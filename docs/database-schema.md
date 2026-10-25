# AttendX — Database Schema & Data Dictionary

**Institute:** GCRG Group of Institutions, Lucknow  
**Database Engines:** PostgreSQL 16+ (Production) / SQLite 3 (Async Development Fallback)  
**ORM:** SQLAlchemy 2.0 Async declarative models (`backend/app/models/entities.py`)

---

## 1. Core Principles

- **Zero Demo Records:** Tables are created with structural integrity and initial administrative governance records only. No synthetic students or fake attendance records exist.
- **UTC Timezones:** All timestamps are persisted in UTC (`datetime.now(timezone.utc)`) and converted to `Asia/Kolkata` at presentation time.
- **Audited Mutability:** Attendance records maintain an audited revision trail (`attendance_corrections`) whenever modified.
- **Biometric Privacy:** Raw camera frames are decoded in volatile memory during template generation and verification; only 128-dimensional mathematical embedding vectors are persisted.

---

## 2. Table Catalog

### A. Authentication & Profiles

#### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique user identifier |
| `user_code` | VARCHAR(50) | UNIQUE, INDEX, NOT NULL | Public ID (`ADM-001`, `STU-...`, `TCH-...`) |
| `email` | VARCHAR(255) | UNIQUE, INDEX, NOT NULL | Official email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2id cryptographic hash |
| `full_name` | VARCHAR(255) | NOT NULL | Full legal name |
| `role` | VARCHAR(20) | NOT NULL | `ADMIN`, `TEACHER`, or `STUDENT` |
| `phone_number` | VARCHAR(20) | NULL | Primary contact phone |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account activation state |
| `must_change_password`| BOOLEAN | DEFAULT FALSE | Requires password change on first login |
| `created_at` | TIMESTAMP | DEFAULT UTC NOW | Registration timestamp |

#### `student_profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Profile ID |
| `user_id` | INTEGER | FK -> `users.id`, UNIQUE | Linked user account |
| `student_id` | VARCHAR(50) | UNIQUE, INDEX | Official institutional student ID |
| `roll_number` | VARCHAR(50) | UNIQUE, INDEX | University roll number |
| `course_id` | INTEGER | FK -> `courses.id` | Enrolled degree program |
| `branch_id` | INTEGER | FK -> `branches.id` | Academic branch / specialization |
| `semester` | INTEGER | NOT NULL | Current semester (1 to 12) |
| `parent_name` | VARCHAR(255) | NULL | Parent / guardian name |
| `parent_phone` | VARCHAR(20) | NULL | Emergency SMS alert phone |
| `parent_email` | VARCHAR(255) | NULL | Absence notification email |
| `address` | TEXT | NULL | Residential address |

#### `teacher_profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Profile ID |
| `user_id` | INTEGER | FK -> `users.id`, UNIQUE | Linked user account |
| `employee_code` | VARCHAR(50) | UNIQUE, INDEX | Faculty employee ID |
| `department_id` | INTEGER | FK -> `departments.id` | Academic department |
| `designation` | VARCHAR(100) | NOT NULL | Faculty title (e.g. Associate Professor) |
| `qualification` | VARCHAR(255) | NOT NULL | Highest degrees earned |

---

### B. Academic Structure & Scheduling

#### `departments`, `courses`, `branches`, `subjects`, `classrooms`
- Hierarchical institutional structure supporting multiple colleges and degree programs under the GCRG banner.
- Subjects enforce unique subject codes (e.g., `CS-501`) and credit weights.
- Classrooms record physical building, floor, room number, and seated capacity.

#### `timetable_entries`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Timetable slot identifier |
| `subject_id` | INTEGER (FK) | Assigned subject |
| `teacher_id` | INTEGER (FK) | Assigned faculty member |
| `classroom_id` | INTEGER (FK) | Assigned lecture hall |
| `day_of_week` | VARCHAR(20) | `Monday`, `Tuesday`, etc. |
| `start_time` | TIME | Lecture beginning time |
| `end_time` | TIME | Lecture concluding time |
| `semester` | INTEGER | Target semester cohort |

*Collision Detection:* Checked against teacher, classroom, and cohort overlaps.

---

### C. Attendance & Verification

#### `lecture_sessions`
Records active or closed lecture attendance windows started by faculty, with a unique session code, start/end timestamps, and active status flag.

#### `attendance_records`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary record ID |
| `lecture_session_id` | INTEGER (FK) | Associated lecture session |
| `student_id` | INTEGER (FK) | Attending student profile |
| `status` | VARCHAR(20) | `PRESENT`, `LATE`, `ABSENT`, `EXCUSED` |
| `verification_method` | VARCHAR(20) | `FACE`, `QR`, `MANUAL`, `CORRECTION` |
| `recorded_at` | TIMESTAMP | Check-in timestamp |
| `remarks` | TEXT | Optional matching confidence or faculty notes |
| `is_corrected` | BOOLEAN | Flagged if status was subsequently modified |

#### `attendance_corrections`
Immutable audit log of all manual overrides: records original status, updated status, mandatory justification reason, actor user ID, and timestamp.

---

### D. Biometrics & Geospatial Data

- **`face_enrollments` & `face_templates`**: Stores status (`PENDING`, `ENROLLED`), sample counts, quality scores, and the serialized 128-d embedding vector. Deactivates previous templates upon re-enrollment.
- **`qr_sessions` & `qr_verification_events`**: Stores cryptographic token nonces, expiration timestamps, and scanning IP addresses.
- **`geofence_settings`**: Persists campus center coordinates (`26.8467, 80.9462`), allowed radius in meters (200m), accuracy threshold (100m), and enforcement toggle.

---

### E. System Governance & Audit

- **`audit_logs`**: Chronological ledger of system security events:
  - `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `timestamp`.
- **`institute_settings`**: Global configuration (institute title, address, timezone, late grace period, QR expiration window, auto-absence cutoff time).
- **`notifications` & `notification_deliveries`**: Multi-channel delivery ledger tracking in-app notices, parent emails, and SMS alerts.
