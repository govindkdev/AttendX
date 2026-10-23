/*
=========================================================
ATTENDX - TEACHER CONTROLLER
=========================================================
Faculty directory, Admin Teacher ID issuance,
and subject assignment management.
=========================================================
*/

const db = require("../config/database");

/**
 * Get all teachers with assigned subjects
 */
function getTeachers(req, res) {
  try {
    const { department, search, status } = req.query;

    let query = "SELECT * FROM teachers WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (LOWER(teacher_id) LIKE LOWER(?) OR LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (department && department !== "All Departments") {
      query += " AND department = ?";
      params.push(department);
    }

    if (status && status !== "All") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY teacher_id ASC";

    const rawTeachers = db.prepare(query).all(...params);

    const teachers = rawTeachers.map((t) => {
      let subjects = [];
      try {
        subjects = JSON.parse(t.subjects_json || "[]");
      } catch (e) {
        subjects = [];
      }
      return {
        ...t,
        assignedSubjects: subjects
      };
    });

    return res.json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    console.error("getTeachers error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve teachers" });
  }
}

/**
 * Issue new Teacher ID (Admin only)
 */
function issueTeacherId(req, res) {
  try {
    const { teacherId, fullName, department, designation, email, phone, subjects } = req.body;

    if (!fullName || !department || !email) {
      return res.status(400).json({ success: false, error: "Teacher Name, Department, and Email are required." });
    }

    let assignedId = teacherId;
    if (!assignedId) {
      const highest = db.prepare("SELECT teacher_id FROM teachers ORDER BY teacher_id DESC LIMIT 1").get();
      if (highest && highest.teacher_id.startsWith("TCH-2026-")) {
        const num = parseInt(highest.teacher_id.split("-")[2], 10) + 1;
        assignedId = `TCH-2026-${String(num).padStart(3, "0")}`;
      } else {
        assignedId = `TCH-2026-${Date.now().toString().slice(-3)}`;
      }
    }

    const existing = db.prepare("SELECT * FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(assignedId);
    if (existing) {
      return res.status(400).json({ success: false, error: `Teacher ID "${assignedId}" already exists.` });
    }

    const subjectsJson = JSON.stringify(subjects || [
      { code: "CS101", name: "Introduction to Computing", room: "LT-101" }
    ]);

    db.prepare(`
      INSERT INTO teachers (teacher_id, full_name, department, designation, email, phone, subjects_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(
      assignedId, fullName, department, designation || "Assistant Professor",
      email, phone || "", subjectsJson
    );

    return res.status(201).json({
      success: true,
      message: `Teacher ID "${assignedId}" officially authorized and issued.`,
      teacherId: assignedId
    });
  } catch (error) {
    console.error("issueTeacherId error:", error);
    return res.status(500).json({ success: false, error: "Failed to issue Teacher ID" });
  }
}

/**
 * Toggle teacher status (Active / Suspended)
 */
function toggleTeacherStatus(req, res) {
  try {
    const { teacherId } = req.params;
    const teacher = db.prepare("SELECT status FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(teacherId);

    if (!teacher) {
      return res.status(404).json({ success: false, error: "Teacher not found" });
    }

    const newStatus = teacher.status === "Active" ? "Suspended" : "Active";
    db.prepare("UPDATE teachers SET status = ? WHERE UPPER(teacher_id) = UPPER(?)").run(newStatus, teacherId);

    return res.json({
      success: true,
      message: `Teacher status updated to "${newStatus}".`,
      status: newStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update teacher status" });
  }
}

module.exports = {
  getTeachers,
  issueTeacherId,
  toggleTeacherStatus
};
