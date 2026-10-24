/*
=========================================================
ATTENDX - GOOGLE SHEETS LIVE INTEGRATION SERVICE
=========================================================
Front-end service for managing institutional Google Sheets
real-time synchronization, Webhook health, status checks,
and queue flushes.
=========================================================
*/

import { api } from "./api";

export const sheetsService = {
  /**
   * Get current Google Sheets integration status and metrics
   */
  async getConfig() {
    try {
      const res = await api.get("/api/sheets/config");
      return res;
    } catch (err) {
      console.warn("sheetsService.getConfig error:", err.message);
      return {
        success: false,
        configured: false,
        enabled: true,
        spreadsheetId: "1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI",
        spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI/edit?usp=sharing",
        webhookConfigured: false,
        totalSynced: 0,
        totalInQueue: 0,
        pendingInQueue: 0
      };
    }
  },

  /**
   * Save configuration (Webhook URL, Spreadsheet ID, Sheet Name, Enabled)
   */
  async saveConfig(data) {
    try {
      return await api.post("/api/sheets/config", data);
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Test live connection with Google Sheets Webhook
   */
  async testConnection(webhookUrl = null) {
    try {
      return await api.post("/api/sheets/test", { webhookUrl });
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Process & push any queued offline attendance records
   */
  async flushQueue() {
    try {
      return await api.post("/api/sheets/sync-pending", {});
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Get sync queue inspection
   */
  async getQueue() {
    try {
      return await api.get("/api/sheets/queue");
    } catch (err) {
      return { success: false, queue: [] };
    }
  }
};
