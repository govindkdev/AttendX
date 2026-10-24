/*
=========================================================
ATTENDX - GOOGLE SHEETS SYNC CONTROLLER
=========================================================
Handles Admin status queries, retry operations, and webhook
configuration for Google Sheets attendance reporting.
=========================================================
*/

const googleSheetsService = require("../services/googleSheetsService");

function getSyncStatus(req, res) {
  try {
    const status = googleSheetsService.getSyncStats();
    return res.json({
      success: true,
      configured: status.isConfigured,
      webhookConfigured: status.isConfigured,
      enabled: true,
      spreadsheetId: status.spreadsheetId,
      spreadsheetUrl: status.spreadsheetUrl,
      sheetName: "Attendance_Logs",
      totalSynced: status.stats.syncedRecords,
      totalInQueue: status.stats.pendingRecords + status.stats.failedRecords,
      pendingInQueue: status.stats.pendingRecords,
      stats: status.stats,
      recentQueue: status.recentQueue,
      maskedWebhookUrl: status.maskedWebhookUrl
    });
  } catch (error) {
    console.error("getSyncStatus error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve Google Sheets sync status" });
  }
}

function getQueue(req, res) {
  try {
    const status = googleSheetsService.getSyncStats();
    return res.json({
      success: true,
      count: status.recentQueue.length,
      queue: status.recentQueue
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to retrieve queue" });
  }
}

async function configureWebhook(req, res) {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || typeof webhookUrl !== "string") {
      return res.status(400).json({ success: false, error: "Please provide a valid Google Apps Script Webhook URL." });
    }

    const saved = googleSheetsService.setWebhookUrl(webhookUrl);
    return res.json({
      success: true,
      message: "Google Sheets Webhook URL configured successfully.",
      webhookUrl: `${saved.slice(0, 30)}...`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to configure Google Sheets Webhook URL" });
  }
}

async function testConnection(req, res) {
  try {
    const result = await googleSheetsService.testConnection();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function retrySync(req, res) {
  try {
    const result = await googleSheetsService.retryPendingQueue();
    return res.json({
      success: true,
      message: `Retried ${result.totalRetried} pending records: ${result.synced} synced, ${result.failed} failed.`,
      ...result
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to trigger sync retry" });
  }
}

module.exports = {
  getSyncStatus,
  configureWebhook,
  testConnection,
  retrySync,
  getQueue
};
