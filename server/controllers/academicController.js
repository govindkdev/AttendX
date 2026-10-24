/*
=========================================================
ATTENDX - INSTITUTIONAL ACADEMIC CONTROLLER
=========================================================
Manages Courses, Branches, Academic Years, Subjects,
Academic Classes/Sections, and Faculty Assignments.
=========================================================
*/

const db = require("../config/database");

/**
 * 1. COURSES
 */
function getCourses(req, res) {
  try {
    const courses = db.prepare("SELECT * FROM courses ORDER BY code ASC").all();
    return res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error("getCourses error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch courses" });
  }
}

function createCourse(req, res) {
  try {
    const { code, name, durationYears } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: "Course Code and Name are required." });
    }

    const cleanCode = code.trim();
    const cleanName = name.trim();
    const duration = parseInt(durationYears, 10) || 4;

    const existing = db.prepare("SELECT * FROM courses WHERE UPPER(code) = UPPER(?)").get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, error: `Course "${cleanCode}" already exists.` });
    }

    const id = `CRS-${cleanCode.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO courses (id, code, name, duration_years)
      VALUES (?, ?, ?, ?)
    `).run(id, cleanCode, cleanName, duration);

    return res.status(201).json({
      success: true,
      message: `Course "${cleanCode}" (${cleanName}) created successfully.`,
      data: { id, code: cleanCode, name: cleanName, duration_years: duration }
    });
  } catch (error) {
    console.error("createCourse error:", error);
    return res.status(500).json({ success: false, error: "Failed to create course" });
  }
}

/**
 * 2. BRANCHES
 */
function getBranches(req, res) {
  try {
    const { courseCode } = req.query;
    let query = "SELECT * FROM branches WHERE 1=1";
    const params = [];

    if (courseCode) {
      query += " AND (UPPER(course_code) = UPPER(?) OR UPPER(course_code) LIKE UPPER(?))";
      params.push(courseCode.trim(), `%${courseCode.trim()}%`);
    }

    query += " ORDER BY name ASC";
    const branches = db.prepare(query).all(...params);

    return res.json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    console.error("getBranches error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch branches" });
  }
}

function createBranch(req, res) {
  try {
    const { courseCode, code, name } = req.body;
    if (!courseCode || !name) {
      return res.status(400).json({ success: false, error: "Course Code and Branch Name are required." });
    }

    const cleanCourse = courseCode.trim();
    const cleanName = name.trim();
    const cleanCode = (code || cleanName.split(" ").map(w => w[0]).join("")).toUpperCase();

    const existing = db.prepare(`
      SELECT * FROM branches
      WHERE UPPER(course_code) = UPPER(?) AND (UPPER(code) = UPPER(?) OR UPPER(name) = UPPER(?))
    `).get(cleanCourse, cleanCode, cleanName);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Branch "${cleanName}" already exists for course "${cleanCourse}".`
      });
    }

    const id = `BR-${cleanCourse.replace(/[^A-Za-z0-9]/g, "")}-${cleanCode}-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO branches (id, course_code, code, name)
      VALUES (?, ?, ?, ?)
    `).run(id, cleanCourse, cleanCode, cleanName);

    return res.status(201).json({
      success: true,
      message: `Branch "${cleanName}" added under "${cleanCourse}".`,
      data: { id, course_code: cleanCourse, code: cleanCode, name: cleanName }
    });
  } catch (error) {
    console.error("createBranch error:", error);
    return res.status(500).json({ success: false, error: "Failed to create branch" });
  }
}

/**
 * 3. ACADEMIC YEARS
 */
function getAcademicYears(req, res) {
  try {
    const years = db.prepare("SELECT * FROM academic_years ORDER BY year_number ASC").all();
    return res.json({ success: true, count: years.length, data: years });
  } catch (error) {
    console.error("getAcademicYears error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch academic years" });
  }
}

/**
 * 4. SUBJECTS (Strict Course + Branch + Year retrieval)
 */
function getSubjects(req, res) {
  try {
    const { course, branch, year } = req.query;

    let query = "SELECT * FROM subjects WHERE 1=1";
    const params = [];

    if (course) {
      query += " AND UPPER(course_code) = UPPER(?)";
      params.push(course.trim());
    }
    if (branch) {
      query += " AND (UPPER(branch_code) = UPPER(?) OR UPPER(branch_code) LIKE UPPER(?))";
      params.push(branch.trim(), `%${branch.trim()}%`);
    }
    if (year) {
      query += " AND UPPER(year_code) = UPPER(?)";
      params.push(year.trim());
    }

    query += " ORDER BY subject_code ASC";
    const subjects = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error("getSubjects error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch subjects" });
  }
}

function createSubject(req, res) {
  try {
    const { courseCode, branchCode, yearCode, subjectCode, subjectName, roomDefault } = req.body;

    if (!courseCode || !branchCode || !yearCode || !subjectCode || !subjectName) {
      return res.status(400).json({
        success: false,
        error: "Course, Branch, Academic Year, Subject Code, and Subject Name are required."
      });
    }

    const cleanCourse = courseCode.trim();
    const cleanBranch = branchCode.trim();
    const cleanYear = yearCode.trim();
    const cleanSubCode = subjectCode.trim().toUpperCase();
    const cleanSubName = subjectName.trim();
    const cleanRoom = (roomDefault || "LT-101").trim();

    const existing = db.prepare(`
      SELECT * FROM subjects
      WHERE UPPER(course_code) = UPPER(?) AND UPPER(branch_code) = UPPER(?) AND UPPER(year_code) = UPPER(?) AND UPPER(subject_code) = UPPER(?)
    `).get(cleanCourse, cleanBranch, cleanYear, cleanSubCode);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Subject "${cleanSubCode}" is already configured for ${cleanCourse} - ${cleanBranch} (${cleanYear}).`
      });
    }

    const id = `SUB-${cleanSubCode}-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO subjects (id, course_code, branch_code, year_code, subject_code, subject_name, room_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, cleanCourse, cleanBranch, cleanYear, cleanSubCode, cleanSubName, cleanRoom);

    return res.status(201).json({
      success: true,
      message: `Subject "${cleanSubCode}: ${cleanSubName}" added to curriculum.`,
      data: {
        id,
        course_code: cleanCourse,
        branch_code: cleanBranch,
        year_code: cleanYear,
        subject_code: cleanSubCode,
        subject_name: cleanSubName,
        room_default: cleanRoom
      }
    });
  } catch (error) {
    console.error("createSubject error:", error);
    return res.status(500).json({ success: false, error: "Failed to create subject" });
  }
}

function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    const info = db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: "Subject not found." });
    }
    return res.json({ success: true, message: "Subject removed successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete subject" });
  }
}

/**
 * 5. ACADEMIC CLASSES / SECTIONS
 */
function getAcademicClasses(req, res) {
  try {
    const { course, branch, year } = req.query;
    let query = "SELECT * FROM academic_classes WHERE 1=1";
    const params = [];

    if (course) {
      query += " AND UPPER(course_code) = UPPER(?)";
      params.push(course.trim());
    }
    if (branch) {
      query += " AND (UPPER(branch_code) = UPPER(?) OR UPPER(branch_code) LIKE UPPER(?))";
      params.push(branch.trim(), `%${branch.trim()}%`);
    }
    if (year) {
      query += " AND UPPER(year_code) = UPPER(?)";
      params.push(year.trim());
    }

    query += " ORDER BY class_code ASC";
    const classes = db.prepare(query).all(...params);

    return res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    console.error("getAcademicClasses error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch classes" });
  }
}

function createAcademicClass(req, res) {
  try {
    const { courseCode, branchCode, yearCode, sectionName, classCode } = req.body;
    if (!courseCode || !branchCode || !yearCode || !classCode) {
      return res.status(400).json({
        success: false,
        error: "Course, Branch, Academic Year, and Class Code are required."
      });
    }

    const cleanClassCode = classCode.trim().toUpperCase();
    const existing = db.prepare("SELECT * FROM academic_classes WHERE UPPER(class_code) = UPPER(?)").get(cleanClassCode);
    if (existing) {
      return res.status(400).json({ success: false, error: `Class code "${cleanClassCode}" already exists.` });
    }

    const id = `CLS-${cleanClassCode}-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO academic_classes (id, course_code, branch_code, year_code, section_name, class_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, courseCode.trim(), branchCode.trim(), yearCode.trim(), (sectionName || "Sec A").trim(), cleanClassCode);

    return res.status(201).json({
      success: true,
      message: `Class "${cleanClassCode}" registered successfully.`,
      data: { id, class_code: cleanClassCode }
    });
  } catch (error) {
    console.error("createAcademicClass error:", error);
    return res.status(500).json({ success: false, error: "Failed to create class" });
  }
}

/**
 * 6. TEACHER ASSIGNMENTS
 */
function getTeacherAssignments(req, res) {
  try {
    const { teacherId, subjectCode, classCode } = req.query;
    let query = "SELECT ta.*, t.full_name as teacher_name FROM teacher_assignments ta LEFT JOIN teachers t ON ta.teacher_id = t.teacher_id WHERE 1=1";
    const params = [];

    if (teacherId) {
      query += " AND UPPER(ta.teacher_id) = UPPER(?)";
      params.push(teacherId.trim());
    }
    if (subjectCode) {
      query += " AND UPPER(ta.subject_code) = UPPER(?)";
      params.push(subjectCode.trim());
    }
    if (classCode) {
      query += " AND UPPER(ta.class_code) = UPPER(?)";
      params.push(classCode.trim());
    }

    query += " ORDER BY ta.subject_code ASC";
    const assignments = db.prepare(query).all(...params);

    return res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    console.error("getTeacherAssignments error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch teacher assignments" });
  }
}

function createTeacherAssignment(req, res) {
  try {
    const { teacherId, subjectCode, subjectName, classCode, courseCode, branchCode, yearCode } = req.body;
    if (!teacherId || !subjectCode || !classCode) {
      return res.status(400).json({ success: false, error: "Teacher ID, Subject Code, and Class Code are required." });
    }

    const cleanTeacherId = teacherId.trim().toUpperCase();
    const cleanSubCode = subjectCode.trim().toUpperCase();
    const cleanClassCode = classCode.trim().toUpperCase();

    const existing = db.prepare(`
      SELECT * FROM teacher_assignments
      WHERE UPPER(teacher_id) = UPPER(?) AND UPPER(subject_code) = UPPER(?) AND UPPER(class_code) = UPPER(?)
    `).get(cleanTeacherId, cleanSubCode, cleanClassCode);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Teacher "${cleanTeacherId}" is already assigned to "${cleanSubCode}" for class "${cleanClassCode}".`
      });
    }

    const id = `TA-${Date.now()}`;
    db.prepare(`
      INSERT INTO teacher_assignments (id, teacher_id, subject_code, subject_name, class_code, course_code, branch_code, year_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      cleanTeacherId,
      cleanSubCode,
      (subjectName || cleanSubCode).trim(),
      cleanClassCode,
      courseCode || "",
      branchCode || "",
      yearCode || ""
    );

    return res.status(201).json({
      success: true,
      message: `Assigned subject ${cleanSubCode} to teacher ${cleanTeacherId} for ${cleanClassCode}.`,
      data: { id, teacher_id: cleanTeacherId, subject_code: cleanSubCode, class_code: cleanClassCode }
    });
  } catch (error) {
    console.error("createTeacherAssignment error:", error);
    return res.status(500).json({ success: false, error: "Failed to create assignment" });
  }
}

function deleteTeacherAssignment(req, res) {
  try {
    const { id } = req.params;
    const info = db.prepare("DELETE FROM teacher_assignments WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: "Assignment record not found." });
    }
    return res.json({ success: true, message: "Assignment removed successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete assignment" });
  }
}

/**
 * 7. SCHEDULED LECTURES & TIMETABLE TARGETS
 */
function getScheduledLectures(req, res) {
  try {
    const { courseCode, branchCode, yearCode, subjectCode, teacherId } = req.query;
    let query = "SELECT * FROM scheduled_lectures WHERE 1=1";
    const params = [];

    if (courseCode && courseCode !== "All") {
      query += " AND (UPPER(course_code) = UPPER(?) OR UPPER(course_code) LIKE UPPER(?))";
      params.push(courseCode.trim(), `%${courseCode.trim()}%`);
    }
    if (branchCode && branchCode !== "All") {
      query += " AND (UPPER(branch_code) = UPPER(?) OR UPPER(branch_code) LIKE UPPER(?))";
      params.push(branchCode.trim(), `%${branchCode.trim()}%`);
    }
    if (yearCode && yearCode !== "All") {
      query += " AND UPPER(year_code) = UPPER(?)";
      params.push(yearCode.trim());
    }
    if (subjectCode && subjectCode !== "All") {
      query += " AND UPPER(subject_code) = UPPER(?)";
      params.push(subjectCode.trim());
    }
    if (teacherId && teacherId !== "All") {
      query += " AND UPPER(teacher_id) = UPPER(?)";
      params.push(teacherId.trim());
    }

    query += " ORDER BY id DESC";
    const lectures = db.prepare(query).all(...params);

    return res.json({ success: true, count: lectures.length, data: lectures });
  } catch (error) {
    console.error("getScheduledLectures error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch scheduled lectures" });
  }
}

function createScheduledLecture(req, res) {
  try {
    const {
      lectureName,
      subjectCode,
      subjectName,
      courseCode,
      branchCode,
      yearCode,
      classCode,
      teacherId,
      teacherName,
      room,
      scheduleDay,
      startTime,
      endTime
    } = req.body;

    if (!lectureName || !subjectCode) {
      return res.status(400).json({ success: false, error: "Lecture Name and Subject Code are required." });
    }

    const cleanSubCode = subjectCode.trim().toUpperCase();
    const cleanLecName = lectureName.trim();

    // Enrich missing subject info if not provided
    const subjectInfo = db.prepare("SELECT * FROM subjects WHERE UPPER(subject_code) = UPPER(?) LIMIT 1").get(cleanSubCode);
    const safeSubName = subjectName || (subjectInfo ? subjectInfo.subject_name : cleanSubCode);
    const safeCourse = courseCode || (subjectInfo ? subjectInfo.course_code : "B.Tech");
    const safeBranch = branchCode || (subjectInfo ? subjectInfo.branch_code : "Computer Science & Engineering");
    const safeYear = yearCode || (subjectInfo ? subjectInfo.year_code : "4th Year");
    const safeRoom = room || (subjectInfo ? subjectInfo.room_default : "Lab 304");

    // Enrich teacher name if not provided
    let safeTeacherId = (teacherId || "TCH-2026-001").trim();
    let safeTeacherName = (teacherName || "").trim();
    if (!safeTeacherName) {
      const teacherRecord = db.prepare("SELECT full_name FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(safeTeacherId);
      safeTeacherName = teacherRecord ? teacherRecord.full_name : "Dr. Rajesh Sharma";
    }

    const id = `LEC-${Date.now().toString().slice(-6)}`;
    db.prepare(`
      INSERT INTO scheduled_lectures (
        id, lecture_name, subject_code, subject_name, course_code, branch_code, year_code,
        class_code, teacher_id, teacher_name, room, schedule_day, start_time, end_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `).run(
      id,
      cleanLecName,
      cleanSubCode,
      safeSubName,
      safeCourse,
      safeBranch,
      safeYear,
      classCode || "CS-4A",
      safeTeacherId,
      safeTeacherName,
      safeRoom,
      scheduleDay || "Monday",
      startTime || "09:00 AM",
      endTime || "10:00 AM"
    );

    // Also auto-register an active session in attendance_sessions so QR & Face Kiosk can target it immediately
    const sessionId = `SES-${Date.now().toString().slice(-6)}`;
    const sessionCode = `AX-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT OR IGNORE INTO attendance_sessions (
        session_id, session_code, subject_code, subject_name, lecture_name,
        class_group, course_code, branch_code, year_code, teacher_id, teacher_name,
        room, start_time, expires_at, status, total_enrolled, marked_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 'Active', 45, 0)
    `).run(
      sessionId,
      sessionCode,
      cleanSubCode,
      safeSubName,
      cleanLecName,
      classCode || "CS-4A",
      safeCourse,
      safeBranch,
      safeYear,
      safeTeacherId,
      safeTeacherName,
      safeRoom,
      expiresAt
    );

    return res.status(201).json({
      success: true,
      message: `Lecture "${cleanLecName}" created for ${safeSubName} (${cleanSubCode}) and enabled in Face Biometric & QR Kiosks.`,
      lecture: {
        id,
        lecture_name: cleanLecName,
        subject_code: cleanSubCode,
        subject_name: safeSubName,
        course_code: safeCourse,
        branch_code: safeBranch,
        year_code: safeYear,
        room: safeRoom,
        teacher_id: safeTeacherId,
        teacher_name: safeTeacherName,
        session_id: sessionId,
        session_code: sessionCode
      }
    });
  } catch (error) {
    console.error("createScheduledLecture error:", error);
    return res.status(500).json({ success: false, error: "Failed to create scheduled lecture" });
  }
}

function deleteScheduledLecture(req, res) {
  try {
    const { id } = req.params;
    const info = db.prepare("DELETE FROM scheduled_lectures WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: "Lecture record not found." });
    }
    return res.json({ success: true, message: "Scheduled lecture removed successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete scheduled lecture" });
  }
}

module.exports = {
  getCourses,
  createCourse,
  getBranches,
  createBranch,
  getAcademicYears,
  getSubjects,
  createSubject,
  deleteSubject,
  getAcademicClasses,
  createAcademicClass,
  getTeacherAssignments,
  createTeacherAssignment,
  deleteTeacherAssignment,
  getScheduledLectures,
  createScheduledLecture,
  deleteScheduledLecture
};
