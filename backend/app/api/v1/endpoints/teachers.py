import secrets
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    TeacherProfile,
    Department,
    TimetableEntry,
    LectureSession,
    AuditLog
)
from app.permissions.deps import require_admin
from app.services.id_service import generate_unique_teacher_id
from app.schemas.users import (
    TeacherAdminCreate,
    TeacherAdminUpdate,
    TeacherAdminResponse,
    UserStatusUpdate
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.get("", response_model=List[TeacherAdminResponse])
async def list_teachers(
    department_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TeacherProfile).options(
        selectinload(TeacherProfile.user),
        selectinload(TeacherProfile.department)
    )
    if department_id:
        stmt = stmt.where(TeacherProfile.department_id == department_id)

    result = await db.execute(stmt)
    profiles = result.scalars().all()

    response = []
    for p in profiles:
        response.append(TeacherAdminResponse(
            id=p.user.id,
            profile_id=p.id,
            employee_code=p.employee_code,
            full_name=p.user.full_name,
            email=p.user.email,
            phone_number=p.user.phone_number,
            department_id=p.department_id,
            department_name=p.department.name if p.department else None,
            designation=p.designation,
            qualification=p.qualification,
            is_active=p.user.is_active,
            created_at=p.user.created_at
        ))
    return response

@router.post("", response_model=TeacherAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    req: TeacherAdminCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # 1. Resolve or Generate Employee Code (TCH-YYYY-XXXX)
    if req.employee_code and req.employee_code.strip():
        assigned_code = req.employee_code.strip().upper()
        stmt_code = select(User).where(User.user_code == assigned_code)
        if (await db.execute(stmt_code)).scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Employee code '{assigned_code}' already exists.")
    else:
        assigned_code = await generate_unique_teacher_id(db)

    # 2. Check duplicate email
    stmt_email = select(User).where(User.email == req.email.lower())
    if (await db.execute(stmt_email)).scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Email '{req.email}' already exists.")

    dept = await db.get(Department, req.department_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department does not exist.")

    # 3. Determine password
    if req.initial_password and len(req.initial_password) >= 8:
        pwd_hash = hash_password(req.initial_password)
    else:
        pwd_hash = hash_password("Teacher@" + secrets.token_hex(3))

    new_user = User(
        user_code=assigned_code,
        email=req.email.lower(),
        hashed_password=pwd_hash,
        full_name=req.full_name.strip(),
        role=UserRole.TEACHER,
        phone_number=req.phone_number,
        is_active=True,
        must_change_password=True
    )
    db.add(new_user)
    await db.flush()

    teacher_profile = TeacherProfile(
        user_id=new_user.id,
        employee_code=assigned_code,
        department_id=req.department_id,
        designation=req.designation,
        qualification=req.qualification,
        phone_number=req.phone_number
    )
    db.add(teacher_profile)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="CREATE_TEACHER",
        resource_type="TEACHER",
        resource_id=str(new_user.id),
        details=f"Admin registered faculty {assigned_code} ({new_user.full_name}, {dept.name}).",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)
    await db.refresh(teacher_profile)

    return TeacherAdminResponse(
        id=new_user.id,
        profile_id=teacher_profile.id,
        employee_code=teacher_profile.employee_code,
        full_name=new_user.full_name,
        email=new_user.email,
        phone_number=new_user.phone_number,
        department_id=teacher_profile.department_id,
        department_name=dept.name,
        designation=teacher_profile.designation,
        qualification=teacher_profile.qualification,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.put("/{teacher_profile_id}", response_model=TeacherAdminResponse)
async def update_teacher(
    teacher_profile_id: int,
    req: TeacherAdminUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(TeacherProfile, teacher_profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher profile not found.")

    user = await db.get(User, profile.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if req.full_name:
        user.full_name = req.full_name.strip()
    if req.email and req.email.lower() != user.email:
        stmt_dup = select(User).where(User.email == req.email.lower(), User.id != user.id)
        if (await db.execute(stmt_dup)).scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use.")
        user.email = req.email.lower()
    if req.phone_number is not None:
        user.phone_number = req.phone_number
        profile.phone_number = req.phone_number

    if req.department_id is not None:
        dept = await db.get(Department, req.department_id)
        if not dept:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department does not exist.")
        profile.department_id = req.department_id
    if req.designation:
        profile.designation = req.designation
    if req.qualification is not None:
        profile.qualification = req.qualification

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="UPDATE_TEACHER",
        resource_type="TEACHER",
        resource_id=str(profile.id),
        details=f"Admin updated details for faculty {profile.employee_code}.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(profile)
    await db.refresh(user)

    dept = await db.get(Department, profile.department_id)

    return TeacherAdminResponse(
        id=user.id,
        profile_id=profile.id,
        employee_code=profile.employee_code,
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        department_id=profile.department_id,
        department_name=dept.name if dept else None,
        designation=profile.designation,
        qualification=profile.qualification,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.delete("/{teacher_profile_id}", response_model=MessageResponse)
async def delete_or_deactivate_teacher(
    teacher_profile_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely deactivates or deletes faculty with referential integrity.
    If historical timetable or lectures exist, deactivates faculty to preserve student records.
    """
    profile = await db.get(TeacherProfile, teacher_profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found.")

    user = await db.get(User, profile.user_id)

    stmt_tt = select(func.count(TimetableEntry.id)).where(TimetableEntry.teacher_id == profile.id)
    tt_count = (await db.execute(stmt_tt)).scalar() or 0

    stmt_ses = select(func.count(LectureSession.id)).where(LectureSession.teacher_id == profile.id)
    ses_count = (await db.execute(stmt_ses)).scalar() or 0

    now = datetime.now(timezone.utc)
    if (tt_count + ses_count) > 0:
        if user:
            user.is_active = False
        audit = AuditLog(
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            action="DEACTIVATE_TEACHER",
            resource_type="TEACHER",
            resource_id=str(profile.id),
            details=f"Faculty {profile.employee_code} deactivated. {tt_count} timetable slots and {ses_count} lectures preserved.",
            ip_address="127.0.0.1",
            timestamp=now
        )
        db.add(audit)
        await db.commit()
        return MessageResponse(
            message=f"Faculty account deactivated. {tt_count} timetable slots and {ses_count} lecture sessions preserved for historical records.",
            success=True
        )
    else:
        code_str = profile.employee_code
        if user:
            await db.delete(user)
        else:
            await db.delete(profile)
        audit = AuditLog(
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            action="DELETE_TEACHER",
            resource_type="TEACHER",
            resource_id=str(profile.id),
            details=f"Faculty {code_str} deleted with zero academic assignment history.",
            ip_address="127.0.0.1",
            timestamp=now
        )
        db.add(audit)
        await db.commit()
        return MessageResponse(
            message=f"Faculty {code_str} record successfully deleted.",
            success=True
        )

@router.put("/{teacher_profile_id}/status", response_model=MessageResponse)
async def toggle_teacher_status(
    teacher_profile_id: int,
    status_in: UserStatusUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(TeacherProfile, teacher_profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found.")

    user = await db.get(User, profile.user_id)
    if user:
        user.is_active = status_in.is_active
        await db.commit()

    return MessageResponse(message=f"Teacher status updated to {'active' if status_in.is_active else 'deactivated'}.")
