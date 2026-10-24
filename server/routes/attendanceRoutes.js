const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// Attendance submission methods
router.post("/mark-face", attendanceController.markFaceAttendance);
router.post("/kiosk-identify", attendanceController.kioskIdentifyFace);
router.post("/mark-qr", attendanceController.markQRAttendance);

// Sessions
router.get("/sessions", attendanceController.getActiveSessions);
router.post("/sessions", attendanceController.createSession);
router.post("/sessions/:sessionId/regenerate", attendanceController.regenerateSessionToken);
router.get("/sessions/:sessionId/attendees", attendanceController.getSessionAttendees);
router.patch("/sessions/:sessionId/close", attendanceController.closeSession);

// Records, audit and reporting
router.get("/student/:studentId", attendanceController.getStudentAttendance);
router.get("/records", attendanceController.getAllAttendanceRecords);
router.get("/anti-proxy-logs", attendanceController.getSecurityAuditLogs);
router.patch("/records/:recordId/correct", attendanceController.correctAttendanceRecord);
router.get("/export/csv", attendanceController.exportAttendanceCSV);

module.exports = router;
