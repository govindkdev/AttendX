const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");

router.post("/submit", leaveController.submitLeave);
router.get("/", leaveController.getLeaves);
router.patch("/:leaveId/status", leaveController.updateLeaveStatus);

module.exports = router;
