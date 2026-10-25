from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import Department, Course, TeacherProfile, AuditLog, User, UserRole
from app.schemas.auth import MessageResponse
from app.permissions.deps import require_admin, require_authenticated
from app.schemas.academic import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
async def list_departments(
    db: AsyncSession = Depends(get_db)
):
    """Lists all active departments (accessible for registration and forms)."""
    stmt = select(Department).order_by(Department.name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to create a department."""
    stmt = select(Department).where(Department.code == dept_in.code.upper())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Department code '{dept_in.code}' already exists.")

    dept = Department(
        code=dept_in.code.upper(),
        name=dept_in.name,
        description=dept_in.description,
        is_active=True
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept

@router.delete("/{dept_id}", response_model=MessageResponse)
async def delete_department(
    dept_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely deletes a department if no courses or faculty reference it.
    """
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")

    stmt_crs = select(Course).where(Course.department_id == dept.id)
    crs_count = len((await db.execute(stmt_crs)).scalars().all())

    stmt_tch = select(TeacherProfile).where(TeacherProfile.department_id == dept.id)
    tch_count = len((await db.execute(stmt_tch)).scalars().all())

    if crs_count > 0 or tch_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department '{dept.name}': it has {crs_count} linked courses and {tch_count} faculty members. Deactivate the department or reassign them first."
        )

    dept_name = dept.name
    await db.delete(dept)
    await db.commit()

    return MessageResponse(message=f"Department '{dept_name}' successfully deleted.")

@router.put("/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: int,
    dept_in: DepartmentUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to update a department."""
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")

    if dept_in.name is not None:
        dept.name = dept_in.name
    if dept_in.description is not None:
        dept.description = dept_in.description
    if dept_in.is_active is not None:
        dept.is_active = dept_in.is_active

    await db.commit()
    await db.refresh(dept)
    return dept

@router.delete("/{dept_id}", response_model=MessageResponse)
async def delete_department(
    dept_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely deletes a department if no courses or faculty reference it.
    """
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")

    stmt_crs = select(Course).where(Course.department_id == dept.id)
    crs_count = len((await db.execute(stmt_crs)).scalars().all())

    stmt_tch = select(TeacherProfile).where(TeacherProfile.department_id == dept.id)
    tch_count = len((await db.execute(stmt_tch)).scalars().all())

    if crs_count > 0 or tch_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department '{dept.name}': it has {crs_count} linked courses and {tch_count} faculty members. Deactivate the department or reassign them first."
        )

    dept_name = dept.name
    await db.delete(dept)
    await db.commit()

    return MessageResponse(message=f"Department '{dept_name}' successfully deleted.")
