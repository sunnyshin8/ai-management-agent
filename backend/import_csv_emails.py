import csv
import os
from datetime import datetime
from app.models.database import create_tables, SessionLocal, Email
from app.services.ai_service import AIService

CSV_PATH = "sample_emails.csv"

def import_csv_emails():
    create_tables()
    ai_service = AIService()
    db = SessionLocal()
    count = 0
    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            sender = row['sender']
            subject = row['subject']
            body = row['body']
            sent_date = row['sent_date']
            try:
                received_at = datetime.strptime(sent_date, "%Y-%m-%d %H:%M:%S")
            except Exception:
                received_at = datetime.utcnow()
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
