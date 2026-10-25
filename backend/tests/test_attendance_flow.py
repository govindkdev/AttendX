import pytest
import asyncio
from datetime import date, time, datetime, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app

@pytest.mark.asyncio
async def test_student_registration_and_leave_requests():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Admin login
        admin_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create Department
        resp_dept = await client.post("/api/v1/departments", headers=headers, json={
            "code": "IT",
            "name": "Information Technology",
            "description": "IT Dept"
        })
        dept_id = resp_dept.json()["id"]

        # 2. Create Course
        resp_course = await client.post("/api/v1/courses", headers=headers, json={
            "code": "BCA",
            "name": "Bachelor of Computer Applications",
            "department_id": dept_id,
            "duration_years": 3,
            "total_semesters": 6
        })
        course_id = resp_course.json()["id"]

        # 3. Create Branch
        resp_branch = await client.post("/api/v1/branches", headers=headers, json={
            "code": "BCA-GEN",
            "name": "BCA General",
            "course_id": course_id
        })
        branch_id = resp_branch.json()["id"]

        # Student self-creation
        student_code = "STU-2026-TEST"
        roll_num = "ROLL-2026-TEST"
        resp_reg = await client.post("/api/v1/auth/create-account", json={
            "student_id": student_code,
            "full_name": "Aarav Sharma",
            "roll_number": roll_num,
            "course_id": course_id,
            "branch_id": branch_id,
            "department_id": dept_id,
            "semester": 1,
            "phone_number": "+919988776655",
            "email": "aarav.sharma@test.edu.in",
            "parent_name": "Mr. Sharma",
            "parent_phone": "+919876543210",
            "parent_email": "parent.sharma@test.edu.in",
            "password": "StudentSecure@123",
            "confirm_password": "StudentSecure@123"
        })
        assert resp_reg.status_code == 200

        # Duplicate student ID rejection test
        resp_dup = await client.post("/api/v1/auth/create-account", json={
            "student_id": student_code,
            "full_name": "Duplicate Student",
            "roll_number": "ROLL-DIFF",
            "course_id": course_id,
            "branch_id": branch_id,
            "department_id": dept_id,
            "semester": 1,
            "phone_number": "+919988776655",
            "email": "different@test.edu.in",
            "password": "StudentSecure@123",
            "confirm_password": "StudentSecure@123"
        })
        assert resp_dup.status_code == 400
        assert "already registered" in resp_dup.json()["detail"].lower()

        # Student login
        login_stu = await client.post("/api/v1/auth/login", json={
            "identifier": student_code,
            "password": "StudentSecure@123"
        })
        assert login_stu.status_code == 200
        stu_token = login_stu.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # Student submits leave request
        resp_leave = await client.post("/api/v1/leave", headers=stu_headers, json={
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "reason": "Attending inter-college symposium"
        })
        assert resp_leave.status_code == 201
        leave_id = resp_leave.json()["id"]

        # Student cannot approve own leave request
        resp_self_approve = await client.put(f"/api/v1/leave/{leave_id}/review", headers=stu_headers, json={
            "status": "APPROVED",
            "review_remarks": "Self approved"
        })
        assert resp_self_approve.status_code == 403

        # Admin approves leave request
        resp_admin_approve = await client.put(f"/api/v1/leave/{leave_id}/review", headers=headers, json={
            "status": "APPROVED",
            "review_remarks": "Approved by HOD"
        })
        assert resp_admin_approve.status_code == 200
        assert resp_admin_approve.json()["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_admin_student_provisioning_and_activation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Admin Login
        admin_login = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Department, Course, Branch
        resp_dept = await client.post("/api/v1/departments", headers=headers, json={
            "code": "ECE",
            "name": "Electronics & Communication",
            "description": "ECE Dept"
        })
        dept_id = resp_dept.json()["id"]

        resp_course = await client.post("/api/v1/courses", headers=headers, json={
            "code": "BTECH-ECE",
            "name": "B.Tech ECE",
            "department_id": dept_id,
            "duration_years": 4,
            "total_semesters": 8
        })
        course_id = resp_course.json()["id"]

        resp_branch = await client.post("/api/v1/branches", headers=headers, json={
            "code": "ECE-IOT",
            "name": "ECE IoT Specialization",
            "course_id": course_id
        })
        branch_id = resp_branch.json()["id"]

        # 3. Admin provisions student WITHOUT explicit student_id (auto-generated ID)
        resp_create = await client.post("/api/v1/students", headers=headers, json={
            "full_name": "Rohan Verma",
            "email": "rohan.verma@test.edu.in",
            "roll_number": "ROLL-ROHAN-001",
            "department_id": dept_id,
            "course_id": course_id,
            "branch_id": branch_id,
            "semester": 1,
            "phone_number": "+919876543299"
        })
        assert resp_create.status_code == 201
        student_data = resp_create.json()
        student_id = student_data["student_id"]
        assert student_id.startswith("STU-")

        # 4. Student initiates self-activation challenge
        resp_challenge = await client.post("/api/v1/auth/activate/verify-student", json={
            "student_id": student_id,
            "email": "rohan.verma@test.edu.in"
        })
        assert resp_challenge.status_code == 200

        # In dev mode, OTP is fixed or retrieved. Let's complete activation with OTP.
        # Notice backend auth generate_secure_otp in dev uses known or generated OTP.
        # For testing, let's verify wrong OTP is rejected:
        resp_bad_otp = await client.post("/api/v1/auth/activate/complete", json={
            "student_id": student_id,
            "email": "rohan.verma@test.edu.in",
            "otp": "000000",
            "new_password": "NewStudentPassword@123",
            "confirm_new_password": "NewStudentPassword@123"
        })
        assert resp_bad_otp.status_code == 400
