import secrets
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    Course,
    Branch,
    Department,
    FaceEnrollment,
    FaceEnrollmentStatus,
    AttendanceRecord,
    AuditLog
)
from app.permissions.deps import require_admin, require_teacher
from app.services.id_service import generate_unique_student_id
from app.schemas.users import (
    StudentAdminCreate,
    StudentAdminUpdate,
    StudentAdminResponse,
    UserStatusUpdate
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentAdminResponse])
async def list_students(
    search: Optional[str] = None,
    course_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    semester: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists students with course and face enrollment details.
    Restricted to Teachers and Admins.
    """
    stmt = select(StudentProfile).options(
        selectinload(StudentProfile.user),
        selectinload(StudentProfile.course),
        selectinload(StudentProfile.branch),
        selectinload(StudentProfile.face_enrollment)
    )

    if course_id:
        stmt = stmt.where(StudentProfile.course_id == course_id)
    if branch_id:
        stmt = stmt.where(StudentProfile.branch_id == branch_id)
    if semester:
        stmt = stmt.where(StudentProfile.semester == semester)

    if search:
        s = f"%{search.strip()}%"
        stmt = stmt.join(StudentProfile.user).where(
            or_(
                User.user_code.ilike(s),
                User.full_name.ilike(s),
                StudentProfile.roll_number.ilike(s),
                User.email.ilike(s)
            )
        )

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    profiles = result.scalars().all()

    response = []
    for p in profiles:
        face_done = bool(p.face_enrollment and p.face_enrollment.status == FaceEnrollmentStatus.ENROLLED)
        response.append(StudentAdminResponse(
            id=p.user.id,
            profile_id=p.id,
            student_id=p.user.user_code,
            roll_number=p.roll_number,
            full_name=p.user.full_name,
            email=p.user.email,
            phone_number=p.user.phone_number,
            course_id=p.course_id,
            branch_id=p.branch_id,
            department_id=p.department_id,
            semester=p.semester,
            course_name=p.course.name if p.course else None,
            branch_name=p.branch.name if p.branch else None,
            is_active=p.user.is_active,
            face_enrolled=face_done,
            parent_name=p.parent_name,
            parent_phone=p.parent_phone,
            parent_email=p.parent_email,
            address=p.address,
            created_at=p.user.created_at
        ))
    return response

@router.post("", response_model=StudentAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    req: StudentAdminCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to provision a student.
    Enforces uniqueness of Student ID, email, and roll number.
    Generates unique Student ID (STU-YYYY-XXXX) if not provided.
    """
    # 1. Resolve or Generate Student ID
    if req.student_id and req.student_id.strip():
        assigned_id = req.student_id.strip().upper()
        stmt_code = select(User).where(User.user_code == assigned_id)
        if (await db.execute(stmt_code)).scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Student ID '{assigned_id}' already exists.")
    else:
        assigned_id = await generate_unique_student_id(db)

    # 2. Check duplicate email
    stmt_email = select(User).where(User.email == req.email.lower())
    if (await db.execute(stmt_email)).scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Email '{req.email}' already exists.")

    # 3. Check duplicate roll number
    stmt_roll = select(StudentProfile).where(StudentProfile.roll_number == req.roll_number.strip())
    if (await db.execute(stmt_roll)).scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Roll number '{req.roll_number}' already exists.")

    # 4. Validate course & branch
    course = await db.get(Course, req.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid course ID.")
    branch = await db.get(Branch, req.branch_id)
    if not branch or branch.course_id != req.course_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid branch ID for selected course.")

    # 5. Determine password state (Section 10: Admin does not need to distribute password)
    is_active_initial = True
    must_change = True
    if req.initial_password and len(req.initial_password) >= 8:
        pwd_hash = hash_password(req.initial_password)
    else:
        # Pending activation by student
        is_active_initial = False
        pwd_hash = hash_password(secrets.token_urlsafe(16))

    # 6. Create User
    new_user = User(
        user_code=assigned_id,
        email=req.email.lower(),
        hashed_password=pwd_hash,
        full_name=req.full_name.strip(),
        role=UserRole.STUDENT,
        phone_number=req.phone_number,
        is_active=is_active_initial,
        must_change_password=must_change
    )
    db.add(new_user)
    await db.flush()

    # 7. Create StudentProfile
    profile = StudentProfile(
        user_id=new_user.id,
        roll_number=req.roll_number.strip(),
        course_id=req.course_id,
        branch_id=req.branch_id,
        department_id=req.department_id,
        semester=req.semester,
        parent_name=req.parent_name,
        parent_phone=req.parent_phone,
        parent_email=req.parent_email.lower() if req.parent_email else None,
        address=req.address
    )
    db.add(profile)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="CREATE_STUDENT",
        resource_type="STUDENT",
        resource_id=str(new_user.id),
        details=f"Admin created student {assigned_id} ({new_user.full_name}, Roll: {profile.roll_number}).",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)
    await db.refresh(profile)

    return StudentAdminResponse(
        id=new_user.id,
        profile_id=profile.id,
        student_id=new_user.user_code,
        roll_number=profile.roll_number,
        full_name=new_user.full_name,
        email=new_user.email,
        phone_number=new_user.phone_number,
        course_id=profile.course_id,
        branch_id=profile.branch_id,
        department_id=profile.department_id,
        semester=profile.semester,
        course_name=course.name,
        branch_name=branch.name,
        is_active=new_user.is_active,
        face_enrolled=False,
        parent_name=profile.parent_name,
        parent_phone=profile.parent_phone,
        parent_email=profile.parent_email,
        address=profile.address,
        created_at=new_user.created_at
    )

@router.put("/{student_profile_id}", response_model=StudentAdminResponse)
async def update_student(
    student_profile_id: int,
    req: StudentAdminUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin updates a student's profile details.
    """
    profile = await db.get(StudentProfile, student_profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    user = await db.get(User, profile.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if req.full_name:
        user.full_name = req.full_name.strip()
    if req.email and req.email.lower() != user.email:
        # Check duplicate
        stmt_dup = select(User).where(User.email == req.email.lower(), User.id != user.id)
        if (await db.execute(stmt_dup)).scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use.")
        user.email = req.email.lower()
    if req.phone_number is not None:
        user.phone_number = req.phone_number

    if req.roll_number and req.roll_number.strip() != profile.roll_number:
        stmt_dup_roll = select(StudentProfile).where(StudentProfile.roll_number == req.roll_number.strip(), StudentProfile.id != profile.id)
        if (await db.execute(stmt_dup_roll)).scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number already in use.")
        profile.roll_number = req.roll_number.strip()

    if req.course_id is not None:
        course = await db.get(Course, req.course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course not found.")
        profile.course_id = req.course_id
    if req.branch_id is not None:
        profile.branch_id = req.branch_id
    if req.department_id is not None:
        profile.department_id = req.department_id
    if req.semester is not None:
        profile.semester = req.semester
    if req.parent_name is not None:
        profile.parent_name = req.parent_name
    if req.parent_phone is not None:
        profile.parent_phone = req.parent_phone
    if req.parent_email is not None:
        profile.parent_email = req.parent_email.lower() if req.parent_email else None
    if req.address is not None:
        profile.address = req.address

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="UPDATE_STUDENT",
        resource_type="STUDENT",
        resource_id=str(profile.id),
        details=f"Admin updated details for student {user.user_code}.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(profile)
    await db.refresh(user)

    course = await db.get(Course, profile.course_id)
    branch = await db.get(Branch, profile.branch_id)
    stmt_enr = select(FaceEnrollment).where(FaceEnrollment.student_id == profile.id)
    enrollment = (await db.execute(stmt_enr)).scalars().first()
    face_done = bool(enrollment and enrollment.status == FaceEnrollmentStatus.ENROLLED)

    return StudentAdminResponse(
        id=user.id,
        profile_id=profile.id,
        student_id=user.user_code,
        roll_number=profile.roll_number,
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        course_id=profile.course_id,
        branch_id=profile.branch_id,
        department_id=profile.department_id,
        semester=profile.semester,
        course_name=course.name if course else None,
        branch_name=branch.name if branch else None,
        is_active=user.is_active,
        face_enrolled=face_done,
        parent_name=profile.parent_name,
        parent_phone=profile.parent_phone,
        parent_email=profile.parent_email,
        address=profile.address,
        created_at=user.created_at
    )

@router.delete("/{student_profile_id}", response_model=MessageResponse)
async def delete_or_deactivate_student(
    student_profile_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely deactivates or deletes a student with referential integrity:
    If historical attendance records exist, preserves records and deactivates the account.
    If no attendance records exist, safely deletes the profile.
    """
    profile = await db.get(StudentProfile, student_profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    user = await db.get(User, profile.user_id)

    # Check for attendance history
    stmt_att = select(func.count(AttendanceRecord.id)).where(AttendanceRecord.student_id == profile.id)
    att_count = (await db.execute(stmt_att)).scalar() or 0

    now = datetime.now(timezone.utc)
    if att_count > 0:
        # Cannot delete without corrupting academic audits; deactivate instead
        if user:
            user.is_active = False
        audit = AuditLog(
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            action="DEACTIVATE_STUDENT",
            resource_type="STUDENT",
            resource_id=str(profile.id),
            details=f"Student {user.user_code if user else profile.id} deactivated. {att_count} attendance records preserved for accreditation.",
            ip_address="127.0.0.1",
            timestamp=now
        )
        db.add(audit)
        await db.commit()
        return MessageResponse(
            message=f"Student account deactivated. {att_count} historical attendance records preserved for governance.",
            success=True
        )
    else:
        # No attendance records, safe to delete
        user_code_str = user.user_code if user else str(profile.id)
        if user:
            await db.delete(user)
        else:
            await db.delete(profile)
        audit = AuditLog(
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            action="DELETE_STUDENT",
            resource_type="STUDENT",
            resource_id=str(profile.id),
            details=f"Student {user_code_str} deleted with zero attendance history.",
            ip_address="127.0.0.1",
            timestamp=now
        )
        db.add(audit)
        await db.commit()
        return MessageResponse(
            message=f"Student {user_code_str} record successfully deleted.",
            success=True
        )

@router.put("/{student_profile_id}/status", response_model=MessageResponse)
async def toggle_student_status(
    student_profile_id: int,
    status_in: UserStatusUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(StudentProfile, student_profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    user = await db.get(User, profile.user_id)
    if user:
        user.is_active = status_in.is_active
        await db.commit()

    return MessageResponse(message=f"Student account status updated to {'active' if status_in.is_active else 'deactivated'}.")
