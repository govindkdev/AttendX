const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method: "POST",
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
            resolve(JSON.parse(respData));
          } catch (e) {
            resolve(respData);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== ATTENDX 1-TO-N BIOMETRIC KIOSK TEST ===");

  const db = require("../config/database");
  db.prepare("DELETE FROM attendance_records WHERE subject_code = 'CS402'").run();

  // Retrieve STU-2026-006's enrolled vector
  const stu6Row = db.prepare("SELECT student_id, embedding_vector FROM face_embeddings WHERE student_id = 'STU-2026-006'").get();
  const enrolledVector = JSON.parse(stu6Row.embedding_vector);

  // Live probe from webcam: enrolled vector + slight natural lighting variance
  const liveWebcamProbe = enrolledVector.map((v) => v + (Math.random() - 0.5) * 0.005);
  const norm = Math.sqrt(liveWebcamProbe.reduce((s, x) => s + x * x, 0));
  const normalizedProbe = liveWebcamProbe.map((x) => x / norm);

  // Test 1: STU-2026-006 appears in front of the kiosk camera (1st time)
  console.log("\n[Scan 1] STU-2026-006 appears before camera:");
  const scan1 = await post("/api/attendance/kiosk-identify", {
    probeVector: normalizedProbe,
    faceSnapshot: "live_camera_snapshot_frame",
    subjectCode: "CS402",
    subjectName: "Machine Learning & AI",
    room: "Lab 304"
  });
  console.log("Result 1:", scan1.status, "| Matched Student:", scan1.student?.studentId, scan1.student?.fullName, "| Confidence:", scan1.confidence);
  if (scan1.status !== "RECORDED" || scan1.student?.studentId !== "STU-2026-006") {
    throw new Error("Scan 1 failed to record STU-2026-006!");
  }

  // Test 2: STU-2026-006 appears in front of the kiosk camera AGAIN (2nd time)
  console.log("\n[Scan 2] STU-2026-006 appears before camera again (Critical Bug Reproduction check):");
  const scan2 = await post("/api/attendance/kiosk-identify", {
    probeVector: normalizedProbe,
    faceSnapshot: "live_camera_snapshot_frame",
    subjectCode: "CS402",
    subjectName: "Machine Learning & AI",
    room: "Lab 304"
  });
  console.log("Result 2:", scan2.status, "| Already Marked:", scan2.alreadyMarked, "| Target Student:", scan2.student?.studentId, scan2.student?.fullName, "| Message:", scan2.message);
  if (scan2.status !== "ALREADY_MARKED" || scan2.student?.studentId !== "STU-2026-006") {
    throw new Error("Scan 2 failed! Should be ALREADY_MARKED for STU-2026-006, not rotated to another student!");
  }

  // Test 3: STU-2026-006 appears in front of the camera a 3rd time
  console.log("\n[Scan 3] STU-2026-006 appears before camera a 3rd time:");
  const scan3 = await post("/api/attendance/kiosk-identify", {
    probeVector: normalizedProbe,
    faceSnapshot: "live_camera_snapshot_frame",
    subjectCode: "CS402",
    subjectName: "Machine Learning & AI",
    room: "Lab 304"
  });
  console.log("Result 3:", scan3.status, "| Target Student:", scan3.student?.studentId, "| Message:", scan3.message);
  if (scan3.status !== "ALREADY_MARKED" || scan3.student?.studentId !== "STU-2026-006") {
    throw new Error("Scan 3 failed!");
  }

  // Test 4: Unknown face appears in front of the camera
  console.log("\n[Scan 4] Unknown face appears before camera:");
  const randomUnknownVector = new Array(512).fill(0).map(() => Math.random() - 0.5);
  const unkNorm = Math.sqrt(randomUnknownVector.reduce((s, x) => s + x * x, 0));
  const normalizedUnknown = randomUnknownVector.map((x) => x / unkNorm);

  const scan4 = await post("/api/attendance/kiosk-identify", {
    probeVector: normalizedUnknown,
    faceSnapshot: "live_camera_snapshot_frame_unknown",
    subjectCode: "CS402",
    subjectName: "Machine Learning & AI",
    room: "Lab 304"
  });
  console.log("Result 4:", scan4.status, "| Message:", scan4.message);
  if (scan4.status !== "UNKNOWN") {
    throw new Error("Scan 4 failed to reject unknown face!");
  }

  // Verify only 1 attendance record was inserted in total!
  const count = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE subject_code = 'CS402'").get().c;
  console.log("\n✓ Total attendance records in database for CS402:", count, "(Expected strictly 1)");
  if (count !== 1) {
    throw new Error(`Expected 1 attendance record, found ${count}!`);
  }

  console.log("\n🎉 ALL 1-TO-N BIOMETRIC & ANTI-DUPLICATE TESTS PASSED PERFECTLY!");
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
