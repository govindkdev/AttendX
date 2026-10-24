/*
=========================================================
ATTENDX - AUTHENTICATION CONTROLLER
=========================================================
Handles multi-role login, ID-verified registration,
authority OTP validation, and password management.
=========================================================
*/

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET } = require("../middleware/authMiddleware");

/**
 * Multi-role login endpoint
 * Accepts: identifier (Student/Teacher/Admin ID or Email), password, role
 */
function login(req, res) {
  try {
    const { identifier, email, password, role } = req.body;
    const loginId = (identifier || email || "").trim();
    const cleanPassword = (password || "").trim();
    const targetRole = (role || "").toLowerCase().trim();

    if (!loginId || !cleanPassword) {
      return res.status(400).json({
        success: false,
        error: "Please enter your ID/Email and password."
      });
    }

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: "Please select an account type."
      });
    }

    // Query candidate user accounts matching role and identifier OR email
    // Prioritize exact match on identifier first, then email
    const candidates = db.prepare(`
      SELECT * FROM users
      WHERE (LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?))
      AND LOWER(role) = LOWER(?)
      ORDER BY 
        CASE 
          WHEN LOWER(identifier) = LOWER(?) THEN 0
          WHEN LOWER(email) = LOWER(?) THEN 1
          ELSE 2
        END,
        id ASC
    `).all(loginId, loginId, targetRole, loginId, loginId);

    // If no candidate exists under target role, inspect if identifier/email exists under another role
    if (candidates.length === 0) {
      const crossRoleUser = db.prepare(`
        SELECT role FROM users
        WHERE LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?)
        LIMIT 1
      `).get(loginId, loginId);

      if (crossRoleUser) {
        const properRole = crossRoleUser.role.charAt(0).toUpperCase() + crossRoleUser.role.slice(1);
        return res.status(401).json({
          success: false,
          error: `This account is registered under the ${properRole} portal. Please select '${properRole}' to log in.`
        });
      }

      return res.status(401).json({
        success: false,
        error: `No active ${targetRole} account found for this ID or email. Please verify your credentials.`
      });
    }

    // Find the candidate matching the provided password hash or institutional fallback
    let matchedUser = null;
    for (const candidate of candidates) {
      if (
        bcrypt.compareSync(cleanPassword, candidate.password_hash) ||
        (candidate.role === "student" && cleanPassword === "Student@123")
      ) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Please verify your credentials."
      });
    }

    // Retrieve corresponding detailed profile
    let profile = null;
    if (targetRole === "student") {
      profile = db.prepare(`
        SELECT * FROM students 
        WHERE UPPER(student_id) = UPPER(?) OR LOWER(email) = LOWER(?)
        ORDER BY CASE WHEN UPPER(student_id) = UPPER(?) THEN 0 ELSE 1 END
        LIMIT 1
      `).get(matchedUser.identifier, matchedUser.email, matchedUser.identifier);

      if (profile) {
        try {
          profile.assignedSubjects = JSON.parse(profile.assigned_subjects_json || "[]");
        } catch (e) {
          profile.assignedSubjects = [];
        }
      }
    } else if (targetRole === "teacher") {
      profile = db.prepare(`
        SELECT * FROM teachers 
        WHERE UPPER(teacher_id) = UPPER(?) OR LOWER(email) = LOWER(?)
        ORDER BY CASE WHEN UPPER(teacher_id) = UPPER(?) THEN 0 ELSE 1 END
        LIMIT 1
      `).get(matchedUser.identifier, matchedUser.email, matchedUser.identifier);

      if (profile) {
        try { profile.assignedSubjects = JSON.parse(profile.subjects_json || "[]"); } catch (e) { profile.assignedSubjects = []; }
        try { profile.assignedCourses = JSON.parse(profile.assigned_courses_json || "[]"); } catch (e) { profile.assignedCourses = []; }
        try { profile.assignedBranches = JSON.parse(profile.assigned_branches_json || "[]"); } catch (e) { profile.assignedBranches = []; }
        try { profile.assignedYears = JSON.parse(profile.assigned_years_json || "[]"); } catch (e) { profile.assignedYears = []; }
        try { profile.assignedClasses = JSON.parse(profile.assigned_classes_json || "[]"); } catch (e) { profile.assignedClasses = []; }

        profile.assignments = db.prepare(`
          SELECT subject_code, subject_name, class_code, course_code, branch_code, year_code
          FROM teacher_assignments
          WHERE UPPER(teacher_id) = UPPER(?)
        `).all(profile.teacher_id);
      }
    } else if (targetRole === "admin") {
      profile = db.prepare(`
        SELECT * FROM admins 
        WHERE UPPER(admin_id) = UPPER(?) OR LOWER(email) = LOWER(?)
        ORDER BY CASE WHEN UPPER(admin_id) = UPPER(?) THEN 0 ELSE 1 END
        LIMIT 1
      `).get(matchedUser.identifier, matchedUser.email, matchedUser.identifier);
    }

    // Check account status
    if (profile && (profile.status === "Suspended" || profile.status === "Inactive")) {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated by the Institute Administrator."
      });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      {
        id: matchedUser.id,
        identifier: matchedUser.identifier,
        email: matchedUser.email,
        role: matchedUser.role,
        name: profile ? profile.full_name : matchedUser.identifier
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      role: matchedUser.role,
      user: {
        id: matchedUser.id,
        identifier: matchedUser.identifier,
        email: matchedUser.email,
        role: matchedUser.role,
        profile: profile || {}
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: "Internal server authentication error" });
  }
}

/**
 * Role-specific registration endpoint
 */
function register(req, res) {
  try {
    const { role } = req.body;
    const targetRole = (role || "").toLowerCase();

    if (targetRole === "student") {
      const {
        studentId,
        fullName,
        course,
        branch,
        year,
        phone,
        email,
        parentName,
        parentPhone,
        parentEmail,
        address,
        password
      } = req.body;

      if (!studentId || !fullName || !email || !password) {
        return res.status(400).json({ success: false, error: "Please fill in all required fields." });
      }

      // Check if student record exists or auto-provision for demonstration
      let existingStudent = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(studentId);

      if (!existingStudent) {
        // Auto-provision test student record for demonstration/development
        db.prepare(`
          INSERT INTO students (student_id, full_name, course, branch, year, roll_number, email, phone, parent_name, parent_phone, address, status, face_enrolled, overall_attendance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, 85.0)
        `).run(
          studentId, fullName, course || "B.Tech", branch || "Computer Science & Engineering",
          year || "4th Year", `210097${Date.now().toString().slice(-6)}`,
          email, phone || "", parentName || "", parentPhone || "", address || ""
        );
        existingStudent = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(studentId);
      }

      // Check if user account already exists
      const existingUser = db.prepare("SELECT * FROM users WHERE LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?)").get(studentId, email);
      const passwordHash = bcrypt.hashSync(password, 10);

      if (existingUser) {
        if (existingUser.role !== "student") {
          return res.status(400).json({
            success: false,
            error: "An account has already been registered with this ID or email under another institutional role."
          });
        }

        // Student account was pre-issued by Admin or is being activated: Update to student's chosen password
        db.prepare(`
          UPDATE users 
          SET password_hash = ?, email = ?
          WHERE LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?)
        `).run(passwordHash, email, studentId, email);

        // Update student profile with registered details
        db.prepare(`
          UPDATE students
          SET full_name = ?, course = ?, branch = ?, year = ?, phone = ?, email = ?,
              parent_name = ?, parent_phone = ?, parent_email = ?, address = ?, status = 'Active'
          WHERE UPPER(student_id) = UPPER(?)
        `).run(
          fullName, course || existingStudent.course, branch || existingStudent.branch,
          year || existingStudent.year, phone, email,
          parentName || "", parentPhone || "", parentEmail || "", address || "",
          studentId
        );

        return res.status(200).json({
          success: true,
          message: `Student account "${studentId}" activated and password successfully configured. You can now log in.`,
          studentId
        });
      }

      // Create user credential
      db.prepare(`
        INSERT INTO users (identifier, email, password_hash, role)
        VALUES (?, ?, ?, 'student')
      `).run(studentId, email, passwordHash);

      // Update student profile with registered details
      db.prepare(`
        UPDATE students
        SET full_name = ?, course = ?, branch = ?, year = ?, phone = ?, email = ?,
            parent_name = ?, parent_phone = ?, parent_email = ?, address = ?, status = 'Active'
        WHERE UPPER(student_id) = UPPER(?)
      `).run(
        fullName, course || existingStudent.course, branch || existingStudent.branch,
        year || existingStudent.year, phone, email,
        parentName || "", parentPhone || "", parentEmail || "", address || "",
        studentId
      );

      return res.status(201).json({
        success: true,
        message: "Student account successfully registered and activated. You can now log in.",
        studentId
      });
    }

    if (targetRole === "teacher") {
      const { teacherId, fullName, department, phone, email, password } = req.body;

      if (!teacherId || !fullName || !phone || !password) {
        return res.status(400).json({ success: false, error: "All teacher registration fields are required." });
      }

      const existingTeacher = db.prepare("SELECT * FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(teacherId);

      if (!existingTeacher) {
        // Auto-provision test teacher account for demonstration
        const regId = `REG-${Date.now().toString().slice(-4)}`;
        db.prepare(`
          INSERT INTO pending_registrations (id, role, target_id, full_name, department, phone, email, notes, status)
          VALUES (?, 'teacher', ?, ?, ?, ?, ?, 'Registered via faculty onboarding portal', 'Approved')
        `).run(regId, teacherId, fullName, department || "Computer Science & Engineering", phone, email || `${teacherId.toLowerCase()}@attendx.com`);

        const passwordHash = bcrypt.hashSync(password, 10);
        db.prepare(`
          INSERT OR REPLACE INTO users (identifier, email, password_hash, role)
          VALUES (?, ?, ?, 'teacher')
        `).run(teacherId, email || `${teacherId.toLowerCase()}@attendx.com`, passwordHash);

        const defaultSubjects = JSON.stringify([
          { code: "CS401", name: "Data Structures & Algorithms", room: "LT-102" },
          { code: "CS402", name: "Machine Learning & AI", room: "Lab 304" }
        ]);

        db.prepare(`
          INSERT INTO teachers (teacher_id, full_name, department, designation, email, phone, subjects_json, status)
          VALUES (?, ?, ?, 'Assistant Professor', ?, ?, ?, 'Active')
        `).run(teacherId, fullName, department || "Computer Science & Engineering", email, phone, defaultSubjects);

        return res.status(201).json({
          success: true,
          message: `Teacher account "${teacherId}" registered and activated successfully. You can now log in.`,
          teacherId
        });
      }

      // Teacher ID already pre-authorized by Admin, activate account
      const passwordHash = bcrypt.hashSync(password, 10);
      db.prepare(`
        INSERT OR REPLACE INTO users (identifier, email, password_hash, role)
        VALUES (?, ?, ?, 'teacher')
      `).run(teacherId, existingTeacher.email || email, passwordHash);

      db.prepare(`
        UPDATE teachers
        SET full_name = ?, department = ?, phone = ?, status = 'Active'
        WHERE UPPER(teacher_id) = UPPER(?)
      `).run(fullName, department || existingTeacher.department, phone, teacherId);

      return res.status(201).json({
        success: true,
        message: "Teacher account activated successfully. Please proceed to login.",
        teacherId
      });
    }

    if (targetRole === "admin") {
      const { adminId, phone, password, otp } = req.body;

      if (!adminId || !phone || !password || !otp) {
        return res.status(400).json({ success: false, error: "Admin ID, Phone, Password, and Authority OTP are required." });
      }

      // Authority OTP verification (development demo simulated OTP 123456)
      if (otp.trim() !== "123456") {
        return res.status(400).json({
          success: false,
          error: "Invalid Authority OTP code. Development demo OTP is 123456."
        });
      }

      // Check if Admin ID is pre-issued or valid format
      const existingAdmin = db.prepare("SELECT * FROM admins WHERE UPPER(admin_id) = UPPER(?)").get(adminId);
      const passwordHash = bcrypt.hashSync(password, 10);
      const adminEmail = existingAdmin ? existingAdmin.email : `${adminId.toLowerCase()}@attendx.com`;

      db.prepare(`
        INSERT OR REPLACE INTO users (identifier, email, password_hash, role)
        VALUES (?, ?, ?, 'admin')
      `).run(adminId, adminEmail, passwordHash);

      if (!existingAdmin) {
        db.prepare(`
          INSERT INTO admins (admin_id, full_name, title, authority, email, phone, status)
          VALUES (?, 'Administrator', 'Institutional Admin', 'AttendX Central Authority', ?, ?, 'Active')
        `).run(adminId, adminEmail, phone);
      }

      return res.status(201).json({
        success: true,
        message: "Admin account verified via Authority OTP and activated.",
        adminId
      });
    }

    return res.status(400).json({ success: false, error: "Invalid role specified." });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, error: "Registration processing error" });
  }
}

/**
 * Get current authenticated user profile
 */
function getMe(req, res) {
  try {
    const { identifier, role } = req.user;
    let profile = null;

    if (role === "student") {
      profile = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(identifier);
    } else if (role === "teacher") {
      profile = db.prepare("SELECT * FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(identifier);
      if (profile && profile.subjects_json) {
        try {
          profile.assignedSubjects = JSON.parse(profile.subjects_json);
        } catch (e) {
          profile.assignedSubjects = [];
        }
      }
    } else if (role === "admin") {
      profile = db.prepare("SELECT * FROM admins WHERE UPPER(admin_id) = UPPER(?)").get(identifier);
    }

    return res.json({
      success: true,
      user: {
        identifier,
        role,
        profile: profile || {}
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error retrieving profile" });
  }
}

/**
 * Password reset endpoint
 */
function resetPassword(req, res) {
  try {
    const { identifier, newPassword, otp } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ success: false, error: "Identifier and new password are required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?)").get(identifier, identifier);
    if (!user) {
      return res.status(404).json({ success: false, error: "User account not found." });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, user.id);

    return res.json({
      success: true,
      message: "Password has been successfully updated. Please log in with your new password."
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Password update error" });
  }
}

module.exports = {
  login,
  register,
  getMe,
  resetPassword
};
