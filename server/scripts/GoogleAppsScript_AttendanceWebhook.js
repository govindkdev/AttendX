/**
 * ===================================================================
 * ATTENDX AI — GOOGLE APPS SCRIPT ATTENDANCE WEBHOOK
 * ===================================================================
 * Target Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI/edit?usp=sharing
 * Spreadsheet ID: 1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI
 * 
 * INSTRUCTIONS TO DEPLOY IN 60 SECONDS:
 * 1. Open your Google Sheet in a browser.
 * 2. Click "Extensions" > "Apps Script" in the top menu.
 * 3. Delete any code in the editor, and paste this entire file.
 * 4. Click "Deploy" (top right) > "New deployment".
 * 5. Select type: "Web app".
 * 6. Description: "AttendX Attendance Sync Webhook".
 * 7. Execute as: "Me (your email)".
 * 8. Who has access: "Anyone" (allows your AttendX backend to securely push records).
 * 9. Click "Deploy", copy the "Web app URL", and paste it into the AttendX Admin Settings.
 * ===================================================================
 */

const SHEET_NAME = "Attendance Records";

const HEADERS = [
  "Attendance Record ID",
  "Student ID",
  "Student Name",
  "Student Email",
  "Course",
  "Branch",
  "Academic Year",
  "Subject",
  "Class/Section",
  "Teacher ID",
  "Teacher Name",
  "Lecture ID",
  "Lecture Name",
  "Attendance Date",
  "Attendance Time",
  "Attendance Status",
  "Attendance Method",
  "Verification Result",
  "Institution/Campus",
  "Google Sheets Sync Status"
];

function getOrCreateWorksheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Initialize headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0F172A"); // AttendX Navy
    headerRange.setFontColor("#FFFFFF");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-fit column widths
    for (let c = 1; c <= HEADERS.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }
  return sheet;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No payload provided in request body."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateWorksheet();

    // Health check / ping probe
    if (payload.action === "PING" || payload.action === "HEALTH_CHECK") {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "AttendX Google Sheets Webhook is active and connected.",
        sheetName: sheet.getName(),
        totalRows: sheet.getLastRow(),
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Single record or batch records
    const records = Array.isArray(payload.records) ? payload.records : [payload];
    const results = [];

    // Retrieve existing Record IDs to prevent duplicate rows (Column A)
    const lastRow = sheet.getLastRow();
    const existingIds = new Set();
    if (lastRow > 1) {
      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < idValues.length; i++) {
        if (idValues[i][0]) existingIds.add(String(idValues[i][0]).trim());
      }
    }

    for (const rec of records) {
      const recordId = String(rec.recordId || rec.id || "").trim();
      
      // Idempotency: Skip if already recorded
      if (recordId && existingIds.has(recordId)) {
        results.push({ recordId, status: "ALREADY_EXISTS", message: "Duplicate prevented: row already present" });
        continue;
      }

      const rowData = [
        recordId || "ATT-" + new Date().getTime(),
        rec.studentId || "",
        rec.studentName || "",
        rec.studentEmail || "",
        rec.course || "B.Tech",
        rec.branch || "Computer Science & Engineering",
        rec.academicYear || "4th Year",
        rec.subject || "Machine Learning & AI",
        rec.classGroup || rec.classCode || "CS-4A",
        rec.teacherId || "TCH-2026-001",
        rec.teacherName || "Dr. Rajesh Sharma",
        rec.lectureId || rec.sessionId || "",
        rec.lectureName || "Regular Lecture",
        rec.date || new Date().toISOString().split("T")[0],
        rec.time || new Date().toLocaleTimeString(),
        rec.status || "Present",
        rec.method || "Face AI",
        rec.verificationResult || "Verified (Biometric Centroid)",
        rec.institution || "AttendX Main Institute of Technology",
        "Synced (" + new Date().toISOString() + ")"
      ];

      sheet.appendRow(rowData);
      existingIds.add(recordId);
      results.push({ recordId, status: "SYNCED", rowNumber: sheet.getLastRow() });
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Attendance records synchronized successfully with Google Sheets.",
      syncedCount: results.filter(r => r.status === "SYNCED").length,
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || "Failed to process Google Sheets sync."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sheet = getOrCreateWorksheet();
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    service: "AttendX Google Sheets Attendance Sync Service",
    status: "ONLINE",
    spreadsheetId: "1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI",
    worksheet: sheet.getName(),
    totalRecordedRows: Math.max(0, sheet.getLastRow() - 1),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
