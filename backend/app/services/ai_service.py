import re
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import (
    User,
    UserRole,
    StudentProfile,
    TeacherProfile,
    Subject,
    LectureSession,
    AttendanceRecord,
    AttendanceStatus,
    VerificationMethod
)

class AttendXAIService:
    @staticmethod
    async def process_query(
        query: str,
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Processes natural language queries over authorized database records.
        Strictly enforces user role permissions and returns evidence-backed responses.
        Never fabricates records or runs arbitrary unvalidated SQL.
        """
        q = query.lower().strip()
        evidence: List[Dict[str, Any]] = []
        follow_ups: List[str] = []

        # 1. Student Intent: "What is my attendance this month?" or "My attendance"
        if any(term in q for term in ["my attendance", "my percentage", "how much attendance"]):
            if user.role != UserRole.STUDENT:
                return {
                    "answer": "This query is designed for students. As a teacher or administrator, you can query institutional attendance or specific student IDs.",
                    "evidence": [],
                    "follow_up_questions": ["How many students were absent today?", "Show QR and face attendance records."]
                }

            stmt_s = select(StudentProfile).where(StudentProfile.user_id == user.id)
            student = (await db.execute(stmt_s)).scalars().first()
            if not student:
                return {"answer": "No student profile found for your account.", "evidence": [], "follow_up_questions": []}

            # Check if querying for this month specifically
            is_this_month = "this month" in q or "current month" in q
            now = datetime.now(timezone.utc)
            start_dt = datetime(now.year, now.month, 1, tzinfo=timezone.utc) if is_this_month else datetime(2000, 1, 1, tzinfo=timezone.utc)

            stmt = select(AttendanceRecord).options(
                selectinload(AttendanceRecord.lecture_session).selectinload(LectureSession.subject)
            ).where(
                AttendanceRecord.student_id == student.id,
                AttendanceRecord.recorded_at >= start_dt
            )
            records = (await db.execute(stmt)).scalars().all()

            if not records:
                timeframe = "this month" if is_this_month else "total"
                return {
                    "answer": f"You do not have any attendance records registered {timeframe} yet.",
                    "evidence": [],
                    "follow_up_questions": ["Which subjects have attendance below 75%?", "Show today's active lectures."]
                }

            total = len(records)
            present_cnt = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
            pct = round((present_cnt / total * 100.0), 1)

            for r in records[:5]:
                sess = r.lecture_session
                evidence.append({
                    "record_id": r.id,
                    "date": str(sess.date if sess else ""),
                    "subject": sess.subject.name if sess and sess.subject else "",
                    "status": r.status.value,
                    "method": r.verification_method.value,
                    "recorded_at": r.recorded_at.strftime("%H:%M:%S")
                })

            time_str = "this month" if is_this_month else "overall"
            return {
                "answer": f"Your {time_str} attendance is {pct}% ({present_cnt} present out of {total} scheduled lectures).",
                "evidence": evidence,
                "follow_up_questions": [
                    "Which subjects have attendance below 75%?",
                    "Show my attendance history for this week."
                ]
            }

        # 2. Low attendance check: "below 75%" or "short attendance"
        if "below 75" in q or "short attendance" in q or "low attendance" in q:
            if user.role == UserRole.STUDENT:
                stmt_s = select(StudentProfile).where(StudentProfile.user_id == user.id)
                student = (await db.execute(stmt_s)).scalars().first()
                if not student:
                    return {"answer": "No student profile found.", "evidence": [], "follow_up_questions": []}

                # Subject-wise attendance calculation
                stmt_sub = select(
                    Subject.name,
                    Subject.code,
                    func.count(AttendanceRecord.id).label("total"),
                    func.sum(case((or_(AttendanceRecord.status == AttendanceStatus.PRESENT, AttendanceRecord.status == AttendanceStatus.LATE), 1), else_=0)).label("present")
                ).join(LectureSession, AttendanceRecord.lecture_session_id == LectureSession.id)\
                 .join(Subject, LectureSession.subject_id == Subject.id)\
                 .where(AttendanceRecord.student_id == student.id)\
                 .group_by(Subject.id, Subject.name, Subject.code)

                rows = (await db.execute(stmt_sub)).all()
                if not rows:
                    return {
                        "answer": "No subject attendance records found to evaluate.",
                        "evidence": [],
                        "follow_up_questions": ["What is my attendance this month?"]
                    }

                low_subjects = []
                for r in rows:
                    tot = r.total or 0
                    pres = r.present or 0
                    pct = round((pres / tot * 100.0), 1) if tot > 0 else 0.0
                    evidence.append({
                        "subject": f"{r.code} - {r.name}",
                        "present": pres,
                        "total": tot,
                        "percentage": pct
                    })
                    if pct < 75.0:
                        low_subjects.append(f"{r.name} ({pct}%)")

                if low_subjects:
                    ans = f"Warning: You have attendance below 75% in {len(low_subjects)} subject(s): {', '.join(low_subjects)}."
                else:
                    ans = "Great job! All your subjects currently maintain 75% or higher attendance."

                return {
                    "answer": ans,
                    "evidence": evidence,
                    "follow_up_questions": ["What is my overall attendance?", "Show my attendance history."]
                }
            else:
                # Admin or Teacher query for low attendance
                return {
                    "answer": "To review institute students below 75%, please filter the Reports tab by criteria or export the semester summary.",
                    "evidence": [],
                    "follow_up_questions": ["How many students were absent today?", "How many lectures were conducted?"]
                }

        # 3. Absent today: "absent today" or "students absent"
        if "absent today" in q or "who is absent" in q or "absent count" in q:
            if user.role == UserRole.STUDENT:
                return {
                    "answer": "Students do not have permission to view other students' attendance records.",
                    "evidence": [],
                    "follow_up_questions": ["What is my attendance this month?"]
                }

            today = date.today()
            stmt_abs = select(AttendanceRecord).options(
                selectinload(AttendanceRecord.student).selectinload(StudentProfile.user),
                selectinload(AttendanceRecord.lecture_session).selectinload(LectureSession.subject)
            ).join(LectureSession).where(
                LectureSession.date == today,
                AttendanceRecord.status == AttendanceStatus.ABSENT
            )
            records = (await db.execute(stmt_abs)).scalars().all()

            if not records:
                return {
                    "answer": "No recorded student absences found for today so far.",
                    "evidence": [],
                    "follow_up_questions": ["How many lectures were conducted today?", "Show attendance breakdown by method."]
                }

            for r in records[:8]:
                stud = r.student
                sess = r.lecture_session
                evidence.append({
                    "record_id": r.id,
                    "student_code": stud.user.user_code if stud and stud.user else "",
                    "student_name": stud.user.full_name if stud and stud.user else "",
                    "roll_number": stud.roll_number if stud else "",
                    "subject": sess.subject.name if sess and sess.subject else "",
                    "date": str(today)
                })

            return {
                "answer": f"A total of {len(records)} absence(s) were recorded for today ({today.strftime('%d %b %Y')}).",
                "evidence": evidence,
                "follow_up_questions": ["Dispatch parent absence alerts for today.", "Export today's attendance report."]
            }

        # 4. Method breakdown: "qr and face" or "method" or "verification breakdown"
        if "qr" in q or "face" in q or "method" in q:
            face_cnt = await db.scalar(
                select(func.count(AttendanceRecord.id)).where(AttendanceRecord.verification_method == VerificationMethod.FACE)
            ) or 0
            qr_cnt = await db.scalar(
                select(func.count(AttendanceRecord.id)).where(AttendanceRecord.verification_method == VerificationMethod.QR)
            ) or 0
            manual_cnt = await db.scalar(
                select(func.count(AttendanceRecord.id)).where(AttendanceRecord.verification_method == VerificationMethod.MANUAL)
            ) or 0
            total_cnt = face_cnt + qr_cnt + manual_cnt

            evidence = [
                {"method": "Face Recognition", "count": face_cnt, "percentage": round((face_cnt/total_cnt*100), 1) if total_cnt>0 else 0.0},
                {"method": "Signed QR Code", "count": qr_cnt, "percentage": round((qr_cnt/total_cnt*100), 1) if total_cnt>0 else 0.0},
                {"method": "Manual Entry / Correction", "count": manual_cnt, "percentage": round((manual_cnt/total_cnt*100), 1) if total_cnt>0 else 0.0}
            ]

            return {
                "answer": f"Verification breakdown across all recorded attendances: Face Recognition: {face_cnt}, QR Scanning: {qr_cnt}, Manual: {manual_cnt} (Total: {total_cnt}).",
                "evidence": evidence,
                "follow_up_questions": ["What is the overall attendance percentage?", "How many students were absent today?"]
            }

        # 5. Lectures conducted: "lectures conducted" or "how many lectures"
        if "lectures" in q or "classes conducted" in q or "sessions" in q:
            total_sessions = await db.scalar(select(func.count(LectureSession.id))) or 0
            completed_sessions = await db.scalar(
                select(func.count(LectureSession.id)).where(LectureSession.status == LectureSessionStatus.COMPLETED)
            ) or 0
            active_sessions = await db.scalar(
                select(func.count(LectureSession.id)).where(LectureSession.status == LectureSessionStatus.ACTIVE)
            ) or 0

            return {
                "answer": f"Total lecture sessions recorded in database: {total_sessions} ({completed_sessions} completed, {active_sessions} currently active).",
                "evidence": [
                    {"metric": "Total Sessions", "value": total_sessions},
                    {"metric": "Completed", "value": completed_sessions},
                    {"metric": "Active", "value": active_sessions}
                ],
                "follow_up_questions": ["How many students were absent today?", "Show verification method breakdown."]
            }

        # 6. Fallback general response with actual DB status
        total_users = await db.scalar(select(func.count(User.id))) or 0
        total_students = await db.scalar(select(func.count(StudentProfile.id))) or 0
        total_att = await db.scalar(select(func.count(AttendanceRecord.id))) or 0

        return {
            "answer": f"I analyzed your question regarding '{query}'. The database currently contains {total_students} student profiles and {total_att} attendance records. You can ask me specific questions like: 'What is my attendance this month?', 'Which subjects have attendance below 75%?', or 'Show verification breakdown'.",
            "evidence": [
                {"database_records_evaluated": total_att, "eligible_students": total_students}
            ],
            "follow_up_questions": [
                "What is my attendance this month?",
                "Which subjects have attendance below 75%?",
                "Show verification breakdown by method."
            ]
        }
