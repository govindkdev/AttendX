import pytest
import json
import base64
import numpy as np
import cv2
from datetime import date, time, datetime, timezone
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import settings
from app.services.face_service import face_service, FaceProcessingService
from app.models.entities import AttendanceStatus, VerificationMethod

# Helper to generate test base64 image
def create_test_base64_image(color=(120, 120, 120), size=(200, 200), text="AttendX Test"):
    img = np.full((size[1], size[0], 3), color, dtype=np.uint8)
    cv2.putText(img, text, (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    _, buf = cv2.imencode(".jpg", img)
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

# Helper to generate normalized random 512-d unit vector
def create_random_vector(seed: int, dim: int = 512):
    rng = np.random.RandomState(seed)
    v = rng.randn(dim).astype(np.float32)
    v /= np.linalg.norm(v)
    return v.tolist()

# -------------------------------------------------------------
# 1. Biometric Unit Tests (Cosine Similarity & 1:N Identification)
# -------------------------------------------------------------

def test_unit_cosine_similarity():
    # Identical 512-d vectors yield 1.0
    vec1 = create_random_vector(42)
    sim_same = face_service.compute_similarity(vec1, vec1)
    assert abs(sim_same - 1.0) < 1e-4

    # Orthogonal vectors yield 0.0
    vec_a = [1.0] + [0.0] * 511
    vec_b = [0.0, 1.0] + [0.0] * 510
    sim_ortho = face_service.compute_similarity(vec_a, vec_b)
    assert abs(sim_ortho - 0.0) < 1e-4

    # Different length vectors return 0.0
    sim_diff = face_service.compute_similarity(vec1, [0.1] * 128)
    assert sim_diff == 0.0

def test_unit_multi_exemplar_matching():
    vec_centroid = create_random_vector(100)
    vec_sample1 = create_random_vector(101)
    vec_sample2 = create_random_vector(102)

    template_payload = {
        "version": "insightface-buffalo_l-v1",
        "centroid": vec_centroid,
        "samples": [vec_sample1, vec_sample2]
    }

    # Query matching sample 1
    score = face_service.match_embedding_against_template(vec_sample1, template_payload)
    assert abs(score - 1.0) < 1e-4

    # Query matching centroid
    score_c = face_service.match_embedding_against_template(vec_centroid, template_payload)
    assert abs(score_c - 1.0) < 1e-4

    # Legacy flat list matching
    score_legacy = face_service.match_embedding_against_template(vec_centroid, vec_centroid)
    assert abs(score_legacy - 1.0) < 1e-4

def test_unit_1_to_n_identification_logic():
    vec_student1 = create_random_vector(10)
    vec_student2 = create_random_vector(20)

    gallery = {
        101: {"centroid": vec_student1, "samples": [vec_student1]},
        102: {"centroid": vec_student2, "samples": [vec_student2]}
    }

    # Case A: High-confidence genuine match for Student 101
    matched_id, top_score, sec_score, is_ambig, _ = face_service.identify_1_to_n(vec_student1, gallery)
    assert matched_id == 101
    assert top_score > 0.95
    assert not is_ambig

    # Case B: Unknown individual (random query vector distant from all candidates)
    vec_unknown = create_random_vector(999)
    unk_id, unk_top, _, _, unk_msg = face_service.identify_1_to_n(vec_unknown, gallery)
    assert unk_id is None
    assert "below threshold" in unk_msg

    # Case C: Ambiguous match
    vec_ambig_1 = np.array([1.0] + [0.0] * 511, dtype=np.float32)
    vec_ambig_2 = np.array([0.98, 0.198] + [0.0] * 510, dtype=np.float32)
    vec_ambig_2 /= np.linalg.norm(vec_ambig_2)
    query_ambig = vec_ambig_1.tolist()

    ambig_gallery = {
        201: {"centroid": vec_ambig_1.tolist(), "samples": []},
        202: {"centroid": vec_ambig_2.tolist(), "samples": []}
    }
    amb_id, amb_top, amb_sec, is_amb, _ = face_service.identify_1_to_n(query_ambig, ambig_gallery)
    assert is_amb is True
    assert (amb_top - amb_sec) < settings.FACE_AMBIGUITY_MARGIN

# -------------------------------------------------------------
# 2. Quality and Detection Checks
# -------------------------------------------------------------

def test_unit_face_quality_assessment():
    # Resolution too low (< 120x120)
    tiny_img = np.zeros((80, 80, 3), dtype=np.uint8)
    ok_res, _, msg_res = face_service.assess_quality(tiny_img)
    assert not ok_res
    assert "Resolution too low" in msg_res

    # Over-exposed (pure white)
    white_img = np.full((200, 200, 3), 255, dtype=np.uint8)
    ok_exp, _, msg_exp = face_service.assess_quality(white_img)
    assert not ok_exp
    assert "overexposed" in msg_exp

    # Under-exposed (pitch black)
    black_img = np.zeros((200, 200, 3), dtype=np.uint8)
    ok_dark, _, msg_dark = face_service.assess_quality(black_img)
    assert not ok_dark
    assert "too dark" in msg_dark

    # Good quality synthetic image
    valid_img = np.full((200, 200, 3), 128, dtype=np.uint8)
    cv2.putText(valid_img, "Quality Pattern", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    ok_good, q_score, _ = face_service.assess_quality(valid_img)
    assert ok_good
    assert q_score > 0.5

def test_unit_detect_faces_blank_viewport():
    # Non-face pattern gives 0 faces
    img = np.full((200, 200, 3), 128, dtype=np.uint8)
    cv2.putText(img, "No Face Pattern", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    ok_det, faces, det_msg = face_service.detect_faces(img)
    assert not ok_det
    assert len(faces) == 0
    assert "No face detected in camera viewport" in det_msg

# -------------------------------------------------------------
# 3. Presentation Attack Detection (Anti-Spoofing PAD)
# -------------------------------------------------------------

def test_unit_pad_fail_closed_when_missing():
    # Temporarily set missing PAD model path
    svc = FaceProcessingService()
    svc._pad_initialized = True
    svc._pad_session = None # Force unavailable model

    dummy_img = np.full((200, 200, 3), 128, dtype=np.uint8)
    is_live, score, msg = svc.check_liveness_pad(dummy_img)
    assert not is_live
    assert score == 0.0
    assert "fail-closed" in msg

def test_unit_pad_detects_synthetic_spoof():
    # MiniFASNet V2 classifies uniform synthetic image as presentation attack
    dummy_img = np.full((200, 200, 3), 128, dtype=np.uint8)
    is_live, score, msg = face_service.check_liveness_pad(dummy_img)
    # Synthetic flat block is detected as spoof
    assert not is_live
    assert "Presentation attack detected" in msg or "below threshold" in msg

# -------------------------------------------------------------
# 4. Multi-Frame Temporal Consistency
# -------------------------------------------------------------

def test_unit_multi_frame_inconsistency_rejected():
    svc = FaceProcessingService()
    # Mock quality, detection and PAD to succeed, but return switching embeddings
    emb_person_a = create_random_vector(100)
    emb_person_b = create_random_vector(200)

    class MockFace:
        bbox = np.array([20, 20, 100, 100])
        embedding = np.array(emb_person_a)
        normed_embedding = np.array(emb_person_a)

    face_a = MockFace()
    face_b = MockFace()
    face_b.normed_embedding = np.array(emb_person_b)

    with patch.object(svc, 'assess_quality', return_value=(True, 0.9, "OK")), \
         patch.object(svc, 'detect_faces', side_effect=[(True, [face_a], "OK"), (True, [face_b], "OK")]), \
         patch.object(svc, 'check_liveness_pad', return_value=(True, 0.95, "Live")), \
         patch.object(svc, '_get_normalized_embedding', side_effect=[emb_person_a, emb_person_b]):

        f1 = np.full((200, 200, 3), 128, dtype=np.uint8)
        f2 = np.full((200, 200, 3), 128, dtype=np.uint8)
        ok_mf, centroid, msg_mf = svc.verify_multi_frame_consistency([f1, f2])

        assert not ok_mf
        assert centroid is None
        assert "Multi-frame identity inconsistency" in msg_mf

# -------------------------------------------------------------
# 5. Full API End-to-End Security Tests
# -------------------------------------------------------------

@pytest.fixture(scope="module")
def sample_test_image_b64():
    return create_test_base64_image()

@pytest.mark.asyncio
async def test_full_face_security_lifecycle():
    """
    Master test executing complete face attendance security workflow:
    1. Authenticate Admin and Teachers
    2. Provision Student A (Aarav) and Student B (Rohan)
    3. Setup Subject, Classroom, Timetable, Active Lecture Session
    4. Enroll distinct 512-d ArcFace templates for Student A and Student B
    5. Test Genuine Verification -> Succeeded (HTTP 200)
    6. Test Impersonation Attack (Student B's face for Student A's account) -> Blocked (HTTP 403)
    7. Test Unknown Person -> Blocked (HTTP 403)
    8. Test Presentation Attack Spoof -> Blocked (HTTP 403)
    9. Test Ambiguous Face -> Blocked (HTTP 400)
    10. Test Fail-Closed on PAD unavailable -> Blocked (HTTP 503)
    11. Test Multiple Faces -> Blocked (HTTP 400)
    12. Test No Face Detected -> Blocked (HTTP 400)
    13. Test Duplicate Attendance Attempt -> Blocked (HTTP 400)
    14. Test Geofence Perimeter Violation -> Blocked (HTTP 400)
    15. Verify Impersonation Audit Log created in database
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Admin Login
        login_admin = await client.post("/api/v1/auth/login", json={
            "identifier": "ADM-001",
            "password": "Govind@123"
        })
        assert login_admin.status_code == 200
        admin_token = login_admin.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Step 2: Setup Academic Structure (Dept, Course, Branch, Subject, Classroom)
        resp_dept = await client.post("/api/v1/departments", headers=admin_headers, json={
            "code": "CSE-SEC",
            "name": "Computer Science & Security",
            "description": "Biometrics & Cyber Security"
        })
        dept_id = resp_dept.json().get("id") or 1

        resp_course = await client.post("/api/v1/courses", headers=admin_headers, json={
            "code": "BTECH-SEC",
            "name": "B.Tech Cyber Security",
            "department_id": dept_id,
            "duration_years": 4,
            "total_semesters": 8
        })
        course_id = resp_course.json().get("id") or 1

        resp_branch = await client.post("/api/v1/branches", headers=admin_headers, json={
            "code": "CS-SEC-A",
            "name": "Cyber Security Section A",
            "course_id": course_id
        })
        branch_id = resp_branch.json().get("id") or 1

        resp_subject = await client.post("/api/v1/subjects", headers=admin_headers, json={
            "code": "SEC-501",
            "name": "Biometric Security & Computer Vision",
            "course_id": course_id,
            "department_id": dept_id,
            "semester": 5,
            "credits": 4
        })
        subject_id = resp_subject.json().get("id") or 1

        resp_room = await client.post("/api/v1/classrooms", headers=admin_headers, json={
            "room_number": "SEC-LAB-01",
            "building": "Aryabhata Block",
            "floor": "Ground Floor",
            "capacity": 60
        })
        room_id = resp_room.json().get("id") or 1

        # Teacher
        teacher_pass = "SecureTeacher@123"
        resp_teacher = await client.post("/api/v1/teachers", headers=admin_headers, json={
            "employee_code": "TCH-SEC-01",
            "full_name": "Dr. Vikram Adityan",
            "email": "vikram.adityan@gcrg.edu.in",
            "department_id": dept_id,
            "designation": "Associate Professor",
            "qualification": "Ph.D. Biometrics",
            "phone_number": "+919876543201",
            "initial_password": teacher_pass
        })
        teacher_profile_id = resp_teacher.json().get("profile_id") or 1

        # Timetable
        resp_tt = await client.post("/api/v1/timetable", headers=admin_headers, json={
            "weekday": 2, # Wednesday
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "subject_id": subject_id,
            "teacher_id": teacher_profile_id,
            "classroom_id": room_id,
            "course_id": course_id,
            "branch_id": branch_id,
            "semester": 5
        })
        timetable_id = resp_tt.json().get("id") or 1

        # Teacher Login & Start Lecture Session
        t_login = await client.post("/api/v1/auth/login", json={
            "identifier": "TCH-SEC-01",
            "password": teacher_pass
        })
        teacher_token = t_login.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        resp_session = await client.post("/api/v1/attendance/sessions/start", headers=teacher_headers, json={
            "timetable_entry_id": timetable_id,
            "subject_id": subject_id,
            "duration_minutes": 60
        })
        assert resp_session.status_code == 200
        session_id = resp_session.json()["session_id"]

        # Step 3: Register Student A (STU-SEC-01) and Student B (STU-SEC-02) via Admin
        stu_a_code = "STU-SEC-01"
        stu_a_pass = "StudentA@123"
        resp_reg_a = await client.post("/api/v1/students", headers=admin_headers, json={
            "student_id": stu_a_code,
            "full_name": "Student A (Aarav)",
            "roll_number": "ROLL-SEC-01",
            "course_id": course_id,
            "branch_id": branch_id,
            "department_id": dept_id,
            "semester": 5,
            "phone_number": "+919811111111",
            "email": "student_a_sec@test.edu.in",
            "initial_password": stu_a_pass
        })
        assert resp_reg_a.status_code in [201, 400]
        if resp_reg_a.status_code == 201:
            stu_a_profile_id = resp_reg_a.json()["profile_id"]
        else:
            list_resp = await client.get(f"/api/v1/students?search={stu_a_code}", headers=admin_headers)
            stu_a_profile_id = list_resp.json()[0]["profile_id"]

        stu_b_code = "STU-SEC-02"
        stu_b_pass = "StudentB@123"
        resp_reg_b = await client.post("/api/v1/students", headers=admin_headers, json={
            "student_id": stu_b_code,
            "full_name": "Student B (Rohan)",
            "roll_number": "ROLL-SEC-02",
            "course_id": course_id,
            "branch_id": branch_id,
            "department_id": dept_id,
            "semester": 5,
            "phone_number": "+919822222222",
            "email": "student_b_sec@test.edu.in",
            "initial_password": stu_b_pass
        })
        assert resp_reg_b.status_code in [201, 400]
        if resp_reg_b.status_code == 201:
            stu_b_profile_id = resp_reg_b.json()["profile_id"]
        else:
            list_resp = await client.get(f"/api/v1/students?search={stu_b_code}", headers=admin_headers)
            stu_b_profile_id = list_resp.json()[0]["profile_id"]

        # Activate Students via Admin
        await client.post(f"/api/v1/students/{stu_a_profile_id}/activate", headers=admin_headers)
        await client.post(f"/api/v1/students/{stu_b_profile_id}/activate", headers=admin_headers)

        # Generate Distinct 512-d ArcFace vectors for Student A and Student B
        emb_student_a = create_random_vector(1111)
        emb_student_b = create_random_vector(2222)
        emb_unknown = create_random_vector(9999)

        # Enroll templates for both students using Admin endpoint or mocked embeddings
        dummy_sample_b64 = create_test_base64_image()

        class MockFaceA:
            bbox = np.array([20, 20, 150, 150])
            embedding = np.array(emb_student_a)
            normed_embedding = np.array(emb_student_a)

        class MockFaceB:
            bbox = np.array([20, 20, 150, 150])
            embedding = np.array(emb_student_b)
            normed_embedding = np.array(emb_student_b)

        # Enroll Student A
        with patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceA()], "OK")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_student_a):
            enroll_resp_a = await client.post(
                f"/api/v1/attendance/face-enroll?student_profile_id={stu_a_profile_id}",
                headers=admin_headers,
                json={"samples": [dummy_sample_b64]}
            )
            assert enroll_resp_a.status_code == 200

        # Enroll Student B
        with patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceB()], "OK")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_student_b):
            enroll_resp_b = await client.post(
                f"/api/v1/attendance/face-enroll?student_profile_id={stu_b_profile_id}",
                headers=admin_headers,
                json={"samples": [dummy_sample_b64]}
            )
            assert enroll_resp_b.status_code == 200

        # Student A Login
        login_stu_a = await client.post("/api/v1/auth/login", json={
            "identifier": stu_a_code,
            "password": stu_a_pass
        })
        assert login_stu_a.status_code == 200
        stu_a_token = login_stu_a.json()["access_token"]
        stu_a_headers = {"Authorization": f"Bearer {stu_a_token}"}

        # -----------------------------------------------------------------
        # TEST CASE 1: GENUINE FACE VERIFICATION
        # Student A logs in, presents Student A's face.
        # Expect: HTTP 200, Attendance record created.
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceA()], "OK")), \
             patch.object(face_service, 'check_liveness_pad', return_value=(True, 0.95, "Live")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_student_a):

            resp_verify_genuine = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_verify_genuine.status_code == 200
            data_rec = resp_verify_genuine.json()
            assert data_rec["student_id"] == stu_a_profile_id
            assert data_rec["status"] == "PRESENT"
            assert data_rec["verification_method"] == "FACE"

        # -----------------------------------------------------------------
        # TEST CASE 2: DUPLICATE ATTENDANCE PREVENTION
        # Student A tries to submit face attendance again for the same session.
        # Expect: HTTP 400 Bad Request.
        # -----------------------------------------------------------------
        resp_dup = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
            "session_id": session_id,
            "face_image": dummy_sample_b64,
            "latitude": settings.INSTITUTE_LATITUDE,
            "longitude": settings.INSTITUTE_LONGITUDE,
            "accuracy": 10.0
        })
        assert resp_dup.status_code == 400
        assert "already recorded" in resp_dup.json()["detail"].lower()

        # Create a second lecture session to test attacks
        resp_session2 = await client.post("/api/v1/attendance/sessions/start", headers=teacher_headers, json={
            "timetable_entry_id": timetable_id,
            "subject_id": subject_id,
            "duration_minutes": 60
        })
        session2_id = resp_session2.json()["session_id"]

        # -----------------------------------------------------------------
        # TEST CASE 3: CRITICAL IMPERSONATION ATTACK PREVENTION
        # Student A logs in.
        # Student B stands in front of the webcam (MockFaceB with Student B's embedding).
        # Expect: HTTP 403 Forbidden!
        # Expect: AuditLog with SECURITY_ALERT_IMPERSONATION.
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceB()], "OK")), \
             patch.object(face_service, 'check_liveness_pad', return_value=(True, 0.95, "Live")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_student_b):

            resp_impersonate = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_impersonate.status_code == 403
            assert "Biometric identity mismatch" in resp_impersonate.json()["detail"]
            assert "Impersonation security alert logged" in resp_impersonate.json()["detail"]

        # -----------------------------------------------------------------
        # TEST CASE 4: UNKNOWN PERSON PRESENTED
        # Student A logs in, an un-enrolled stranger stands in front of camera.
        # Expect: HTTP 403 Forbidden ("Unknown individual").
        # -----------------------------------------------------------------
        class MockFaceUnknown:
            bbox = np.array([20, 20, 150, 150])
            embedding = np.array(emb_unknown)
            normed_embedding = np.array(emb_unknown)

        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceUnknown()], "OK")), \
             patch.object(face_service, 'check_liveness_pad', return_value=(True, 0.95, "Live")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_unknown):

            resp_unknown = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_unknown.status_code == 403
            assert "Unknown individual" in resp_unknown.json()["detail"]

        # -----------------------------------------------------------------
        # TEST CASE 5: PRESENTATION ATTACK (PHOTO / SCREEN REPLAY SPOOF)
        # PAD model detects printed photograph or screen attack.
        # Expect: HTTP 403 Forbidden ("Biometric presentation attack detected").
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceA()], "OK")), \
             patch.object(face_service, 'check_liveness_pad', return_value=(False, 0.05, "printed photograph attack detected")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_student_a):

            resp_spoof = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_spoof.status_code == 403
            assert "presentation attack detected" in resp_spoof.json()["detail"].lower()

        # -----------------------------------------------------------------
        # TEST CASE 6: FAIL-CLOSED SECURITY WHEN PAD MODEL IS UNAVAILABLE
        # Expect: HTTP 503 Service Unavailable ("fail-closed security mode").
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceA()], "OK")), \
             patch.object(face_service, 'check_liveness_pad', return_value=(False, 0.0, "PAD model unavailable or failed to initialize (fail-closed)")):

            resp_pad_fail = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_pad_fail.status_code == 503
            assert "fail-closed" in resp_pad_fail.json()["detail"].lower()

        # -----------------------------------------------------------------
        # TEST CASE 7: NO FACE DETECTED IN CAMERA VIEWPORT
        # Expect: HTTP 400 Bad Request ("No face detected in camera viewport").
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(False, [], "No face detected in camera viewport. Please face the camera directly.")):

            resp_no_face = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_no_face.status_code == 400
            assert "No face detected" in resp_no_face.json()["detail"]

        # -----------------------------------------------------------------
        # TEST CASE 8: MULTIPLE FACES DETECTED IN VIEWPORT
        # Expect: HTTP 400 Bad Request ("Multiple faces detected in camera viewport").
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(False, [MockFaceA(), MockFaceB()], "Multiple faces detected in camera viewport (2). Exactly one person must be present.")):

            resp_multi_face = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_multi_face.status_code == 400
            assert "Multiple faces detected" in resp_multi_face.json()["detail"]

        # -----------------------------------------------------------------
        # TEST CASE 9: IMAGE QUALITY CHECK FAILURE (BLURRY / TOO DARK)
        # Expect: HTTP 400 Bad Request ("Face capture quality check failed").
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(False, 10.0, "Image is too blurry. Please hold steady and ensure good focus.")):
            resp_blur = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_blur.status_code == 400
            assert "blurry" in resp_blur.json()["detail"].lower()

        # -----------------------------------------------------------------
        # TEST CASE 10: AMBIGUOUS BIOMETRIC MATCH REJECTED
        # Expect: HTTP 400 Bad Request ("Ambiguous biometric match").
        # -----------------------------------------------------------------
        with patch.object(face_service, 'assess_quality', return_value=(True, 0.9, "OK")), \
             patch.object(face_service, 'detect_faces', return_value=(True, [MockFaceA()], "OK")), \
             patch.object(face_service, 'check_liveness_pad', return_value=(True, 0.95, "Live")), \
             patch.object(face_service, '_get_normalized_embedding', return_value=emb_student_a), \
             patch.object(face_service, 'identify_1_to_n', return_value=(stu_a_profile_id, 0.85, 0.82, True, "Ambiguous")):

            resp_ambig = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
                "session_id": session2_id,
                "face_image": dummy_sample_b64,
                "latitude": settings.INSTITUTE_LATITUDE,
                "longitude": settings.INSTITUTE_LONGITUDE,
                "accuracy": 10.0
            })
            assert resp_ambig.status_code == 400
            assert "Ambiguous biometric match" in resp_ambig.json()["detail"]

        # -----------------------------------------------------------------
        # TEST CASE 11: GEOFENCE VIOLATION (OUTSIDE PERIMETER)
        # Expect: HTTP 400 Bad Request ("outside campus perimeter").
        # -----------------------------------------------------------------
        resp_geo = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
            "session_id": session2_id,
            "face_image": dummy_sample_b64,
            "latitude": settings.INSTITUTE_LATITUDE + 0.1, # 11 km away
            "longitude": settings.INSTITUTE_LONGITUDE + 0.1,
            "accuracy": 10.0
        })
        assert resp_geo.status_code == 400
        assert "outside campus perimeter" in resp_geo.json()["detail"].lower()

        # -----------------------------------------------------------------
        # TEST CASE 12: STUDENT WITHOUT ENROLLED TEMPLATE
        # Admin resets Student A template, then Student A attempts attendance.
        # Expect: HTTP 400 Bad Request ("You do not have an active face enrollment").
        # -----------------------------------------------------------------
        resp_reset = await client.post(
            f"/api/v1/attendance/face-enroll/{stu_a_profile_id}/reset",
            headers=admin_headers
        )
        assert resp_reset.status_code == 200

        resp_no_tmpl = await client.post("/api/v1/attendance/verify-face", headers=stu_a_headers, json={
            "session_id": session2_id,
            "face_image": dummy_sample_b64,
            "latitude": settings.INSTITUTE_LATITUDE,
            "longitude": settings.INSTITUTE_LONGITUDE,
            "accuracy": 10.0
        })
        assert resp_no_tmpl.status_code == 400
        assert "do not have an active face enrollment" in resp_no_tmpl.json()["detail"].lower()

        # -----------------------------------------------------------------
        # TEST CASE 13: QR ATTENDANCE REMAINS INTACT AND FUNCTIONAL
        # -----------------------------------------------------------------
        resp_qr_gen = await client.post("/api/v1/attendance/qr/generate", headers=teacher_headers, json={
            "session_id": session2_id,
            "expires_in_minutes": 15
        })
        assert resp_qr_gen.status_code == 200
        qr_token = resp_qr_gen.json()["qr_token"]

        # Student B scans QR token
        login_stu_b = await client.post("/api/v1/auth/login", json={
            "identifier": stu_b_code,
            "password": stu_b_pass
        })
        stu_b_token = login_stu_b.json()["access_token"]
        stu_b_headers = {"Authorization": f"Bearer {stu_b_token}"}

        resp_qr_scan = await client.post("/api/v1/attendance/qr/verify", headers=stu_b_headers, json={
            "qr_token": qr_token,
            "latitude": settings.INSTITUTE_LATITUDE,
            "longitude": settings.INSTITUTE_LONGITUDE,
            "accuracy": 10.0
        })
        assert resp_qr_scan.status_code == 200
        assert resp_qr_scan.json()["verification_method"] == "QR"

        # -----------------------------------------------------------------
        # TEST CASE 14: MANUAL ATTENDANCE REMAINS INTACT AND FUNCTIONAL
        # -----------------------------------------------------------------
        resp_manual = await client.post("/api/v1/attendance/manual", headers=teacher_headers, json={
            "session_id": session2_id,
            "student_id": stu_a_profile_id,
            "status": "PRESENT",
            "remarks": "Manual teacher override"
        })
        assert resp_manual.status_code == 200
        assert resp_manual.json()["verification_method"] == "MANUAL"

        # -----------------------------------------------------------------
        # TEST CASE 15: VERIFY SECURITY AUDIT LOGS IN DATABASE
        # -----------------------------------------------------------------
        resp_audit = await client.get("/api/v1/audit", headers=admin_headers)
        assert resp_audit.status_code == 200
        logs = resp_audit.json()

        actions = [log["action"] for log in logs]
        assert "SECURITY_ALERT_IMPERSONATION" in actions
        assert "SECURITY_ALERT_UNRECOGNIZED_FACE" in actions
        assert "SECURITY_ALERT_SPOOF_ATTEMPT" in actions

        # Inspect impersonation audit log entry details
        impersonation_logs = [l for l in logs if l["action"] == "SECURITY_ALERT_IMPERSONATION"]
        assert len(impersonation_logs) > 0
        imp_log = impersonation_logs[0]
        assert "CRITICAL BIOMETRIC IMPERSONATION ATTEMPT" in imp_log["details"]
