from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.entities import UserRole

class LoginRequest(BaseModel):
    identifier: str = Field(..., description="User ID (e.g. ADM-001, roll number, or employee ID) or registered email")
    password: str = Field(..., min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_code: str
    full_name: str
    email: str
    role: UserRole
    must_change_password: bool

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str

class StudentCreateAccountRequest(BaseModel):
    student_id: str = Field(..., min_length=3, max_length=64, description="Student ID e.g. STU-2026-001")
    full_name: str = Field(..., min_length=2, max_length=128)
    roll_number: str = Field(..., min_length=1, max_length=64)
    course_id: int
    branch_id: int
    department_id: int
    semester: int = Field(default=1, ge=1, le=12)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: EmailStr
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    address: Optional[str] = None
    password: str = Field(..., min_length=8)
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Student ID, Teacher ID, Admin ID, or registered email")

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str

class UserProfileResponse(BaseModel):
    id: int
    user_code: str
    full_name: str
    email: str
    role: UserRole
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    must_change_password: bool
    created_at: datetime
    # Additional profile metadata
    details: Optional[dict] = None

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class StudentVerifyActivationRequest(BaseModel):
    student_id: str = Field(..., min_length=3, max_length=64)
    email: EmailStr

class StudentCompleteActivationRequest(BaseModel):
    student_id: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str = Field(..., min_length=8)

class ProfileImageResponse(BaseModel):
    avatar_url: Optional[str]
    message: str
