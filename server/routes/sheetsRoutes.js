/*
=========================================================
ATTENDX - GOOGLE SHEETS ROUTES
=========================================================
*/

const express = require("express");
const router = express.Router();
const sheetsController = require("../controllers/sheetsController");

router.get("/status", sheetsController.getSyncStatus);
router.get("/config", sheetsController.getSyncStatus);
router.get("/queue", sheetsController.getQueue);
router.post("/configure", sheetsController.configureWebhook);
router.post("/config", sheetsController.configureWebhook);
router.post("/test", sheetsController.testConnection);
router.post("/retry", sheetsController.retrySync);
router.post("/sync-pending", sheetsController.retrySync);

module.exports = router;
