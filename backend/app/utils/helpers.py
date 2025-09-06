from datetime import datetime
import json
import re
from typing import Any, Dict, List

def format_datetime(dt: datetime) -> str:
    """Format datetime for display"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def extract_priority_keywords(text: str) -> List[str]:
    """Extract priority-indicating keywords from text"""
    urgent_keywords = [
        'urgent', 'emergency', 'critical', 'immediate', 'asap',
        'cannot access', 'down', 'not working', 'broken'
    ]
    
    text_lower = text.lower()
    found_keywords = []
    
    for keyword in urgent_keywords:
        if keyword in text_lower:
            found_keywords.append(keyword)
    
    return found_keywords

def clean_email_body(body: str) -> str:
    """Clean and format email body text"""
    # Remove excessive whitespace
    body = re.sub(r'\n\s*\n', '\n\n', body)
    body = re.sub(r'[ \t]+', ' ', body)
    
    # Remove email signatures (basic pattern)
    body = re.sub(r'\n--\n.*$', '', body, flags=re.DOTALL)
    
    # Remove quoted replies (lines starting with >)
    lines = body.split('\n')
    cleaned_lines = []
    in_quote = False
    
    for line in lines:
        if line.strip().startswith('>') or line.strip().startswith('On ') and ' wrote:' in line:
            in_quote = True
            continue
        elif in_quote and line.strip() == '':
            continue
        else:
            in_quote = False
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()

def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """Safely load JSON string with fallback"""
    try:
        return json.loads(json_str) if json_str else default
    except (json.JSONDecodeError, TypeError):
        return default

def calculate_urgency_score(subject: str, body: str) -> float:
    """Calculate urgency score based on content analysis"""
    text = f"{subject} {body}".lower()
    
    urgent_keywords = [
        'urgent', 'emergency', 'critical', 'immediate', 'asap',
        'cannot access', 'down', 'not working', 'broken', 'error'
    ]
    
    # Count urgent keywords (weighted)
    keyword_score = sum(2 if keyword in text else 0 for keyword in urgent_keywords)
    
    # Count exclamation marks
    exclamation_score = min(text.count('!') * 0.5, 2)
    
    # Check for ALL CAPS words (indicates urgency)
    words = text.split()
    caps_words = sum(1 for word in words if word.isupper() and len(word) > 2)
    caps_score = min(caps_words * 0.3, 1)
    
    # Time-sensitive words
    time_keywords = ['deadline', 'today', 'now', 'immediately', 'quickly']
    time_score = sum(1 if keyword in text else 0 for keyword in time_keywords)
    
    total_score = keyword_score + exclamation_score + caps_score + time_score
    
    # Normalize to 0-10 scale
    return min(total_score, 10)

def extract_email_metadata(email_text: str) -> Dict[str, Any]:
    """Extract metadata from email text"""
    metadata = {
        'word_count': len(email_text.split()),
        'char_count': len(email_text),
        'paragraph_count': len([p for p in email_text.split('\n\n') if p.strip()]),
        'question_count': email_text.count('?'),
        'exclamation_count': email_text.count('!'),
        'has_attachments': 'attachment' in email_text.lower(),
        'has_phone': bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', email_text)),
        'has_url': bool(re.search(r'http[s]?://\S+', email_text))
    }
    
    return metadata

def prioritize_emails(emails: List[Dict]) -> List[Dict]:
    """Sort emails by priority with urgent first"""
    def priority_key(email):
        priority_order = {'urgent': 0, 'not_urgent': 1}
        return (
            priority_order.get(email.get('priority', 'not_urgent'), 1),
            email.get('received_at', datetime.min)
        )
    
    return sorted(emails, key=priority_key, reverse=True)
