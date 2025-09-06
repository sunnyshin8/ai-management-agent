import imaplib
import email
import os
import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.imap_server = os.getenv("IMAP_SERVER", "imap.gmail.com")
        self.imap_port = int(os.getenv("IMAP_PORT", "993"))
        self.email_address = os.getenv("EMAIL_ADDRESS")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        self.support_keywords = ["support", "query", "request", "help"]
        
    def connect_imap(self):
        """Connect to IMAP server"""
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            mail.login(self.email_address, self.email_password)
            return mail
        except Exception as e:
            print(f"Error connecting to IMAP: {e}")
            return None
    
    def fetch_support_emails(self, days_back: int = 1) -> List[Dict[str, Any]]:
        """Fetch emails containing support keywords from the last N days"""
        mail = self.connect_imap()
        if not mail:
            return []
        
        try:
            mail.select('INBOX')
            
            # Calculate date range
            since_date = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
            
            # Search for recent emails
            search_criteria = f'(SINCE "{since_date}")'
            status, message_ids = mail.search(None, search_criteria)
            
            if status != 'OK':
                return []
            
            emails = []
            message_ids = message_ids[0].split()
            
            for msg_id in message_ids[-50:]:  # Limit to last 50 emails
                try:
                    status, msg_data = mail.fetch(msg_id, '(RFC822)')
                    if status != 'OK':
                        continue
                    
                    raw_email = msg_data[0][1]
                    email_message = email.message_from_bytes(raw_email)
                    
                    # Extract email details
                    subject = email_message.get('Subject', '')
                    sender = email_message.get('From', '')
                    date_str = email_message.get('Date', '')
                    
                    # Check if subject contains support keywords
                    if self._contains_support_keywords(subject):
                        body = self._extract_email_body(email_message)
                        
                        # Parse date
                        try:
                            received_at = email.utils.parsedate_to_datetime(date_str)
                        except:
                            received_at = datetime.now()
                        
                        # Extract sender email from format "Name <email@domain.com>"
                        sender_email = self._extract_email_address(sender)
                        
                        email_data = {
                            'sender_email': sender_email,
                            'subject': subject,
                            'body': body,
                            'received_at': received_at,
                            'raw_sender': sender
                        }
                        
                        emails.append(email_data)
                        
                except Exception as e:
                    print(f"Error processing email {msg_id}: {e}")
                    continue
            
            mail.close()
            mail.logout()
            return emails
            
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []
    
    def _contains_support_keywords(self, subject: str) -> bool:
        """Check if subject contains support keywords"""
        subject_lower = subject.lower()
        return any(keyword in subject_lower for keyword in self.support_keywords)
    
    def _extract_email_body(self, email_message) -> str:
        """Extract text body from email message"""
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode('utf-8')
                        break
                    except:
                        continue
        else:
            try:
                body = email_message.get_payload(decode=True).decode('utf-8')
            except:
                body = str(email_message.get_payload())
        
        return body.strip()
    
    def _extract_email_address(self, sender: str) -> str:
        """Extract email address from sender string"""
        # Handle formats like "Name <email@domain.com>" or just "email@domain.com"
        email_pattern = r'<([^>]+)>'
        match = re.search(email_pattern, sender)
        if match:
            return match.group(1)
        
        # If no angle brackets, assume the whole string is the email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, sender)
        if match:
            return match.group(0)
        
        return sender
    
    def send_response_email(self, to_email: str, subject: str, response_body: str) -> bool:
        """Send response email"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.email_address
            msg['To'] = to_email
            msg['Subject'] = f"Re: {subject}"
            
            msg.attach(MIMEText(response_body, 'plain'))
            
            # Connect to SMTP server
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(self.email_address, self.email_password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(self.email_address, to_email, text)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def extract_contact_info(self, email_body: str, sender_email: str) -> Dict[str, Any]:
        """Extract contact information from email body"""
        contact_info = {
            'primary_email': sender_email,
            'phone_numbers': [],
            'alternate_emails': []
        }
        
        # Extract phone numbers
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\(\d{3}\)\s*\d{3}[-.]?\d{4}',
            r'\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        
        for pattern in phone_patterns:
            phones = re.findall(pattern, email_body)
            contact_info['phone_numbers'].extend(phones)
        
        # Extract alternate email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, email_body)
        for email_addr in emails:
            if email_addr != sender_email:
                contact_info['alternate_emails'].append(email_addr)
        
        # Remove duplicates
        contact_info['phone_numbers'] = list(set(contact_info['phone_numbers']))
        contact_info['alternate_emails'] = list(set(contact_info['alternate_emails']))
        
        return contact_info
