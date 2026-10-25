from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    LeaveRequest,
    LeaveRequestStatus,
    AuditLog
)
from app.permissions.deps import get_current_user, require_student, require_teacher
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/leave", tags=["Leave Requests"])

class LeaveRequestCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=5, max_length=500)

class LeaveRequestReview(BaseModel):
    status: LeaveRequestStatus
    review_remarks: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: int
    student_id: int
    student_code: str
    student_name: str
    roll_number: str
    start_date: date
    end_date: date
    reason: str
    status: LeaveRequestStatus
    reviewed_by_name: Optional[str] = None
    review_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_leave_request(
    req: LeaveRequestCreate,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    if req.end_date < req.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date cannot be earlier than start date.")

    stmt_s = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    student = (await db.execute(stmt_s)).scalars().first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    leave = LeaveRequest(
        student_id=student.id,
        start_date=req.start_date,
        end_date=req.end_date,
        reason=req.reason,
        status=LeaveRequestStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)

    return LeaveRequestResponse(
        id=leave.id,
        student_id=student.id,
        student_code=current_user.user_code,
        student_name=current_user.full_name,
        roll_number=student.roll_number,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        reviewed_by_name=None,
        review_remarks=None,
        reviewed_at=None,
        created_at=leave.created_at
    )

@router.get("", response_model=List[LeaveRequestResponse])
async def list_leave_requests(
    status_filter: Optional[LeaveRequestStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LeaveRequest).options(
        selectinload(LeaveRequest.student).selectinload(StudentProfile.user),
        selectinload(LeaveRequest.reviewed_by)
    )

    if current_user.role == UserRole.STUDENT:
        stmt_s = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        student = (await db.execute(stmt_s)).scalars().first()
        if not student:
            return []
        stmt = stmt.where(LeaveRequest.student_id == student.id)
    elif status_filter:
        stmt = stmt.where(LeaveRequest.status == status_filter)

    stmt = stmt.order_by(LeaveRequest.created_at.desc())
    records = (await db.execute(stmt)).scalars().all()

    results = []
    for r in records:
        stud = r.student
        results.append(LeaveRequestResponse(
            id=r.id,
            student_id=stud.id if stud else 0,
            student_code=stud.user.user_code if stud and stud.user else "",
            student_name=stud.user.full_name if stud and stud.user else "",
            roll_number=stud.roll_number if stud else "",
            start_date=r.start_date,
            end_date=r.end_date,
            reason=r.reason,
            status=r.status,
            reviewed_by_name=r.reviewed_by.full_name if r.reviewed_by else None,
            review_remarks=r.review_remarks,
            reviewed_at=r.reviewed_at,
            created_at=r.created_at
        ))
    return results

@router.put("/{leave_id}/review", response_model=LeaveRequestResponse)
async def review_leave_request(
    leave_id: int,
    req: LeaveRequestReview,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher or Admin reviews (approves/rejects) a leave request.
    Students cannot approve their own requests.
    """
    leave = await db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")

    leave.status = req.status
    leave.reviewed_by_id = current_user.id
    leave.review_remarks = req.review_remarks
    leave.reviewed_at = datetime.now(timezone.utc)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="LEAVE_REQUEST_REVIEWED",
        resource_type="LEAVE_REQUEST",
        resource_id=str(leave.id),
        details=f"Leave request status set to {req.status.value}. Remarks: {req.review_remarks}",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(leave)

    stud = await db.get(StudentProfile, leave.student_id)
    user_s = await db.get(User, stud.user_id) if stud else None

    return LeaveRequestResponse(
        id=leave.id,
        student_id=stud.id if stud else 0,
        student_code=user_s.user_code if user_s else "",
        student_name=user_s.full_name if user_s else "",
        roll_number=stud.roll_number if stud else "",
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        reviewed_by_name=current_user.full_name,
        review_remarks=leave.review_remarks,
        reviewed_at=leave.reviewed_at,
        created_at=leave.created_at
    )
