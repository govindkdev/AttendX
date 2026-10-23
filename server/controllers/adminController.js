/*
=========================================================
ATTENDX - INSTITUTIONAL ADMIN CONTROLLER
=========================================================
Dashboard aggregate metrics, faculty onboarding approvals,
and campus geofence perimeter controls.
=========================================================
*/

const db = require("../config/database");

/**
 * Get comprehensive Admin Dashboard metrics
 */
function getDashboardStats(req, res) {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
    const activeStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'Active'").get().count;
    const faceEnrolled = db.prepare("SELECT COUNT(*) as count FROM students WHERE face_enrolled = 1").get().count;
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM teachers").get().count;

    const today = new Date().toISOString().split("T")[0];
    const todayAttendanceCount = db.prepare("SELECT COUNT(*) as count FROM attendance_records WHERE date = ?").get(today).count;

    const pendingRegistrations = db.prepare("SELECT COUNT(*) as count FROM pending_registrations WHERE status = 'Pending'").get().count;
    const pendingLeaves = db.prepare("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'Pending'").get().count;

    // Face enrollment percentage
    const faceEnrolledPct = totalStudents > 0 ? Number(((faceEnrolled / totalStudents) * 100).toFixed(1)) : 0;

    // Recent 5 attendance events
    const recentActivity = db.prepare(`
      SELECT * FROM attendance_records
      ORDER BY date DESC, time DESC
      LIMIT 6
    `).all();

    // Active attendance sessions
    const activeSessions = db.prepare(`
      SELECT * FROM attendance_sessions
      WHERE status = 'Active'
    `).all();

    return res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        faceEnrolled,
        faceEnrolledPct,
        totalTeachers,
        todayAttendanceCount,
        pendingRegistrations,
        pendingLeaves,
        activeSessionsCount: activeSessions.length
      },
      recentActivity,
      activeSessions
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({ success: false, error: "Failed to load dashboard metrics" });
  }
}

/**
 * Get pending registrations queue
 */
function getPendingRegistrations(req, res) {
  try {
    const pending = db.prepare("SELECT * FROM pending_registrations ORDER BY requested_at DESC").all();
    return res.json({ success: true, data: pending });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch pending approvals" });
  }
}

/**
 * Approve registration request
 */
function approveRegistration(req, res) {
  try {
    const { id } = req.params;
    const reqRecord = db.prepare("SELECT * FROM pending_registrations WHERE id = ?").get(id);

    if (!reqRecord) {
      return res.status(404).json({ success: false, error: "Registration request not found" });
    }

    if (reqRecord.role === "teacher") {
      // Check if teacher already exists, else create
      const existingTeacher = db.prepare("SELECT * FROM teachers WHERE UPPER(teacher_id) = UPPER(?)").get(reqRecord.target_id);
      if (!existingTeacher) {
        db.prepare(`
          INSERT INTO teachers (teacher_id, full_name, department, designation, email, phone, subjects_json, status)
          VALUES (?, ?, ?, 'Faculty', ?, ?, '[]', 'Active')
        `).run(reqRecord.target_id, reqRecord.full_name, reqRecord.department || "General Engineering", reqRecord.email, reqRecord.phone);
      } else {
        db.prepare("UPDATE teachers SET status = 'Active' WHERE UPPER(teacher_id) = UPPER(?)").run(reqRecord.target_id);
      }
    }

    db.prepare("UPDATE pending_registrations SET status = 'Approved' WHERE id = ?").run(id);

    return res.json({
      success: true,
      message: `Registration for ${reqRecord.full_name} (${reqRecord.target_id}) approved and activated.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Approval failed" });
  }
}

/**
 * Reject registration request
 */
function rejectRegistration(req, res) {
  try {
    const { id } = req.params;
    db.prepare("UPDATE pending_registrations SET status = 'Rejected' WHERE id = ?").run(id);

    return res.json({ success: true, message: `Registration ${id} rejected.` });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Rejection failed" });
  }
}

/**
 * Get Geofence Perimeter Settings
 */
function getGeofence(req, res) {
  try {
    const settings = db.prepare("SELECT * FROM geofence_settings WHERE id = 1").get();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to get geofence settings" });
  }
}

/**
 * Update Geofence Perimeter Settings
 */
function updateGeofence(req, res) {
  try {
    const { campusName, latitude, longitude, radiusMeters, strictMode } = req.body;

    db.prepare(`
      UPDATE geofence_settings
      SET campus_name = ?, latitude = ?, longitude = ?, radius_meters = ?, strict_mode = ?
      WHERE id = 1
    `).run(
      campusName || "AttendX Main Institute of Technology",
      parseFloat(latitude) || 28.5355,
      parseFloat(longitude) || 77.3910,
      parseInt(radiusMeters, 10) || 600,
      strictMode ? 1 : 0
    );

    const updated = db.prepare("SELECT * FROM geofence_settings WHERE id = 1").get();

    return res.json({
      success: true,
      message: "Campus geofence perimeter coordinates updated successfully.",
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update geofence" });
  }
}

module.exports = {
  getDashboardStats,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getGeofence,
  updateGeofence
};
