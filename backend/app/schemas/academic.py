from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# --- Departments ---
class DepartmentCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=32)
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

# --- Courses ---
class CourseCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=32)
    name: str = Field(..., min_length=2, max_length=128)
    department_id: int
    duration_years: int = Field(default=4, ge=1, le=6)
    total_semesters: int = Field(default=8, ge=1, le=12)

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    duration_years: Optional[int] = None
    total_semesters: Optional[int] = None
    is_active: Optional[bool] = None

class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    department_id: int
    duration_years: int
    total_semesters: int
    is_active: bool

# --- Branches ---
class BranchCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=32)
    name: str = Field(..., min_length=2, max_length=128)
    course_id: int

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class BranchResponse(BaseModel):
    id: int
    code: str
    name: str
    course_id: int
    is_active: bool

# --- Classrooms ---
class ClassroomCreate(BaseModel):
    room_number: str = Field(..., min_length=1, max_length=32)
    building: str = Field(..., min_length=1, max_length=64)
    floor: Optional[str] = None
    capacity: int = Field(default=60, ge=1)

class ClassroomUpdate(BaseModel):
    building: Optional[str] = None
    floor: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

class ClassroomResponse(BaseModel):
    id: int
    room_number: str
    building: str
    floor: Optional[str] = None
    capacity: int
    is_active: bool

# --- Subjects ---
class SubjectCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=32)
    name: str = Field(..., min_length=2, max_length=128)
    course_id: int
    branch_id: Optional[int] = None
    department_id: int
    semester: int = Field(..., ge=1, le=12)
    credits: int = Field(default=3, ge=1, le=10)

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    is_active: Optional[bool] = None

class SubjectResponse(BaseModel):
    id: int
    code: str
    name: str
    course_id: int
    branch_id: Optional[int] = None
    department_id: int
    semester: int
    credits: int
    is_active: bool

# --- Timetable ---
class TimetableCreate(BaseModel):
    weekday: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: time
    end_time: time
    subject_id: int
    teacher_id: int
    classroom_id: int
    course_id: int
    branch_id: int
    semester: int
    academic_term_id: Optional[int] = None

class TimetableResponse(BaseModel):
    id: int
    weekday: int
    start_time: time
    end_time: time
    subject_id: int
    teacher_id: int
    classroom_id: int
    course_id: int
    branch_id: int
    semester: int
    is_active: bool
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None
    classroom_number: Optional[str] = None

# --- Lecture Sessions ---
class LectureSessionCreate(BaseModel):
    subject_id: int
    teacher_id: int
    date: date
    start_time: time
    end_time: time
    timetable_entry_id: Optional[int] = None

class LectureSessionResponse(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    date: date
    start_time: time
    end_time: time
    status: str
    session_code: str
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None
