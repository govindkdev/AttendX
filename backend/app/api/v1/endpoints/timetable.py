from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.entities import (
    TimetableEntry,
    Subject,
    TeacherProfile,
    Classroom,
    Course,
    Branch,
    AcademicTerm,
    StudentProfile,
    LectureSession,
    User,
    UserRole
)
from app.permissions.deps import require_admin, require_authenticated, get_current_user
from app.schemas.academic import TimetableCreate, TimetableResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/timetable", tags=["Timetable"])

@router.get("", response_model=List[TimetableResponse])
async def list_timetable(
    course_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    semester: Optional[int] = None,
    teacher_id: Optional[int] = None,
    weekday: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TimetableEntry).options(
        selectinload(TimetableEntry.subject),
        selectinload(TimetableEntry.teacher).selectinload(TeacherProfile.user),
        selectinload(TimetableEntry.classroom)
    ).where(TimetableEntry.is_active == True)

    if course_id:
        stmt = stmt.where(TimetableEntry.course_id == course_id)
    if branch_id:
        stmt = stmt.where(TimetableEntry.branch_id == branch_id)
    if semester:
        stmt = stmt.where(TimetableEntry.semester == semester)
    if teacher_id:
        stmt = stmt.where(TimetableEntry.teacher_id == teacher_id)
    if weekday is not None:
        stmt = stmt.where(TimetableEntry.weekday == weekday)

    stmt = stmt.order_by(TimetableEntry.weekday.asc(), TimetableEntry.start_time.asc())
    result = await db.execute(stmt)
    entries = result.scalars().all()

    response = []
    for e in entries:
        response.append(TimetableResponse(
            id=e.id,
            weekday=e.weekday,
            start_time=e.start_time,
            end_time=e.end_time,
            subject_id=e.subject_id,
            teacher_id=e.teacher_id,
            classroom_id=e.classroom_id,
            course_id=e.course_id,
            branch_id=e.branch_id,
            semester=e.semester,
            is_active=e.is_active,
            subject_name=e.subject.name if e.subject else None,
            teacher_name=e.teacher.user.full_name if e.teacher and e.teacher.user else None,
            classroom_number=e.classroom.room_number if e.classroom else None
        ))
    return response

@router.delete("/{entry_id}", response_model=MessageResponse)
async def delete_timetable_entry(
    entry_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    entry = await db.get(TimetableEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable entry not found.")

    stmt_ses = select(LectureSession).where(LectureSession.timetable_entry_id == entry.id)
    ses_count = len((await db.execute(stmt_ses)).scalars().all())

    if ses_count > 0:
        entry.is_active = False
        await db.commit()
        return MessageResponse(
            message=f"Timetable slot deactivated. {ses_count} historical lecture sessions preserved.",
            success=True
        )
    else:
        await db.delete(entry)
        await db.commit()
        return MessageResponse(message="Timetable slot successfully removed.", success=True)

@router.post("", response_model=TimetableResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_entry(
    entry_in: TimetableCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new timetable entry after checking for classroom, teacher, and batch time conflicts.
    """
    if entry_in.start_time >= entry_in.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class start time must precede end time."
        )

    # 1. Check classroom conflict
    overlap_condition = and_(
        TimetableEntry.weekday == entry_in.weekday,
        TimetableEntry.is_active == True,
        TimetableEntry.start_time < entry_in.end_time,
        TimetableEntry.end_time > entry_in.start_time
    )

    room_conflict_stmt = select(TimetableEntry).where(
        overlap_condition,
        TimetableEntry.classroom_id == entry_in.classroom_id
    )
    if (await db.execute(room_conflict_stmt)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classroom is already booked for another class during this time slot."
        )

    # 2. Check teacher conflict
    teacher_conflict_stmt = select(TimetableEntry).where(
        overlap_condition,
        TimetableEntry.teacher_id == entry_in.teacher_id
    )
    if (await db.execute(teacher_conflict_stmt)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher is already scheduled for another class during this time slot."
        )

    # 3. Check student batch conflict
    batch_conflict_stmt = select(TimetableEntry).where(
        overlap_condition,
        TimetableEntry.course_id == entry_in.course_id,
        TimetableEntry.branch_id == entry_in.branch_id,
        TimetableEntry.semester == entry_in.semester
    )
    if (await db.execute(batch_conflict_stmt)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student batch (Course/Branch/Semester) already has a class scheduled during this time slot."
        )

    # Get active academic term if not specified
    term_id = entry_in.academic_term_id
    if not term_id:
        stmt_term = select(AcademicTerm).where(AcademicTerm.is_current == True)
        term = (await db.execute(stmt_term)).scalars().first()
        if term:
            term_id = term.id
        else:
            # Fallback or create default current term
            from datetime import date
            term = AcademicTerm(
                name="2026-2027 Academic Term",
                start_date=date(2026, 7, 1),
                end_date=date(2027, 6, 30),
                is_current=True
            )
            db.add(term)
            await db.flush()
            term_id = term.id

    entry = TimetableEntry(
        weekday=entry_in.weekday,
        start_time=entry_in.start_time,
        end_time=entry_in.end_time,
        subject_id=entry_in.subject_id,
        teacher_id=entry_in.teacher_id,
        classroom_id=entry_in.classroom_id,
        course_id=entry_in.course_id,
        branch_id=entry_in.branch_id,
        semester=entry_in.semester,
        academic_term_id=term_id,
        is_active=True
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Fetch loaded entry
    stmt_full = select(TimetableEntry).options(
        selectinload(TimetableEntry.subject),
        selectinload(TimetableEntry.teacher).selectinload(TeacherProfile.user),
        selectinload(TimetableEntry.classroom)
    ).where(TimetableEntry.id == entry.id)
    entry_loaded = (await db.execute(stmt_full)).scalar_one()

    return TimetableResponse(
        id=entry_loaded.id,
        weekday=entry_loaded.weekday,
        start_time=entry_loaded.start_time,
        end_time=entry_loaded.end_time,
        subject_id=entry_loaded.subject_id,
        teacher_id=entry_loaded.teacher_id,
        classroom_id=entry_loaded.classroom_id,
        course_id=entry_loaded.course_id,
        branch_id=entry_loaded.branch_id,
        semester=entry_loaded.semester,
        is_active=entry_loaded.is_active,
        subject_name=entry_loaded.subject.name if entry_loaded.subject else None,
        teacher_name=entry_loaded.teacher.user.full_name if entry_loaded.teacher and entry_loaded.teacher.user else None,
        classroom_number=entry_loaded.classroom.room_number if entry_loaded.classroom else None
    )

@router.get("/my-timetable", response_model=List[TimetableResponse])
async def get_my_timetable(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns timetable for the authenticated student or teacher based on their DB profile.
    """
    if current_user.role == UserRole.STUDENT:
        stmt_prof = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        prof = (await db.execute(stmt_prof)).scalars().first()
        if not prof:
            return []
        stmt = select(TimetableEntry).options(
            selectinload(TimetableEntry.subject),
            selectinload(TimetableEntry.teacher).selectinload(TeacherProfile.user),
            selectinload(TimetableEntry.classroom)
        ).where(
            TimetableEntry.course_id == prof.course_id,
            TimetableEntry.branch_id == prof.branch_id,
            TimetableEntry.semester == prof.semester,
            TimetableEntry.is_active == True
        ).order_by(TimetableEntry.weekday.asc(), TimetableEntry.start_time.asc())
    elif current_user.role == UserRole.TEACHER:
        stmt_prof = select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
        prof = (await db.execute(stmt_prof)).scalars().first()
        if not prof:
            return []
        stmt = select(TimetableEntry).options(
            selectinload(TimetableEntry.subject),
            selectinload(TimetableEntry.teacher).selectinload(TeacherProfile.user),
            selectinload(TimetableEntry.classroom)
        ).where(
            TimetableEntry.teacher_id == prof.id,
            TimetableEntry.is_active == True
        ).order_by(TimetableEntry.weekday.asc(), TimetableEntry.start_time.asc())
    else:
        # Admin gets full active timetable
        stmt = select(TimetableEntry).options(
            selectinload(TimetableEntry.subject),
            selectinload(TimetableEntry.teacher).selectinload(TeacherProfile.user),
            selectinload(TimetableEntry.classroom)
        ).where(TimetableEntry.is_active == True).order_by(TimetableEntry.weekday.asc(), TimetableEntry.start_time.asc())

    entries = (await db.execute(stmt)).scalars().all()
    response = []
    for e in entries:
        response.append(TimetableResponse(
            id=e.id,
            weekday=e.weekday,
            start_time=e.start_time,
            end_time=e.end_time,
            subject_id=e.subject_id,
            teacher_id=e.teacher_id,
            classroom_id=e.classroom_id,
            course_id=e.course_id,
            branch_id=e.branch_id,
            semester=e.semester,
            is_active=e.is_active,
            subject_name=e.subject.name if e.subject else None,
            teacher_name=e.teacher.user.full_name if e.teacher and e.teacher.user else None,
            classroom_number=e.classroom.room_number if e.classroom else None
        ))
    return response

@router.delete("/{entry_id}", response_model=MessageResponse)
async def delete_timetable_entry(
    entry_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    entry = await db.get(TimetableEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable entry not found.")

    stmt_ses = select(LectureSession).where(LectureSession.timetable_entry_id == entry.id)
    ses_count = len((await db.execute(stmt_ses)).scalars().all())

    if ses_count > 0:
        entry.is_active = False
        await db.commit()
        return MessageResponse(
            message=f"Timetable slot deactivated. {ses_count} historical lecture sessions preserved.",
            success=True
        )
    else:
        await db.delete(entry)
        await db.commit()
        return MessageResponse(message="Timetable slot successfully removed.", success=True)
