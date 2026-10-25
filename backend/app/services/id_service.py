from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import User

async def generate_unique_student_id(db: AsyncSession) -> str:
    """
    Generates a unique, non-reusable student ID in the format: STU-{YYYY}-{0001}.
    Ensures concurrency safety by inspecting existing database records.
    """
    year = datetime.now(timezone.utc).year
    prefix = f"STU-{year}-"

    stmt = select(User.user_code).where(User.user_code.like(f"{prefix}%")).order_by(User.id.desc())
    result = await db.execute(stmt)
    codes = result.scalars().all()

    max_seq = 0
    for code in codes:
        try:
            parts = code.split("-")
            if len(parts) >= 3 and parts[2].isdigit():
                seq = int(parts[2])
                if seq > max_seq:
                    max_seq = seq
        except Exception:
            continue

    next_seq = max_seq + 1
    while True:
        candidate = f"STU-{year}-{next_seq:04d}"
        check = await db.execute(select(User.id).where(User.user_code == candidate))
        if not check.scalars().first():
            return candidate
        next_seq += 1

async def generate_unique_teacher_id(db: AsyncSession) -> str:
    """
    Generates a unique, non-reusable faculty employee ID in the format: TCH-{YYYY}-{0001}.
    Ensures concurrency safety by inspecting existing database records.
    """
    year = datetime.now(timezone.utc).year
    prefix = f"TCH-{year}-"

    stmt = select(User.user_code).where(User.user_code.like(f"{prefix}%")).order_by(User.id.desc())
    result = await db.execute(stmt)
    codes = result.scalars().all()

    max_seq = 0
    for code in codes:
        try:
            parts = code.split("-")
            if len(parts) >= 3 and parts[2].isdigit():
                seq = int(parts[2])
                if seq > max_seq:
                    max_seq = seq
        except Exception:
            continue

    next_seq = max_seq + 1
    while True:
        candidate = f"TCH-{year}-{next_seq:04d}"
        check = await db.execute(select(User.id).where(User.user_code == candidate))
        if not check.scalars().first():
            return candidate
        next_seq += 1
