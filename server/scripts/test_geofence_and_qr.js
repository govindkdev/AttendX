const http = require("http");

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
      },
      (res) => {
        let respData = "";
        res.on("data", (chunk) => (respData += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: respData });
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== ATTENDX GEOFENCE & QR SECURITY TEST ===");

  const db = require("../config/database");

  // 1. Ensure an active session exists
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO attendance_sessions (
      session_id, session_code, token, subject_code, subject_name,
      lecture_name, class_group, teacher_id, teacher_name, room,
      start_time, expires_at, status, total_enrolled, marked_count
    ) VALUES (
      'SESS-TEST-99', 'TEST-QR-99', 'ATTENDX_TOKEN_9999', 'CS402', 'Machine Learning & AI',
      'Lecture 15: Deep Learning', 'CS-4A', 'TCH-2026-001', 'Dr. Rajesh Sharma', 'Lab 304',
      CURRENT_TIMESTAMP, ?, 'Active', 45, 0
    )
  `).run(expires);

  // Clear records for this student and subject today
  const today = new Date().toISOString().split("T")[0];
  db.prepare("DELETE FROM attendance_records WHERE student_id = 'STU-2026-006' AND subject_code = 'CS402'").run();

  // Test 1: Geofence Update via PUT /api/admin/geofence
  console.log("\n[Test 1] Update geofence perimeter via PUT /api/admin/geofence:");
  const geoUpdate = await request("/api/admin/geofence", "PUT", {
    campusName: "AttendX Main Institute of Technology",
    latitude: 28.5355,
    longitude: 77.3910,
    radiusMeters: 600,
    strictMode: true
  });
  console.log("Update response:", geoUpdate.status, geoUpdate.body.message);
  if (geoUpdate.status !== 200 || !geoUpdate.body.success) {
    throw new Error("Failed to update geofence!");
  }

  // Test 2: QR Scan from OUTSIDE campus perimeter (e.g., student at home 15 km away)
  console.log("\n[Test 2] Student attempts QR scan from outside campus perimeter (Latitude: 28.6500, Longitude: 77.2000):");
  const outsideScan = await request("/api/attendance/mark-qr", "POST", {
    studentId: "STU-2026-006",
    sessionCode: "TEST-QR-99",
    qrData: "ATTENDX_TOKEN_9999",
    latitude: 28.6500,
    longitude: 77.2000
  });
  console.log("Outside scan status:", outsideScan.status, "| Geofence failed:", outsideScan.body.geofenceFailed, "| Error:", outsideScan.body.error);
  if (outsideScan.status !== 403 || !outsideScan.body.geofenceFailed) {
    throw new Error("Outside campus scan was not blocked! Expected 403 Forbidden with geofenceFailed: true");
  }

  // Verify security audit log was generated for geofence violation
  const auditViolation = db.prepare("SELECT * FROM security_audit_logs WHERE event_type = 'GEOFENCE_VIOLATION' ORDER BY rowid DESC LIMIT 1").get();
  console.log("Audit log recorded:", auditViolation.event_type, "| Status:", auditViolation.status, "| Details:", auditViolation.details);

  // Test 3: QR Scan from INSIDE campus perimeter (Latitude: 28.5356, Longitude: 77.3911 ~ 15 meters from center)
  console.log("\n[Test 3] Student performs QR scan from INSIDE authorized campus perimeter (Latitude: 28.5356, Longitude: 77.3911):");
  const insideScan = await request("/api/attendance/mark-qr", "POST", {
    studentId: "STU-2026-006",
    sessionCode: "TEST-QR-99",
    qrData: "ATTENDX_TOKEN_9999",
    latitude: 28.5356,
    longitude: 77.3911
  });
  console.log("Inside scan status:", insideScan.status, "| Success:", insideScan.body.success, "| Message:", insideScan.body.message);
  if ((insideScan.status !== 200 && insideScan.status !== 201) || !insideScan.body.success) {
    throw new Error("Inside campus scan failed to record attendance!");
  }

  // Test 4: Duplicate QR check-in attempt for the same lecture
  console.log("\n[Test 4] Student attempts duplicate QR check-in for the same lecture:");
  const dupScan = await request("/api/attendance/mark-qr", "POST", {
    studentId: "STU-2026-006",
    sessionCode: "TEST-QR-99",
    qrData: "ATTENDX_TOKEN_9999",
    latitude: 28.5356,
    longitude: 77.3911
  });
  console.log("Duplicate scan status:", dupScan.status, "| Duplicate detected:", dupScan.body.duplicate, "| Error:", dupScan.body.error);
  if (dupScan.status !== 400 || !dupScan.body.duplicate) {
    throw new Error("Duplicate check-in was not blocked!");
  }

  console.log("\n🎉 ALL CAMPUS GEOFENCE & QR SECURITY TESTS PASSED PERFECTLY!");
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
