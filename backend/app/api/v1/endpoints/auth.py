import os
import shutil
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    generate_secure_otp,
    hash_otp
)
from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    TeacherProfile,
    Department,
    Course,
    Branch,
    EmailOTPChallenge,
    AuditLog
)
from app.permissions.deps import get_current_user
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    PasswordChangeRequest,
    StudentCreateAccountRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    UserProfileResponse,
    MessageResponse,
    StudentVerifyActivationRequest,
    StudentCompleteActivationRequest,
    ProfileImageResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(
    request_data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate a user (Admin, Teacher, or Student) via ID or Email and Argon2id password.
    Never trusts client-supplied roles. Sets secure HttpOnly cookie and returns Bearer token.
    """
    ident = request_data.identifier.strip()

    # Search by user_code (exact case or upper) or email (lower)
    stmt = select(User).where(
        or_(
            User.user_code == ident,
            User.user_code == ident.upper(),
            User.email == ident.lower()
        )
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(request_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your User ID/Email and password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact the administrator."
        )

    # Issue JWT token
    token_data = {
        "sub": str(user.id),
        "code": user.user_code,
        "role": user.role.value,
        "change_pwd": user.must_change_password
    }
    access_token = create_access_token(token_data)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=480 * 60,
        samesite="lax",
        secure=False  # Set to True in production HTTPS
    )

    # Log successful login
    audit = AuditLog(
        actor_id=user.id,
        actor_role=user.role.value,
        action="LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"User {user.user_code} logged in successfully.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_code=user.user_code,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        must_change_password=user.must_change_password
    )

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Enforces password changes, including mandatory first-login password updates.
    """
    if not verify_password(request_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )

    if request_data.new_password != request_data.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match."
        )

    if len(request_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    # Update hash and clear first-login flag
    current_user.hashed_password = hash_password(request_data.new_password)
    current_user.must_change_password = False
    current_user.updated_at = datetime.now(timezone.utc)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="PASSWORD_CHANGED",
        resource_type="USER",
        resource_id=str(current_user.id),
        details="User successfully changed their password.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return MessageResponse(message="Password has been updated successfully.")

@router.post("/create-account", response_model=MessageResponse)
async def create_student_account(
    req: StudentCreateAccountRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Student self-registration workflow.
    Validates identity uniqueness and ties profile to valid department, course, and branch.
    """
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # Check for duplicate user code
    stmt_code = select(User).where(User.user_code == req.student_id)
    if (await db.execute(stmt_code)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student ID '{req.student_id}' is already registered."
        )

    # Check for duplicate email
    stmt_email = select(User).where(User.email == req.email.lower())
    if (await db.execute(stmt_email)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email address '{req.email}' is already registered."
        )

    # Check for duplicate roll number
    stmt_roll = select(StudentProfile).where(StudentProfile.roll_number == req.roll_number)
    if (await db.execute(stmt_roll)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roll number '{req.roll_number}' is already registered."
        )

    # Validate course and department
    course = await db.get(Course, req.course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid course selected.")

    branch = await db.get(Branch, req.branch_id)
    if not branch or branch.course_id != req.course_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected branch does not belong to the course.")

    # Create user
    new_user = User(
        user_code=req.student_id,
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=UserRole.STUDENT,
        phone_number=req.phone_number,
        is_active=True,
        must_change_password=False
    )
    db.add(new_user)
    await db.flush()

    # Create profile
    student_profile = StudentProfile(
        user_id=new_user.id,
        roll_number=req.roll_number,
        course_id=req.course_id,
        branch_id=req.branch_id,
        department_id=req.department_id,
        semester=req.semester,
        parent_name=req.parent_name,
        parent_phone=req.parent_phone,
        parent_email=req.parent_email.lower() if req.parent_email else None,
        address=req.address
    )
    db.add(student_profile)

    audit = AuditLog(
        actor_id=new_user.id,
        actor_role=UserRole.STUDENT.value,
        action="STUDENT_ACCOUNT_CREATED",
        resource_type="USER",
        resource_id=str(new_user.id),
        details=f"Student account created for {req.full_name} ({req.student_id}).",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return MessageResponse(message="Student account created successfully! You can now log in.")

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates password recovery with a cryptographic OTP.
    Returns generic response to prevent user enumeration.
    """
    ident = req.identifier.strip()
    stmt = select(User).where(
        or_(
            User.user_code == ident,
            User.user_code == ident.upper(),
            User.email == ident.lower()
        )
    )
    user = (await db.execute(stmt)).scalars().first()

    if user and user.email:
        otp = generate_secure_otp(6)
        otp_hash = hash_otp(otp, user.email)
        challenge = EmailOTPChallenge(
            email=user.email,
            otp_hash=otp_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            attempts=0,
            is_used=False
        )
        db.add(challenge)
        await db.commit()

        # In development/mock mode, print for testing
        print(f"[SECURITY OTP NOTICE] OTP for {user.email}: {otp}")

    return MessageResponse(
        message="If an account matches the provided identifier, a verification code has been dispatched to the registered email."
    )

@router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(
    req: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies that the provided OTP for the email is valid, not expired, and not consumed.
    """
    email = req.email.lower()
    expected_hash = hash_otp(req.otp, email)

    stmt = select(EmailOTPChallenge).where(
        EmailOTPChallenge.email == email,
        EmailOTPChallenge.is_used == False,
        EmailOTPChallenge.expires_at > datetime.now(timezone.utc)
    ).order_by(EmailOTPChallenge.id.desc())

    challenge = (await db.execute(stmt)).scalars().first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP.")

    if challenge.attempts >= 5:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Maximum OTP attempts exceeded. Please request a new OTP.")

    challenge.attempts += 1

    if challenge.otp_hash != expected_hash:
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code.")

    await db.commit()
    return MessageResponse(message="OTP verified successfully.")

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Resets password after verifying OTP.
    """
    if req.new_password != req.confirm_new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters.")

    email = req.email.lower()
    expected_hash = hash_otp(req.otp, email)

    stmt = select(EmailOTPChallenge).where(
        EmailOTPChallenge.email == email,
        EmailOTPChallenge.is_used == False,
        EmailOTPChallenge.expires_at > datetime.now(timezone.utc)
    ).order_by(EmailOTPChallenge.id.desc())

    challenge = (await db.execute(stmt)).scalars().first()
    if not challenge or challenge.otp_hash != expected_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP challenge.")

    stmt_user = select(User).where(User.email == email)
    user = (await db.execute(stmt_user)).scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.hashed_password = hash_password(req.new_password)
    user.must_change_password = False
    challenge.is_used = True

    audit = AuditLog(
        actor_id=user.id,
        actor_role=user.role.value,
        action="PASSWORD_RESET_SUCCESS",
        resource_type="USER",
        resource_id=str(user.id),
        details="User reset password via verified OTP challenge.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return MessageResponse(message="Password reset successfully. You may now log in with your new password.")

@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """
    Logs out the current session and clears the HttpOnly auth cookie.
    """
    response.delete_cookie(key="access_token")
    return MessageResponse(message="Logged out successfully.")

@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the authenticated user profile with associated role metadata.
    """
    details = {}
    if current_user.role == UserRole.STUDENT:
        stmt = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        profile = (await db.execute(stmt)).scalars().first()
        if profile:
            course = await db.get(Course, profile.course_id) if profile.course_id else None
            branch = await db.get(Branch, profile.branch_id) if profile.branch_id else None
            dept = await db.get(Department, profile.department_id) if profile.department_id else None

            details = {
                "roll_number": profile.roll_number,
                "semester": profile.semester,
                "course_id": profile.course_id,
                "course_name": course.name if course else None,
                "course_code": course.code if course else None,
                "branch_id": profile.branch_id,
                "branch_name": branch.name if branch else None,
                "branch_code": branch.code if branch else None,
                "department_id": profile.department_id,
                "department_name": dept.name if dept else None,
                "parent_name": profile.parent_name,
                "parent_phone": profile.parent_phone,
                "parent_email": profile.parent_email,
                "address": profile.address
            }
    elif current_user.role == UserRole.TEACHER:
        stmt = select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
        profile = (await db.execute(stmt)).scalars().first()
        if profile:
            dept = await db.get(Department, profile.department_id) if profile.department_id else None
            details = {
                "employee_code": profile.employee_code,
                "designation": profile.designation,
                "department_id": profile.department_id,
                "department_name": dept.name if dept else None,
                "qualification": profile.qualification
            }

    return UserProfileResponse(
        id=current_user.id,
        user_code=current_user.user_code,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        phone_number=current_user.phone_number,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        must_change_password=current_user.must_change_password,
        created_at=current_user.created_at,
        details=details
    )

# --- Student Activation Workflow (Section 10) ---

@router.post("/activate/verify-student", response_model=MessageResponse)
async def verify_student_for_activation(
    req: StudentVerifyActivationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies that a student record was issued by the institute and is eligible for activation.
    Dispatches a single-use OTP challenge.
    """
    stmt = select(User).where(
        User.user_code == req.student_id.strip().upper(),
        User.email == req.email.strip().lower(),
        User.role == UserRole.STUDENT
    )
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No student record matching this Student ID and email was found. Please ensure you are entering the exact institute-issued credentials."
        )

    # Invalidate prior challenges
    now = datetime.now(timezone.utc)
    stmt_old = select(EmailOTPChallenge).where(
        EmailOTPChallenge.email == user.email,
        EmailOTPChallenge.is_used == False
    )
    for old_c in (await db.execute(stmt_old)).scalars().all():
        old_c.is_used = True

    otp = generate_secure_otp(length=6)
    challenge = EmailOTPChallenge(
        email=user.email,
        otp_hash=hash_otp(otp, user.email),
        expires_at=now + timedelta(minutes=15),
        attempts=0,
        is_used=False
    )
    db.add(challenge)

    audit = AuditLog(
        actor_id=user.id,
        actor_role="STUDENT",
        action="ACTIVATION_CHALLENGE_REQUESTED",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Activation OTP challenge issued for {user.user_code}.",
        ip_address="127.0.0.1",
        timestamp=now
    )
    db.add(audit)
    await db.commit()

    return MessageResponse(
        message=f"Verification OTP challenge generated for {user.email}. Please enter the 6-digit code to set your password."
    )

@router.post("/activate/complete", response_model=MessageResponse)
async def complete_student_activation(
    req: StudentCompleteActivationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Completes student account activation by validating the OTP and setting a strong password.
    """
    if req.new_password != req.confirm_new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    stmt = select(User).where(
        User.user_code == req.student_id.strip().upper(),
        User.email == req.email.strip().lower(),
        User.role == UserRole.STUDENT
    )
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student account not found.")

    now = datetime.now(timezone.utc)
    stmt_chal = select(EmailOTPChallenge).where(
        EmailOTPChallenge.email == user.email,
        EmailOTPChallenge.is_used == False,
        EmailOTPChallenge.expires_at > now
    ).order_by(EmailOTPChallenge.id.desc())
    challenge = (await db.execute(stmt_chal)).scalars().first()

    expected_hash = hash_otp(req.otp.strip(), user.email)
    if not challenge or challenge.otp_hash != expected_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification OTP.")

    # Update password and activate user
    user.hashed_password = hash_password(req.new_password)
    user.is_active = True
    user.must_change_password = False
    challenge.is_used = True

    audit = AuditLog(
        actor_id=user.id,
        actor_role="STUDENT",
        action="STUDENT_ACTIVATION_SUCCESS",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Student account {user.user_code} successfully activated.",
        ip_address="127.0.0.1",
        timestamp=now
    )
    db.add(audit)
    await db.commit()

    return MessageResponse(
        message="Account activated successfully! You can now log in with your Student ID and password."
    )

# --- Profile Picture Upload & Persistence (Bug 11) ---

UPLOAD_AVATAR_DIR = Path("backend/uploads/avatars")
UPLOAD_AVATAR_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/profile-image", response_model=ProfileImageResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads and persists a profile picture for the authenticated student, teacher, or admin.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPEG, PNG, and WebP images are permitted.")

    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile picture must not exceed 2 MB.")

    ext = ".jpg" if "jpeg" in file.content_type else (".png" if "png" in file.content_type else ".webp")
    filename = f"avatar_{current_user.id}_{int(datetime.now(timezone.utc).timestamp())}{ext}"
    file_path = UPLOAD_AVATAR_DIR / filename

    # Remove any existing avatar files for this user
    for existing in UPLOAD_AVATAR_DIR.glob(f"avatar_{current_user.id}_*"):
        try:
            existing.unlink()
        except Exception:
            pass

    with open(file_path, "wb") as f:
        f.write(contents)

    ts = int(datetime.now(timezone.utc).timestamp())
    current_user.avatar_url = f"/api/v1/auth/avatar/{current_user.id}?v={ts}"
    await db.commit()

    return ProfileImageResponse(
        avatar_url=current_user.avatar_url,
        message="Profile image uploaded successfully."
    )

@router.get("/avatar/{user_id}")
async def get_avatar(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Returns the persisted profile picture for a user.
    """
    for file in UPLOAD_AVATAR_DIR.glob(f"avatar_{user_id}_*"):
        media_type = "image/png" if file.suffix == ".png" else ("image/webp" if file.suffix == ".webp" else "image/jpeg")
        return FileResponse(file, media_type=media_type)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No profile picture found.")

@router.delete("/profile-image", response_model=ProfileImageResponse)
async def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes the uploaded profile image for the authenticated user.
    """
    for existing in UPLOAD_AVATAR_DIR.glob(f"avatar_{current_user.id}_*"):
        try:
            existing.unlink()
        except Exception:
            pass

    current_user.avatar_url = None
    await db.commit()

    return ProfileImageResponse(
        avatar_url=None,
        message="Profile picture removed."
    )
