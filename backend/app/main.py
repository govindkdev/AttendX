from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.provision import init_database_tables, provision_initial_settings
from app.db.session import engine, get_db, AsyncSessionLocal
from app.models.entities import AuditLog

# Import Endpoint Routers
from app.api.v1.endpoints import (
    auth,
    departments,
    courses,
    branches,
    subjects,
    classrooms,
    timetable,
    students,
    teachers,
    attendance,
    analytics,
    reports,
    leave,
    notifications,
    settings as settings_ep,
    audit,
    ai
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_database_tables()
    async with AsyncSessionLocal() as session:
        await provision_initial_settings(session)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    description="AttendX AI-Powered Smart Attendance & Institute Management System",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Readiness Endpoints (Do not leak secrets)
@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "institute": settings.INSTITUTE_NAME
    }

@app.get("/ready", tags=["Health"])
async def ready_check(db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )

# Public Website Contact Submission Schema & Endpoint
class ContactFormRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr
    subject: str = Field(..., min_length=3, max_length=255)
    message: str = Field(..., min_length=10, max_length=2000)

@app.post("/api/v1/public/contact", tags=["Public"])
async def submit_contact_form(
    form_data: ContactFormRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives contact messages from public website visitors and records audit trail.
    """
    audit = AuditLog(
        actor_id=None,
        actor_role="GUEST",
        action="CONTACT_FORM_SUBMISSION",
        resource_type="CONTACT",
        resource_id=form_data.email,
        details=f"From: {form_data.name} ({form_data.email}) | Subject: {form_data.subject} | Msg: {form_data.message[:100]}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    await db.commit()
    return {"success": True, "message": "Thank you for reaching out! Our administrative team will review your inquiry."}

# Register API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(departments.router, prefix=api_v1_prefix)
app.include_router(courses.router, prefix=api_v1_prefix)
app.include_router(branches.router, prefix=api_v1_prefix)
app.include_router(subjects.router, prefix=api_v1_prefix)
app.include_router(classrooms.router, prefix=api_v1_prefix)
app.include_router(timetable.router, prefix=api_v1_prefix)
app.include_router(students.router, prefix=api_v1_prefix)
app.include_router(teachers.router, prefix=api_v1_prefix)
app.include_router(attendance.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(reports.router, prefix=api_v1_prefix)
app.include_router(leave.router, prefix=api_v1_prefix)
app.include_router(notifications.router, prefix=api_v1_prefix)
app.include_router(settings_ep.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(ai.router, prefix=api_v1_prefix)
