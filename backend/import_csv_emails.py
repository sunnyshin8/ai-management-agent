import csv
import os
import random
from datetime import datetime, timedelta
from app.models.database import create_tables, SessionLocal, Email
from app.services.ai_service import AIService

CSV_PATH = "sample_emails.csv"

def import_csv_emails():
    create_tables()
    ai_service = AIService()
    db = SessionLocal()
    count = 0
    
    # Clear existing emails to avoid duplicates
    db.query(Email).delete()
    db.commit()
    
    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            sender = row['sender']
            subject = row['subject']
            body = row['body']
            
            # Use current time with random offset in the last 24 hours for recent data
            hours_ago = random.uniform(0, 24)
            received_at = datetime.utcnow() - timedelta(hours=hours_ago)
            email_data = {
                'sender_email': sender,
                'subject': subject,
                'body': body,
                'received_at': received_at
            }
            analysis = ai_service.analyze_email(email_data)
            email_record = Email(
                sender_email=sender,
                subject=subject,
                body=body,
                received_at=received_at,
                sentiment=analysis['sentiment'],
                sentiment_score=analysis['sentiment_score'],
                priority=analysis['priority'],
                category=analysis['category'],
                contact_details=str(analysis['contact_details']),
                requirements=str(analysis['requirements']),
                sentiment_indicators=str(analysis['sentiment_indicators']),
                processed=False
            )
            db.add(email_record)
            count += 1
        db.commit()
        db.close()
    print(f"Imported {count} emails from CSV.")

if __name__ == "__main__":
    import_csv_emails()
