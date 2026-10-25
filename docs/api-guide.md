# AttendX — REST API Guide & Integration Reference

**Base URL:** `http://localhost:8000/api/v1`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**ReDoc Reference:** `http://localhost:8000/redoc`  

---

## 1. Authentication & Security Headers

All protected endpoints require a valid JSON Web Token (JWT) passed via the `Authorization` HTTP header:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Token expiration is configured via environment settings (default: 8 hours). Role authorization is enforced strictly on the server:

- **Public:** No authentication required (`/public/contact`, `/auth/login`, etc.).
- **Student:** Allowed `STUDENT` role (`/attendance/verify-face`, `/attendance/qr/verify`, etc.).
- **Teacher:** Allowed `TEACHER` and `ADMIN` roles (`/attendance/sessions/start`, `/attendance/qr/generate`, etc.).
- **Admin:** Allowed `ADMIN` role only (`/settings/*`, `/audit`, `/departments`, `/students`, etc.).

---

## 2. Core Endpoint Reference

### A. Authentication & Lifecycle

#### `POST /auth/login`
Authenticates Student, Teacher, or Admin using either user code (`ADM-001`, `STU-001`, `TCH-001`) or registered email.
- **Request Body:**
  ```json
  {
    "identifier": "ADM-001",
    "password": "InitialPassword@123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": 1,
    "user_code": "ADM-001",
    "full_name": "Govind Kushwaha",
    "email": "admin@gcrg.edu.in",
    "role": "ADMIN",
    "must_change_password": true
  }
  ```

#### `POST /auth/change-password`
Mandatory first-login password rotation or user-initiated credential update.
- **Request Body:**
  ```json
  {
    "current_password": "InitialPassword@123",
    "new_password": "NewStrongPassword@2026",
    "confirm_new_password": "NewStrongPassword@2026"
  }
  ```

#### `POST /auth/create-account`
Student self-registration workflow verified against institute enrollment parameters.

---

### B. Biometric & QR Attendance Endpoints

#### `POST /attendance/sessions/start` (Teacher / Admin)
Initiates an active attendance window for an assigned lecture.
- **Request Body:**
  ```json
  {
    "subject_id": 1,
    "duration_minutes": 45,
    "timetable_entry_id": 12
  }
  ```

#### `POST /attendance/face-enroll` (Student / Admin)
Extracts 128-dimensional facial embedding vectors from 3 captured frames and saves the active biometric template.
- **Request Body:**
  ```json
  {
    "samples": ["data:image/jpeg;base64,...", "...", "..."]
  }
  ```

#### `POST /attendance/verify-face` (Student)
Validates facial cosine similarity and WGS-84 campus geofence to register attendance.
- **Request Body:**
  ```json
  {
    "session_id": 4,
    "face_image": "data:image/jpeg;base64,...",
    "latitude": 26.8467,
    "longitude": 80.9462,
    "accuracy": 12.5
  }
  ```

#### `POST /attendance/qr/generate` (Teacher / Admin)
Generates an expiring HMAC-SHA256 signed QR token for classroom projection.

#### `POST /attendance/qr/verify` (Student)
Scans dynamic QR token with mobile device and verifies signature and geofence.

#### `POST /attendance/correct` (Admin / Teacher)
Audited status override with mandatory justification reason.

---

### C. Reporting & Analytics

#### `GET /analytics/dashboard`
Returns live metrics dynamically computed from the database according to the authenticated user's role.
- **Admin:** Total enrolled students, faculty count, today's attendance rate, verification breakdown.
- **Teacher:** Assigned classes, average attendance, active sessions.
- **Student:** Personal attendance percentage, attended/missed lectures, eligibility status.

#### `GET /reports/excel`, `GET /reports/csv`, `GET /reports/pdf`
Streams sanitized attendance ledgers with query parameters: `start_date`, `end_date`, `subject_id`, `department_id`, `course_id`, `status`.

---

### D. AttendX AI Natural Language Query

#### `POST /ai/query`
Natural language database query assistant with role-based data boundary isolation.
- **Request Body:**
  ```json
  {
    "query": "Which students have attendance below 75 percent in Computer Networks?"
  }
  ```
- **Response:**
  ```json
  {
    "answer": "Attendance analysis for Computer Networks (CS-501): ...",
    "intent": "ATTENDANCE_QUERY",
    "evidence": [...],
    "confidence": 0.94,
    "suggested_actions": ["Download Defaulters PDF Report", "Send Parent Alerts"]
  }
  ```
