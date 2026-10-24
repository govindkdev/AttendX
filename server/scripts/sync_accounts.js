/*
=========================================================
ATTENDX - ACCOUNT SYNCHRONIZATION & MIGRATION SCRIPT
=========================================================
Safely synchronizes existing student, teacher, and admin
accounts in SQLite attendx.db without deleting attendance
records or facial biometric templates.
=========================================================
*/

const db = require("../config/database");
const bcrypt = require("bcryptjs");

console.log("---------------------------------------------------------");
console.log("Starting AttendX Account Synchronization...");
console.log("---------------------------------------------------------");

const defaultStudentHash = bcrypt.hashSync("Student@123", 10);
const defaultTeacherHash = bcrypt.hashSync("Teacher@123", 10);
const defaultAdminHash = bcrypt.hashSync("Admin@123", 10);

// 1. Audit current students
const students = db.prepare("SELECT * FROM students").all();
console.log(`Found ${students.length} student records in database.`);

// 2. Clean up obsolete registration placeholder "KUSHWAHA"
// Note: Only delete the placeholder user record if it's not a real student ID
const duplicateUser = db.prepare("SELECT * FROM users WHERE identifier = 'KUSHWAHA'").get();
if (duplicateUser) {
  console.log("Removing obsolete registration placeholder user row: KUSHWAHA");
  db.prepare("DELETE FROM users WHERE identifier = 'KUSHWAHA'").run();
}
const duplicateStudent = db.prepare("SELECT * FROM students WHERE student_id = 'KUSHWAHA'").get();
if (duplicateStudent) {
  console.log("Removing obsolete registration placeholder student row: KUSHWAHA");
  db.prepare("DELETE FROM students WHERE student_id = 'KUSHWAHA'").run();
}

// 3. Synchronize each student into users table
const upsertUser = db.prepare(`
  INSERT INTO users (identifier, email, password_hash, role)
  VALUES (?, ?, ?, 'student')
  ON CONFLICT(identifier) DO UPDATE SET
    email = excluded.email,
    password_hash = excluded.password_hash,
    role = 'student'
`);

students.forEach((s) => {
  if (s.student_id === "KUSHWAHA") return;
  console.log(`Synchronizing credentials for student: ${s.student_id} (${s.full_name}, ${s.email})`);
  upsertUser.run(s.student_id, s.email, defaultStudentHash);
});

// Also ensure email alias user row for student@attendx.com exists
db.prepare(`
  INSERT INTO users (identifier, email, password_hash, role)
  VALUES ('student@attendx.com', 'student@attendx.com', ?, 'student')
  ON CONFLICT(identifier) DO UPDATE SET
    email = excluded.email,
    password_hash = excluded.password_hash
`).run(defaultStudentHash);

// 4. Ensure Teacher and Admin users exist and are synchronized
db.prepare(`
  INSERT INTO users (identifier, email, password_hash, role)
  VALUES ('TCH-2026-001', 'teacher@attendx.com', ?, 'teacher')
  ON CONFLICT(identifier) DO UPDATE SET
    email = excluded.email,
    password_hash = excluded.password_hash
`).run(defaultTeacherHash);

db.prepare(`
  INSERT INTO users (identifier, email, password_hash, role)
  VALUES ('teacher@attendx.com', 'teacher@attendx.com', ?, 'teacher')
  ON CONFLICT(identifier) DO UPDATE SET
    email = excluded.email,
    password_hash = excluded.password_hash
`).run(defaultTeacherHash);

db.prepare(`
  INSERT INTO users (identifier, email, password_hash, role)
  VALUES ('ADM-2026-001', 'admin@attendx.com', ?, 'admin')
  ON CONFLICT(identifier) DO UPDATE SET
    email = excluded.email,
    password_hash = excluded.password_hash
`).run(defaultAdminHash);

db.prepare(`
  INSERT INTO users (identifier, email, password_hash, role)
  VALUES ('admin@attendx.com', 'admin@attendx.com', ?, 'admin')
  ON CONFLICT(identifier) DO UPDATE SET
    email = excluded.email,
    password_hash = excluded.password_hash
`).run(defaultAdminHash);

console.log("---------------------------------------------------------");
console.log("Account synchronization completed successfully.");
console.log("---------------------------------------------------------");

// Print summary of users table
const allUsers = db.prepare("SELECT id, identifier, email, role FROM users ORDER BY role, id").all();
console.table(allUsers);
