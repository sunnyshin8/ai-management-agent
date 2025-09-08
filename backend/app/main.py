from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

from app.models.database import get_db, create_tables, Email, EmailStats
from app.models.schemas import (
    EmailResponse, EmailCreate, EmailUpdate, DashboardStats, 
    GenerateResponseRequest, EmailAnalysis
)
from app.services.email_service import EmailService
from app.services.ai_service import AIService
from app.api.email_routes import router as email_router
from app.api.dashboard_routes import router as dashboard_router

load_dotenv()

# Create tables
create_tables()

app = FastAPI(
    title="AI-Powered Communication Assistant",
    description="Intelligent email management system with AI-powered analysis and response generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(email_router, prefix="/api/emails", tags=["emails"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])

# Initialize services
email_service = EmailService()
ai_service = AIService()

@app.get("/")
async def root():
    return {
        "message": "AI-Powered Communication Assistant API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
