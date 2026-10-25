import pytest
import asyncio
from datetime import date, time, datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_signed_qr_token,
    verify_signed_qr_token,
    calculate_haversine_distance,
    verify_gps_geofence
)
from app.models.entities import UserRole, AttendanceStatus, VerificationMethod
from app.services.face_service import face_service

@pytest.mark.asyncio
async def test_health_and_readiness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["app"] == "AttendX"
        assert "secret" not in str(data).lower()

        resp_ready = await client.get("/ready")
        assert resp_ready.status_code == 200
        assert resp_ready.json()["status"] == "ready"

@pytest.mark.asyncio
async def test_admin_login_and_first_login_flag():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid credentials test
        resp_bad = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "WrongPassword!999"
        })
        assert resp_bad.status_code == 401

        # Valid initial admin login
        resp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        assert resp_login.status_code == 200
        data = resp_login.json()
        assert data["user_code"] == "ADM-001"
        assert data["role"] == "ADMIN"
        assert data["must_change_password"] is True
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Check /me
        resp_me = await client.get("/api/v1/auth/me", headers=headers)
        assert resp_me.status_code == 200
        assert resp_me.json()["user_code"] == "ADM-001"

@pytest.mark.asyncio
async def test_first_login_password_change():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = resp_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Change password to new password
        resp_change = await client.post("/api/v1/auth/change-password", headers=headers, json={
            "current_password": "Govind@123",
            "new_password": "GovindSecure@2026",
            "confirm_new_password": "GovindSecure@2026"
        })
        assert resp_change.status_code == 200

        # Login with new password
        resp_new_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "GovindSecure@2026"
        })
        assert resp_new_login.status_code == 200
        assert resp_new_login.json()["must_change_password"] is False

        # Reset back to Govind@123 for downstream tests
        new_token = resp_new_login.json()["access_token"]
        await client.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {new_token}"}, json={
            "current_password": "GovindSecure@2026",
            "new_password": "Govind@123",
            "confirm_new_password": "Govind@123"
        })

@pytest.mark.asyncio
async def test_unauthorized_access_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Accessing protected endpoint without token
        resp = await client.get("/api/v1/settings/geofence")
        assert resp.status_code == 401

@pytest.mark.asyncio
async def test_qr_signing_expiration_and_tamper_detection():
    # 1. Valid token creation
    token_str, expires_at = create_signed_qr_token(lecture_session_id=10, teacher_id=5, expires_in_minutes=30)
    is_valid, payload, msg = verify_signed_qr_token(token_str)
    assert is_valid is True
    assert payload["sid"] == 10
    assert payload["tid"] == 5

    # 2. Tampered token detection
    tampered_str = token_str.replace("10", "99")
    is_valid_t, _, msg_t = verify_signed_qr_token(tampered_str)
    assert is_valid_t is False
    assert "Invalid QR token signature or tamper detected" in msg_t

    # 3. Expired token rejection
    expired_token_str, _ = create_signed_qr_token(lecture_session_id=10, teacher_id=5, expires_in_minutes=-5)
    is_valid_e, _, msg_e = verify_signed_qr_token(expired_token_str)
    assert is_valid_e is False
    assert "expired" in msg_e.lower()

@pytest.mark.asyncio
async def test_gps_geofence_haversine():
    gcrg_lat, gcrg_lon = 26.8467, 80.9462
    # 0 meters away
    d = calculate_haversine_distance(gcrg_lat, gcrg_lon, gcrg_lat, gcrg_lon)
    assert d < 0.01

    # Within 200m
    near_lat = gcrg_lat + 0.0005 # ~55m away
    is_in, dist, msg = verify_gps_geofence(
        student_lat=near_lat,
        student_lon=gcrg_lon,
        accuracy=10.0,
        target_lat=gcrg_lat,
        target_lon=gcrg_lon,
        allowed_radius=200.0,
        accuracy_threshold=50.0
    )
    assert is_in is True

    # Far outside (5km away)
    far_lat = gcrg_lat + 0.05
    is_in_far, dist_far, msg_far = verify_gps_geofence(
        student_lat=far_lat,
        student_lon=gcrg_lon,
        accuracy=10.0,
        target_lat=gcrg_lat,
        target_lon=gcrg_lon,
        allowed_radius=200.0,
        accuracy_threshold=50.0
    )
    assert is_in_far is False
    assert "outside campus perimeter" in msg_far

    # Poor accuracy rejection
    is_in_acc, _, msg_acc = verify_gps_geofence(
        student_lat=near_lat,
        student_lon=gcrg_lon,
        accuracy=120.0,
        target_lat=gcrg_lat,
        target_lon=gcrg_lon,
        allowed_radius=200.0,
        accuracy_threshold=50.0
    )
    assert is_in_acc is False
    assert "too poor" in msg_acc

@pytest.mark.asyncio
async def test_face_service_similarity():
    # Test identical vectors yield 1.0 similarity
    vec1 = [0.1] * 128
    sim = face_service.compute_similarity(vec1, vec1)
    assert abs(sim - 1.0) < 1e-4

    # Orthogonal vectors yield 0.0 similarity
    vec_a = [1.0] + [0.0] * 127
    vec_b = [0.0, 1.0] + [0.0] * 126
    sim_ortho = face_service.compute_similarity(vec_a, vec_b)
    assert abs(sim_ortho - 0.0) < 1e-4

@pytest.mark.asyncio
async def test_academic_and_timetable_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Admin
        resp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = resp_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create Department
        resp_dept = await client.post("/api/v1/departments", headers=headers, json={
            "code": "CSE",
            "name": "Computer Science & Engineering",
            "description": "Department of Computer Science"
        })
        assert resp_dept.status_code in [201, 400]
        dept_id = resp_dept.json().get("id") or 1

        # 2. Create Course
        resp_course = await client.post("/api/v1/courses", headers=headers, json={
            "code": "BTECH",
            "name": "Bachelor of Technology",
            "department_id": dept_id,
            "duration_years": 4,
            "total_semesters": 8
        })
        assert resp_course.status_code in [201, 400]
        course_id = resp_course.json().get("id") or 1

        # 3. Create Branch
        resp_branch = await client.post("/api/v1/branches", headers=headers, json={
            "code": "CS-AI",
            "name": "Computer Science (AI & ML)",
            "course_id": course_id
        })
        assert resp_branch.status_code in [201, 400]
        branch_id = resp_branch.json().get("id") or 1

        # 4. Create Subject
        resp_subj = await client.post("/api/v1/subjects", headers=headers, json={
            "code": "CS501",
            "name": "Artificial Intelligence",
            "course_id": course_id,
            "branch_id": branch_id,
            "department_id": dept_id,
            "semester": 5,
            "credits": 4
        })
        assert resp_subj.status_code in [201, 400]
        subj_id = resp_subj.json().get("id") or 1

        # 5. Create Classroom
        resp_room = await client.post("/api/v1/classrooms", headers=headers, json={
            "room_number": "LT-101",
            "building": "Ramanujan Block",
            "floor": "1st Floor",
            "capacity": 70
        })
        assert resp_room.status_code in [201, 400]
        room_id = resp_room.json().get("id") or 1

        # 6. Create Teacher
        resp_teacher = await client.post("/api/v1/teachers", headers=headers, json={
            "employee_code": "TCH-001",
            "full_name": "Dr. R. K. Sharma",
            "email": "rk.sharma@gcrg.edu.in",
            "department_id": dept_id,
            "designation": "Professor & HOD",
            "qualification": "Ph.D. in Computer Science",
            "phone_number": "+919876543210",
            "initial_password": "TeacherPassword@123"
        })
        assert resp_teacher.status_code in [201, 400]
        teacher_prof_id = resp_teacher.json().get("profile_id") or 1

        # 7. Create Timetable Entry
        resp_tt = await client.post("/api/v1/timetable", headers=headers, json={
            "weekday": 0, # Monday
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "subject_id": subj_id,
            "teacher_id": teacher_prof_id,
            "classroom_id": room_id,
            "course_id": course_id,
            "branch_id": branch_id,
            "semester": 5
        })
        assert resp_tt.status_code == 201
        tt_data = resp_tt.json()
        assert tt_data["subject_id"] == subj_id

        # 8. Test Classroom Conflict Rejection
        resp_conflict = await client.post("/api/v1/timetable", headers=headers, json={
            "weekday": 0,
            "start_time": "09:30:00", # Overlaps with 09:00-10:00
            "end_time": "10:30:00",
            "subject_id": subj_id,
            "teacher_id": teacher_prof_id,
            "classroom_id": room_id, # Same room!
            "course_id": course_id,
            "branch_id": branch_id,
            "semester": 5
        })
        assert resp_conflict.status_code == 400
        assert "already booked" in resp_conflict.json()["detail"].lower()

@pytest.mark.asyncio
async def test_attendx_ai_queries():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = resp_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Query 1: Absence count
        resp_ai1 = await client.post("/api/v1/ai/query", headers=headers, json={
            "query": "How many students were absent today?"
        })
        assert resp_ai1.status_code == 200
        data1 = resp_ai1.json()
        assert "absence" in data1["answer"].lower() or "absent" in data1["answer"].lower()
        assert isinstance(data1["evidence"], list)

        # Query 2: Method breakdown
        resp_ai2 = await client.post("/api/v1/ai/query", headers=headers, json={
            "query": "Show QR and face attendance verification breakdown"
        })
        assert resp_ai2.status_code == 200
        data2 = resp_ai2.json()
        assert "verification breakdown" in data2["answer"].lower()

@pytest.mark.asyncio
async def test_report_downloads():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = resp_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # CSV report
        resp_csv = await client.get("/api/v1/reports/csv", headers=headers)
        assert resp_csv.status_code == 200
        assert "text/csv" in resp_csv.headers["content-type"]
        assert "Record ID" in resp_csv.text

        # Excel report
        resp_excel = await client.get("/api/v1/reports/excel", headers=headers)
        assert resp_excel.status_code == 200
        assert "spreadsheetml" in resp_excel.headers["content-type"]
        assert len(resp_excel.content) > 100

        # PDF report
        resp_pdf = await client.get("/api/v1/reports/pdf", headers=headers)
        assert resp_pdf.status_code == 200
        assert "application/pdf" in resp_pdf.headers["content-type"]
        assert resp_pdf.content.startswith(b"%PDF")

@pytest.mark.asyncio
async def test_admin_broadcast_and_audit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = resp_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Broadcast notice
        resp_bc = await client.post("/api/v1/notifications/broadcast", headers=headers, json={
            "title": "Semester Examination Schedule",
            "message": "Final end-semester evaluations begin next Monday.",
            "target_role": "ALL"
        })
        assert resp_bc.status_code == 200
        assert "broadcasted" in resp_bc.json()["message"].lower()

        # Check Audit Log records
        resp_audit = await client.get("/api/v1/audit", headers=headers)
        assert resp_audit.status_code == 200
        logs = resp_audit.json()
        assert any(l["action"] == "BROADCAST_NOTIFICATION" for l in logs)
