from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import Classroom, TimetableEntry, User
from app.permissions.deps import require_admin
from app.schemas.academic import ClassroomCreate, ClassroomUpdate, ClassroomResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

@router.get("", response_model=List[ClassroomResponse])
async def list_classrooms(db: AsyncSession = Depends(get_db)):
    stmt = select(Classroom).order_by(Classroom.room_number.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    room_in: ClassroomCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Classroom).where(Classroom.room_number == room_in.room_number.upper())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Room '{room_in.room_number}' already exists.")

    classroom = Classroom(
        room_number=room_in.room_number.upper(),
        building=room_in.building,
        floor=room_in.floor,
        capacity=room_in.capacity,
        is_active=True
    )
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}", response_model=MessageResponse)
async def delete_classroom(
    classroom_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    classroom = await db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")

    stmt_tt = select(TimetableEntry).where(TimetableEntry.classroom_id == classroom.id)
    tt_count = len((await db.execute(stmt_tt)).scalars().all())

    if tt_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete room '{classroom.room_number}': scheduled in {tt_count} timetable slots. Reassign slots or deactivate it instead."
        )

    r_num = classroom.room_number
    await db.delete(classroom)
    await db.commit()

    return MessageResponse(message=f"Classroom '{r_num}' successfully deleted.")

@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: int,
    room_in: ClassroomUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    classroom = await db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")

    if room_in.building is not None:
        classroom.building = room_in.building
    if room_in.floor is not None:
        classroom.floor = room_in.floor
    if room_in.capacity is not None:
        classroom.capacity = room_in.capacity
    if room_in.is_active is not None:
        classroom.is_active = room_in.is_active

    await db.commit()
    await db.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}", response_model=MessageResponse)
async def delete_classroom(
    classroom_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    classroom = await db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")

    stmt_tt = select(TimetableEntry).where(TimetableEntry.classroom_id == classroom.id)
    tt_count = len((await db.execute(stmt_tt)).scalars().all())

    if tt_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete room '{classroom.room_number}': scheduled in {tt_count} timetable slots. Reassign slots or deactivate it instead."
        )

    r_num = classroom.room_number
    await db.delete(classroom)
    await db.commit()

    return MessageResponse(message=f"Classroom '{r_num}' successfully deleted.")
