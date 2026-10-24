/*
=========================================================
ATTENDX - TEACHER CONTROLLER
=========================================================
Faculty directory, Admin Teacher ID issuance,
and academic course, branch, subject, and class assignments.
=========================================================
*/

const db = require("../config/database");
const bcrypt = require("bcryptjs");

/**
 * Get all teachers with assigned subjects and academic scope
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
      let courses = [];
      let branches = [];
      let years = [];
      let classes = [];

      try { subjects = JSON.parse(t.subjects_json || "[]"); } catch (e) { subjects = []; }
      try { courses = JSON.parse(t.assigned_courses_json || "[]"); } catch (e) { courses = []; }
      try { branches = JSON.parse(t.assigned_branches_json || "[]"); } catch (e) { branches = []; }
      try { years = JSON.parse(t.assigned_years_json || "[]"); } catch (e) { years = []; }
      try { classes = JSON.parse(t.assigned_classes_json || "[]"); } catch (e) { classes = []; }

      // Also get explicit assignments from teacher_assignments table
      const assignments = db.prepare(`
        SELECT subject_code, subject_name, class_code, course_code, branch_code, year_code
        FROM teacher_assignments
        WHERE UPPER(teacher_id) = UPPER(?)
      `).all(t.teacher_id);

      return {
        ...t,
        assignedSubjects: subjects,
        assignedCourses: courses,
        assignedBranches: branches,
        assignedYears: years,
        assignedClasses: classes,
        assignments
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
 * Get single teacher by ID
 */
function getTeacherById(req, res) {
  try {
    const { teacherId } = req.params;
    const teacher = db.prepare("SELECT * FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(teacherId);

    if (!teacher) {
      return res.status(404).json({ success: false, error: "Teacher not found" });
    }

    let subjects = [];
    let courses = [];
    let branches = [];
    let years = [];
    let classes = [];

    try { subjects = JSON.parse(teacher.subjects_json || "[]"); } catch (e) { subjects = []; }
    try { courses = JSON.parse(teacher.assigned_courses_json || "[]"); } catch (e) { courses = []; }
    try { branches = JSON.parse(teacher.assigned_branches_json || "[]"); } catch (e) { branches = []; }
    try { years = JSON.parse(teacher.assigned_years_json || "[]"); } catch (e) { years = []; }
    try { classes = JSON.parse(teacher.assigned_classes_json || "[]"); } catch (e) { classes = []; }

    const assignments = db.prepare(`
      SELECT subject_code, subject_name, class_code, course_code, branch_code, year_code
      FROM teacher_assignments
      WHERE UPPER(teacher_id) = UPPER(?)
    `).all(teacher.teacher_id);

    return res.json({
      success: true,
      data: {
        ...teacher,
        assignedSubjects: subjects,
        assignedCourses: courses,
        assignedBranches: branches,
        assignedYears: years,
        assignedClasses: classes,
        assignments
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to retrieve teacher profile" });
  }
}

/**
 * Issue new Teacher ID (Admin only)
 */
function issueTeacherId(req, res) {
  try {
    const {
      teacherId,
      fullName,
      department,
      designation,
      email,
      phone,
      assignedCourses,
      assignedBranches,
      assignedYears,
      assignedSubjects,
      assignedClasses
    } = req.body;

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

    // Prepare subjects array
    let subjectsList = Array.isArray(assignedSubjects) ? assignedSubjects : [];
    if (subjectsList.length === 0) {
      // Default to department subjects or initial
      subjectsList = [
        { code: "CS101", name: "Introduction to Computing", room: "LT-101" }
      ];
    } else {
      // Normalize to { code, name, room }
      subjectsList = subjectsList.map((s) => {
        if (typeof s === "string") return { code: s, name: s, room: "LT-101" };
        return {
          code: s.code || s.subject_code || s,
          name: s.name || s.subject_name || s.code,
          room: s.room || s.room_default || "LT-101"
        };
      });
    }

    const coursesList = Array.isArray(assignedCourses) ? assignedCourses : ["B.Tech"];
    const branchesList = Array.isArray(assignedBranches) ? assignedBranches : [department];
    const yearsList = Array.isArray(assignedYears) ? assignedYears : ["1st Year", "4th Year"];
    const classesList = Array.isArray(assignedClasses) ? assignedClasses : ["CS-4A"];

    const subjectsJson = JSON.stringify(subjectsList);
    const coursesJson = JSON.stringify(coursesList);
    const branchesJson = JSON.stringify(branchesList);
    const yearsJson = JSON.stringify(yearsList);
    const classesJson = JSON.stringify(classesList);

    db.prepare(`
      INSERT INTO teachers (
        teacher_id, full_name, department, designation, email, phone,
        subjects_json, assigned_courses_json, assigned_branches_json,
        assigned_years_json, assigned_classes_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(
      assignedId, fullName, department, designation || "Assistant Professor",
      email, phone || "", subjectsJson, coursesJson, branchesJson, yearsJson, classesJson
    );

    // Persist assignments to teacher_assignments table
    const insertAssign = db.prepare(`
      INSERT OR IGNORE INTO teacher_assignments (
        id, teacher_id, subject_code, subject_name, class_code, course_code, branch_code, year_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const sub of subjectsList) {
      for (const cls of classesList) {
        const assignId = `TA-${assignedId}-${sub.code}-${cls}-${Date.now().toString().slice(-4)}`;
        insertAssign.run(
          assignId,
          assignedId,
          sub.code,
          sub.name,
          cls,
          coursesList[0] || "",
          branchesList[0] || department,
          yearsList[0] || ""
        );
      }
    }

    // Create login account in users table
    const defaultPassword = req.body.password || "Teacher@123";
    const hash = bcrypt.hashSync(defaultPassword, 10);
    db.prepare(`
      INSERT INTO users (identifier, email, password_hash, role)
      VALUES (?, ?, ?, 'teacher')
      ON CONFLICT(identifier) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        role = 'teacher'
    `).run(assignedId, email, hash);

    return res.status(201).json({
      success: true,
      message: `Teacher ID "${assignedId}" officially authorized and issued for ${fullName}.`,
      teacherId: assignedId,
      teacher: {
        teacher_id: assignedId,
        teacherId: assignedId,
        full_name: fullName,
        fullName,
        department,
        designation: designation || "Assistant Professor",
        email,
        phone: phone || "",
        assignedCourses: coursesList,
        assignedBranches: branchesList,
        assignedYears: yearsList,
        assignedSubjects: subjectsList,
        assignedClasses: classesList,
        status: "Active"
      }
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
  getTeacherById,
  issueTeacherId,
  toggleTeacherStatus
};
