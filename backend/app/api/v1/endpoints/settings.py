from datetime import time, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import InstituteSettings, GeofenceSettings, User, AuditLog
from app.permissions.deps import require_admin, require_authenticated

router = APIRouter(prefix="/settings", tags=["Settings"])

class InstituteSettingsSchema(BaseModel):
    institute_name: str
    address: str
    timezone: str
    contact_email: EmailStr
    contact_phone: str
    late_threshold_minutes: int = Field(..., ge=1, le=60)
    qr_expiry_minutes: int = Field(..., ge=1, le=120)
    face_session_minutes: int = Field(..., ge=1, le=60)
    daily_cutoff_time: time

class GeofenceSettingsSchema(BaseModel):
    latitude: float
    longitude: float
    radius_meters: float = Field(..., ge=10.0, le=5000.0)
    accuracy_threshold_meters: float = Field(..., ge=5.0, le=200.0)
    is_enabled: bool

@router.get("/institute", response_model=InstituteSettingsSchema)
async def get_institute_settings(
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InstituteSettings).limit(1)
    settings_obj = (await db.execute(stmt)).scalars().first()
    if not settings_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institute settings not configured.")

    return InstituteSettingsSchema(
        institute_name=settings_obj.institute_name,
        address=settings_obj.address,
        timezone=settings_obj.timezone,
        contact_email=settings_obj.contact_email,
        contact_phone=settings_obj.contact_phone,
        late_threshold_minutes=settings_obj.late_threshold_minutes,
        qr_expiry_minutes=settings_obj.qr_expiry_minutes,
        face_session_minutes=settings_obj.face_session_minutes,
        daily_cutoff_time=settings_obj.daily_cutoff_time
    )

@router.put("/institute", response_model=InstituteSettingsSchema)
async def update_institute_settings(
    req: InstituteSettingsSchema,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InstituteSettings).limit(1)
    inst = (await db.execute(stmt)).scalars().first()
    if not inst:
        inst = InstituteSettings()
        db.add(inst)

    inst.institute_name = req.institute_name
    inst.address = req.address
    inst.timezone = req.timezone
    inst.contact_email = req.contact_email
    inst.contact_phone = req.contact_phone
    inst.late_threshold_minutes = req.late_threshold_minutes
    inst.qr_expiry_minutes = req.qr_expiry_minutes
    inst.face_session_minutes = req.face_session_minutes
    inst.daily_cutoff_time = req.daily_cutoff_time

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="INSTITUTE_SETTINGS_UPDATED",
        resource_type="SETTINGS",
        resource_id=str(inst.id),
        details="Admin modified institute configuration.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return req

@router.get("/geofence", response_model=GeofenceSettingsSchema)
async def get_geofence_settings(
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GeofenceSettings).limit(1)
    geo = (await db.execute(stmt)).scalars().first()
    if not geo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Geofence settings not found.")

    return GeofenceSettingsSchema(
        latitude=geo.latitude,
        longitude=geo.longitude,
        radius_meters=geo.radius_meters,
        accuracy_threshold_meters=geo.accuracy_threshold_meters,
        is_enabled=geo.is_enabled
    )

@router.put("/geofence", response_model=GeofenceSettingsSchema)
async def update_geofence_settings(
    req: GeofenceSettingsSchema,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GeofenceSettings).limit(1)
    geo = (await db.execute(stmt)).scalars().first()
    if not geo:
        geo = GeofenceSettings()
        db.add(geo)

    geo.latitude = req.latitude
    geo.longitude = req.longitude
    geo.radius_meters = req.radius_meters
    geo.accuracy_threshold_meters = req.accuracy_threshold_meters
    geo.is_enabled = req.is_enabled
    geo.updated_at = datetime.now(timezone.utc)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="GEOFENCE_SETTINGS_UPDATED",
        resource_type="GEOFENCE",
        resource_id=str(geo.id),
        details=f"Geofence updated: Center=({req.latitude}, {req.longitude}), Radius={req.radius_meters}m, Enabled={req.is_enabled}.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return req
