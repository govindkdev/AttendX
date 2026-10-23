/*
=========================================================
ATTENDX - LEAVE CONTROLLER
=========================================================
Leave application submission by students and review
(Approve / Reject) by Institutional Faculty / Admin.
=========================================================
*/

const db = require("../config/database");

/**
 * Submit student leave request
 */
function submitLeave(req, res) {
  try {
    const { studentId, studentName, fromDate, toDate, reason, category } = req.body;

    if (!studentId || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, error: "Please fill in all leave application details." });
    }

    const leaveId = `LR-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split("T")[0];

    db.prepare(`
      INSERT INTO leave_requests (id, student_id, student_name, from_date, to_date, reason, category, status, submitted_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `).run(
      leaveId,
      studentId,
      studentName || "Govind Kushwaha",
      fromDate,
      toDate,
      reason,
      category || "Medical",
      today
    );

    // Notify Admin
    db.prepare(`
      INSERT INTO notifications (id, recipient_role, recipient_id, title, message, timestamp, read, type)
      VALUES (?, 'admin', 'ADM-2026-001', 'New Student Leave Application', ?, 'Just now', 0, 'info')
    `).run(`NOTIF-${Date.now().toString().slice(-5)}`, `Leave application (${category}) submitted by ${studentName} (${studentId}) from ${fromDate} to ${toDate}.`);

    return res.status(201).json({
      success: true,
      message: "Leave application submitted successfully for administrator approval.",
      leaveId
    });
  } catch (error) {
    console.error("submitLeave error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit leave application" });
  }
}

/**
 * Get leave applications (filtered by studentId or all)
 */
function getLeaves(req, res) {
  try {
    const { studentId, status } = req.query;

    let query = "SELECT * FROM leave_requests WHERE 1=1";
    const params = [];

    if (studentId) {
      query += " AND UPPER(student_id) = UPPER(?)";
      params.push(studentId);
    }

    if (status && status !== "All") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY submitted_on DESC";

    const leaves = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to retrieve leave records" });
  }
}

/**
 * Review leave application (Approve / Reject)
 */
function updateLeaveStatus(req, res) {
  try {
    const { leaveId } = req.params;
    const { status, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be 'Approved' or 'Rejected'." });
    }

    const leave = db.prepare("SELECT * FROM leave_requests WHERE id = ?").get(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave request not found." });
    }

    db.prepare(`
      UPDATE leave_requests
      SET status = ?, admin_remarks = ?
      WHERE id = ?
    `).run(status, remarks || `Marked as ${status} by administration`, leaveId);

    // Notify student
    db.prepare(`
      INSERT INTO notifications (id, recipient_role, recipient_id, title, message, timestamp, read, type)
      VALUES (?, 'student', ?, ?, ?, 'Just now', 0, ?)
    `).run(
      `NOTIF-${Date.now().toString().slice(-5)}`,
      leave.student_id,
      `Leave Request ${status}`,
      `Your leave application for ${leave.from_date} to ${leave.to_date} was ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ""}`,
      status === "Approved" ? "success" : "warning"
    );

    return res.json({
      success: true,
      message: `Leave request ${leaveId} has been ${status}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update leave status" });
  }
}

module.exports = {
  submitLeave,
  getLeaves,
  updateLeaveStatus
};
