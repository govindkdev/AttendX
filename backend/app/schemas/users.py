from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.entities import UserRole

class StudentAdminCreate(BaseModel):
    student_id: Optional[str] = None # Auto-generated as STU-YYYY-XXXX if omitted
    full_name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr
    roll_number: str = Field(..., min_length=1, max_length=64)
    course_id: int
    branch_id: int
    department_id: int
    semester: int = Field(default=1, ge=1, le=12)
    phone_number: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    address: Optional[str] = None
    initial_password: Optional[str] = None # Optional; pending activation workflow

class StudentAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    roll_number: Optional[str] = None
    course_id: Optional[int] = None
    branch_id: Optional[int] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    phone_number: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    address: Optional[str] = None

class StudentAdminResponse(BaseModel):
    id: int # User ID
    profile_id: int # StudentProfile ID
    student_id: str
    roll_number: str
    full_name: str
    email: str
    phone_number: Optional[str] = None
    course_id: int
    branch_id: int
    department_id: int
    semester: int
    course_name: Optional[str] = None
    branch_name: Optional[str] = None
    is_active: bool
    face_enrolled: bool = False
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

class TeacherAdminCreate(BaseModel):
    employee_code: Optional[str] = None # Auto-generated as TCH-YYYY-XXXX if omitted
    full_name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr
    department_id: int
    designation: str = "Assistant Professor"
    qualification: Optional[str] = None
    phone_number: Optional[str] = None
    initial_password: Optional[str] = None

class TeacherAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    phone_number: Optional[str] = None

class TeacherAdminResponse(BaseModel):
    id: int # User ID
    profile_id: int
    employee_code: str
    full_name: str
    email: str
    phone_number: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    designation: str
    qualification: Optional[str] = None
    is_active: bool
    created_at: datetime

class UserStatusUpdate(BaseModel):
    is_active: bool
