"""
Database models and connection setup using SQLAlchemy 2.0+
"""
import os
from typing import Optional
from sqlalchemy import (
    create_engine, Integer, String, Text, DateTime, Float, Boolean
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Mapped, mapped_column
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./emails.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
class Base(DeclarativeBase):
    pass


class Email(Base):
    """Email model matching the database schema"""
    __tablename__ = "emails"

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    sentiment: Mapped[Optional[str]] = mapped_column(String(20))
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float)
    priority: Mapped[Optional[str]] = mapped_column(String(20))
    category: Mapped[Optional[str]] = mapped_column(String(50))
    contact_details: Mapped[Optional[str]] = mapped_column(Text)
    requirements: Mapped[Optional[str]] = mapped_column(Text)
    sentiment_indicators: Mapped[Optional[str]] = mapped_column(Text)
    ai_response: Mapped[Optional[str]] = mapped_column(Text)
    response_sent: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    response_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    processed: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailStats(Base):
    """Email statistics model for dashboard"""
    __tablename__ = "email_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    total_emails: Mapped[Optional[int]] = mapped_column(Integer)
    urgent_emails: Mapped[Optional[int]] = mapped_column(Integer)
    processed_emails: Mapped[Optional[int]] = mapped_column(Integer)
    positive_sentiment: Mapped[Optional[int]] = mapped_column(Integer)
    negative_sentiment: Mapped[Optional[int]] = mapped_column(Integer)
    neutral_sentiment: Mapped[Optional[int]] = mapped_column(Integer)


def create_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
