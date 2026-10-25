# AttendX — Quality Assurance & Testing Guide

**Institute:** GCRG Group of Institutions, Lucknow  
**Backend Framework:** Pytest + HTTPX AsyncClient + in-memory Async SQLite  
**Frontend Framework:** Vitest + React Testing Library + JSDOM  

---

## 1. Test Architecture & Principles

The AttendX test suite follows rigorous verification principles:

1. **Test Isolation:** Backend tests run against a dynamic, in-memory SQLite database instance (`sqlite+aiosqlite:///:memory:`). Tests execute in complete isolation without mutating the persistent production database (`attendx.db`).
2. **Deterministic Verification:** No mock data is leaked into persistent environments. Every test generates its own ephemeral prerequisites and cleans up via asynchronous fixture teardowns.
3. **End-to-End Flow Validation:** Complex workflows—such as student registration followed by leave submission and faculty review—are validated end-to-end through real HTTP endpoint dispatches.

---

## 2. Test Execution Commands

### Backend Pytest Suite
```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests -v
```
**Expected Result:** 12 passed in ~3.5 seconds.

### Frontend Vitest Suite
```bash
cd frontend
npm test
```
**Expected Result:** 3 test files, 6 tests passed in ~2.5 seconds.

### Frontend TypeScript Compilation & Production Build Check
```bash
cd frontend
npm run build
```
**Expected Result:** `tsc -b && vite build` succeeds with zero errors.

---

## 3. Catalog of Backend Test Cases (`backend/tests/`)

| Test Name | File | Description |
|---|---|---|
| `test_health_and_readiness` | `test_backend.py` | Validates `/health` and `/ready` endpoints return HTTP 200 with database connectivity confirmation. |
| `test_admin_login_and_first_login_flag` | `test_backend.py` | Verifies initial administrator login with `ADM-001` and confirms `must_change_password=True`. |
| `test_first_login_password_change` | `test_backend.py` | Tests mandatory password rotation, Argon2id re-hashing, and clearing of the `must_change_password` flag. |
| `test_unauthorized_access_protection` | `test_backend.py` | Asserts unauthenticated requests or requests with insufficient role privileges are blocked with HTTP 401/403. |
| `test_qr_signing_expiration_and_tamper_detection` | `test_backend.py` | Verifies HMAC-SHA256 signature verification, rejection of expired QR nonces, and detection of manipulated tokens. |
| `test_gps_geofence_haversine` | `test_backend.py` | Tests coordinate boundary checking: Lucknow campus center accepted, off-campus coordinates rejected. |
| `test_face_service_similarity` | `test_backend.py` | Evaluates 128-d normalized facial embedding vector generation and cosine similarity calculation. |
| `test_academic_and_timetable_flow` | `test_backend.py` | Validates creation of departments, courses, branches, subjects, classrooms, faculty, and collision-free timetable slots. |
| `test_attendx_ai_queries` | `test_backend.py` | Asserts natural-language query resolution across database records with structured confidence and evidence cards. |
| `test_report_downloads` | `test_backend.py` | Validates streaming of formula-sanitized Excel (.xlsx), UTF-8 CSV, and official ReportLab PDF documents. |
| `test_admin_broadcast_and_audit` | `test_backend.py` | Tests broadcast announcement creation and verifies corresponding record insertion in immutable audit logs. |
| `test_student_registration_and_leave_requests` | `test_attendance_flow.py` | End-to-end student self-enrollment, student login, leave request submission, and faculty approval workflow. |

---

## 4. Catalog of Frontend Test Cases (`frontend/tests/`)

| Test Suite | File | Description |
|---|---|---|
| `EmptyState Component` | `empty_state.test.tsx` | Verifies zero-data empty state rendering and compliant empty messages without synthetic records. |
| `API Token Utilities` | `auth_token.test.ts` | Validates localStorage token storage, retrieval, clearing, and `ApiError` structured parsing. |
| `Public Branding & Institute Integrity` | `public_branding.test.tsx` | Asserts GCRG Group of Institutions (Lucknow, UP) identity in headers and footers across the public layout. |
