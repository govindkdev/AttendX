from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import Course, Department, Branch, Subject, StudentProfile, User
from app.permissions.deps import require_admin
from app.schemas.academic import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("", response_model=List[CourseResponse])
async def list_courses(
    department_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Lists courses, optionally filtered by department."""
    stmt = select(Course)
    if department_id:
        stmt = stmt.where(Course.department_id == department_id)
    stmt = stmt.order_by(Course.code.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_in: CourseCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to create a course."""
    dept = await db.get(Department, course_in.department_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced Department does not exist.")

    stmt = select(Course).where(Course.code == course_in.code.upper())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Course code '{course_in.code}' already exists.")

    course = Course(
        code=course_in.code.upper(),
        name=course_in.name,
        department_id=course_in.department_id,
        duration_years=course_in.duration_years,
        total_semesters=course_in.total_semesters,
        is_active=True
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course

@router.delete("/{course_id}", response_model=MessageResponse)
async def delete_course(
    course_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely deletes a course if no branches, subjects, or students reference it.
    """
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    stmt_b = select(Branch).where(Branch.course_id == course.id)
    b_count = len((await db.execute(stmt_b)).scalars().all())

    stmt_s = select(StudentProfile).where(StudentProfile.course_id == course.id)
    s_count = len((await db.execute(stmt_s)).scalars().all())

    if b_count > 0 or s_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete course '{course.name}': it has {b_count} branches and {s_count} enrolled students. Deactivate the course or reassign them first."
        )

    course_name = course.name
    await db.delete(course)
    await db.commit()

    return MessageResponse(message=f"Course '{course_name}' successfully deleted.")

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_in: CourseUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    if course_in.name is not None:
        course.name = course_in.name
    if course_in.duration_years is not None:
        course.duration_years = course_in.duration_years
    if course_in.total_semesters is not None:
        course.total_semesters = course_in.total_semesters
    if course_in.is_active is not None:
        course.is_active = course_in.is_active

    await db.commit()
    await db.refresh(course)
    return course

@router.delete("/{course_id}", response_model=MessageResponse)
async def delete_course(
    course_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely deletes a course if no branches, subjects, or students reference it.
    """
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    stmt_b = select(Branch).where(Branch.course_id == course.id)
    b_count = len((await db.execute(stmt_b)).scalars().all())

    stmt_s = select(StudentProfile).where(StudentProfile.course_id == course.id)
    s_count = len((await db.execute(stmt_s)).scalars().all())

    if b_count > 0 or s_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete course '{course.name}': it has {b_count} branches and {s_count} enrolled students. Deactivate the course or reassign them first."
        )

    course_name = course.name
    await db.delete(course)
    await db.commit()

    return MessageResponse(message=f"Course '{course_name}' successfully deleted.")
