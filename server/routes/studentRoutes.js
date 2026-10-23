const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Retrieve students (accessible by Admin & Faculty)
router.get("/", studentController.getStudents);
router.get("/:studentId", studentController.getStudentById);

// Admin-exclusive Identity & Biometric operations
router.post("/issue", studentController.issueStudentId);
router.post("/biometric-enroll", studentController.enrollBiometricFace);
router.delete("/:studentId/biometric", studentController.removeBiometricFace);
router.patch("/:studentId/status", studentController.toggleStudentStatus);

module.exports = router;
