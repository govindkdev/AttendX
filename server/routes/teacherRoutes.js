const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");

router.get("/", teacherController.getTeachers);
router.post("/issue", teacherController.issueTeacherId);
router.patch("/:teacherId/status", teacherController.toggleTeacherStatus);

module.exports = router;
