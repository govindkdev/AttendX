import enum
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, Text, Enum,
    ForeignKey, UniqueConstraint, Index, Time, Date
)
from sqlalchemy.orm import relationship
from app.db.session import Base

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class LectureSessionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    LATE = "LATE"
    ABSENT = "ABSENT"
    EXCUSED = "EXCUSED"

class VerificationMethod(str, enum.Enum):
    FACE = "FACE"
    QR = "QR"
    MANUAL = "MANUAL"
    CORRECTION = "CORRECTION"

class FaceEnrollmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ENROLLED = "ENROLLED"
    REJECTED = "REJECTED"

class LeaveRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class NotificationType(str, enum.Enum):
    ATTENDANCE = "ATTENDANCE"
    ABSENCE = "ABSENCE"
    TIMETABLE = "TIMETABLE"
    LEAVE = "LEAVE"
    SYSTEM = "SYSTEM"

class NotificationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    IN_APP = "IN_APP"

class DeliveryStatus(str, enum.Enum):
    PENDING = "PENDING"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"

class JobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

# --- Models ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_code = Column(String(64), unique=True, index=True, nullable=False) # e.g. ADM-001, STU-2026-001
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    phone_number = Column(String(32), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    courses = relationship("Course", back_populates="department")
    teachers = relationship("TeacherProfile", back_populates="department")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False) # e.g. BTECH, MCA
    name = Column(String(128), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    duration_years = Column(Integer, default=4, nullable=False)
    total_semesters = Column(Integer, default=8, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    department = relationship("Department", back_populates="courses")
    branches = relationship("Branch", back_populates="course")
    subjects = relationship("Subject", back_populates="course")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), index=True, nullable=False) # e.g. CSE, ECE
    name = Column(String(128), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (UniqueConstraint("course_id", "code", name="uq_course_branch_code"),)

    course = relationship("Course", back_populates="branches")

class AcademicTerm(Base):
    __tablename__ = "academic_terms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False) # e.g. "2026-2027 Odd Semester"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (UniqueConstraint("course_id", "branch_id", "number", name="uq_course_branch_sem"),)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False) # e.g. CS501
    name = Column(String(128), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, default=3, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    course = relationship("Course", back_populates="subjects")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(32), unique=True, index=True, nullable=False)
    building = Column(String(64), nullable=False)
    floor = Column(String(32), nullable=True)
    capacity = Column(Integer, default=60, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String(64), unique=True, index=True, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="RESTRICT"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    semester = Column(Integer, default=1, nullable=False)
    parent_name = Column(String(128), nullable=True)
    parent_phone = Column(String(32), nullable=True)
    parent_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    profile_image_url = Column(String(255), nullable=True)

    user = relationship("User", back_populates="student_profile")
    course = relationship("Course")
    branch = relationship("Branch")
    department = relationship("Department")
    enrollments = relationship("StudentEnrollment", back_populates="student")
    face_enrollment = relationship("FaceEnrollment", back_populates="student", uselist=False, cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    leave_requests = relationship("LeaveRequest", back_populates="student")

class StudentEnrollment(Base):
    __tablename__ = "student_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="RESTRICT"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="RESTRICT"), nullable=False)
    enrolled_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)

    student = relationship("StudentProfile", back_populates="enrollments")

class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = Column(String(64), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    designation = Column(String(64), default="Assistant Professor", nullable=False)
    qualification = Column(String(128), nullable=True)
    phone_number = Column(String(32), nullable=True)
    profile_image_url = Column(String(255), nullable=True)

    user = relationship("User", back_populates="teacher_profile")
    department = relationship("Department", back_populates="teachers")
    assignments = relationship("TeacherSubjectAssignment", back_populates="teacher")
    timetable_entries = relationship("TimetableEntry", back_populates="teacher")
    lecture_sessions = relationship("LectureSession", back_populates="teacher")

class TeacherSubjectAssignment(Base):
    __tablename__ = "teacher_subject_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="RESTRICT"), nullable=False)

    __table_args__ = (UniqueConstraint("teacher_id", "subject_id", "academic_term_id", name="uq_teacher_sub_term"),)

    teacher = relationship("TeacherProfile", back_populates="assignments")
    subject = relationship("Subject")

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    weekday = Column(Integer, nullable=False) # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="RESTRICT"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    subject = relationship("Subject", back_populates="timetable_entries")
    teacher = relationship("TeacherProfile", back_populates="timetable_entries")
    classroom = relationship("Classroom")
    course = relationship("Course")
    branch = relationship("Branch")
    lecture_sessions = relationship("LectureSession", back_populates="timetable_entry")

class LectureSession(Base):
    __tablename__ = "lecture_sessions"

    id = Column(Integer, primary_key=True, index=True)
    timetable_entry_id = Column(Integer, ForeignKey("timetable_entries.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="RESTRICT"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(LectureSessionStatus), default=LectureSessionStatus.SCHEDULED, nullable=False, index=True)
    session_code = Column(String(32), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    timetable_entry = relationship("TimetableEntry", back_populates="lecture_sessions")
    subject = relationship("Subject")
    teacher = relationship("TeacherProfile", back_populates="lecture_sessions")
    attendance_records = relationship("AttendanceRecord", back_populates="lecture_session")
    qr_session = relationship("QRSession", back_populates="lecture_session", uselist=False, cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    lecture_session_id = Column(Integer, ForeignKey("lecture_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False, index=True)
    verification_method = Column(Enum(VerificationMethod), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    remarks = Column(String(255), nullable=True)
    is_corrected = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("lecture_session_id", "student_id", name="uq_session_student_attendance"),
        Index("ix_attendance_session_status", "lecture_session_id", "status"),
        Index("ix_attendance_student_date", "student_id", "recorded_at"),
    )

    lecture_session = relationship("LectureSession", back_populates="attendance_records")
    student = relationship("StudentProfile", back_populates="attendance_records")
    events = relationship("AttendanceEvent", back_populates="attendance_record", cascade="all, delete-orphan")
    corrections = relationship("AttendanceCorrection", back_populates="attendance_record", cascade="all, delete-orphan")

class AttendanceEvent(Base):
    __tablename__ = "attendance_events"

    id = Column(Integer, primary_key=True, index=True)
    attendance_record_id = Column(Integer, ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(64), nullable=False) # e.g. "RECORDED", "UPDATED", "FLAGGED"
    details = Column(Text, nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    attendance_record = relationship("AttendanceRecord", back_populates="events")

class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id = Column(Integer, primary_key=True, index=True)
    attendance_record_id = Column(Integer, ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(Enum(AttendanceStatus), nullable=False)
    new_status = Column(Enum(AttendanceStatus), nullable=False)
    reason = Column(Text, nullable=False)
    corrected_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    corrected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    attendance_record = relationship("AttendanceRecord", back_populates="corrections")
    corrected_by = relationship("User")

# --- Face Dataset & Recognition ---

class FaceEnrollment(Base):
    __tablename__ = "face_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    status = Column(Enum(FaceEnrollmentStatus), default=FaceEnrollmentStatus.PENDING, nullable=False)
    sample_count = Column(Integer, default=0, nullable=False)
    quality_score = Column(Float, default=0.0, nullable=False)
    enrolled_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("StudentProfile", back_populates="face_enrollment")
    templates = relationship("FaceTemplate", back_populates="enrollment", cascade="all, delete-orphan")
    samples = relationship("FaceSample", back_populates="enrollment", cascade="all, delete-orphan")

class FaceTemplate(Base):
    __tablename__ = "face_templates"

    id = Column(Integer, primary_key=True, index=True)
    face_enrollment_id = Column(Integer, ForeignKey("face_enrollments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    embedding_vector = Column(Text, nullable=False) # JSON array of floats (128-d / 512-d normalized vector)
    algorithm_version = Column(String(32), default="opencv-sface-v1", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    enrollment = relationship("FaceEnrollment", back_populates="templates")

class FaceSample(Base):
    __tablename__ = "face_samples"

    id = Column(Integer, primary_key=True, index=True)
    face_enrollment_id = Column(Integer, ForeignKey("face_enrollments.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(255), nullable=False)
    quality_score = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    enrollment = relationship("FaceEnrollment", back_populates="samples")

# --- QR Attendance ---

class QRSession(Base):
    __tablename__ = "qr_sessions"

    id = Column(Integer, primary_key=True, index=True)
    lecture_session_id = Column(Integer, ForeignKey("lecture_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    token_hash = Column(String(128), index=True, nullable=False)
    secret_key = Column(String(64), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_closed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    lecture_session = relationship("LectureSession", back_populates="qr_session")
    verifications = relationship("QRVerificationEvent", back_populates="qr_session", cascade="all, delete-orphan")

class QRVerificationEvent(Base):
    __tablename__ = "qr_verification_events"

    id = Column(Integer, primary_key=True, index=True)
    qr_session_id = Column(Integer, ForeignKey("qr_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    verification_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(32), nullable=False) # SUCCESS, FAILED, EXPIRED, GEOFENCE_REJECTED
    failure_reason = Column(String(255), nullable=True)

    qr_session = relationship("QRSession", back_populates="verifications")

# --- Leave Requests ---

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveRequestStatus), default=LeaveRequestStatus.PENDING, nullable=False, index=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_remarks = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("StudentProfile", back_populates="leave_requests")
    reviewed_by = relationship("User")

# --- Notifications & Delivery ---

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    recipient = relationship("User", back_populates="notifications")
    deliveries = relationship("NotificationDelivery", back_populates="notification", cascade="all, delete-orphan")

class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    channel = Column(Enum(NotificationChannel), nullable=False)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False)
    provider_response = Column(Text, nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    notification = relationship("Notification", back_populates="deliveries")

# --- Security Challenges & OTPs ---

class EmailOTPChallenge(Base):
    __tablename__ = "email_otp_challenges"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp_hash = Column(String(128), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class PasswordResetChallenge(Base):
    __tablename__ = "password_reset_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(128), index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

# --- Institute & Geofence Settings ---

class InstituteSettings(Base):
    __tablename__ = "institute_settings"

    id = Column(Integer, primary_key=True)
    institute_name = Column(String(128), default="GCRG Group of Institutions", nullable=False)
    address = Column(Text, default="Lucknow, Uttar Pradesh, India", nullable=False)
    timezone = Column(String(64), default="Asia/Kolkata", nullable=False)
    contact_email = Column(String(255), default="contact@gcrg.edu.in", nullable=False)
    contact_phone = Column(String(32), default="+91 522 1234567", nullable=False)
    late_threshold_minutes = Column(Integer, default=15, nullable=False)
    qr_expiry_minutes = Column(Integer, default=30, nullable=False)
    face_session_minutes = Column(Integer, default=5, nullable=False)
    daily_cutoff_time = Column(Time, nullable=False) # 17:00:00 (5:00 PM)

class GeofenceSettings(Base):
    __tablename__ = "geofence_settings"

    id = Column(Integer, primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=200.0, nullable=False)
    accuracy_threshold_meters = Column(Float, default=50.0, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

# --- Audit Logs & Background Jobs ---

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role = Column(String(32), nullable=True)
    action = Column(String(64), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False, index=True)
    resource_id = Column(String(64), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

class AIQueryLog(Base):
    __tablename__ = "ai_query_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    query_text = Column(Text, nullable=False)
    response_summary = Column(Text, nullable=False)
    evidence_used = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String(64), nullable=False, index=True)
    payload = Column(Text, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED, nullable=False, index=True)
    attempts = Column(Integer, default=0, nullable=False)
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
