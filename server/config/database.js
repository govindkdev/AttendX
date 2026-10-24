/*
=========================================================
ATTENDX BACKEND - DATABASE CONFIGURATION (SQLite)
=========================================================
Zero-config relational database with persistent storage.
Tables:
- users: Authentication, password hash, role
- students: Profile, academic details, face enrollment status
- teachers: Profile, department, assigned subjects
- admins: Authority profiles
- face_embeddings: 512-d facial embedding vectors & photos
- attendance_sessions: Active QR sessions with expiry
- attendance_records: Real attendance logs with verification metadata
- pending_registrations: Approvals queue for faculty
- leave_requests: Student leave applications
- notifications: Real-time system/attendance alerts
- geofence_settings: Campus boundary coordinates and radius
=========================================================
*/

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "..", "attendx.db");
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initDatabase() {
  db.exec(`
    -- USERS & CREDENTIALS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT UNIQUE NOT NULL, -- STU-2026-001 / student@attendx.com
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'student' | 'teacher' | 'admin'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- STUDENTS TABLE
    CREATE TABLE IF NOT EXISTS students (
      student_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      course TEXT NOT NULL,
      branch TEXT NOT NULL,
      year TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      address TEXT,
      status TEXT DEFAULT 'Active', -- 'Active' | 'Suspended'
      face_enrolled INTEGER DEFAULT 0, -- 0 or 1
      face_template_id TEXT,
      face_enrolled_date TEXT,
      overall_attendance REAL DEFAULT 88.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TEACHERS TABLE
    CREATE TABLE IF NOT EXISTS teachers (
      teacher_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      subjects_json TEXT NOT NULL, -- JSON array of assigned subjects
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ADMINS TABLE
    CREATE TABLE IF NOT EXISTS admins (
      admin_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      title TEXT NOT NULL,
      authority TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- BIOMETRIC FACE EMBEDDINGS TABLE
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      face_template_id TEXT NOT NULL,
      embedding_vector TEXT NOT NULL, -- 512-dimensional float array stored as JSON
      photo_url TEXT, -- base64 / path
      quality_score TEXT DEFAULT '99.4%',
      enrolled_by TEXT DEFAULT 'ADM-2026-001',
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    );

    -- ATTENDANCE SESSIONS TABLE
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      session_id TEXT PRIMARY KEY,
      session_code TEXT NOT NULL,
      token TEXT,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      lecture_name TEXT DEFAULT 'Lecture 1',
      class_group TEXT DEFAULT 'CS-4A',
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      room TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      status TEXT DEFAULT 'Active', -- 'Active' | 'Closed'
      total_enrolled INTEGER DEFAULT 45,
      marked_count INTEGER DEFAULT 0
    );

    -- ATTENDANCE RECORDS TABLE
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      time TEXT NOT NULL, -- HH:MM AM/PM
      subject TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      lecture_name TEXT,
      method TEXT NOT NULL, -- 'Face AI' | 'QR Backup' | 'Manual Record'
      status TEXT NOT NULL, -- 'Present' | 'Late' | 'Absent'
      geofence_verified INTEGER DEFAULT 1,
      confidence TEXT DEFAULT '99.4%',
      room TEXT,
      corrected_by TEXT,
      correction_reason TEXT,
      corrected_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    -- PENDING REGISTRATIONS TABLE
    CREATE TABLE IF NOT EXISTS pending_registrations (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      target_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      department TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Pending', -- 'Pending' | 'Approved' | 'Rejected'
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- LEAVE REQUESTS TABLE
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'Pending', -- 'Pending' | 'Approved' | 'Rejected'
      admin_remarks TEXT,
      submitted_on TEXT NOT NULL
    );

    -- NOTIFICATIONS TABLE
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_role TEXT NOT NULL,
      recipient_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      type TEXT DEFAULT 'info'
    );

    -- GEOFENCE CONFIGURATION TABLE
    CREATE TABLE IF NOT EXISTS geofence_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      campus_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_meters INTEGER NOT NULL,
      strict_mode INTEGER DEFAULT 1
    );

    -- ANTI-PROXY SECURITY AUDIT LEDGER TABLE
    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL, -- 'FACE_VERIFIED' | 'FACE_REJECTED' | 'QR_VERIFIED' | 'QR_EXPIRED' | 'QR_INVALID' | 'DUPLICATE_BLOCKED' | 'GEOFENCE_VIOLATION' | 'LIVENESS_FAILED' | 'SUSPICIOUS_PROXY_FLAGGED'
      student_id TEXT,
      student_name TEXT,
      subject_code TEXT,
      lecture_name TEXT,
      method TEXT NOT NULL, -- 'Face AI' | 'QR Scan'
      status TEXT NOT NULL, -- 'VERIFIED' | 'FLAGGED' | 'BLOCKED'
      risk_level TEXT DEFAULT 'Low', -- 'Low' | 'Medium' | 'High'
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- =========================================================
    -- ACADEMIC CONFIGURATION TABLES
    -- =========================================================

    -- COURSES TABLE (e.g. B.Tech, BCA, MCA, B.Sc, M.Tech, MBA, custom)
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      duration_years INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- BRANCHES TABLE (e.g. CSE, IT, ECE, custom per course)
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      course_code TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_code, code)
    );

    -- ACADEMIC YEARS TABLE (1st Year, 2nd Year, 3rd Year, 4th Year)
    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      year_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- SUBJECTS TABLE (Exact Course + Branch + Year combination)
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      course_code TEXT NOT NULL,
      branch_code TEXT NOT NULL,
      year_code TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      room_default TEXT DEFAULT 'LT-101',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_code, branch_code, year_code, subject_code)
    );

    -- ACADEMIC CLASSES / SECTIONS (e.g. CS-4A, IT-1A)
    CREATE TABLE IF NOT EXISTS academic_classes (
      id TEXT PRIMARY KEY,
      course_code TEXT NOT NULL,
      branch_code TEXT NOT NULL,
      year_code TEXT NOT NULL,
      section_name TEXT NOT NULL,
      class_code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TEACHER ASSIGNMENTS TABLE (Authorized subjects & classes per teacher)
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      class_code TEXT NOT NULL,
      course_code TEXT,
      branch_code TEXT,
      year_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, subject_code, class_code)
    );
  `);

  // Migrate existing tables if columns are missing
  try {
    const sessionCols = db.pragma("table_info(attendance_sessions)").map((c) => c.name);
    if (!sessionCols.includes("token")) db.exec("ALTER TABLE attendance_sessions ADD COLUMN token TEXT");
    if (!sessionCols.includes("lecture_name")) db.exec("ALTER TABLE attendance_sessions ADD COLUMN lecture_name TEXT DEFAULT 'Lecture 1'");
    if (!sessionCols.includes("class_group")) db.exec("ALTER TABLE attendance_sessions ADD COLUMN class_group TEXT DEFAULT 'CS-4A'");

    const recordCols = db.pragma("table_info(attendance_records)").map((c) => c.name);
    if (!recordCols.includes("session_id")) db.exec("ALTER TABLE attendance_records ADD COLUMN session_id TEXT");
    if (!recordCols.includes("lecture_name")) db.exec("ALTER TABLE attendance_records ADD COLUMN lecture_name TEXT");
    if (!recordCols.includes("teacher_id")) db.exec("ALTER TABLE attendance_records ADD COLUMN teacher_id TEXT");
    if (!recordCols.includes("teacher_name")) db.exec("ALTER TABLE attendance_records ADD COLUMN teacher_name TEXT");
    if (!recordCols.includes("course")) db.exec("ALTER TABLE attendance_records ADD COLUMN course TEXT");
    if (!recordCols.includes("branch")) db.exec("ALTER TABLE attendance_records ADD COLUMN branch TEXT");
    if (!recordCols.includes("academic_year")) db.exec("ALTER TABLE attendance_records ADD COLUMN academic_year TEXT");
    if (!recordCols.includes("sheets_synced")) db.exec("ALTER TABLE attendance_records ADD COLUMN sheets_synced INTEGER DEFAULT 0");
    if (!recordCols.includes("sheets_sync_status")) db.exec("ALTER TABLE attendance_records ADD COLUMN sheets_sync_status TEXT DEFAULT 'Pending'");
    if (!recordCols.includes("sheets_synced_at")) db.exec("ALTER TABLE attendance_records ADD COLUMN sheets_synced_at DATETIME");
    if (!recordCols.includes("sheets_error")) db.exec("ALTER TABLE attendance_records ADD COLUMN sheets_error TEXT");
    if (!recordCols.includes("corrected_by")) db.exec("ALTER TABLE attendance_records ADD COLUMN corrected_by TEXT");
    if (!recordCols.includes("correction_reason")) db.exec("ALTER TABLE attendance_records ADD COLUMN correction_reason TEXT");
    if (!recordCols.includes("corrected_at")) db.exec("ALTER TABLE attendance_records ADD COLUMN corrected_at DATETIME");

    const sessionCols2 = db.pragma("table_info(attendance_sessions)").map((c) => c.name);
    if (!sessionCols2.includes("course_code")) db.exec("ALTER TABLE attendance_sessions ADD COLUMN course_code TEXT DEFAULT 'B.Tech'");
    if (!sessionCols2.includes("branch_code")) db.exec("ALTER TABLE attendance_sessions ADD COLUMN branch_code TEXT DEFAULT 'Computer Science & Engineering'");
    if (!sessionCols2.includes("year_code")) db.exec("ALTER TABLE attendance_sessions ADD COLUMN year_code TEXT DEFAULT '4th Year'");

    // GOOGLE SHEETS SYNC QUEUE & SYSTEM SETTINGS TABLES
    db.exec(`
      CREATE TABLE IF NOT EXISTS google_sheets_sync_queue (
        id TEXT PRIMARY KEY,
        record_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        attempts INTEGER DEFAULT 0,
        last_attempt_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scheduled_lectures (
        id TEXT PRIMARY KEY,
        lecture_name TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        course_code TEXT NOT NULL,
        branch_code TEXT NOT NULL,
        year_code TEXT NOT NULL,
        class_code TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        room TEXT DEFAULT 'LT-101',
        schedule_day TEXT DEFAULT 'Monday',
        start_time TEXT DEFAULT '09:00 AM',
        end_time TEXT DEFAULT '10:00 AM',
        status TEXT DEFAULT 'Scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const faceCols = db.pragma("table_info(face_embeddings)").map((c) => c.name);
    if (!faceCols.includes("sample_count")) db.exec("ALTER TABLE face_embeddings ADD COLUMN sample_count INTEGER DEFAULT 25");
    if (!faceCols.includes("angle_coverage")) db.exec("ALTER TABLE face_embeddings ADD COLUMN angle_coverage TEXT DEFAULT 'Multi-Angle (Frontal, Left, Right, Tilt)'");
    if (!faceCols.includes("liveness_score")) db.exec("ALTER TABLE face_embeddings ADD COLUMN liveness_score REAL DEFAULT 0.99");
    if (!faceCols.includes("samples_preview_json")) db.exec("ALTER TABLE face_embeddings ADD COLUMN samples_preview_json TEXT");

    const studentCols = db.pragma("table_info(students)").map((c) => c.name);
    if (!studentCols.includes("face_sample_count")) db.exec("ALTER TABLE students ADD COLUMN face_sample_count INTEGER DEFAULT 0");
    if (!studentCols.includes("assigned_subjects_json")) db.exec("ALTER TABLE students ADD COLUMN assigned_subjects_json TEXT DEFAULT '[]'");

    const teacherCols = db.pragma("table_info(teachers)").map((c) => c.name);
    if (!teacherCols.includes("assigned_courses_json")) db.exec("ALTER TABLE teachers ADD COLUMN assigned_courses_json TEXT DEFAULT '[]'");
    if (!teacherCols.includes("assigned_branches_json")) db.exec("ALTER TABLE teachers ADD COLUMN assigned_branches_json TEXT DEFAULT '[]'");
    if (!teacherCols.includes("assigned_years_json")) db.exec("ALTER TABLE teachers ADD COLUMN assigned_years_json TEXT DEFAULT '[]'");
    if (!teacherCols.includes("assigned_classes_json")) db.exec("ALTER TABLE teachers ADD COLUMN assigned_classes_json TEXT DEFAULT '[]'");

    // Populate initial security audit logs if table is newly created and empty
    const auditCount = db.prepare("SELECT COUNT(*) as count FROM security_audit_logs").get().count;
    if (auditCount === 0) {
      const insertAudit = db.prepare(`
        INSERT INTO security_audit_logs (id, event_type, student_id, student_name, subject_code, lecture_name, method, status, risk_level, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertAudit.run("SEC-101", "FACE_VERIFIED", "STU-2026-001", "Govind Kushwaha", "CS402", "Lecture 14: Neural Networks", "Face AI", "VERIFIED", "Low", "Biometric centroid match 99.4% (Threshold: 80%). Liveness check verified.", "Today 09:05 AM");
      insertAudit.run("SEC-102", "QR_VERIFIED", "STU-2026-001", "Govind Kushwaha", "CS403", "Lecture 11: Cloud Architecture", "QR Scan", "VERIFIED", "Low", "Cryptographic single-use nonce validated. Campus perimeter verified within 48m.", "Yesterday 02:10 PM");
      insertAudit.run("SEC-103", "DUPLICATE_BLOCKED", "STU-2026-003", "Aman Verma", "CS402", "Lecture 14: Neural Networks", "QR Scan", "BLOCKED", "Medium", "Duplicate check-in attempt blocked: Student already checked in at 09:02 AM.", "Today 09:14 AM");
      insertAudit.run("SEC-104", "QR_EXPIRED", "STU-2026-004", "Riya Singh", "CS401", "Lecture 9: Binary Trees", "QR Scan", "BLOCKED", "Low", "Rejected expired QR token: Token TTL exceeded by 2m 14s.", "2026-10-22 11:22 AM");
    }

    // Enforce database-level uniqueness for student attendance per lecture per day
    try {
      db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_lecture ON attendance_records(student_id, date, subject_code)");
    } catch (idxErr) {
      console.warn("Index notice:", idxErr.message);
    }
  } catch (err) {
    console.warn("Schema migration notice:", err.message);
  }

  seedInitialData();
  seedAcademicData();
}

function seedInitialData() {
  // Check if students already exist
  const existingCount = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
  if (existingCount > 0) return;

  console.log("Seeding initial database records...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@attendx.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const hashStudent = bcrypt.hashSync("Student@123", 10);
  const hashTeacher = bcrypt.hashSync("Teacher@123", 10);
  const hashAdmin = bcrypt.hashSync(adminPassword, 10);

  // 1. Seed Users for Auth
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (identifier, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  insertUser.run("STU-2026-001", "student@attendx.com", hashStudent, "student");
  insertUser.run("student@attendx.com", "student@attendx.com", hashStudent, "student");
  insertUser.run("TCH-2026-001", "teacher@attendx.com", hashTeacher, "teacher");
  insertUser.run("teacher@attendx.com", "teacher@attendx.com", hashTeacher, "teacher");
  insertUser.run("ADM-2026-001", adminEmail, hashAdmin, "admin");
  insertUser.run(adminEmail, adminEmail, hashAdmin, "admin");

  // Keep admin credentials updated if environment variables are provided
  db.prepare(`
    UPDATE users SET email = ?, password_hash = ? WHERE LOWER(role) = 'admin'
  `).run(adminEmail, hashAdmin);

  // 2. Seed Students
  const insertStudent = db.prepare(`
    INSERT INTO students (student_id, full_name, course, branch, year, roll_number, email, phone, parent_name, parent_phone, parent_email, address, status, face_enrolled, face_template_id, face_enrolled_date, overall_attendance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStudent.run(
    "STU-2026-001", "Govind Kushwaha", "B.Tech", "Computer Science & Engineering", "4th Year",
    "2100970100045", "student@attendx.com", "9876543210", "Suresh Kushwaha", "9876543211", "suresh.k@gmail.com",
    "B-42, Tech Enclave, New Delhi", "Active", 1, "FT-2026-9042", "2026-08-01", 87.5
  );
  insertStudent.run(
    "STU-2026-002", "Ananya Sharma", "B.Tech", "Computer Science & Engineering", "4th Year",
    "2100970100012", "ananya.sharma@attendx.com", "9876543212", "Mohan Sharma", "9876543213", "mohan.s@gmail.com",
    "Flat 302, Green Avenue, Noida", "Active", 1, "FT-2026-9043", "2026-08-01", 92.0
  );
  insertStudent.run(
    "STU-2026-003", "Rohan Patel", "B.Tech", "Computer Science & Engineering", "4th Year",
    "2100970100078", "rohan.patel@attendx.com", "9876543214", "Vikram Patel", "9876543215", "vikram.p@gmail.com",
    "C-11 Sector 62, Noida", "Active", 1, "FT-2026-9044", "2026-08-01", 74.2
  );
  insertStudent.run(
    "STU-2026-004", "Priya Verma", "B.Tech", "Information Technology", "3rd Year",
    "2200970130022", "priya.verma@attendx.com", "9876543216", "Rajeev Verma", "9876543217", "rajeev.v@gmail.com",
    "Pocket 4, Mayur Vihar, New Delhi", "Active", 1, "FT-2026-9045", "2026-08-05", 89.1
  );
  insertStudent.run(
    "STU-2026-005", "Aditya Pratap Singh", "B.Tech", "Electronics & Communication", "4th Year",
    "2100970310005", "aditya.singh@attendx.com", "9876543218", "Dharmendra Singh", "9876543219", "dsingh@gmail.com",
    "Sector 15, Vasundhara, Ghaziabad", "Active", 0, null, null, 62.0
  );

  // 3. Seed Biometric Face Embedding for STU-2026-001 (512-d normalized vector representation)
  const biometricEngine = require("../utils/biometricEngine");
  const seededEmbedding = biometricEngine.extractEmbeddingFromPayload("enrolled_face_snapshot", "STU-2026-001");
  db.prepare(`
    INSERT INTO face_embeddings (student_id, face_template_id, embedding_vector, quality_score, enrolled_by)
    VALUES (?, ?, ?, ?, ?)
  `).run("STU-2026-001", "FT-2026-9042", JSON.stringify(seededEmbedding), "99.4%", "ADM-2026-001");

  // 4. Seed Teachers
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (teacher_id, full_name, department, designation, email, phone, subjects_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTeacher.run(
    "TCH-2026-001", "Dr. Rajesh Sharma", "Computer Science & Engineering", "Professor & HOD",
    "teacher@attendx.com", "9876543220",
    JSON.stringify([
      { code: "CS401", name: "Data Structures & Algorithms", room: "LT-102" },
      { code: "CS402", name: "Machine Learning & AI", room: "Lab 304" },
      { code: "CS403", name: "Cloud Computing & DevOps", room: "LT-201" }
    ]), "Active"
  );
  insertTeacher.run(
    "TCH-2026-002", "Prof. Sunita Rao", "Information Technology", "Associate Professor",
    "sunita.rao@attendx.com", "9876543222",
    JSON.stringify([
      { code: "IT301", name: "Database Management Systems", room: "Lab 201" },
      { code: "IT302", name: "Cybersecurity & Cryptography", room: "LT-105" }
    ]), "Active"
  );

  // 5. Seed Admin
  db.prepare(`
    INSERT INTO admins (admin_id, full_name, title, authority, email, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "ADM-2026-001", "Prof. Amitabh Verma", "Chief Attendance Administrator",
    "AttendX Institutional Controller", "admin@attendx.com", "9876543200", "Active"
  );

  // 6. Seed Geofence
  db.prepare(`
    INSERT INTO geofence_settings (id, campus_name, latitude, longitude, radius_meters, strict_mode)
    VALUES (1, 'AttendX Main Institute of Technology', 28.5355, 77.3910, 600, 1)
  `).run();

  // 7. Seed Active Session
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 25 * 60 * 1000);
  db.prepare(`
    INSERT INTO attendance_sessions (session_id, session_code, subject_code, subject_name, teacher_id, teacher_name, room, start_time, expires_at, status, total_enrolled, marked_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "SES-2026-402", "AX-8492", "CS402", "Machine Learning & AI",
    "TCH-2026-001", "Dr. Rajesh Sharma", "Lab 304",
    now.toISOString(), expiresAt.toISOString(), "Active", 45, 38
  );

  // 8. Seed Attendance Records
  const insertRecord = db.prepare(`
    INSERT INTO attendance_records (id, student_id, student_name, date, time, subject, subject_code, method, status, geofence_verified, confidence, room)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRecord.run("ATT-1001", "STU-2026-001", "Govind Kushwaha", "2026-10-23", "09:05 AM", "Machine Learning & AI", "CS402", "Face AI", "Present", 1, "99.4%", "Lab 304");
  insertRecord.run("ATT-1002", "STU-2026-001", "Govind Kushwaha", "2026-10-22", "11:15 AM", "Data Structures & Algorithms", "CS401", "Face AI", "Present", 1, "98.9%", "LT-102");
  insertRecord.run("ATT-1003", "STU-2026-001", "Govind Kushwaha", "2026-10-21", "02:10 PM", "Cloud Computing & DevOps", "CS403", "QR Backup", "Present", 1, "QR Validated", "LT-201");
  insertRecord.run("ATT-1004", "STU-2026-001", "Govind Kushwaha", "2026-10-20", "09:22 AM", "Machine Learning & AI", "CS402", "Face AI", "Late", 1, "97.8%", "Lab 304");

  // 9. Seed Leave Requests
  db.prepare(`
    INSERT INTO leave_requests (id, student_id, student_name, from_date, to_date, reason, category, status, admin_remarks, submitted_on)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "LR-501", "STU-2026-001", "Govind Kushwaha", "2026-10-25", "2026-10-26",
    "Attending Smart India Hackathon Grand Finale", "Academic / Competition",
    "Approved", "Approved by HOD. Produce participation certificate on return.", "2026-10-18"
  );

  // 10. Seed Notifications
  db.prepare(`
    INSERT INTO notifications (id, recipient_role, recipient_id, title, message, timestamp, read, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "NOTIF-1", "student", "STU-2026-001", "Attendance Verified via Face AI",
    "Your attendance for CS402 was successfully logged into database.", "Today 09:06 AM", 0, "success"
  );

  // 11. Seed Pending Registration
  db.prepare(`
    INSERT INTO pending_registrations (id, role, target_id, full_name, department, phone, email, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "REG-2026-901", "teacher", "TCH-2026-004", "Dr. Meenakshi Sundaram",
    "Computer Science & Engineering", "9811223344", "meenakshi.s@attendx.com",
    "New faculty onboarding for Deep Learning Lab", "Pending"
  );

  console.log("Database successfully seeded with realistic AttendX data!");
}

function seedAcademicData() {
  const courseCount = db.prepare("SELECT COUNT(*) as count FROM courses").get().count;
  if (courseCount === 0) {
    console.log("Seeding institutional academic configuration (Courses, Branches, Years, Subjects, Classes)...");

    // 1. Seed Courses
    const insertCourse = db.prepare(`
      INSERT OR IGNORE INTO courses (id, code, name, duration_years)
      VALUES (?, ?, ?, ?)
    `);
    insertCourse.run("CRS-BTECH", "B.Tech", "Bachelor of Technology", 4);
    insertCourse.run("CRS-BCA", "BCA", "Bachelor of Computer Applications", 3);
    insertCourse.run("CRS-MCA", "MCA", "Master of Computer Applications", 2);
    insertCourse.run("CRS-BSC", "B.Sc", "Bachelor of Science", 3);
    insertCourse.run("CRS-MTECH", "M.Tech", "Master of Technology", 2);
    insertCourse.run("CRS-MBA", "MBA", "Master of Business Administration", 2);
    insertCourse.run("CRS-BPHARMA", "B.Pharma", "Bachelor of Pharmacy", 4);

    // 2. Seed Branches per Course
    const insertBranch = db.prepare(`
      INSERT OR IGNORE INTO branches (id, course_code, code, name)
      VALUES (?, ?, ?, ?)
    `);
    // B.Tech Branches
    insertBranch.run("BR-BTECH-CSE", "B.Tech", "CSE", "Computer Science & Engineering");
    insertBranch.run("BR-BTECH-IT", "B.Tech", "IT", "Information Technology");
    insertBranch.run("BR-BTECH-ECE", "B.Tech", "ECE", "Electronics & Communication");
    insertBranch.run("BR-BTECH-ME", "B.Tech", "ME", "Mechanical Engineering");
    insertBranch.run("BR-BTECH-CE", "B.Tech", "CE", "Civil Engineering");

    // BCA Branches
    insertBranch.run("BR-BCA-CA", "BCA", "CA", "Computer Applications");
    insertBranch.run("BR-BCA-CIS", "BCA", "CIS", "Cloud & Information Security");
    insertBranch.run("BR-BCA-DA", "BCA", "DA", "Data Analytics");

    // MCA Branches
    insertBranch.run("BR-MCA-SE", "MCA", "SE", "Software Engineering");
    insertBranch.run("BR-MCA-DSAI", "MCA", "DSAI", "Data Science & Artificial Intelligence");

    // B.Sc Branches
    insertBranch.run("BR-BSC-CS", "B.Sc", "CS", "Computer Science");
    insertBranch.run("BR-BSC-ELEC", "B.Sc", "ELEC", "Electronics");
    insertBranch.run("BR-BSC-IT", "B.Sc", "IT", "Information Technology");

    // M.Tech Branches
    insertBranch.run("BR-MTECH-CSE", "M.Tech", "CSE", "Computer Science & Engineering");
    insertBranch.run("BR-MTECH-VLSI", "M.Tech", "VLSI", "VLSI Design");

    // MBA Branches
    insertBranch.run("BR-MBA-FBA", "MBA", "FBA", "Finance & Business Analytics");
    insertBranch.run("BR-MBA-MSM", "MBA", "MSM", "Marketing & Strategic Management");
    insertBranch.run("BR-MBA-HRM", "MBA", "HRM", "Human Resource Management");

    // 3. Seed Academic Years
    const insertYear = db.prepare(`
      INSERT OR IGNORE INTO academic_years (id, code, name, year_number)
      VALUES (?, ?, ?, ?)
    `);
    insertYear.run("AY-1", "1st Year", "First Year", 1);
    insertYear.run("AY-2", "2nd Year", "Second Year", 2);
    insertYear.run("AY-3", "3rd Year", "Third Year", 3);
    insertYear.run("AY-4", "4th Year", "Fourth Year", 4);

    // 4. Seed Distinct Subjects per exact Course + Branch + Year
    const insertSubject = db.prepare(`
      INSERT OR IGNORE INTO subjects (id, course_code, branch_code, year_code, subject_code, subject_name, room_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // B.Tech -> Information Technology -> 1st Year
    insertSubject.run("SUB-IT-101", "B.Tech", "Information Technology", "1st Year", "BAS101", "Engineering Mathematics I", "LT-101");
    insertSubject.run("SUB-IT-102", "B.Tech", "Information Technology", "1st Year", "CS101", "Programming in C", "Lab 102");
    insertSubject.run("SUB-IT-103", "B.Tech", "Information Technology", "1st Year", "BAS102", "Engineering Physics", "LT-103");
    insertSubject.run("SUB-IT-104", "B.Tech", "Information Technology", "1st Year", "EC101", "Digital Electronics", "Lab 104");

    // B.Tech -> Information Technology -> 4th Year
    insertSubject.run("SUB-IT-401", "B.Tech", "Information Technology", "4th Year", "CS403", "Cloud Computing & DevOps", "LT-201");
    insertSubject.run("SUB-IT-402", "B.Tech", "Information Technology", "4th Year", "CS402", "Neural Networks & AI", "Lab 304");
    insertSubject.run("SUB-IT-403", "B.Tech", "Information Technology", "4th Year", "CS404", "Distributed Systems & Microservices", "LT-202");
    insertSubject.run("SUB-IT-404", "B.Tech", "Information Technology", "4th Year", "CS405", "Information & Cyber Security", "Lab 305");

    // B.Tech -> Computer Science & Engineering -> 1st Year
    insertSubject.run("SUB-CSE-101", "B.Tech", "Computer Science & Engineering", "1st Year", "BAS101", "Engineering Mathematics I", "LT-101");
    insertSubject.run("SUB-CSE-102", "B.Tech", "Computer Science & Engineering", "1st Year", "CS101", "Problem Solving & Python", "Lab 101");
    insertSubject.run("SUB-CSE-103", "B.Tech", "Computer Science & Engineering", "1st Year", "BAS103", "Engineering Chemistry", "LT-104");
    insertSubject.run("SUB-CSE-104", "B.Tech", "Computer Science & Engineering", "1st Year", "EE101", "Basic Electrical Engineering", "LT-105");

    // B.Tech -> Computer Science & Engineering -> 4th Year
    insertSubject.run("SUB-CSE-401", "B.Tech", "Computer Science & Engineering", "4th Year", "CS401", "Data Structures & Algorithms", "LT-102");
    insertSubject.run("SUB-CSE-402", "B.Tech", "Computer Science & Engineering", "4th Year", "CS402", "Machine Learning & AI", "Lab 304");
    insertSubject.run("SUB-CSE-403", "B.Tech", "Computer Science & Engineering", "4th Year", "CS403", "Cloud Computing & DevOps", "LT-201");
    insertSubject.run("SUB-CSE-404", "B.Tech", "Computer Science & Engineering", "4th Year", "CS407", "Compiler Design", "LT-301");
    insertSubject.run("SUB-CSE-405", "B.Tech", "Computer Science & Engineering", "4th Year", "CS408", "Cryptography & Network Security", "Lab 302");

    // BCA -> Computer Applications -> 1st Year
    insertSubject.run("SUB-BCA-101", "BCA", "Computer Applications", "1st Year", "BCA101", "Fundamentals of Information Technology", "LT-BCA1");
    insertSubject.run("SUB-BCA-102", "BCA", "Computer Applications", "1st Year", "BCA102", "Programming in C++", "Lab-BCA1");
    insertSubject.run("SUB-BCA-103", "BCA", "Computer Applications", "1st Year", "BCA103", "Mathematics for Computing", "LT-BCA2");
    insertSubject.run("SUB-BCA-104", "BCA", "Computer Applications", "1st Year", "BCA104", "Principles of Management", "LT-BCA3");

    // MBA -> Finance & Business Analytics -> 1st Year
    insertSubject.run("SUB-MBA-101", "MBA", "Finance & Business Analytics", "1st Year", "MBA101", "Financial Accounting & Reporting", "MBA-101");
    insertSubject.run("SUB-MBA-102", "MBA", "Finance & Business Analytics", "1st Year", "MBA102", "Managerial Economics", "MBA-102");
    insertSubject.run("SUB-MBA-103", "MBA", "Finance & Business Analytics", "1st Year", "MBA103", "Business Statistics & Analytics", "MBA-103");
    insertSubject.run("SUB-MBA-104", "MBA", "Finance & Business Analytics", "1st Year", "MBA104", "Organizational Behavior", "MBA-104");

    // 5. Seed Academic Classes
    const insertClass = db.prepare(`
      INSERT OR IGNORE INTO academic_classes (id, course_code, branch_code, year_code, section_name, class_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertClass.run("CLS-CS-4A", "B.Tech", "Computer Science & Engineering", "4th Year", "Sec A", "CS-4A");
    insertClass.run("CLS-CS-4B", "B.Tech", "Computer Science & Engineering", "4th Year", "Sec B", "CS-4B");
    insertClass.run("CLS-IT-1A", "B.Tech", "Information Technology", "1st Year", "Sec A", "IT-1A");
    insertClass.run("CLS-IT-4A", "B.Tech", "Information Technology", "4th Year", "Sec A", "IT-4A");
    insertClass.run("CLS-BCA-1A", "BCA", "Computer Applications", "1st Year", "Sec A", "BCA-1A");
    insertClass.run("CLS-MBA-1A", "MBA", "Finance & Business Analytics", "1st Year", "Sec A", "MBA-1A");

    // 6. Seed Teacher Assignments
    const insertTeacherAssign = db.prepare(`
      INSERT OR IGNORE INTO teacher_assignments (id, teacher_id, subject_code, subject_name, class_code, course_code, branch_code, year_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTeacherAssign.run("TA-1", "TCH-2026-001", "CS401", "Data Structures & Algorithms", "CS-4A", "B.Tech", "Computer Science & Engineering", "4th Year");
    insertTeacherAssign.run("TA-2", "TCH-2026-001", "CS402", "Machine Learning & AI", "CS-4A", "B.Tech", "Computer Science & Engineering", "4th Year");
    insertTeacherAssign.run("TA-3", "TCH-2026-001", "CS403", "Cloud Computing & DevOps", "CS-4A", "B.Tech", "Computer Science & Engineering", "4th Year");
    insertTeacherAssign.run("TA-4", "TCH-2026-001", "CS403", "Cloud Computing & DevOps", "IT-4A", "B.Tech", "Information Technology", "4th Year");
    insertTeacherAssign.run("TA-5", "TCH-2026-002", "CS101", "Programming in C", "IT-1A", "B.Tech", "Information Technology", "1st Year");
    insertTeacherAssign.run("TA-6", "TCH-2026-002", "CS405", "Information & Cyber Security", "IT-4A", "B.Tech", "Information Technology", "4th Year");

    // 7. Seed Scheduled Lectures
    const insertScheduledLecture = db.prepare(`
      INSERT OR IGNORE INTO scheduled_lectures (
        id, lecture_name, subject_code, subject_name, course_code, branch_code, year_code,
        class_code, teacher_id, teacher_name, room, schedule_day, start_time, end_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `);
    insertScheduledLecture.run("LEC-101", "Lecture 14: Neural Networks", "CS402", "Machine Learning & AI", "B.Tech", "Computer Science & Engineering", "4th Year", "CS-4A", "TCH-2026-001", "Dr. Rajesh Sharma", "Lab 304", "Monday", "09:00 AM", "10:00 AM");
    insertScheduledLecture.run("LEC-102", "Lecture 11: Cloud Architecture", "CS403", "Cloud Computing & DevOps", "B.Tech", "Computer Science & Engineering", "4th Year", "CS-4A", "TCH-2026-001", "Dr. Rajesh Sharma", "LT-201", "Monday", "10:15 AM", "11:15 AM");
    insertScheduledLecture.run("LEC-103", "Lecture 9: Binary Trees & Graphs", "CS401", "Data Structures & Algorithms", "B.Tech", "Computer Science & Engineering", "4th Year", "CS-4A", "TCH-2026-001", "Dr. Rajesh Sharma", "LT-102", "Tuesday", "11:30 AM", "12:30 PM");
    insertScheduledLecture.run("LEC-104", "Lecture 5: Pharmaceutical Dosage Forms", "BP103", "Pharmaceutics I", "B.Pharma", "Pharmaceutics", "1st Year", "PH-1A", "TCH-2026-001", "Dr. Rajesh Sharma", "Lab-Pharm3", "Wednesday", "02:00 PM", "03:00 PM");
    insertScheduledLecture.run("LEC-105", "Lecture 7: Python OOP Concepts", "BSC102", "Introduction to Computing with Python", "B.Sc", "Computer Science", "1st Year", "BSC-1A", "TCH-2026-001", "Dr. Rajesh Sharma", "Lab-BSC1", "Thursday", "09:00 AM", "10:00 AM");

    console.log("Institutional academic data successfully configured!");
  }

  // Ensure default teacher academic metadata is populated
  try {
    const t1 = db.prepare("SELECT * FROM teachers WHERE teacher_id = 'TCH-2026-001'").get();
    if (t1 && (!t1.assigned_courses_json || t1.assigned_courses_json === '[]')) {
      db.prepare(`
        UPDATE teachers
        SET assigned_courses_json = ?, assigned_branches_json = ?, assigned_years_json = ?, assigned_classes_json = ?
        WHERE teacher_id = 'TCH-2026-001'
      `).run(
        JSON.stringify(["B.Tech"]),
        JSON.stringify(["Computer Science & Engineering", "Information Technology"]),
        JSON.stringify(["4th Year"]),
        JSON.stringify(["CS-4A", "CS-4B", "IT-4A"])
      );
    }

    const t2 = db.prepare("SELECT * FROM teachers WHERE teacher_id = 'TCH-2026-002'").get();
    if (t2 && (!t2.assigned_courses_json || t2.assigned_courses_json === '[]')) {
      db.prepare(`
        UPDATE teachers
        SET assigned_courses_json = ?, assigned_branches_json = ?, assigned_years_json = ?, assigned_classes_json = ?
        WHERE teacher_id = 'TCH-2026-002'
      `).run(
        JSON.stringify(["B.Tech"]),
        JSON.stringify(["Information Technology"]),
        JSON.stringify(["1st Year", "4th Year"]),
        JSON.stringify(["IT-1A", "IT-4A"])
      );
    }

    // Ensure student STU-2026-001 has assigned subjects
    const s1 = db.prepare("SELECT * FROM students WHERE student_id = 'STU-2026-001'").get();
    if (s1 && (!s1.assigned_subjects_json || s1.assigned_subjects_json === '[]')) {
      const defaultSubjects = [
        { code: "CS401", name: "Data Structures & Algorithms", room: "LT-102", teacher: "Dr. Rajesh Sharma" },
        { code: "CS402", name: "Machine Learning & AI", room: "Lab 304", teacher: "Dr. Rajesh Sharma" },
        { code: "CS403", name: "Cloud Computing & DevOps", room: "LT-201", teacher: "Dr. Rajesh Sharma" },
        { code: "CS407", name: "Compiler Design", room: "LT-301", teacher: "Prof. Vikram Gupta" },
        { code: "CS408", name: "Cryptography & Network Security", room: "Lab 302", teacher: "Prof. Sunita Rao" }
      ];
      db.prepare("UPDATE students SET assigned_subjects_json = ? WHERE student_id = 'STU-2026-001'").run(JSON.stringify(defaultSubjects));
    }
  } catch (syncErr) {
    console.warn("Academic metadata update notice:", syncErr.message);
  }
}

initDatabase();

module.exports = db;
