import os
import json
import re
from typing import Dict, List, Any, Tuple
from textblob import TextBlob
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        # Priority keywords for urgency detection
        self.urgent_keywords = [
            'urgent', 'emergency', 'critical', 'immediate', 'asap', 'urgent help',
            'cannot access', 'down', 'not working', 'broken', 'error', 'issue',
            'problem', 'stuck', 'deadline', 'important', 'priority', 'escalate'
        ]
        
        # Knowledge base for context-aware responses
        self.knowledge_base = {
            'account_issues': {
                'keywords': ['account', 'login', 'password', 'access', 'locked'],
                'response_template': "I understand you're having trouble with your account access. Let me help you resolve this issue."
            },
            'technical_support': {
                'keywords': ['error', 'bug', 'not working', 'broken', 'issue', 'problem'],
                'response_template': "I see you're experiencing a technical issue. I'll make sure our technical team addresses this promptly."
            },
            'billing_inquiry': {
                'keywords': ['billing', 'payment', 'invoice', 'charge', 'refund', 'subscription'],
                'response_template': "Thank you for reaching out about your billing inquiry. I'll help clarify any questions you have about your account."
            },
            'product_inquiry': {
                'keywords': ['product', 'feature', 'how to', 'tutorial', 'guide'],
                'response_template': "I'd be happy to help you learn more about our product features and how to use them effectively."
            }
        }
    
    def analyze_sentiment(self, text: str) -> Tuple[str, float]:
        """Analyze sentiment using TextBlob and return sentiment label and score"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                sentiment = "positive"
            elif polarity < -0.1:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            # Normalize score to 0-1 range
            score = (polarity + 1) / 2
            
            return sentiment, score
            
        except Exception as e:
            print(f"Error in sentiment analysis: {e}")
            return "neutral", 0.5
    
    def determine_priority(self, subject: str, body: str) -> str:
        """Determine email priority based on keywords and urgency indicators"""
        text = f"{subject} {body}".lower()
        
        # Check for urgent keywords
        urgent_count = sum(1 for keyword in self.urgent_keywords if keyword in text)
        
        # Additional urgency indicators
        exclamation_count = text.count('!')
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        
        # Calculate urgency score
        urgency_score = urgent_count + (exclamation_count * 0.5) + (caps_ratio * 2)
        
        return "urgent" if urgency_score >= 2 else "not_urgent"
    
    def categorize_email(self, subject: str, body: str) -> str:
        """Categorize email based on content"""
        text = f"{subject} {body}".lower()
        
        # Check against knowledge base categories
        max_score = 0
        best_category = "general_inquiry"
        
        for category, info in self.knowledge_base.items():
            score = sum(1 for keyword in info['keywords'] if keyword in text)
            if score > max_score:
                max_score = score
                best_category = category
        
        return best_category
    
    def extract_requirements(self, email_body: str) -> List[str]:
        """Extract customer requirements and requests from email"""
        requirements = []
        
        # Common requirement patterns
        requirement_patterns = [
            r'need\s+to\s+([^.!?]+)',
            r'want\s+to\s+([^.!?]+)',
            r'looking\s+for\s+([^.!?]+)',
            r'require\s+([^.!?]+)',
            r'request\s+([^.!?]+)',
            r'help\s+with\s+([^.!?]+)',
            r'can\s+you\s+([^.!?]+)',
            r'could\s+you\s+([^.!?]+)'
        ]
        
        for pattern in requirement_patterns:
            matches = re.findall(pattern, email_body.lower())
            requirements.extend([match.strip() for match in matches])
        
        # Remove duplicates and clean up
        requirements = list(set(requirements))
        requirements = [req for req in requirements if len(req) > 3]
        
        return requirements[:5]  # Return top 5 requirements
    
    def extract_sentiment_indicators(self, text: str) -> List[str]:
        """Extract specific words/phrases that indicate sentiment"""
        positive_indicators = [
            'thank you', 'thanks', 'appreciate', 'grateful', 'excellent', 'great',
            'wonderful', 'amazing', 'perfect', 'love', 'satisfied', 'happy'
        ]
        
        negative_indicators = [
            'frustrated', 'angry', 'upset', 'disappointed', 'terrible', 'awful',
            'horrible', 'hate', 'disgusted', 'annoyed', 'irritated', 'furious',
            'dissatisfied', 'unhappy', 'concerned', 'worried'
        ]
        
        text_lower = text.lower()
        indicators = []
        
        for indicator in positive_indicators + negative_indicators:
            if indicator in text_lower:
                indicators.append(indicator)
        
        return indicators
    
    def generate_response(self, email_data: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Generate contextual response using OpenAI GPT"""
        try:
            if not self.openai_api_key:
                return self._generate_template_response(email_data, analysis)
            
            # Build context for the AI
            sentiment = analysis.get('sentiment', 'neutral')
            priority = analysis.get('priority', 'not_urgent')
            category = analysis.get('category', 'general_inquiry')
            requirements = analysis.get('requirements', [])
            sentiment_indicators = analysis.get('sentiment_indicators', [])
            
            # Create prompt based on context
            prompt = self._build_response_prompt(
                email_data, sentiment, priority, category, requirements, sentiment_indicators
            )
            
            # Call OpenAI API with new format
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_api_key)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional customer service representative. Generate helpful, empathetic, and professional email responses."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return self._generate_template_response(email_data, analysis)
    
    def _build_response_prompt(self, email_data: Dict, sentiment: str, priority: str, 
                              category: str, requirements: List[str], 
                              sentiment_indicators: List[str]) -> str:
        """Build prompt for AI response generation"""
        
        email_subject = email_data.get('subject', '')
        email_body = email_data.get('body', '')
        sender_email = email_data.get('sender_email', '')
        
        prompt = f"""
        Generate a professional email response for the following customer inquiry:
        
        Customer Email Subject: {email_subject}
        Customer Email: {email_body}
        Customer Email: {sender_email}
        
        Analysis Context:
        - Sentiment: {sentiment}
        - Priority: {priority}
        - Category: {category}
        - Customer Requirements: {', '.join(requirements) if requirements else 'None identified'}
        - Sentiment Indicators: {', '.join(sentiment_indicators) if sentiment_indicators else 'None'}
        
        Instructions:
        1. Maintain a professional and friendly tone
        2. Acknowledge the customer's {sentiment} sentiment appropriately
        3. If priority is urgent, emphasize quick resolution
        4. Address the specific category: {category}
        5. Reference specific requirements mentioned by the customer
        6. Include next steps or resolution timeline
        7. Keep response concise but comprehensive
        8. Sign off professionally
        
        Generate only the email response body, no subject line needed:
        """
        
        return prompt
    
    def _generate_template_response(self, email_data: Dict[str, Any], 
                                  analysis: Dict[str, Any]) -> str:
        """Generate template-based response when OpenAI is not available"""
        
        category = analysis.get('category', 'general_inquiry')
        sentiment = analysis.get('sentiment', 'neutral')
        priority = analysis.get('priority', 'not_urgent')
        requirements = analysis.get('requirements', [])
        
        # Get base template
        template = self.knowledge_base.get(category, {}).get(
            'response_template', 
            "Thank you for contacting us. We've received your inquiry and will respond promptly."
        )
        
        # Build response
        response_parts = []
        
        # Greeting and acknowledgment
        if sentiment == 'negative':
            response_parts.append("Thank you for reaching out to us, and I apologize for any inconvenience you've experienced.")
        else:
            response_parts.append("Thank you for contacting us.")
        
        # Main response based on category
        response_parts.append(template)
        
        # Address specific requirements
        if requirements:
            response_parts.append(f"Regarding your request for {', '.join(requirements[:2])}, I'll make sure this is addressed appropriately.")
        
        # Priority-based response
        if priority == 'urgent':
            response_parts.append("I understand this is urgent, and I'll prioritize your request for immediate attention.")
            response_parts.append("You can expect a follow-up within 2-4 hours.")
        else:
            response_parts.append("We typically respond to inquiries within 24-48 hours.")
        
        # Closing
        response_parts.append("If you have any immediate questions, please don't hesitate to reach out.")
        response_parts.append("\nBest regards,")
        response_parts.append("Customer Support Team")
        
        return "\n\n".join(response_parts)
    
    def analyze_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete email analysis including sentiment, priority, and categorization"""
        subject = email_data.get('subject', '')
        body = email_data.get('body', '')
        sender_email = email_data.get('sender_email', '')
        
        # Perform all analyses
        sentiment, sentiment_score = self.analyze_sentiment(f"{subject} {body}")
        priority = self.determine_priority(subject, body)
        category = self.categorize_email(subject, body)
        requirements = self.extract_requirements(body)
        sentiment_indicators = self.extract_sentiment_indicators(f"{subject} {body}")
        
        # Extract contact details (this would be enhanced with more sophisticated NLP)
        contact_details = {
            'primary_email': sender_email,
            'extracted_phones': [],
            'extracted_emails': []
        }
        
        return {
            'sentiment': sentiment,
            'sentiment_score': sentiment_score,
            'priority': priority,
            'category': category,
            'requirements': requirements,
            'sentiment_indicators': sentiment_indicators,
            'contact_details': contact_details
        }
