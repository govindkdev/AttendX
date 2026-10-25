import asyncio
from datetime import time, timezone, datetime
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal, engine
from app.models import (
    Base,
    User,
    UserRole,
    InstituteSettings,
    GeofenceSettings,
    AuditLog
)

async def init_database_tables():
    """Initializes tables in the database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def provision_initial_settings(session: AsyncSession) -> Tuple[InstituteSettings, GeofenceSettings]:
    """Ensures InstituteSettings and GeofenceSettings exist without fake user data."""
    # Institute settings
    stmt = select(InstituteSettings).limit(1)
    res = await session.execute(stmt)
    inst_settings = res.scalars().first()
    if not inst_settings:
        inst_settings = InstituteSettings(
            institute_name=settings.INSTITUTE_NAME,
            address=settings.INSTITUTE_LOCATION,
            timezone=settings.INSTITUTE_TIMEZONE,
            contact_email="admin@gcrg.edu.in",
            contact_phone="+91 522 1234567",
            late_threshold_minutes=settings.LATE_THRESHOLD_MINUTES,
            qr_expiry_minutes=settings.QR_EXPIRY_MINUTES,
            face_session_minutes=settings.FACE_SESSION_MINUTES,
            daily_cutoff_time=time(17, 0)
        )
        session.add(inst_settings)

    # Geofence settings
    stmt_geo = select(GeofenceSettings).limit(1)
    res_geo = await session.execute(stmt_geo)
    geo_settings = res_geo.scalars().first()
    if not geo_settings:
        geo_settings = GeofenceSettings(
            latitude=settings.INSTITUTE_LATITUDE,
            longitude=settings.INSTITUTE_LONGITUDE,
            radius_meters=settings.GEOFENCE_RADIUS_METERS,
            accuracy_threshold_meters=settings.GEOFENCE_ACCURACY_THRESHOLD,
            is_enabled=True
        )
        session.add(geo_settings)

    await session.commit()
    return inst_settings, geo_settings

async def provision_administrator(
    admin_id: Optional[str] = None,
    admin_name: Optional[str] = None,
    admin_email: Optional[str] = None,
    password: Optional[str] = None,
    session: Optional[AsyncSession] = None
) -> Tuple[bool, str, Optional[User]]:
    """
    Provisions the initial administrator account.
    Enforces that initial password is required at execution time if not configured,
    and sets must_change_password=True for first login security.
    """
    target_id = admin_id or settings.INITIAL_ADMIN_ID
    target_name = admin_name or settings.INITIAL_ADMIN_NAME
    target_email = admin_email or settings.INITIAL_ADMIN_EMAIL
    initial_pwd = password or settings.INITIAL_ADMIN_PASSWORD

    if not initial_pwd:
        return False, "Initial password must be provided via command argument or INITIAL_ADMIN_PASSWORD environment variable.", None

    should_close = False
    if session is None:
        session = AsyncSessionLocal()
        should_close = True

    try:
        # Check if any admin or this user_code already exists
        stmt = select(User).where(User.user_code == target_id)
        result = await session.execute(stmt)
        existing_user = result.scalars().first()

        if existing_user:
            return False, f"Administrator with user code '{target_id}' already exists.", existing_user

        # Create the administrator account
        hashed_pwd = hash_password(initial_pwd)
        admin_user = User(
            user_code=target_id,
            email=target_email,
            hashed_password=hashed_pwd,
            full_name=target_name,
            role=UserRole.ADMIN,
            is_active=True,
            must_change_password=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(admin_user)
        await session.flush()

        audit = AuditLog(
            actor_id=admin_user.id,
            actor_role=UserRole.ADMIN.value,
            action="INITIAL_ADMIN_PROVISIONED",
            resource_type="USER",
            resource_id=str(admin_user.id),
            details=f"Initial administrator {target_id} provisioned with mandatory first-login password change.",
            ip_address="127.0.0.1",
            timestamp=datetime.now(timezone.utc)
        )
        session.add(audit)
        await session.commit()
        await session.refresh(admin_user)

        return True, f"Administrator '{target_id}' provisioned successfully with mandatory first-login password change.", admin_user
    finally:
        if should_close:
            await session.close()
