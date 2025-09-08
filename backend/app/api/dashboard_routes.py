from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.models.database import get_db, Email, EmailStats
from app.models.schemas import DashboardStats, SentimentBreakdown, PriorityBreakdown

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get comprehensive dashboard statistics"""
    
    # Calculate 24 hours ago
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Total emails in last 24 hours
    total_emails_24h = db.query(Email).filter(
        Email.received_at >= twenty_four_hours_ago
    ).count()
    
    # Processed emails
    processed_emails = db.query(Email).filter(
        and_(
            Email.received_at >= twenty_four_hours_ago,
            Email.processed == True
        )
    ).count()
    
    # Pending emails
    pending_emails = total_emails_24h - processed_emails
    
    # Urgent emails
    urgent_emails = db.query(Email).filter(
        and_(
            Email.received_at >= twenty_four_hours_ago,
            Email.priority == "urgent"
        )
    ).count()
    
    # Sentiment breakdown
    sentiment_stats = db.query(
        Email.sentiment,
        func.count(Email.sentiment)
    ).filter(
        Email.received_at >= twenty_four_hours_ago
    ).group_by(Email.sentiment).all()
    
    sentiment_breakdown = {
        "positive": 0,
        "negative": 0,
        "neutral": 0
    }
    
    for sentiment, count in sentiment_stats:
        if sentiment in sentiment_breakdown:
            sentiment_breakdown[sentiment] = count
    
    # Priority breakdown
    priority_stats = db.query(
        Email.priority,
        func.count(Email.priority)
    ).filter(
        Email.received_at >= twenty_four_hours_ago
    ).group_by(Email.priority).all()
    
    priority_breakdown = {
        "urgent": 0,
        "not_urgent": 0
    }
    
    for priority, count in priority_stats:
        if priority in priority_breakdown:
            priority_breakdown[priority] = count
    
    # Hourly stats for the last 24 hours
    hourly_stats = []
    for i in range(24):
        hour_start = twenty_four_hours_ago + timedelta(hours=i)
        hour_end = hour_start + timedelta(hours=1)
        
        hour_count = db.query(Email).filter(
            and_(
                Email.received_at >= hour_start,
                Email.received_at < hour_end
            )
        ).count()
        
        hourly_stats.append({
            "hour": hour_start.strftime("%Y-%m-%d %H:00"),
            "count": hour_count
        })
    
    return DashboardStats(
        total_emails_24h=total_emails_24h,
        processed_emails=processed_emails,
        pending_emails=pending_emails,
        urgent_emails=urgent_emails,
        sentiment_breakdown=SentimentBreakdown(**sentiment_breakdown),
        priority_breakdown=PriorityBreakdown(**priority_breakdown),
        hourly_stats=hourly_stats
    )

@router.get("/recent-emails")
async def get_recent_emails(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent emails for dashboard preview"""
    emails = db.query(Email).order_by(
        Email.priority.desc(),
        Email.received_at.desc()
    ).limit(limit).all()
    
    return [{
        "id": email.id,
        "sender_email": email.sender_email,
        "subject": email.subject[:100] + "..." if len(email.subject) > 100 else email.subject,
        "priority": email.priority,
        "sentiment": email.sentiment,
        "processed": email.processed,
        "received_at": email.received_at,
        "category": email.category
    } for email in emails]

@router.get("/category-stats")
async def get_category_stats(db: Session = Depends(get_db)):
    """Get email statistics by category"""
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    category_stats = db.query(
        Email.category,
        func.count(Email.category)
    ).filter(
        Email.received_at >= twenty_four_hours_ago
    ).group_by(Email.category).all()
    
    return {
        "categories": [
            {"category": category, "count": count}
            for category, count in category_stats
        ]
    }

@router.get("/response-stats")
async def get_response_stats(db: Session = Depends(get_db)):
    """Get response statistics"""
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Total emails that need responses
    total_emails = db.query(Email).filter(
        Email.received_at >= twenty_four_hours_ago
    ).count()
    
    # Emails with AI responses generated
    emails_with_responses = db.query(Email).filter(
        and_(
            Email.received_at >= twenty_four_hours_ago,
            Email.ai_response.isnot(None),
            Email.ai_response != ""
        )
    ).count()
    
    # Emails with responses sent
    responses_sent = db.query(Email).filter(
        and_(
            Email.received_at >= twenty_four_hours_ago,
            Email.response_sent == True
        )
    ).count()
    
    # Average response time (for sent responses)
    avg_response_time_query = db.query(
        func.avg(
            func.strftime('%s', Email.response_sent_at) - 
            func.strftime('%s', Email.received_at)
        )
    ).filter(
        and_(
            Email.received_at >= twenty_four_hours_ago,
            Email.response_sent == True,
            Email.response_sent_at.isnot(None)
        )
    ).scalar()
    
    avg_response_time_seconds = avg_response_time_query if avg_response_time_query else 0
    avg_response_time_hours = avg_response_time_seconds / 3600 if avg_response_time_seconds else 0
    
    return {
        "total_emails": total_emails,
        "emails_with_responses": emails_with_responses,
        "responses_sent": responses_sent,
        "response_rate": (responses_sent / total_emails * 100) if total_emails > 0 else 0,
        "avg_response_time_hours": round(avg_response_time_hours, 2)
    }

@router.get("/performance-metrics")
async def get_performance_metrics(days: int = 7, db: Session = Depends(get_db)):
    """Get performance metrics over specified days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily email counts
    daily_stats = []
    for i in range(days):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        total_count = db.query(Email).filter(
            and_(
                Email.received_at >= day_start,
                Email.received_at < day_end
            )
        ).count()
        
        processed_count = db.query(Email).filter(
            and_(
                Email.received_at >= day_start,
                Email.received_at < day_end,
                Email.processed == True
            )
        ).count()
        
        urgent_count = db.query(Email).filter(
            and_(
                Email.received_at >= day_start,
                Email.received_at < day_end,
                Email.priority == "urgent"
            )
        ).count()
        
        daily_stats.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "total_emails": total_count,
            "processed_emails": processed_count,
            "urgent_emails": urgent_count,
            "processing_rate": (processed_count / total_count * 100) if total_count > 0 else 0
        })
    
    return {
        "daily_stats": daily_stats,
        "summary": {
            "total_emails": sum(day["total_emails"] for day in daily_stats),
            "total_processed": sum(day["processed_emails"] for day in daily_stats),
            "total_urgent": sum(day["urgent_emails"] for day in daily_stats),
            "avg_processing_rate": sum(day["processing_rate"] for day in daily_stats) / len(daily_stats) if daily_stats else 0
        }
    }
