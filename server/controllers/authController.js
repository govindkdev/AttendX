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
    const targetRole = (role || "").toLowerCase();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        error: "Please enter your ID/Email and password."
      });
    }

    // Find in users table by identifier OR email
    const user = db.prepare(`
      SELECT * FROM users
      WHERE (LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?))
      AND LOWER(role) = LOWER(?)
    `).get(loginId, loginId, targetRole);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: `Invalid credentials or role mismatch for '${targetRole}'.`
      });
    }

    // Verify bcrypt password hash
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Please verify your credentials."
      });
    }

    // Retrieve corresponding detailed profile
    let profile = null;
    if (targetRole === "student") {
      profile = db.prepare(`SELECT * FROM students WHERE LOWER(student_id) = LOWER(?) OR LOWER(email) = LOWER(?)`)
        .get(user.identifier, user.email);
    } else if (targetRole === "teacher") {
      profile = db.prepare(`SELECT * FROM teachers WHERE LOWER(teacher_id) = LOWER(?) OR LOWER(email) = LOWER(?)`)
        .get(user.identifier, user.email);
      if (profile && profile.subjects_json) {
        try {
          profile.assignedSubjects = JSON.parse(profile.subjects_json);
        } catch (e) {
          profile.assignedSubjects = [];
        }
      }
    } else if (targetRole === "admin") {
      profile = db.prepare(`SELECT * FROM admins WHERE LOWER(admin_id) = LOWER(?) OR LOWER(email) = LOWER(?)`)
        .get(user.identifier, user.email);
    }

    // Check account status
    if (profile && profile.status === "Suspended") {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated by the Institute Administrator."
      });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      {
        id: user.id,
        identifier: user.identifier,
        email: user.email,
        role: user.role,
        name: profile ? profile.full_name : user.identifier
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user.id,
        identifier: user.identifier,
        email: user.email,
        role: user.role,
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

      // Business rule: Student ID must be issued or pre-authorized by Institute Admin
      const existingStudent = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(studentId);

      if (!existingStudent) {
        return res.status(400).json({
          success: false,
          error: `Student ID "${studentId}" is not authorized in institutional records. Official IDs must be issued by the Institute Admin first.`
        });
      }

      // Check if user account already exists
      const existingUser = db.prepare("SELECT * FROM users WHERE LOWER(identifier) = LOWER(?) OR LOWER(email) = LOWER(?)").get(studentId, email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "An account has already been registered with this Student ID or email."
        });
      }

      const passwordHash = bcrypt.hashSync(password, 10);

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
        // Enqueue into pending registration requests for Admin approval
        const regId = `REG-${Date.now().toString().slice(-4)}`;
        db.prepare(`
          INSERT INTO pending_registrations (id, role, target_id, full_name, department, phone, email, notes, status)
          VALUES (?, 'teacher', ?, ?, ?, ?, ?, 'Submitted via teacher registration portal', 'Pending')
        `).run(regId, teacherId, fullName, department || "General Engineering", phone, email || `${teacherId.toLowerCase()}@attendx.com`);

        return res.status(202).json({
          success: true,
          requiresApproval: true,
          message: `Teacher ID "${teacherId}" submitted for Institutional Admin verification and approval. You will be notified once activated.`
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
