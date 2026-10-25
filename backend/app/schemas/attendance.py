from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.entities import AttendanceStatus, VerificationMethod, LectureSessionStatus

class FaceEnrollmentRequest(BaseModel):
    samples: List[str] = Field(..., min_length=1, description="List of base64 face image captures")

class FaceEnrollmentResponse(BaseModel):
    student_id: int
    status: str
    sample_count: int
    quality_score: float
    enrolled_at: datetime
    message: str

class StartLectureSessionRequest(BaseModel):
    timetable_entry_id: Optional[int] = None
    subject_id: int
    duration_minutes: int = Field(default=50, ge=5, le=180)

class LectureSessionStatusResponse(BaseModel):
    session_id: int
    subject_id: int
    subject_name: str
    teacher_id: int
    teacher_name: str
    date: date
    start_time: time
    end_time: time
    status: LectureSessionStatus
    session_code: str
    attendance_count: int = 0

class FaceAttendanceSubmit(BaseModel):
    session_id: int
    face_image: str = Field(..., description="Base64 data URL from browser camera")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None

class QRGenerateRequest(BaseModel):
    session_id: int
    expires_in_minutes: int = Field(default=30, ge=1, le=120)

class QRGenerateResponse(BaseModel):
    session_id: int
    qr_token: str
    expires_at: datetime
    message: str

class QRScanVerifyRequest(BaseModel):
    qr_token: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None

class ManualAttendanceRequest(BaseModel):
    session_id: int
    student_id: int # StudentProfile ID
    status: AttendanceStatus
    remarks: Optional[str] = None

class AttendanceCorrectionRequest(BaseModel):
    record_id: int
    new_status: AttendanceStatus
    reason: str = Field(..., min_length=5, description="Audited justification for attendance change")

class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_code: str
    student_name: str
    roll_number: str
    course_name: Optional[str] = None
    branch_name: Optional[str] = None
    subject_code: str
    subject_name: str
    date: date
    start_time: time
    end_time: time
    status: AttendanceStatus
    verification_method: VerificationMethod
    recorded_at: datetime
    remarks: Optional[str] = None
    is_corrected: bool = False

class AttendanceSummaryStats(BaseModel):
    total_eligible: int = 0
    present_count: int = 0
    late_count: int = 0
    absent_count: int = 0
    attendance_percentage: float = 0.0
