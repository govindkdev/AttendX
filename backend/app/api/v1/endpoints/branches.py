from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import Branch, Course, StudentProfile, Subject, User
from app.permissions.deps import require_admin
from app.schemas.academic import BranchCreate, BranchUpdate, BranchResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/branches", tags=["Branches"])

@router.get("", response_model=List[BranchResponse])
async def list_branches(
    course_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Lists branches, optionally filtered by course."""
    stmt = select(Branch)
    if course_id:
        stmt = stmt.where(Branch.course_id == course_id)
    stmt = stmt.order_by(Branch.code.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    branch_in: BranchCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    course = await db.get(Course, branch_in.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced Course does not exist.")

    stmt = select(Branch).where(
        Branch.course_id == branch_in.course_id,
        Branch.code == branch_in.code.upper()
    )
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Branch code '{branch_in.code}' already exists for this course.")

    branch = Branch(
        code=branch_in.code.upper(),
        name=branch_in.name,
        course_id=branch_in.course_id,
        is_active=True
    )
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch

@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: int,
    branch_in: BranchUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    branch = await db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")

    if branch_in.name is not None:
        branch.name = branch_in.name
    if branch_in.is_active is not None:
        branch.is_active = branch_in.is_active

    await db.commit()
    await db.refresh(branch)
    return branch

@router.delete("/{branch_id}", response_model=MessageResponse)
async def delete_branch(
    branch_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    branch = await db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")

    stmt_st = select(StudentProfile).where(StudentProfile.branch_id == branch.id)
    st_count = len((await db.execute(stmt_st)).scalars().all())

    if st_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete branch '{branch.name}': {st_count} students are currently enrolled. Deactivate the branch instead."
        )

    branch_name = branch.name
    await db.delete(branch)
    await db.commit()

    return MessageResponse(message=f"Branch '{branch_name}' successfully deleted.")
