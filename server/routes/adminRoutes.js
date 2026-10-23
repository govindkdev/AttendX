const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/registrations", adminController.getPendingRegistrations);
router.patch("/registrations/:id/approve", adminController.approveRegistration);
router.patch("/registrations/:id/reject", adminController.rejectRegistration);
router.get("/geofence", adminController.getGeofence);
router.put("/geofence", adminController.updateGeofence);

module.exports = router;
