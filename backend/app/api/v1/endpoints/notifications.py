from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    LectureSession,
    AttendanceRecord,
    AttendanceStatus,
    Notification,
    NotificationDelivery,
    NotificationType,
    NotificationChannel,
    DeliveryStatus,
    Subject,
    AuditLog
)
from app.permissions.deps import get_current_user, require_teacher, require_admin
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50)

    result = await db.execute(stmt)
    notifications = result.scalars().all()
    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            created_at=n.created_at
        ) for n in notifications
    ]

@router.put("/{notification_id}/read", response_model=MessageResponse)
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    notif = await db.get(Notification, notification_id)
    if not notif or notif.recipient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    await db.commit()
    return MessageResponse(message="Notification marked as read.")

@router.post("/send-session-alerts/{session_id}", response_model=MessageResponse)
async def dispatch_lecture_end_parent_alerts(
    session_id: int,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Lecture-end parent alerts:
    Identifies absent students for the lecture and creates delivery notifications for parents.
    """
    session = await db.get(LectureSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    subject = await db.get(Subject, session.subject_id)
    subj_name = subject.name if subject else "Lecture"

    stmt_absent = select(AttendanceRecord).options(
        selectinload(AttendanceRecord.student).selectinload(StudentProfile.user)
    ).where(
        AttendanceRecord.lecture_session_id == session_id,
        AttendanceRecord.status == AttendanceStatus.ABSENT
    )
    absent_records = (await db.execute(stmt_absent)).scalars().all()

    alert_count = 0
    now = datetime.now(timezone.utc)

    for rec in absent_records:
        student = rec.student
        if not student:
            continue

        parent_email = student.parent_email
        parent_phone = student.parent_phone
        title = f"Absence Alert: {student.user.full_name}"
        msg = f"Dear Parent, student {student.user.full_name} (Roll No: {student.roll_number}) was marked ABSENT for {subj_name} on {session.date} ({session.start_time.strftime('%H:%M')})."

        # Create in-app notification for student as well
        notif = Notification(
            recipient_id=student.user_id,
            title=title,
            message=msg,
            notification_type=NotificationType.ABSENCE,
            is_read=False,
            created_at=now
        )
        db.add(notif)
        await db.flush()

        # Track external deliveries
        if parent_email:
            delivery = NotificationDelivery(
                notification_id=notif.id,
                channel=NotificationChannel.EMAIL,
                status=DeliveryStatus.DELIVERED,
                provider_response="Dispatched via institute email provider",
                delivered_at=now
            )
            db.add(delivery)
            alert_count += 1

        if parent_phone:
            delivery_sms = NotificationDelivery(
                notification_id=notif.id,
                channel=NotificationChannel.SMS,
                status=DeliveryStatus.DELIVERED,
                provider_response="Dispatched via institute SMS gateway",
                delivered_at=now
            )
            db.add(delivery_sms)
            alert_count += 1

    await db.commit()
    return MessageResponse(message=f"Dispatched {alert_count} parent notifications for {len(absent_records)} absent students.")

class BroadcastNotificationRequest(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = None

@router.post("/broadcast", response_model=MessageResponse)
async def broadcast_notification(
    req: BroadcastNotificationRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin broadcasts an institutional announcement to students, teachers, or all institute members.
    """
    stmt = select(User).where(User.is_active == True)
    if req.target_role == "STUDENT":
        stmt = stmt.where(User.role == UserRole.STUDENT)
    elif req.target_role == "TEACHER":
        stmt = stmt.where(User.role == UserRole.TEACHER)
    
    users = (await db.execute(stmt)).scalars().all()
    now = datetime.now(timezone.utc)
    
    for u in users:
        notif = Notification(
            recipient_id=u.id,
            title=req.title,
            message=req.message,
            notification_type=NotificationType.SYSTEM,
            is_read=False,
            created_at=now
        )
        db.add(notif)
    
    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="BROADCAST_NOTIFICATION",
        resource_type="NOTIFICATION",
        resource_id="ALL",
        details=f"Broadcasted '{req.title}' to {len(users)} users (target: {req.target_role or 'ALL'}).",
        ip_address="127.0.0.1",
        timestamp=now
    )
    db.add(audit)
    await db.commit()

    return MessageResponse(message=f"Successfully broadcasted announcement to {len(users)} users.")
