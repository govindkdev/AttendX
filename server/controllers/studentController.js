/*
=========================================================
ATTENDX - STUDENT CONTROLLER & BIOMETRIC ENROLLMENT ENGINE
=========================================================
Admin identity issuance, student roster management,
and Face AI Biometric Template enrollment & database storage.
=========================================================
*/

const db = require("../config/database");
const biometricEngine = require("../utils/biometricEngine");

/**
 * Get all students with optional search, branch, and face enrollment filters
 */
function getStudents(req, res) {
  try {
    const { search, branch, faceEnrolled, status } = req.query;

    let query = "SELECT * FROM students WHERE 1=1";
    const params = [];

    if (search) {
      query += ` AND (LOWER(student_id) LIKE LOWER(?) OR LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (branch && branch !== "All Branches") {
      query += " AND branch = ?";
      params.push(branch);
    }

    if (faceEnrolled !== undefined && faceEnrolled !== "") {
      query += " AND face_enrolled = ?";
      params.push(faceEnrolled === "true" || faceEnrolled === "1" ? 1 : 0);
    }

    if (status && status !== "All") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY student_id ASC";

    const students = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error("getStudents error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve student roster" });
  }
}

/**
 * Get single student by ID
 */
function getStudentById(req, res) {
  try {
    const { studentId } = req.params;
    const student = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    // Check if biometric face embedding exists
    const faceRecord = db.prepare("SELECT face_template_id, quality_score, enrolled_at FROM face_embeddings WHERE UPPER(student_id) = UPPER(?)").get(studentId);

    return res.json({
      success: true,
      data: {
        ...student,
        biometricTemplate: faceRecord || null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to retrieve student details" });
  }
}

/**
 * Issue new Student ID (Admin only)
 */
function issueStudentId(req, res) {
  try {
    const {
      studentId,
      fullName,
      course,
      branch,
      year,
      rollNumber,
      email,
      phone,
      parentName,
      parentPhone,
      address
    } = req.body;

    if (!fullName || !course || !branch || !year || !email) {
      return res.status(400).json({ success: false, error: "Please fill in all required fields." });
    }

    // Generate Student ID if not provided (e.g. STU-2026-006)
    let assignedId = studentId;
    if (!assignedId) {
      const highest = db.prepare("SELECT student_id FROM students ORDER BY student_id DESC LIMIT 1").get();
      if (highest && highest.student_id.startsWith("STU-2026-")) {
        const num = parseInt(highest.student_id.split("-")[2], 10) + 1;
        assignedId = `STU-2026-${String(num).padStart(3, "0")}`;
      } else {
        assignedId = `STU-2026-${Date.now().toString().slice(-3)}`;
      }
    }

    // Check if ID already exists
    const existing = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(assignedId);
    if (existing) {
      return res.status(400).json({ success: false, error: `Student ID "${assignedId}" already exists.` });
    }

    const roll = rollNumber || `220097${Date.now().toString().slice(-7)}`;

    db.prepare(`
      INSERT INTO students (
        student_id, full_name, course, branch, year, roll_number,
        email, phone, parent_name, parent_phone, address,
        status, face_enrolled, overall_attendance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, 85.0)
    `).run(
      assignedId, fullName, course, branch, year, roll,
      email, phone || "", parentName || "", parentPhone || "", address || ""
    );

    return res.status(201).json({
      success: true,
      message: `Student ID "${assignedId}" officially authorized and issued.`,
      studentId: assignedId
    });
  } catch (error) {
    console.error("issueStudentId error:", error);
    return res.status(500).json({ success: false, error: "Failed to issue new Student ID" });
  }
}

/**
 * Enroll student biometric face into database (Admin Face Enrollment Console)
 * Computes 512-d mathematical vector embedding and stores in face_embeddings table
 */
function enrollBiometricFace(req, res) {
  try {
    const { studentId, facePhotoBase64, qualityScore } = req.body;

    if (!studentId || !facePhotoBase64) {
      return res.status(400).json({
        success: false,
        error: "Student ID and facial image data are required for biometric enrollment."
      });
    }

    const student = db.prepare("SELECT * FROM students WHERE UPPER(student_id) = UPPER(?)").get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: `Student ID "${studentId}" not found in database.` });
    }

    // 1. Extract 512-dimensional normalized facial embedding vector
    const embeddingVector = biometricEngine.extractEmbeddingFromPayload(facePhotoBase64, studentId);
    const templateId = `FT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const enrolledBy = req.user ? req.user.identifier : "ADM-2026-001";
    const quality = qualityScore || "99.4%";
    const today = new Date().toISOString().split("T")[0];

    // 2. Insert or replace face embedding in face_embeddings table
    db.prepare(`
      INSERT OR REPLACE INTO face_embeddings (student_id, face_template_id, embedding_vector, photo_url, quality_score, enrolled_by, enrolled_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      studentId,
      templateId,
      JSON.stringify(embeddingVector),
      facePhotoBase64.slice(0, 10000), // Store preview
      quality,
      enrolledBy
    );

    // 3. Update student record face_enrolled = 1
    db.prepare(`
      UPDATE students
      SET face_enrolled = 1, face_template_id = ?, face_enrolled_date = ?
      WHERE UPPER(student_id) = UPPER(?)
    `).run(templateId, today, studentId);

    // 4. Create an audit notification for the student
    const notifId = `NOTIF-${Date.now().toString().slice(-5)}`;
    db.prepare(`
      INSERT INTO notifications (id, recipient_role, recipient_id, title, message, timestamp, read, type)
      VALUES (?, 'student', ?, 'Biometric Face Enrolled Successfully', 'Your 512-d facial biometric template is now activated in the AttendX database. You may now mark attendance via Face AI.', 'Just now', 0, 'success')
    `).run(notifId, studentId);

    return res.json({
      success: true,
      message: `Biometric face template enrolled successfully for ${student.full_name} (${studentId}).`,
      data: {
        studentId,
        faceTemplateId: templateId,
        faceEnrolled: 1,
        qualityScore: quality,
        enrolledDate: today,
        vectorDimensions: 512
      }
    });
  } catch (error) {
    console.error("enrollBiometricFace error:", error);
    return res.status(500).json({ success: false, error: "Failed to store facial biometric embedding" });
  }
}

/**
 * Remove student biometric face template from database
 */
function removeBiometricFace(req, res) {
  try {
    const { studentId } = req.params;

    db.prepare("DELETE FROM face_embeddings WHERE UPPER(student_id) = UPPER(?)").run(studentId);
    db.prepare(`
      UPDATE students
      SET face_enrolled = 0, face_template_id = NULL, face_enrolled_date = NULL
      WHERE UPPER(student_id) = UPPER(?)
    `).run(studentId);

    return res.json({
      success: true,
      message: `Biometric template removed for ${studentId}. Face AI attendance is now disabled until re-enrolled.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to remove biometric template" });
  }
}

/**
 * Toggle student status (Active / Suspended)
 */
function toggleStudentStatus(req, res) {
  try {
    const { studentId } = req.params;
    const student = db.prepare("SELECT status FROM students WHERE UPPER(student_id) = UPPER(?)").get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    const newStatus = student.status === "Active" ? "Suspended" : "Active";
    db.prepare("UPDATE students SET status = ? WHERE UPPER(student_id) = UPPER(?)").run(newStatus, studentId);

    return res.json({
      success: true,
      message: `Student account status updated to "${newStatus}".`,
      status: newStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update student status" });
  }
}

module.exports = {
  getStudents,
  getStudentById,
  issueStudentId,
  enrollBiometricFace,
  removeBiometricFace,
  toggleStudentStatus
};
