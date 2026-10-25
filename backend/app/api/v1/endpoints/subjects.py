from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import Subject, Course, Department, TimetableEntry, LectureSession, User
from app.permissions.deps import require_admin
from app.schemas.academic import SubjectCreate, SubjectUpdate, SubjectResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
async def list_subjects(
    course_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    semester: Optional[int] = None,
    department_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Subject)
    if course_id:
        stmt = stmt.where(Subject.course_id == course_id)
    if branch_id:
        stmt = stmt.where(Subject.branch_id == branch_id)
    if semester:
        stmt = stmt.where(Subject.semester == semester)
    if department_id:
        stmt = stmt.where(Subject.department_id == department_id)
    stmt = stmt.order_by(Subject.code.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    sub_in: SubjectCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    course = await db.get(Course, sub_in.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced Course does not exist.")

    dept = await db.get(Department, sub_in.department_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced Department does not exist.")

    stmt = select(Subject).where(Subject.code == sub_in.code.upper())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Subject code '{sub_in.code}' already exists.")

    subject = Subject(
        code=sub_in.code.upper(),
        name=sub_in.name,
        course_id=sub_in.course_id,
        branch_id=sub_in.branch_id,
        department_id=sub_in.department_id,
        semester=sub_in.semester,
        credits=sub_in.credits,
        is_active=True
    )
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return subject

@router.delete("/{subject_id}", response_model=MessageResponse)
async def delete_subject(
    subject_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    stmt_tt = select(TimetableEntry).where(TimetableEntry.subject_id == subject.id)
    tt_count = len((await db.execute(stmt_tt)).scalars().all())

    stmt_ses = select(LectureSession).where(LectureSession.subject_id == subject.id)
    ses_count = len((await db.execute(stmt_ses)).scalars().all())

    if tt_count > 0 or ses_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete subject '{subject.name}': referenced in {tt_count} timetable slots and {ses_count} lectures. Deactivate it instead."
        )

    sub_name = subject.name
    await db.delete(subject)
    await db.commit()

    return MessageResponse(message=f"Subject '{sub_name}' successfully deleted.")

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    sub_in: SubjectUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    if sub_in.name is not None:
        subject.name = sub_in.name
    if sub_in.semester is not None:
        subject.semester = sub_in.semester
    if sub_in.credits is not None:
        subject.credits = sub_in.credits
    if sub_in.is_active is not None:
        subject.is_active = sub_in.is_active

    await db.commit()
    await db.refresh(subject)
    return subject

@router.delete("/{subject_id}", response_model=MessageResponse)
async def delete_subject(
    subject_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    stmt_tt = select(TimetableEntry).where(TimetableEntry.subject_id == subject.id)
    tt_count = len((await db.execute(stmt_tt)).scalars().all())

    stmt_ses = select(LectureSession).where(LectureSession.subject_id == subject.id)
    ses_count = len((await db.execute(stmt_ses)).scalars().all())

    if tt_count > 0 or ses_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete subject '{subject.name}': referenced in {tt_count} timetable slots and {ses_count} lectures. Deactivate it instead."
        )

    sub_name = subject.name
    await db.delete(subject)
    await db.commit()

    return MessageResponse(message=f"Subject '{sub_name}' successfully deleted.")
