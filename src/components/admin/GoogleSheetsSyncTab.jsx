/*
=========================================================
ATTENDX - INSTITUTIONAL GOOGLE SHEETS LIVE SYNC MANAGER
=========================================================
Admin module for configuring and monitoring automatic
20-column attendance log reporting to Google Sheets.
Spreadsheet ID: 1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI
=========================================================
*/

import React, { useState, useEffect } from "react";
import { sheetsService } from "../../services/sheetsService";

export default function GoogleSheetsSyncTab() {
  const [config, setConfig] = useState({
    spreadsheetId: "1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI",
    spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI/edit?usp=sharing",
    sheetName: "Attendance_Logs",
    webhookConfigured: false,
    enabled: true,
    totalSynced: 0,
    totalInQueue: 0,
    pendingInQueue: 0,
    lastSyncAt: null,
    lastError: null
  });

  const [webhookInput, setWebhookInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [feedback, setFeedback] = useState({ msg: "", type: "info" });
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [queueItems, setQueueItems] = useState([]);

  const showBanner = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback({ msg: "", type: "info" }), 4500);
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await sheetsService.getConfig();
      if (data && data.success) {
        setConfig(data);
        if (data.webhookUrl) {
          setWebhookInput(data.webhookUrl);
        }
      }
      const q = await sheetsService.getQueue();
      if (q && q.success) {
        setQueueItems(q.queue || []);
      }
    } catch (err) {
      console.warn("Failed to load Google Sheets config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await sheetsService.saveConfig({
      webhookUrl: webhookInput.trim(),
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      enabled: config.enabled
    });
    setLoading(false);

    if (res && res.success) {
      showBanner("Google Sheets Webhook configuration saved successfully!");
      loadStatus();
    } else {
      showBanner(res?.error || "Failed to update configuration", "error");
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    const res = await sheetsService.testConnection(webhookInput.trim() || null);
    setLoading(false);
    setTestResult(res);

    if (res && res.success) {
      showBanner("✓ Google Sheets connection verified! Webhook responded successfully.");
      loadStatus();
    } else {
      showBanner(res?.message || "Webhook test failed. Please check URL and permissions.", "error");
    }
  };

  const handleFlushQueue = async () => {
    setLoading(true);
    const res = await sheetsService.flushQueue();
    setLoading(false);

    if (res && res.success) {
      showBanner(`Queue flush completed: ${res.synced || 0} pushed, ${res.failed || 0} failed.`);
      loadStatus();
    } else {
      showBanner(res?.error || "Queue flush failed", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Feedback banner */}
      {feedback.msg && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            background: feedback.type === "error" ? "#FEF2F2" : "#ECFDF5",
            border: feedback.type === "error" ? "1px solid #FCA5A5" : "1px solid #6EE7B7",
            color: feedback.type === "error" ? "#991B1B" : "#065F46"
          }}
        >
          {feedback.type === "error" ? "⚠️ " : "✓ "} {feedback.msg}
        </div>
      )}

      {/* Main Integration Card */}
      <div className="dashboard-card" style={{ padding: 20 }}>
        <div className="card-header-flex" style={{ borderBottom: "1px solid #E2E8F0", paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>📊</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "#0F172A" }}>Google Sheets Automatic Attendance Reporting</h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748B" }}>
                  Every verified attendance mark (Face Biometric AI or QR Code) is automatically appended to your official institutional Google Spreadsheet.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={config.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#0F9D58",
                color: "#fff",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(15, 157, 88, 0.3)"
              }}
            >
              <span>↗</span>
              <span>Open Google Sheet</span>
            </a>
            <button
              onClick={loadStatus}
              className="btn-secondary"
              style={{ fontSize: 13, padding: "8px 12px" }}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20
          }}
        >
          <div style={{ padding: 14, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Integration Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: config.webhookConfigured ? "#10B981" : "#F59E0B"
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: config.webhookConfigured ? "#065F46" : "#92400E" }}>
                {config.webhookConfigured ? "Live Sync Active" : "Queued in Local DB"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
              {config.webhookConfigured ? "Connected via Apps Script Webhook" : "Records queued safely; zero data loss"}
            </div>
          </div>

          <div style={{ padding: 14, background: "#ECFDF5", borderRadius: 8, border: "1px solid #A7F3D0" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#065F46", textTransform: "uppercase" }}>Total Synced to Sheets</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#065F46", marginTop: 4 }}>
              {config.totalSynced || 0}
            </div>
            <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>Rows committed in Google Sheet</div>
          </div>

          <div style={{ padding: 14, background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E", textTransform: "uppercase" }}>Pending In Offline Queue</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#B45309", marginTop: 4 }}>
              {config.pendingInQueue || 0}
            </div>
            <div style={{ fontSize: 11, color: "#B45309", marginTop: 4 }}>Awaiting Webhook bridge delivery</div>
          </div>

          <div style={{ padding: 14, background: "#F1F5F9", borderRadius: 8, border: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>Target Sheet / Tab</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
              {config.sheetName || "Attendance_Logs"}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontFamily: "monospace" }}>
              ID: {config.spreadsheetId ? `${config.spreadsheetId.slice(0, 12)}...` : "None"}
            </div>
          </div>
        </div>

        {/* Configuration & Webhook Form */}
        <div style={{ background: "#F8FAFC", padding: 18, borderRadius: 10, border: "1px solid #E2E8F0", marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#0F172A" }}>
            Google Apps Script Webhook Endpoint
          </h4>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
            Because official Google Sheets require OAuth2 or an Apps Script bridge to append rows without exposing admin credentials, AttendX uses a high-speed Google Apps Script Webhook. The Webhook script is included in your project under <code>server/scripts/GoogleAppsScript_AttendanceWebhook.js</code>.
          </p>

          <form onSubmit={handleSaveWebhook} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 320,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  fontFamily: "monospace"
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ fontSize: 13, padding: "9px 18px" }}
              >
                Save Webhook
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                className="btn-secondary"
                disabled={loading}
                style={{ fontSize: 13, padding: "9px 16px" }}
              >
                🧪 Test Connection
              </button>
              {config.pendingInQueue > 0 && (
                <button
                  type="button"
                  onClick={handleFlushQueue}
                  style={{
                    fontSize: 13,
                    padding: "9px 16px",
                    background: "#F59E0B",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  disabled={loading}
                >
                  ⚡ Flush Queue ({config.pendingInQueue})
                </button>
              )}
            </div>
          </form>

          {/* Test connection result display */}
          {testResult && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                background: testResult.success ? "#ECFDF5" : "#FEF2F2",
                border: testResult.success ? "1px solid #A7F3D0" : "1px solid #FECACA",
                color: testResult.success ? "#065F46" : "#991B1B"
              }}
            >
              <strong>{testResult.success ? "✓ Test Passed: " : "✕ Test Failed: "}</strong>
              {testResult.message}
              {testResult.details && (
                <pre style={{ margin: "6px 0 0", fontSize: 11, overflowX: "auto" }}>
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                padding: 0
              }}
            >
              {showSetupGuide ? "▲ Hide Setup Instructions" : "▼ How to setup Google Apps Script Webhook (2 minutes)"}
            </button>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              Idempotency: Record IDs prevent duplicate rows
            </span>
          </div>

          {/* Setup Guide Accordion */}
          {showSetupGuide && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12,
                color: "#334155",
                lineHeight: 1.6
              }}
            >
              <h5 style={{ margin: "0 0 8px", fontSize: 13, color: "#0F172A" }}>
                3-Step Google Apps Script Deployment:
              </h5>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>
                  Open your Google Sheet:{" "}
                  <a href={config.spreadsheetUrl} target="_blank" rel="noreferrer" style={{ color: "#2563EB", fontWeight: 600 }}>
                    AttendX Google Sheet Link
                  </a>
                </li>
                <li>
                  Go to <strong>Extensions &gt; Apps Script</strong>. Replace the empty file with the code from:
                  <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>
                    server/scripts/GoogleAppsScript_AttendanceWebhook.js
                  </code>
                </li>
                <li>
                  Click <strong>Deploy &gt; New deployment</strong>. Select type <strong>Web app</strong>:
                  <ul style={{ marginTop: 4 }}>
                    <li>Description: <code>AttendX Attendance Ingestion Bridge</code></li>
                    <li>Execute as: <strong>Me</strong></li>
                    <li>Who has access: <strong>Anyone</strong> (critical for automated backend POST calls)</li>
                  </ul>
                </li>
                <li>
                  Copy the generated <strong>Web app URL</strong> (ending in <code>/exec</code>) and paste it into the input above, then click <strong>Save Webhook</strong>.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* 20-Column Data Schema Specification */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#0F172A" }}>
            20-Column Attendance Ledger Schema
          </h4>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748B" }}>
            Every row appended to Google Sheets automatically populates the following 20 standardized attributes:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8,
              background: "#F8FAFC",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #E2E8F0"
            }}
          >
            {[
              "1. Record ID (REC-XXXXXX)",
              "2. Student ID (STU-XXXX)",
              "3. Student Full Name",
              "4. Course (e.g. B.Tech)",
              "5. Branch (e.g. CSE)",
              "6. Academic Year (e.g. 4th Year)",
              "7. Roll Number",
              "8. Student Email",
              "9. Subject Code (e.g. CS402)",
              "10. Subject Name",
              "11. Lecture / Topic Title",
              "12. Faculty / Teacher ID",
              "13. Faculty Name",
              "14. Date (YYYY-MM-DD)",
              "15. Time (HH:MM:SS)",
              "16. Method (Face AI / QR)",
              "17. Status (Present / Late / Absent)",
              "18. Biometric Confidence / Similarity",
              "19. Geofence Status",
              "20. System Timestamp (ISO 8601)"
            ].map((col, idx) => (
              <div key={idx} style={{ fontSize: 11, color: "#334155", background: "#fff", padding: "6px 8px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
                <strong>{col.split(" ")[0]}</strong> {col.slice(col.indexOf(" ") + 1)}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Queue Inspection Table */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: "#0F172A" }}>
              Offline Synchronization Queue ({queueItems.length})
            </h4>
            {queueItems.length > 0 && (
              <button
                onClick={handleFlushQueue}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Sync All Pending
              </button>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                  <th style={{ padding: "8px 12px" }}>Queue ID</th>
                  <th style={{ padding: "8px 12px" }}>Record ID</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                  <th style={{ padding: "8px 12px" }}>Retry Count</th>
                  <th style={{ padding: "8px 12px" }}>Queued At</th>
                  <th style={{ padding: "8px 12px" }}>Error Details</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px 12px", textAlign: "center", color: "#94A3B8" }}>
                      Queue is currently empty. All attendance events are synchronized.
                    </td>
                  </tr>
                ) : (
                  queueItems.slice(0, 10).map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>#{item.id}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600 }}>{item.record_id}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                            background: item.status === "FAILED" ? "#FEE2E2" : "#FEF3C7",
                            color: item.status === "FAILED" ? "#991B1B" : "#92400E"
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>{item.retry_count} / 5</td>
                      <td style={{ padding: "8px 12px", color: "#64748B" }}>{item.created_at}</td>
                      <td style={{ padding: "8px 12px", color: "#DC2626", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.error_message || "Awaiting Webhook response"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
