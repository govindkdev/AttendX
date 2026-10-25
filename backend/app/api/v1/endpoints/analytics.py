from datetime import date, datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    TeacherProfile,
    Department,
    Course,
    Subject,
    LectureSession,
    LectureSessionStatus,
    AttendanceRecord,
    AttendanceStatus,
    TimetableEntry,
    LeaveRequest,
    LeaveRequestStatus,
    AuditLog
)
from app.permissions.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns actual, database-driven dashboard metrics tailored for the user's role.
    Zero demo data: all counts and percentages are calculated directly from real records.
    """
    today = date.today()

    if current_user.role == UserRole.ADMIN:
        # Admin Global Metrics
        total_students = await db.scalar(select(func.count(StudentProfile.id))) or 0
        total_teachers = await db.scalar(select(func.count(TeacherProfile.id))) or 0
        total_departments = await db.scalar(select(func.count(Department.id))) or 0
        total_courses = await db.scalar(select(func.count(Course.id))) or 0
        total_subjects = await db.scalar(select(func.count(Subject.id))) or 0
        total_lectures = await db.scalar(select(func.count(LectureSession.id))) or 0

        # Attendance stats
        total_att = await db.scalar(select(func.count(AttendanceRecord.id))) or 0
        present_cnt = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(
                or_(AttendanceRecord.status == AttendanceStatus.PRESENT, AttendanceRecord.status == AttendanceStatus.LATE)
            )
        ) or 0
        absent_cnt = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(AttendanceRecord.status == AttendanceStatus.ABSENT)
        ) or 0
        late_cnt = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(AttendanceRecord.status == AttendanceStatus.LATE)
        ) or 0

        overall_percentage = round((present_cnt / total_att * 100.0), 1) if total_att > 0 else 0.0

        # Pending leave requests
        pending_leaves = await db.scalar(
            select(func.count(LeaveRequest.id)).where(LeaveRequest.status == LeaveRequestStatus.PENDING)
        ) or 0

        # Recent audit events count
        recent_audits = await db.scalar(select(func.count(AuditLog.id))) or 0

        return {
            "role": "ADMIN",
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_departments": total_departments,
            "total_courses": total_courses,
            "total_subjects": total_subjects,
            "total_lectures": total_lectures,
            "total_attendance_records": total_att,
            "present_count": present_cnt,
            "absent_count": absent_cnt,
            "late_count": late_cnt,
            "attendance_percentage": overall_percentage,
            "pending_leave_requests": pending_leaves,
            "recent_audit_events": recent_audits
        }

    elif current_user.role == UserRole.TEACHER:
        stmt_t = select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
        teacher = (await db.execute(stmt_t)).scalars().first()
        if not teacher:
            return {"role": "TEACHER", "sessions_conducted": 0, "attendance_percentage": 0.0}

        # Teacher specific stats
        total_sessions = await db.scalar(
            select(func.count(LectureSession.id)).where(LectureSession.teacher_id == teacher.id)
        ) or 0

        # Attendance in teacher's sessions
        stmt_att = select(
            func.count(AttendanceRecord.id),
            func.sum(case((or_(AttendanceRecord.status == AttendanceStatus.PRESENT, AttendanceRecord.status == AttendanceStatus.LATE), 1), else_=0))
        ).join(LectureSession).where(LectureSession.teacher_id == teacher.id)
        row = (await db.execute(stmt_att)).first()
        total_records = row[0] or 0
        total_present = row[1] or 0

        overall_pct = round((total_present / total_records * 100.0), 1) if total_records > 0 else 0.0

        # Assigned timetable count
        timetable_count = await db.scalar(
            select(func.count(TimetableEntry.id)).where(TimetableEntry.teacher_id == teacher.id)
        ) or 0

        return {
            "role": "TEACHER",
            "sessions_conducted": total_sessions,
            "assigned_classes": timetable_count,
            "total_student_records": total_records,
            "present_records": total_present,
            "attendance_percentage": overall_pct
        }

    else:
        # STUDENT metrics
        stmt_s = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        student = (await db.execute(stmt_s)).scalars().first()
        if not student:
            return {"role": "STUDENT", "attendance_percentage": 0.0, "total_classes": 0}

        total_classes = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(AttendanceRecord.student_id == student.id)
        ) or 0

        present_cnt = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.student_id == student.id,
                AttendanceRecord.status == AttendanceStatus.PRESENT
            )
        ) or 0

        late_cnt = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.student_id == student.id,
                AttendanceRecord.status == AttendanceStatus.LATE
            )
        ) or 0

        absent_cnt = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.student_id == student.id,
                AttendanceRecord.status == AttendanceStatus.ABSENT
            )
        ) or 0

        effective_present = present_cnt + late_cnt
        overall_pct = round((effective_present / total_classes * 100.0), 1) if total_classes > 0 else 0.0

        # Subject-wise breakdown
        stmt_sub = select(
            Subject.name,
            Subject.code,
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((or_(AttendanceRecord.status == AttendanceStatus.PRESENT, AttendanceRecord.status == AttendanceStatus.LATE), 1), else_=0)).label("present")
        ).join(LectureSession, AttendanceRecord.lecture_session_id == LectureSession.id)\
         .join(Subject, LectureSession.subject_id == Subject.id)\
         .where(AttendanceRecord.student_id == student.id)\
         .group_by(Subject.id, Subject.name, Subject.code)

        sub_rows = (await db.execute(stmt_sub)).all()
        subjects_data = []
        for r in sub_rows:
            sub_total = r.total or 0
            sub_pres = r.present or 0
            sub_pct = round((sub_pres / sub_total * 100.0), 1) if sub_total > 0 else 0.0
            subjects_data.append({
                "subject_code": r.code,
                "subject_name": r.name,
                "total": sub_total,
                "present": sub_pres,
                "percentage": sub_pct
            })

        return {
            "role": "STUDENT",
            "attendance_percentage": overall_pct,
            "total_classes": total_classes,
            "present_count": present_cnt,
            "late_count": late_cnt,
            "absent_count": absent_cnt,
            "subject_breakdown": subjects_data
        }
