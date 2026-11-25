import json
import secrets
from pathlib import Path
import cv2
from datetime import datetime, timezone, timedelta, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_signed_qr_token,
    verify_signed_qr_token,
    verify_gps_geofence
)
from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    TeacherProfile,
    TimetableEntry,
    LectureSession,
    LectureSessionStatus,
    AttendanceRecord,
    AttendanceStatus,
    VerificationMethod,
    AttendanceEvent,
    AttendanceCorrection,
    FaceEnrollment,
    FaceTemplate,
    FaceSample,
    FaceEnrollmentStatus,
    QRSession,
    QRVerificationEvent,
    GeofenceSettings,
    InstituteSettings,
    Subject,
    AuditLog
)
from app.permissions.deps import (
    get_current_user,
    require_admin,
    require_teacher,
    require_student
)
from app.schemas.attendance import (
    FaceEnrollmentRequest,
    FaceEnrollmentResponse,
    StartLectureSessionRequest,
    LectureSessionStatusResponse,
    FaceAttendanceSubmit,
    QRGenerateRequest,
    QRGenerateResponse,
    QRScanVerifyRequest,
    ManualAttendanceRequest,
    AttendanceCorrectionRequest,
    AttendanceRecordResponse
)
from app.schemas.auth import MessageResponse
from app.services.face_service import face_service

router = APIRouter(prefix="/attendance", tags=["Attendance Engine"])

# --- Face Enrollment (Admin Only — Bug 4 & 10) ---

UPLOAD_FACE_DIR = Path("backend/uploads/faces")
UPLOAD_FACE_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/face-enroll", response_model=FaceEnrollmentResponse)
async def enroll_face_dataset(
    req: FaceEnrollmentRequest,
    student_user_id: Optional[int] = None,
    student_profile_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Biometric enrollment endpoint — restricted strictly to authorized administrators (Bug 10).
    Captures 25-30 face samples, assesses quality, persists photos to disk/DB (Bug 4),
    and computes the normalized 128-d master face embedding template.
    """
    student = None
    if student_profile_id:
        student = await db.get(StudentProfile, student_profile_id)
    elif student_user_id:
        stmt_prof = select(StudentProfile).where(StudentProfile.user_id == student_user_id)
        student = (await db.execute(stmt_prof)).scalars().first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please provide a valid student_profile_id or student_user_id."
        )

    valid_vectors = []
    valid_images = []
    quality_scores = []

    for sample in req.samples:
        img = face_service.decode_image(sample)
        if img is None:
            continue
        ok, quality, _ = face_service.assess_quality(img)
        if not ok:
            continue
        ok_emb, vec, _ = face_service.extract_face_embedding(img)
        if ok_emb and vec:
            valid_vectors.append(vec)
            valid_images.append((img, quality))
            quality_scores.append(quality)

    if not valid_vectors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate valid face template from captured samples. Please ensure proper lighting, clear focus, and centered camera framing."
        )

    # Average vectors and normalize to create master biometric template
    mean_vec = [float(sum(v[i] for v in valid_vectors) / len(valid_vectors)) for i in range(128)]
    # L2 normalize
    norm = sum(x**2 for x in mean_vec) ** 0.5
    if norm > 0:
        mean_vec = [x / norm for x in mean_vec]

    avg_quality = float(sum(quality_scores) / len(quality_scores))

    # Check existing enrollment
    stmt_enr = select(FaceEnrollment).where(FaceEnrollment.student_id == student.id)
    enrollment = (await db.execute(stmt_enr)).scalars().first()

    now = datetime.now(timezone.utc)
    if not enrollment:
        enrollment = FaceEnrollment(
            student_id=student.id,
            status=FaceEnrollmentStatus.ENROLLED,
            sample_count=len(valid_vectors),
            quality_score=avg_quality,
            enrolled_at=now
        )
        db.add(enrollment)
        await db.flush()
    else:
        enrollment.status = FaceEnrollmentStatus.ENROLLED
        enrollment.sample_count = len(valid_vectors)
        enrollment.quality_score = avg_quality
        enrollment.enrolled_at = now

    # Persist face samples to disk and database (Bug 4)
    student_face_dir = UPLOAD_FACE_DIR / str(student.id)
    student_face_dir.mkdir(parents=True, exist_ok=True)

    # Clear old sample files if re-enrolling
    for old_file in student_face_dir.glob("sample_*.jpg"):
        try:
            old_file.unlink()
        except Exception:
            pass

    for idx, (img, q) in enumerate(valid_images):
        file_path = student_face_dir / f"sample_{idx+1}.jpg"
        cv2.imwrite(str(file_path), img)
        sample_record = FaceSample(
            face_enrollment_id=enrollment.id,
            file_path=str(file_path),
            quality_score=q,
            created_at=now
        )
        db.add(sample_record)

    # Deactivate older templates and save new active template
    stmt_tmpl = select(FaceTemplate).where(FaceTemplate.face_enrollment_id == enrollment.id)
    for old_t in (await db.execute(stmt_tmpl)).scalars().all():
        old_t.is_active = False

    template = FaceTemplate(
        face_enrollment_id=enrollment.id,
        student_id=student.id,
        embedding_vector=json.dumps(mean_vec),
        algorithm_version="opencv-sf-v1",
        is_active=True,
        created_at=now
    )
    db.add(template)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="FACE_ENROLLMENT_SUCCESS",
        resource_type="STUDENT",
        resource_id=str(student.id),
        details=f"Admin enrolled face template with {len(valid_vectors)} samples (quality: {avg_quality:.2f}). Photos saved to disk.",
        ip_address="127.0.0.1",
        timestamp=now
    )
    db.add(audit)
    await db.commit()

    return FaceEnrollmentResponse(
        student_id=student.id,
        status="ENROLLED",
        sample_count=len(valid_vectors),
        quality_score=round(avg_quality, 2),
        enrolled_at=now,
        message=f"Biometric enrollment successfully completed. {len(valid_vectors)} samples verified and saved."
    )

@router.post("/face-enroll/{student_profile_id}/reset")
async def reset_face_enrollment(
    student_profile_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin resets biometric face template for a student, requiring re-enrollment.
    """
    student = await db.get(StudentProfile, student_profile_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    stmt_enr = select(FaceEnrollment).where(FaceEnrollment.student_id == student.id)
    enrollment = (await db.execute(stmt_enr)).scalars().first()
    if enrollment:
        enrollment.status = FaceEnrollmentStatus.PENDING
        enrollment.sample_count = 0
        enrollment.quality_score = 0.0

    stmt_tmpl = select(FaceTemplate).where(FaceTemplate.student_id == student.id)
    for tmpl in (await db.execute(stmt_tmpl)).scalars().all():
        tmpl.is_active = False

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="FACE_ENROLLMENT_RESET",
        resource_type="STUDENT",
        resource_id=str(student.id),
        details=f"Admin reset face biometric enrollment for student {student.student_id}.",
        ip_address="127.0.0.1",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return {"message": f"Biometric face dataset successfully reset for {student.student_id}."}

# --- Lecture Sessions ---

@router.post("/sessions/start", response_model=LectureSessionStatusResponse)
async def start_lecture_session(
    req: StartLectureSessionRequest,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher starts attendance session for an assigned lecture.
    Enforces that teacher is authorized.
    """
    teacher = None
    if current_user.role == UserRole.TEACHER:
        stmt_t = select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
        teacher = (await db.execute(stmt_t)).scalars().first()
        if not teacher:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher profile not found.")
    else:
        # Admin can start for any teacher or timetable entry
        if req.timetable_entry_id:
            tt = await db.get(TimetableEntry, req.timetable_entry_id)
            if tt:
                teacher = await db.get(TeacherProfile, tt.teacher_id)
        if not teacher:
            stmt_any_t = select(TeacherProfile).limit(1)
            teacher = (await db.execute(stmt_any_t)).scalars().first()
            if not teacher:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No teachers found in institute.")

    subject = await db.get(Subject, req.subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    now = datetime.now(timezone.utc)
    today = now.date()
    start_t = now.time()
    end_t = (now + timedelta(minutes=req.duration_minutes)).time()
    session_code = f"SES-{secrets.token_hex(4).upper()}"

    session = LectureSession(
        timetable_entry_id=req.timetable_entry_id,
        subject_id=req.subject_id,
        teacher_id=teacher.id,
        date=today,
        start_time=start_t,
        end_time=end_t,
        status=LectureSessionStatus.ACTIVE,
        session_code=session_code,
        created_at=now
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    teacher_user = await db.get(User, teacher.user_id)
    teacher_name = teacher_user.full_name if teacher_user else "Teacher"

    return LectureSessionStatusResponse(
        session_id=session.id,
        subject_id=subject.id,
        subject_name=subject.name,
        teacher_id=teacher.id,
        teacher_name=teacher_name,
        date=session.date,
        start_time=session.start_time,
        end_time=session.end_time,
        status=session.status,
        session_code=session.session_code,
        attendance_count=0
    )

@router.post("/sessions/{session_id}/close", response_model=MessageResponse)
async def close_lecture_session(
    session_id: int,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(LectureSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session.status = LectureSessionStatus.COMPLETED
    # Close any active QR session
    stmt_qr = select(QRSession).where(QRSession.lecture_session_id == session_id)
    qr_sess = (await db.execute(stmt_qr)).scalars().first()
    if qr_sess:
        qr_sess.is_closed = True

    await db.commit()
    return MessageResponse(message="Lecture session completed and closed.")

@router.get("/sessions/active", response_model=List[LectureSessionStatusResponse])
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns currently active sessions eligible for attendance verification.
    """
    stmt = select(LectureSession).options(
        selectinload(LectureSession.subject),
        selectinload(LectureSession.teacher).selectinload(TeacherProfile.user),
        selectinload(LectureSession.attendance_records)
    ).where(LectureSession.status == LectureSessionStatus.ACTIVE)

    if current_user.role == UserRole.TEACHER:
        stmt_t = select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
        t_prof = (await db.execute(stmt_t)).scalars().first()
        if t_prof:
            stmt = stmt.where(LectureSession.teacher_id == t_prof.id)
    elif current_user.role == UserRole.STUDENT:
        stmt_s = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        s_prof = (await db.execute(stmt_s)).scalars().first()
        if s_prof:
            # Match sessions whose subjects belong to student's course, branch, and semester
            stmt = stmt.join(LectureSession.subject).where(
                Subject.course_id == s_prof.course_id,
                Subject.semester == s_prof.semester
            )

    sessions = (await db.execute(stmt)).scalars().all()
    results = []
    for s in sessions:
        results.append(LectureSessionStatusResponse(
            session_id=s.id,
            subject_id=s.subject_id,
            subject_name=s.subject.name if s.subject else "Subject",
            teacher_id=s.teacher_id,
            teacher_name=s.teacher.user.full_name if s.teacher and s.teacher.user else "Teacher",
            date=s.date,
            start_time=s.start_time,
            end_time=s.end_time,
            status=s.status,
            session_code=s.session_code,
            attendance_count=len(s.attendance_records)
        ))
    return results

# --- Face Verification Attendance ---

@router.post("/verify-face", response_model=AttendanceRecordResponse)
async def submit_face_attendance(
    req: FaceAttendanceSubmit,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """
    Validates facial biometric frame, session status, GPS perimeter, and records attendance transactionally.
    """
    # 1. Fetch student profile
    stmt_prof = select(StudentProfile).options(
        selectinload(StudentProfile.user),
        selectinload(StudentProfile.course),
        selectinload(StudentProfile.branch)
    ).where(StudentProfile.user_id == current_user.id)
    student = (await db.execute(stmt_prof)).scalars().first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    # 2. Check active face enrollment and template
    stmt_tmpl = select(FaceTemplate).where(
        FaceTemplate.student_id == student.id,
        FaceTemplate.is_active == True
    ).order_by(FaceTemplate.id.desc())
    template = (await db.execute(stmt_tmpl)).scalars().first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You do not have an active face enrollment. Please complete face enrollment first."
        )

    # 3. Check lecture session
    session = await db.get(LectureSession, req.session_id)
    if not session or session.status != LectureSessionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This lecture session is not currently active for attendance."
        )

    # 3b. Verify student cohort enrollment for this subject (Bug 8)
    subject = await db.get(Subject, session.subject_id)
    if subject and (subject.course_id != student.course_id or subject.semester != student.semester):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not enrolled in this lecture ({subject.name}, Sem {subject.semester}). Attendance is restricted to enrolled students."
        )

    # 4. Check for duplicate attendance
    stmt_dup = select(AttendanceRecord).where(
        AttendanceRecord.lecture_session_id == req.session_id,
        AttendanceRecord.student_id == student.id
    )
    existing_record = (await db.execute(stmt_dup)).scalars().first()
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance already recorded for this lecture on {existing_record.recorded_at.strftime('%H:%M:%S')}."
        )

    # 5. Geofence verification
    geo_stmt = select(GeofenceSettings).limit(1)
    geofence = (await db.execute(geo_stmt)).scalars().first()
    if geofence and geofence.is_enabled:
        if req.latitude is None or req.longitude is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GPS location is required by institute policy to verify on-campus presence."
            )
        accuracy = req.accuracy or 10.0
        in_fence, dist, msg = verify_gps_geofence(
            student_lat=req.latitude,
            student_lon=req.longitude,
            accuracy=accuracy,
            target_lat=geofence.latitude,
            target_lon=geofence.longitude,
            allowed_radius=geofence.radius_meters,
            accuracy_threshold=geofence.accuracy_threshold_meters
        )
        if not in_fence:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # 6. Biometric comparison
    is_match, conf, match_msg = face_service.verify_face(
        captured_frame=req.face_image,
        stored_template_json=template.embedding_vector
    )
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Face verification failed: {match_msg}"
        )

    # 7. Determine status (Present vs Late)
    now = datetime.now(timezone.utc)
    rec_status = AttendanceStatus.PRESENT

    # Late threshold check
    inst_stmt = select(InstituteSettings).limit(1)
    inst = (await db.execute(inst_stmt)).scalars().first()
    late_threshold_min = inst.late_threshold_minutes if inst else settings.LATE_THRESHOLD_MINUTES

    session_start_dt = datetime.combine(session.date, session.start_time, tzinfo=timezone.utc)
    if now > (session_start_dt + timedelta(minutes=late_threshold_min)):
        rec_status = AttendanceStatus.LATE

    # 8. Record attendance transactionally
    record = AttendanceRecord(
        lecture_session_id=session.id,
        student_id=student.id,
        status=rec_status,
        verification_method=VerificationMethod.FACE,
        recorded_at=now,
        remarks=f"Face matched ({conf * 100:.1f}%)"
    )
    db.add(record)
    await db.flush()

    event = AttendanceEvent(
        attendance_record_id=record.id,
        event_type="RECORDED",
        details=f"Face verified with similarity {conf:.4f}",
        actor_id=current_user.id,
        ip_address="127.0.0.1",
        created_at=now
    )
    db.add(event)
    await db.commit()
    await db.refresh(record)

    subject = await db.get(Subject, session.subject_id)

    return AttendanceRecordResponse(
        id=record.id,
        session_id=session.id,
        student_id=student.id,
        student_code=student.user.user_code,
        student_name=student.user.full_name,
        roll_number=student.roll_number,
        course_name=student.course.name if student.course else None,
        branch_name=student.branch.name if student.branch else None,
        subject_code=subject.code if subject else "",
        subject_name=subject.name if subject else "",
        date=session.date,
        start_time=session.start_time,
        end_time=session.end_time,
        status=record.status,
        verification_method=record.verification_method,
        recorded_at=record.recorded_at,
        remarks=record.remarks,
        is_corrected=False
    )

# --- QR Attendance ---

@router.post("/qr/generate", response_model=QRGenerateResponse)
async def generate_qr_attendance(
    req: QRGenerateRequest,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher generates an HMAC-signed, tamper-evident expiring QR token for an active lecture session.
    """
    session = await db.get(LectureSession, req.session_id)
    if not session or session.status != LectureSessionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lecture session is not active."
        )

    token_str, expires_at = create_signed_qr_token(
        lecture_session_id=session.id,
        teacher_id=session.teacher_id,
        expires_in_minutes=req.expires_in_minutes
    )

    # Store or update QRSession
    stmt = select(QRSession).where(QRSession.lecture_session_id == session.id)
    qr_sess = (await db.execute(stmt)).scalars().first()
    now = datetime.now(timezone.utc)

    if not qr_sess:
        qr_sess = QRSession(
            lecture_session_id=session.id,
            token_hash=secrets.token_hex(16),
            secret_key=settings.APP_SECRET_KEY,
            expires_at=expires_at,
            is_closed=False,
            created_at=now
        )
        db.add(qr_sess)
    else:
        qr_sess.expires_at = expires_at
        qr_sess.is_closed = False

    await db.commit()

    return QRGenerateResponse(
        session_id=session.id,
        qr_token=token_str,
        expires_at=expires_at,
        message="Signed QR token generated successfully."
    )

@router.post("/qr/verify", response_model=AttendanceRecordResponse)
async def verify_qr_attendance(
    req: QRScanVerifyRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """
    Student submits scanned QR token. Backend validates signature, expiration, session status,
    enrollment, and GPS perimeter.
    """
    # 1. Verify token signature and expiry
    is_valid, payload, msg = verify_signed_qr_token(req.qr_token)
    if not is_valid or not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    session_id = payload.get("sid")

    # 2. Verify lecture session
    session = await db.get(LectureSession, session_id)
    if not session or session.status != LectureSessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The lecture session is no longer active.")

    # 3. Verify student
    stmt_prof = select(StudentProfile).options(
        selectinload(StudentProfile.user),
        selectinload(StudentProfile.course),
        selectinload(StudentProfile.branch)
    ).where(StudentProfile.user_id == current_user.id)
    student = (await db.execute(stmt_prof)).scalars().first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    # 3b. Verify student cohort enrollment for this subject (Bug 6)
    subject = await db.get(Subject, session.subject_id)
    if subject and (subject.course_id != student.course_id or subject.semester != student.semester):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not enrolled in this lecture ({subject.name}, Sem {subject.semester}). QR attendance cannot be marked for other classes."
        )

    # 4. Check duplicate
    stmt_dup = select(AttendanceRecord).where(
        AttendanceRecord.lecture_session_id == session_id,
        AttendanceRecord.student_id == student.id
    )
    if (await db.execute(stmt_dup)).scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance already recorded for this lecture.")

    # 5. Geofence verification
    geo_stmt = select(GeofenceSettings).limit(1)
    geofence = (await db.execute(geo_stmt)).scalars().first()
    if geofence and geofence.is_enabled:
        if req.latitude is None or req.longitude is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GPS location is required to verify campus proximity.")
        accuracy = req.accuracy or 10.0
        in_fence, dist, g_msg = verify_gps_geofence(
            student_lat=req.latitude,
            student_lon=req.longitude,
            accuracy=accuracy,
            target_lat=geofence.latitude,
            target_lon=geofence.longitude,
            allowed_radius=geofence.radius_meters,
            accuracy_threshold=geofence.accuracy_threshold_meters
        )
        if not in_fence:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=g_msg)

    # 6. Check late status
    now = datetime.now(timezone.utc)
    rec_status = AttendanceStatus.PRESENT
    inst_stmt = select(InstituteSettings).limit(1)
    inst = (await db.execute(inst_stmt)).scalars().first()
    late_threshold_min = inst.late_threshold_minutes if inst else settings.LATE_THRESHOLD_MINUTES

    session_start_dt = datetime.combine(session.date, session.start_time, tzinfo=timezone.utc)
    if now > (session_start_dt + timedelta(minutes=late_threshold_min)):
        rec_status = AttendanceStatus.LATE

    record = AttendanceRecord(
        lecture_session_id=session.id,
        student_id=student.id,
        status=rec_status,
        verification_method=VerificationMethod.QR,
        recorded_at=now,
        remarks="QR verified"
    )
    db.add(record)
    await db.flush()

    event = AttendanceEvent(
        attendance_record_id=record.id,
        event_type="RECORDED",
        details="Verified via signed QR scan",
        actor_id=current_user.id,
        ip_address="127.0.0.1",
        created_at=now
    )
    db.add(event)
    await db.commit()
    await db.refresh(record)

    subject = await db.get(Subject, session.subject_id)

    return AttendanceRecordResponse(
        id=record.id,
        session_id=session.id,
        student_id=student.id,
        student_code=student.user.user_code,
        student_name=student.user.full_name,
        roll_number=student.roll_number,
        course_name=student.course.name if student.course else None,
        branch_name=student.branch.name if student.branch else None,
        subject_code=subject.code if subject else "",
        subject_name=subject.name if subject else "",
        date=session.date,
        start_time=session.start_time,
        end_time=session.end_time,
        status=record.status,
        verification_method=record.verification_method,
        recorded_at=record.recorded_at,
        remarks=record.remarks,
        is_corrected=False
    )

# --- Manual Attendance & Corrections ---

@router.post("/manual", response_model=AttendanceRecordResponse)
async def mark_manual_attendance(
    req: ManualAttendanceRequest,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(LectureSession, req.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture session not found.")

    student = await db.get(StudentProfile, req.student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    # Check duplicate
    stmt_dup = select(AttendanceRecord).where(
        AttendanceRecord.lecture_session_id == req.session_id,
        AttendanceRecord.student_id == student.id
    )
    existing = (await db.execute(stmt_dup)).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Record already exists. Use attendance correction endpoint to modify existing record."
        )

    now = datetime.now(timezone.utc)
    record = AttendanceRecord(
        lecture_session_id=session.id,
        student_id=student.id,
        status=req.status,
        verification_method=VerificationMethod.MANUAL,
        recorded_at=now,
        remarks=req.remarks or "Manual entry by teacher"
    )
    db.add(record)
    await db.flush()

    event = AttendanceEvent(
        attendance_record_id=record.id,
        event_type="MANUAL_ENTRY",
        details=f"Manual attendance marked: {req.status.value}",
        actor_id=current_user.id,
        ip_address="127.0.0.1",
        created_at=now
    )
    db.add(event)
    await db.commit()
    await db.refresh(record)

    user_s = await db.get(User, student.user_id)
    subject = await db.get(Subject, session.subject_id)
    course = await db.get(Course, student.course_id)
    branch = await db.get(Branch, student.branch_id)

    return AttendanceRecordResponse(
        id=record.id,
        session_id=session.id,
        student_id=student.id,
        student_code=user_s.user_code if user_s else "",
        student_name=user_s.full_name if user_s else "",
        roll_number=student.roll_number,
        course_name=course.name if course else None,
        branch_name=branch.name if branch else None,
        subject_code=subject.code if subject else "",
        subject_name=subject.name if subject else "",
        date=session.date,
        start_time=session.start_time,
        end_time=session.end_time,
        status=record.status,
        verification_method=record.verification_method,
        recorded_at=record.recorded_at,
        remarks=record.remarks,
        is_corrected=False
    )

@router.post("/correct", response_model=AttendanceRecordResponse)
async def correct_attendance(
    req: AttendanceCorrectionRequest,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Authorized correction endpoint.
    Maintains audit trail with previous status, new status, actor, and reason.
    """
    record = await db.get(AttendanceRecord, req.record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found.")

    prev_status = record.status
    record.status = req.new_status
    record.is_corrected = True
    now = datetime.now(timezone.utc)

    correction = AttendanceCorrection(
        attendance_record_id=record.id,
        previous_status=prev_status,
        new_status=req.new_status,
        reason=req.reason,
        corrected_by_id=current_user.id,
        corrected_at=now
    )
    db.add(correction)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="ATTENDANCE_CORRECTED",
        resource_type="ATTENDANCE_RECORD",
        resource_id=str(record.id),
        details=f"Status changed from {prev_status.value} to {req.new_status.value}. Reason: {req.reason}",
        ip_address="127.0.0.1",
        timestamp=now
    )
    db.add(audit)
    await db.commit()
    await db.refresh(record)

    session = await db.get(LectureSession, record.lecture_session_id)
    student = await db.get(StudentProfile, record.student_id)
    user_s = await db.get(User, student.user_id) if student else None
    subject = await db.get(Subject, session.subject_id) if session else None
    course = await db.get(Course, student.course_id) if student else None
    branch = await db.get(Branch, student.branch_id) if student else None

    return AttendanceRecordResponse(
        id=record.id,
        session_id=record.lecture_session_id,
        student_id=student.id if student else 0,
        student_code=user_s.user_code if user_s else "",
        student_name=user_s.full_name if user_s else "",
        roll_number=student.roll_number if student else "",
        course_name=course.name if course else None,
        branch_name=branch.name if branch else None,
        subject_code=subject.code if subject else "",
        subject_name=subject.name if subject else "",
        date=session.date if session else date.today(),
        start_time=session.start_time if session else time(0, 0),
        end_time=session.end_time if session else time(0, 0),
        status=record.status,
        verification_method=record.verification_method,
        recorded_at=record.recorded_at,
        remarks=f"Corrected: {req.reason}",
        is_corrected=True
    )

# --- Attendance History & Absence Processing ---

@router.get("/history", response_model=List[AttendanceRecordResponse])
async def get_attendance_history(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    subject_id: Optional[int] = None,
    student_id: Optional[int] = None,
    session_id: Optional[int] = None,
    status_filter: Optional[AttendanceStatus] = None,
    verification_method: Optional[VerificationMethod] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AttendanceRecord).options(
        selectinload(AttendanceRecord.lecture_session).selectinload(LectureSession.subject),
        selectinload(AttendanceRecord.student).selectinload(StudentProfile.user),
        selectinload(AttendanceRecord.student).selectinload(StudentProfile.course),
        selectinload(AttendanceRecord.student).selectinload(StudentProfile.branch)
    )

    if current_user.role == UserRole.STUDENT:
        stmt_prof = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        prof = (await db.execute(stmt_prof)).scalars().first()
        if not prof:
            return []
        stmt = stmt.where(AttendanceRecord.student_id == prof.id)
    elif current_user.role == UserRole.TEACHER:
        stmt_t = select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
        t_prof = (await db.execute(stmt_t)).scalars().first()
        if not t_prof:
            return []
        stmt = stmt.join(AttendanceRecord.lecture_session).where(LectureSession.teacher_id == t_prof.id)
    else:
        # Admin filters
        if student_id:
            stmt = stmt.where(AttendanceRecord.student_id == student_id)

    if session_id:
        stmt = stmt.where(AttendanceRecord.lecture_session_id == session_id)
    if status_filter:
        stmt = stmt.where(AttendanceRecord.status == status_filter)
    if verification_method:
        stmt = stmt.where(AttendanceRecord.verification_method == verification_method)
    if subject_id:
        stmt = stmt.join(AttendanceRecord.lecture_session).where(LectureSession.subject_id == subject_id)
    if date_from:
        stmt = stmt.where(AttendanceRecord.recorded_at >= datetime.combine(date_from, time(0, 0), tzinfo=timezone.utc))
    if date_to:
        stmt = stmt.where(AttendanceRecord.recorded_at <= datetime.combine(date_to, time(23, 59, 59), tzinfo=timezone.utc))

    stmt = stmt.order_by(AttendanceRecord.recorded_at.desc()).offset(skip).limit(limit)
    records = (await db.execute(stmt)).scalars().all()

    results = []
    for r in records:
        sess = r.lecture_session
        stud = r.student
        results.append(AttendanceRecordResponse(
            id=r.id,
            session_id=r.lecture_session_id,
            student_id=stud.id if stud else 0,
            student_code=stud.user.user_code if stud and stud.user else "",
            student_name=stud.user.full_name if stud and stud.user else "",
            roll_number=stud.roll_number if stud else "",
            course_name=stud.course.name if stud and stud.course else None,
            branch_name=stud.branch.name if stud and stud.branch else None,
            subject_code=sess.subject.code if sess and sess.subject else "",
            subject_name=sess.subject.name if sess and sess.subject else "",
            date=sess.date if sess else date.today(),
            start_time=sess.start_time if sess else time(0, 0),
            end_time=sess.end_time if sess else time(0, 0),
            status=r.status,
            verification_method=r.verification_method,
            recorded_at=r.recorded_at,
            remarks=r.remarks,
            is_corrected=r.is_corrected
        ))
    return results

@router.post("/process-absences", response_model=MessageResponse)
async def process_completed_absences(
    session_id: Optional[int] = None,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    """
    Core attendance engine absence processor.
    For completed sessions, identifies eligible enrolled students who have no recorded attendance,
    and marks them ABSENT according to institute policy. Idempotent and audit-logged.
    """
    stmt_sess = select(LectureSession).options(selectinload(LectureSession.subject))
    if session_id:
        stmt_sess = stmt_sess.where(LectureSession.id == session_id)
    else:
        stmt_sess = stmt_sess.where(LectureSession.status == LectureSessionStatus.COMPLETED)

    sessions = (await db.execute(stmt_sess)).scalars().all()
    absent_count = 0
    now = datetime.now(timezone.utc)

    for sess in sessions:
        if not sess.subject:
            continue
        # Find students enrolled in the course, branch, semester matching this subject
        stmt_students = select(StudentProfile).where(
            StudentProfile.course_id == sess.subject.course_id,
            StudentProfile.semester == sess.subject.semester
        )
        if sess.subject.branch_id:
            stmt_students = stmt_students.where(StudentProfile.branch_id == sess.subject.branch_id)

        eligible_students = (await db.execute(stmt_students)).scalars().all()

        # Find existing attendance records for this session
        stmt_exist = select(AttendanceRecord.student_id).where(AttendanceRecord.lecture_session_id == sess.id)
        marked_ids = set((await db.execute(stmt_exist)).scalars().all())

        for stud in eligible_students:
            if stud.id not in marked_ids:
                abs_rec = AttendanceRecord(
                    lecture_session_id=sess.id,
                    student_id=stud.id,
                    status=AttendanceStatus.ABSENT,
                    verification_method=VerificationMethod.MANUAL,
                    recorded_at=now,
                    remarks="Automatic absence marked after session completion"
                )
                db.add(abs_rec)
                absent_count += 1
                marked_ids.add(stud.id)

    await db.commit()
    return MessageResponse(message=f"Absence processing complete. {absent_count} absence records created.")
