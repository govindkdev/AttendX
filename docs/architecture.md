# AttendX — Architecture & System Design Documentation

**Institute:** GCRG Group of Institutions, Lucknow, Uttar Pradesh, India  
**System:** AI-Powered Smart Attendance & Institute Management System  

---

## 1. System Overview

AttendX is an enterprise-grade Smart Attendance Management System engineered for modern educational institutions. It replaces manual paper attendance registers and static spreadsheets with cryptographic, biometric, and geospatial verification methods:

1. **Biometric Face Recognition:** WebRTC camera capture coupled with normalized 128-dimensional facial embedding vectors and cosine similarity verification.
2. **Dynamic Cryptographic QR Tokens:** HMAC-SHA256 signed, expiring QR codes refreshed dynamically to prevent replay attacks and off-site sharing.
3. **GPS Geofencing:** Precise WGS-84 coordinate validation with Haversine spherical distance calculation ensuring students are physically present within the Lucknow campus perimeter (default radius: 200m).
4. **AttendX AI Assistant:** Natural-language conversational query assistant powered by schema-aware, role-authorized database introspection.
5. **Absolute Zero-Demo-Data Policy:** Strict architectural separation between database schemas and records. The application starts in an authentic, production-ready state with only the provisioned initial administrator (`ADM-001`).

---

## 2. Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                Client Tier (Browser)                             |
|  - React 19 + TypeScript + Vite                                                   |
|  - Tailwind CSS v4 + Lucide Icons                                                 |
|  - WebRTC Camera Feed & Geolocation API                                           |
|  - Portals: Public Website, Auth, Student Portal, Teacher Portal, Admin Dashboard |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON REST API
                                           v
+-----------------------------------------------------------------------------------+
|                                FastAPI Application Tier                          |
|  - Core Router & Middleware (CORS, Rate Limiting, Audit Interceptors)             |
|  - Authentication & Authorization: JWT Bearer Tokens + Argon2id Passwords        |
|  - Permission Guards: require_roles, require_admin, require_teacher, require_stu  |
|                                                                                   |
|  [ Subsystems ]                                                                   |
|   ├── Face Recognition Service (OpenCV / 128-d Vector Cosine Similarity)          |
|   ├── Dynamic QR Service (HMAC-SHA256 Token Signer & Expiring Nonce Verifier)     |
|   ├── Geofencing Service (Haversine WGS-84 Distance & Accuracy Check)            |
|   ├── Attendance Engine (Grace Periods, Lateness Rules, Automated Absence Job)    |
|   ├── Reports Generator (openpyxl Excel, UTF-8 CSV, ReportLab PDF)               |
|   └── AttendX AI Assistant Service (Natural Language Query Pipeline)              |
+------------------------------------------+----------------------------------------+
                                           | Async SQLAlchemy 2.x
                                           v
+-----------------------------------------------------------------------------------+
|                               Persistence Tier                                    |
|  - PostgreSQL (Production) / Async SQLite (aiosqlite) Development Fallback        |
|  - Tables: users, student_profiles, teacher_profiles, departments, courses,      |
|    branches, subjects, classrooms, timetable_entries, lecture_sessions,          |
|    attendance_records, face_enrollments, face_templates, qr_sessions,             |
|    leave_requests, notifications, audit_logs, institute_settings, geofence_settings|
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack Justification

| Layer | Technology | Key Architectural Driver |
|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite | Sub-second HMR, type safety across 45 views, optimized production tree-shaking |
| **Styling & Icons** | Tailwind CSS v4, Lucide React | High-performance atomic CSS, responsive design, zero layout shift |
| **Backend API** | Python 3.12+, FastAPI | Asynchronous I/O, native Pydantic validation, OpenAPI documentation |
| **ORM & Migrations** | SQLAlchemy 2.0 (Async), Alembic | Unified database abstraction supporting PostgreSQL and SQLite fallback |
| **Biometrics** | OpenCV & Cosine Similarity | 128-dimensional embedding vector comparison with quality scoring |
| **Security & Hashing** | Argon2id (`Type.ID`) | Memory-hard password hashing resistant to GPU brute-force attacks |
| **Tokens & Signatures** | HMAC-SHA256 & PyJWT | Signed, tamper-evident expiring tokens for QR sessions and user authentication |
| **Exports** | openpyxl, ReportLab | Excel generation with formula injection sanitization, PDF generation with seals |

---

## 4. Attendance Subsystem Workflows

### A. Biometric Face Attendance
1. **Enrollment:** Student or administrator submits 3 clear facial frames. Backend computes embedding vectors, averages them, and stores a normalized 128-d template.
2. **Session Activation:** Faculty starts a lecture session with an assigned subject and duration.
3. **Verification:** Student captures a live frame and current device GPS coordinates.
4. **Validation:** Backend verifies:
   - Lecture session is active and not expired.
   - Device GPS is within the Lucknow campus geofence radius.
   - Captured face cosine similarity exceeds matching threshold ($\ge 0.65$).
   - Student has not already checked into this lecture.
5. **Ledger Update:** Attendance recorded as `PRESENT` (or `LATE` if after the institute grace period), accompanied by an audit event.

### B. Dynamic Cryptographic QR Attendance
1. Faculty initiates QR attendance session on the classroom projector or screen.
2. Backend signs a dynamic token with session ID, timestamp, and HMAC-SHA256 secret.
3. Student scans QR token from mobile camera, bundling current GPS coordinates.
4. Backend checks signature, expiration window, and campus perimeter.
5. Attendance logged under `QR` verification method.

### C. Automated Session Absence Processor
- Faculty or scheduled background job triggers session closure.
- Enrolled students who did not check in via Face, QR, or Manual method are automatically marked `ABSENT`.
- Absence alerts are queued for dispatch to student profiles and registered parent email/SMS contacts.
