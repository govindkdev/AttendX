/*
=========================================================
ATTENDX - ATTENDANCE SERVICE
=========================================================
Centralized business logic for recording attendance,
session management, duplicate checks, geofencing verification,
and CSV exports.
=========================================================
*/

import { loadState, saveState } from "../data/demoData.js";
import { api } from "./api.js";

export const attendanceService = {
  /**
   * Get attendance history for a student
   */
  getStudentHistory(studentId = "STU-2026-001") {
    const state = loadState();
    return state.attendanceHistory.filter(
      (r) => r.studentId.toUpperCase() === studentId.toUpperCase()
    );
  },

  /**
   * Mark attendance with validation (Face AI or QR)
   */
  markAttendance({
    studentId = "STU-2026-001",
    studentName = "Govind Kushwaha",
    subject = "Machine Learning & AI",
    subjectCode = "CS402",
    method = "Face AI", // 'Face AI' | 'QR Backup' | 'Manual'
    geofenceVerified = true,
    confidence = "99.2%",
    room = "Lab 304",
    status = "Present"
  }) {
    const state = loadState();
    const todayStr = new Date().toISOString().split("T")[0];

    // Biometric Enrollment Check: Verify that student's face is enrolled by Admin in database
    if (method === "Face AI") {
      const studentRecord = state.students.find(
        (s) => s.studentId.toUpperCase() === studentId.toUpperCase()
      );
      if (studentRecord && !studentRecord.faceEnrolled) {
        return {
          success: false,
          error: "Biometric Enrollment Required: Your face has not been registered in the database by the Institute Admin. Admin must enroll your face in the Admin Portal before you can mark attendance with Face AI."
        };
      }
    }

    // Duplicate Check: Has the student already marked attendance for this subject today?
    const alreadyMarked = state.attendanceHistory.find(
      (r) =>
        r.studentId.toUpperCase() === studentId.toUpperCase() &&
        (r.subjectCode === subjectCode || r.subject === subject) &&
        r.date === todayStr &&
        r.status !== "Absent"
    );

    if (alreadyMarked) {
      return {
        success: false,
        error: `Duplicate Entry: You have already marked attendance for ${subject} today (${alreadyMarked.time} via ${alreadyMarked.method}).`
      };
    }

    if (!geofenceVerified && state.campusGeofence.strictMode) {
      return {
        success: false,
        error: "Geofence Verification Failed: You are outside the authorized campus perimeter. Move within campus grounds to record attendance."
      };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord = {
      id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
      studentId,
      studentName,
      date: todayStr,
      time: timeStr,
      subject,
      subjectCode,
      method,
      status,
      geofenceVerified,
      confidence,
      room
    };

    // Prepend to attendance history
    state.attendanceHistory.unshift(newRecord);

    // Update session marked count if an active session exists
    const session = state.activeSessions.find((s) => s.subjectCode === subjectCode);
    if (session) {
      session.markedCount = (session.markedCount || 0) + 1;
    }

    // Add a notification for the student
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      recipientRole: "student",
      recipientId: studentId,
      title: `Attendance Marked (${method})`,
      message: `Your attendance for ${subject} was recorded as ${status} at ${timeStr}.`,
      timestamp: `${todayStr} ${timeStr}`,
      read: false,
      type: "success"
    });

    saveState(state);

    // Fullstack: Sync attendance to SQLite backend (AI Face verification or Dynamic QR)
    if (method === "Face AI") {
      api.post("/api/attendance/mark-face", {
        studentId,
        subjectCode,
        subjectName: subject,
        room,
        latitude: 28.5355,
        longitude: 77.3910,
        faceSnapshot: "biometric_probe_vector"
      }).then((res) => {
        console.log("[AttendX Fullstack] Face AI attendance logged in SQLite database:", res);
      }).catch((e) => console.warn("[AttendX Fullstack] Backend face attendance sync:", e.message));
    } else {
      api.post("/api/attendance/mark-qr", {
        studentId,
        sessionCode: "AX-8492",
        latitude: 28.5355,
        longitude: 77.3910
      }).then((res) => {
        console.log("[AttendX Fullstack] QR attendance logged in SQLite database:", res);
      }).catch((e) => console.warn("[AttendX Fullstack] Backend QR attendance sync:", e.message));
    }

    return {
      success: true,
      record: newRecord,
      message: `Attendance marked successfully for ${subject} via ${method}.`
    };
  },

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const state = loadState();
    const now = new Date().getTime();
    // Return sessions that haven't expired
    return state.activeSessions.filter(
      (s) => new Date(s.expiresAt).getTime() > now && s.status === "Active"
    );
  },

  /**
   * Create a new attendance session (Teacher / Admin)
   */
  createSession({
    subjectCode,
    subjectName,
    teacherId,
    teacherName,
    room,
    durationMinutes = 15
  }) {
    const state = loadState();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const sessionCode = "AX-" + Math.floor(1000 + Math.random() * 9000);

    const newSession = {
      sessionId: "SES-2026-" + Math.floor(100 + Math.random() * 900),
      sessionCode,
      subjectCode,
      subjectName,
      teacherId,
      teacherName,
      room,
      startTime: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "Active",
      totalEnrolled: 45,
      markedCount: 0
    };

    state.activeSessions.unshift(newSession);

    // Notify teacher
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      recipientRole: "teacher",
      recipientId: teacherId,
      title: "New Attendance Session Live",
      message: `Session for ${subjectName} (${room}) is active for ${durationMinutes} minutes. Code: ${sessionCode}`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "info"
    });

    saveState(state);

    // Fullstack: Sync to backend SQLite
    api.post("/api/attendance/sessions", {
      subjectCode,
      subjectName,
      teacherId,
      teacherName,
      room,
      durationMinutes
    }).catch((e) => console.warn("Backend session create sync:", e.message));

    return newSession;
  },

  /**
   * Close an active attendance session
   */
  closeSession(sessionId) {
    const state = loadState();
    const session = state.activeSessions.find((s) => s.sessionId === sessionId);
    if (session) {
      session.status = "Closed";
      saveState(state);
      api.patch(`/api/attendance/sessions/${sessionId}/close`).catch(() => {});
      return true;
    }
    return false;
  },

  /**
   * Manual override of attendance record (Admin or Teacher)
   */
  updateRecordStatus(recordId, newStatus, reason = "Admin Manual Adjustment") {
    const state = loadState();
    const record = state.attendanceHistory.find((r) => r.id === recordId);
    if (!record) return { success: false, error: "Record not found." };

    const oldStatus = record.status;
    record.status = newStatus;
    record.method = "Manual Admin Override";
    record.overrideReason = reason;

    saveState(state);
    return {
      success: true,
      message: `Status changed from ${oldStatus} to ${newStatus}.`
    };
  },

  /**
   * Calculate distance between two GPS coordinates using Haversine formula (in meters)
   */
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  },

  /**
   * Export attendance records to CSV file
   */
  exportToCSV(records, filename = "AttendX_Attendance_Report.csv") {
    if (!records || records.length === 0) {
      alert("No attendance records available to export.");
      return;
    }

    const headers = ["ID", "Student ID", "Student Name", "Date", "Time", "Subject", "Method", "Status", "Room", "Geofence"];
    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.studentId}"`,
      `"${r.studentName}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.subject}"`,
      `"${r.method}"`,
      `"${r.status}"`,
      `"${r.room || 'N/A'}"`,
      `"${r.geofenceVerified ? 'Verified' : 'Unverified'}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
