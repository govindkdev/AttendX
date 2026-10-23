const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// Attendance submission methods
router.post("/mark-face", attendanceController.markFaceAttendance);
router.post("/mark-qr", attendanceController.markQRAttendance);

// Sessions
router.get("/sessions", attendanceController.getActiveSessions);
router.post("/sessions", attendanceController.createSession);
router.patch("/sessions/:sessionId/close", attendanceController.closeSession);

// Records and reporting
router.get("/student/:studentId", attendanceController.getStudentAttendance);
router.get("/records", attendanceController.getAllAttendanceRecords);
router.get("/export/csv", attendanceController.exportAttendanceCSV);

module.exports = router;
