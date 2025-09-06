import random
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.database import create_tables, SessionLocal, Email
from app.services.ai_service import AIService

def generate_demo_emails():
    """Generate demo emails for testing the application"""
    
    # Create tables if they don't exist
    create_tables()
    
    # Sample email data
    demo_emails = [
        {
            "sender_email": "customer1@example.com",
            "subject": "Urgent: Cannot access my account",
            "body": "Hi, I'm having trouble logging into my account. I've tried resetting my password multiple times but it's still not working. This is urgent as I need to access important documents for a meeting tomorrow. Please help me immediately!",
            "priority": "urgent",
            "sentiment": "negative"
        },
        {
            "sender_email": "support.user@company.com",
            "subject": "Help with product feature",
            "body": "Hello, I'm trying to understand how to use the advanced search feature in your product. Could you please provide some guidance or documentation? I'm particularly interested in the filtering options. Thank you for your assistance.",
            "priority": "not_urgent",
            "sentiment": "neutral"
        },
        {
            "sender_email": "happy.customer@email.com",
            "subject": "Support request - billing inquiry",
            "body": "Hi there! I have a question about my recent billing statement. I noticed a charge that I don't recognize. Could you please help me understand what this charge is for? I really appreciate your excellent customer service team. Thank you!",
            "priority": "not_urgent",
            "sentiment": "positive"
        },
        {
            "sender_email": "frustrated.user@test.com",
            "subject": "Critical: System not working",
            "body": "This is completely unacceptable! Your system has been down for hours and I can't get any work done. I've lost important data and this is causing major problems for my business. I need this fixed IMMEDIATELY or I want a full refund!",
            "priority": "urgent",
            "sentiment": "negative"
        },
        {
            "sender_email": "newbie@startup.com",
            "subject": "Query about getting started",
            "body": "Hello, I'm new to your platform and would like some help getting started. Could you provide me with a tutorial or guide? I'm excited to start using your service! My phone number is 555-123-4567 if you need to reach me.",
            "priority": "not_urgent",
            "sentiment": "positive"
        },
        {
            "sender_email": "tech.admin@corp.com",
            "subject": "Urgent help needed with integration",
            "body": "We're trying to integrate your API with our system but getting error 500 on all requests. This is blocking our development team and we have a deadline today. Please provide immediate assistance. Our alternate contact is admin@corp.com",
            "priority": "urgent",
            "sentiment": "negative"
        },
        {
            "sender_email": "small.business@local.com",
            "subject": "Support: Need help with subscription",
            "body": "Hi, I'm interested in upgrading my subscription to include more features. Could you help me understand the different plans available? I'm currently on the basic plan but need more storage space. What are my options?",
            "priority": "not_urgent",
            "sentiment": "neutral"
        },
        {
            "sender_email": "satisfied.client@enterprise.com",
            "subject": "Request for additional features",
            "body": "We've been using your service for 6 months now and we're very happy with it! We're wondering if there are any plans to add automated reporting features? This would be very helpful for our monthly reviews. Keep up the great work!",
            "priority": "not_urgent",
            "sentiment": "positive"
        }
    ]
    
    ai_service = AIService()
    db = SessionLocal()
    
    try:
        for i, email_data in enumerate(demo_emails):
            # Create email with timestamp spread over last 24 hours
            received_at = datetime.utcnow() - timedelta(hours=random.randint(1, 24))
            
            # Analyze email with AI
            analysis = ai_service.analyze_email(email_data)
            
            # Create email record
            email_record = Email(
                sender_email=email_data["sender_email"],
                subject=email_data["subject"],
                body=email_data["body"],
                received_at=received_at,
                sentiment=analysis["sentiment"],
                sentiment_score=analysis["sentiment_score"],
                priority=analysis["priority"],
                category=analysis["category"],
                contact_details=json.dumps(analysis["contact_details"]),
                requirements=json.dumps(analysis["requirements"]),
                sentiment_indicators=json.dumps(analysis["sentiment_indicators"]),
                processed=random.choice([True, False]),  # Random processing status
                ai_response=None  # Will be generated on demand
            )
            
            # For some emails, generate AI responses
            if random.choice([True, False]):
                ai_response = ai_service.generate_response(email_data, analysis)
                email_record.ai_response = ai_response
                
                # Some responses are marked as sent
                if random.choice([True, False]):
                    email_record.response_sent = True
                    email_record.response_sent_at = received_at + timedelta(hours=random.randint(1, 4))
            
            db.add(email_record)
        
        db.commit()
        print(f"Generated {len(demo_emails)} demo emails successfully!")
        
        # Print summary
        total_emails = db.query(Email).count()
        urgent_emails = db.query(Email).filter(Email.priority == "urgent").count()
        processed_emails = db.query(Email).filter(Email.processed == True).count()
        
        print(f"\nDatabase Summary:")
        print(f"Total emails: {total_emails}")
        print(f"Urgent emails: {urgent_emails}")
        print(f"Processed emails: {processed_emails}")
        
    except Exception as e:
        db.rollback()
        print(f"Error generating demo emails: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_demo_emails()
