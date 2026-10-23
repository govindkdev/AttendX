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
    if (!recordCols.includes("corrected_by")) db.exec("ALTER TABLE attendance_records ADD COLUMN corrected_by TEXT");
    if (!recordCols.includes("correction_reason")) db.exec("ALTER TABLE attendance_records ADD COLUMN correction_reason TEXT");
    if (!recordCols.includes("corrected_at")) db.exec("ALTER TABLE attendance_records ADD COLUMN corrected_at DATETIME");
  } catch (err) {
    console.warn("Schema migration notice:", err.message);
  }

  seedInitialData();
}

function seedInitialData() {
  // Check if students already exist
  const existingCount = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
  if (existingCount > 0) return;

  console.log("Seeding initial database records...");

  const hashStudent = bcrypt.hashSync("Student@123", 10);
  const hashTeacher = bcrypt.hashSync("Teacher@123", 10);
  const hashAdmin = bcrypt.hashSync("Admin@123", 10);

  // 1. Seed Users for Auth
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (identifier, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  insertUser.run("STU-2026-001", "student@attendx.com", hashStudent, "student");
  insertUser.run("student@attendx.com", "student@attendx.com", hashStudent, "student");
  insertUser.run("TCH-2026-001", "teacher@attendx.com", hashTeacher, "teacher");
  insertUser.run("teacher@attendx.com", "teacher@attendx.com", hashTeacher, "teacher");
  insertUser.run("ADM-2026-001", "admin@attendx.com", hashAdmin, "admin");
  insertUser.run("admin@attendx.com", "admin@attendx.com", hashAdmin, "admin");

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

initDatabase();

module.exports = db;
