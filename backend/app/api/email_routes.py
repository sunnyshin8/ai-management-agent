from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from app.models.database import get_db, Email
from app.models.schemas import EmailResponse, EmailCreate, EmailUpdate, GenerateResponseRequest
from app.services.email_service import EmailService
from app.services.ai_service import AIService

router = APIRouter()

# Initialize services
email_service = EmailService()
ai_service = AIService()

@router.get("/", response_model=List[EmailResponse])
async def get_emails(
    skip: int = 0,
    limit: int = 100,
    priority_filter: Optional[str] = None,
    sentiment_filter: Optional[str] = None,
    processed_filter: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all emails with optional filtering"""
    query = db.query(Email)
    
    # Apply filters
    if priority_filter:
        query = query.filter(Email.priority == priority_filter)
    if sentiment_filter:
        query = query.filter(Email.sentiment == sentiment_filter)
    if processed_filter is not None:
        query = query.filter(Email.processed == processed_filter)
    
    # Order by priority (urgent first) then by received date
    query = query.order_by(
        Email.priority.desc(),  # urgent comes first
        desc(Email.received_at)
    )
    
    emails = query.offset(skip).limit(limit).all()
    return emails

@router.get("/urgent", response_model=List[EmailResponse])
async def get_urgent_emails(db: Session = Depends(get_db)):
    """Get all urgent emails"""
    emails = db.query(Email).filter(
        Email.priority == "urgent"
    ).order_by(desc(Email.received_at)).all()
    return emails

@router.get("/unprocessed", response_model=List[EmailResponse])
async def get_unprocessed_emails(db: Session = Depends(get_db)):
    """Get all unprocessed emails"""
    emails = db.query(Email).filter(
        Email.processed == False
    ).order_by(
        Email.priority.desc(),
        desc(Email.received_at)
    ).all()
    return emails

@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(email_id: int, db: Session = Depends(get_db)):
    """Get specific email by ID"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.post("/fetch")
async def fetch_new_emails(
    background_tasks: BackgroundTasks,
    days_back: int = 1,
    db: Session = Depends(get_db)
):
    """Fetch new emails from email server"""
    background_tasks.add_task(fetch_and_process_emails, days_back, db)
    return {"message": "Email fetching started in background"}

async def fetch_and_process_emails(days_back: int, db: Session):
    """Background task to fetch and process emails"""
    try:
        # Fetch emails from server
        raw_emails = email_service.fetch_support_emails(days_back)
        
        processed_count = 0
        for raw_email in raw_emails:
            # Check if email already exists
            existing_email = db.query(Email).filter(
                and_(
                    Email.sender_email == raw_email['sender_email'],
                    Email.subject == raw_email['subject'],
                    Email.received_at == raw_email['received_at']
                )
            ).first()
            
            if existing_email:
                continue
            
            # Analyze email with AI
            analysis = ai_service.analyze_email(raw_email)
            
            # Create email record
            email_record = Email(
                sender_email=raw_email['sender_email'],
                subject=raw_email['subject'],
                body=raw_email['body'],
                received_at=raw_email['received_at'],
                sentiment=analysis['sentiment'],
                sentiment_score=analysis['sentiment_score'],
                priority=analysis['priority'],
                category=analysis['category'],
                contact_details=json.dumps(analysis['contact_details']),
                requirements=json.dumps(analysis['requirements']),
                sentiment_indicators=json.dumps(analysis['sentiment_indicators']),
                processed=False
            )
            
            db.add(email_record)
            processed_count += 1
        
        db.commit()
        print(f"Processed {processed_count} new emails")
        
    except Exception as e:
        print(f"Error in fetch_and_process_emails: {e}")
        db.rollback()

@router.post("/{email_id}/generate-response")
async def generate_response(
    email_id: int,
    request: GenerateResponseRequest,
    db: Session = Depends(get_db)
):
    """Generate AI response for an email"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        # Prepare email data for AI
        email_data = {
            'sender_email': email.sender_email,
            'subject': email.subject,
            'body': email.body,
            'received_at': email.received_at
        }
        
        # Prepare analysis data
        analysis = {
            'sentiment': email.sentiment,
            'sentiment_score': email.sentiment_score,
            'priority': email.priority,
            'category': email.category,
            'requirements': json.loads(email.requirements) if email.requirements else [],
            'sentiment_indicators': json.loads(email.sentiment_indicators) if email.sentiment_indicators else []
        }
        
        # Add custom context if provided
        if request.custom_context:
            analysis['custom_context'] = request.custom_context
        
        # Generate response
        ai_response = ai_service.generate_response(email_data, analysis)
        
        # Update email record
        email.ai_response = ai_response
        db.commit()
        
        return {
            "email_id": email_id,
            "ai_response": ai_response,
            "message": "Response generated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@router.post("/{email_id}/send-response")
async def send_response(
    email_id: int,
    custom_response: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Send response email"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    if email.response_sent:
        raise HTTPException(status_code=400, detail="Response already sent for this email")
    
    try:
        # Use custom response or AI-generated response
        response_body = custom_response or email.ai_response
        
        if not response_body:
            raise HTTPException(status_code=400, detail="No response available to send")
        
        # Send email
        success = email_service.send_response_email(
            email.sender_email,
            email.subject,
            response_body
        )
        
        if success:
            # Update email record
            email.response_sent = True
            email.response_sent_at = datetime.utcnow()
            email.processed = True
            if custom_response:
                email.ai_response = custom_response
            db.commit()
            
            return {
                "email_id": email_id,
                "message": "Response sent successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending response: {str(e)}")

@router.put("/{email_id}", response_model=EmailResponse)
async def update_email(
    email_id: int,
    email_update: EmailUpdate,
    db: Session = Depends(get_db)
):
    """Update email record"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Update fields
    if email_update.ai_response is not None:
        email.ai_response = email_update.ai_response
    if email_update.response_sent is not None:
        email.response_sent = email_update.response_sent
        if email_update.response_sent:
            email.response_sent_at = datetime.utcnow()
    if email_update.processed is not None:
        email.processed = email_update.processed
    
    email.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(email)
    
    return email

@router.delete("/{email_id}")
async def delete_email(email_id: int, db: Session = Depends(get_db)):
    """Delete email record"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    db.delete(email)
    db.commit()
    
    return {"message": "Email deleted successfully"}

@router.post("/{email_id}/mark-processed")
async def mark_email_processed(email_id: int, db: Session = Depends(get_db)):
    """Mark email as processed"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    email.processed = True
    email.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Email marked as processed"}
