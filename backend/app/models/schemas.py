"""
Pydantic schemas for API request/response models
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class EmailBase(BaseModel):
    """Base email schema"""
    sender_email: str
    subject: str
    body: str
    received_at: Optional[datetime] = None


class EmailCreate(EmailBase):
    """Schema for creating a new email"""
    pass


class EmailUpdate(BaseModel):
    """Schema for updating an email"""
    ai_response: Optional[str] = None
    response_sent: Optional[bool] = None
    processed: Optional[bool] = None


class EmailResponse(EmailBase):
    """Schema for email responses"""
    id: int
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    contact_details: Optional[str] = None
    requirements: Optional[str] = None
    sentiment_indicators: Optional[str] = None
    ai_response: Optional[str] = None
    response_sent: Optional[bool] = False
    response_sent_at: Optional[datetime] = None
    processed: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GenerateResponseRequest(BaseModel):
    """Schema for generating AI response request"""
    custom_context: Optional[str] = None


class EmailAnalysis(BaseModel):
    """Schema for email analysis results"""
    sentiment: str
    sentiment_score: float
    priority: str
    category: str
    requirements: List[str]
    sentiment_indicators: List[str]
    contact_details: Dict[str, Any]


class HourlyStats(BaseModel):
    """Schema for hourly statistics"""
    hour: str
    count: int


class SentimentBreakdown(BaseModel):
    """Schema for sentiment breakdown"""
    positive: int
    negative: int
    neutral: int


class PriorityBreakdown(BaseModel):
    """Schema for priority breakdown"""
    urgent: int
    not_urgent: int


class DashboardStats(BaseModel):
    """Schema for dashboard statistics"""
    total_emails_24h: int
    processed_emails: int
    pending_emails: int
    urgent_emails: int
    sentiment_breakdown: SentimentBreakdown
    priority_breakdown: PriorityBreakdown
    hourly_stats: List[HourlyStats]


class EmailStatsBase(BaseModel):
    """Base schema for email statistics"""
    date: datetime
    total_emails: int
    urgent_emails: int
    processed_emails: int
    positive_sentiment: int
    negative_sentiment: int
    neutral_sentiment: int


class EmailStatsCreate(EmailStatsBase):
    """Schema for creating email statistics"""
    pass


class EmailStatsResponse(EmailStatsBase):
    """Schema for email statistics responses"""
    id: int

    class Config:
        from_attributes = True
