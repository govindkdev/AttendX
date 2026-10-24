/*
=========================================================
ATTENDX - ACADEMIC CONFIGURATION ROUTES
=========================================================
*/

const express = require("express");
const router = express.Router();
const academicController = require("../controllers/academicController");

// Public/Read-only for all authenticated roles (Students, Teachers, Admins)
router.get("/courses", academicController.getCourses);
router.get("/branches", academicController.getBranches);
router.get("/years", academicController.getAcademicYears);
router.get("/subjects", academicController.getSubjects);
router.get("/classes", academicController.getAcademicClasses);
router.get("/teacher-assignments", academicController.getTeacherAssignments);
router.get("/lectures", academicController.getScheduledLectures);

// Admin management endpoints
router.post("/courses", academicController.createCourse);
router.post("/branches", academicController.createBranch);
router.post("/subjects", academicController.createSubject);
router.delete("/subjects/:id", academicController.deleteSubject);
router.post("/classes", academicController.createAcademicClass);
router.post("/teacher-assignments", academicController.createTeacherAssignment);
router.delete("/teacher-assignments/:id", academicController.deleteTeacherAssignment);
router.post("/lectures", academicController.createScheduledLecture);
router.delete("/lectures/:id", academicController.deleteScheduledLecture);

module.exports = router;
