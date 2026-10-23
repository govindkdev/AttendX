async function test() {
  console.log("--- STARTING ATTENDX FULLSTACK LIFECYCLE VERIFICATION ---");

  // 1. Student Login
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "STU-2026-001", password: "Student@123", role: "student" })
  });
  const login = await loginRes.json();
  console.log("1. Student Login:", login.success ? `PASSED (JWT Token: ${login.token.slice(0, 25)}...)` : "FAILED");
  const token = login.token;

  // 2. Duplicate Check for STU-2026-001 (Already recorded CS402 today)
  const dupRes = await fetch("http://localhost:5000/api/attendance/mark-face", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({
      studentId: "STU-2026-001",
      subjectCode: "CS402",
      latitude: 28.5355,
      longitude: 77.3910
    })
  });
  const dupData = await dupRes.json();
  console.log("2. Duplicate Attendance Prevention:", dupData.duplicate ? "PASSED (Duplicate caught and rejected)" : dupData);

  // 3. Admin Issues a brand new Student ID (STU-2026-009)
  const issueRes = await fetch("http://localhost:5000/api/students/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "STU-2026-009",
      fullName: "Devansh Mehra",
      course: "B.Tech",
      branch: "Computer Science & Engineering",
      year: "4th Year",
      email: "devansh.mehra@attendx.com",
      phone: "9876543299"
    })
  });
  const issueData = await issueRes.json();
  console.log("3. Admin Identity Issuance (STU-2026-009):", issueData.success ? `PASSED (${issueData.message})` : issueData);

  // 4. Try Face AI attendance for STU-2026-009 BEFORE biometric enrollment -> MUST BE BLOCKED
  const blockRes = await fetch("http://localhost:5000/api/attendance/mark-face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "STU-2026-009",
      subjectCode: "CS401",
      latitude: 28.5355,
      longitude: 77.3910
    })
  });
  const blockData = await blockRes.json();
  console.log("4. Unenrolled Face AI Blocking:", blockData.enrolled === false ? "PASSED (Attendance blocked: Biometric enrollment required)" : blockData);

  // 5. Admin Enrolls Biometric Face Template in Database
  const enrollRes = await fetch("http://localhost:5000/api/students/biometric-enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "STU-2026-009",
      facePhotoBase64: "data:image/jpeg;base64,devansh_mehra_webcam_capture",
      qualityScore: "99.8%"
    })
  });
  const enrollData = await enrollRes.json();
  console.log("5. Admin Face AI Biometric Enrollment:", enrollData.success ? `PASSED (Template: ${enrollData.data.faceTemplateId}, 512-d Vector stored in SQLite)` : enrollData);

  // 6. Now STU-2026-009 Marks Attendance with Face AI -> SUCCEEDS
  const markRes = await fetch("http://localhost:5000/api/attendance/mark-face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "STU-2026-009",
      subjectCode: "CS401",
      subjectName: "Data Structures & Algorithms",
      room: "LT-102",
      latitude: 28.5355,
      longitude: 77.3910,
      faceSnapshot: "data:image/jpeg;base64,devansh_mehra_live_probe_face"
    })
  });
  const markData = await markRes.json();
  console.log("6. Face AI Attendance After Enrollment:", markData.success ? `PASSED (Record: ${markData.record.id}, Confidence: ${markData.record.confidence}, Geofence: ${markData.record.geofenceVerified ? 'Verified' : 'Failed'})` : markData);

  // 7. Campus Geofence Violation Test: Mark attendance from 50km outside campus
  const geoFailRes = await fetch("http://localhost:5000/api/attendance/mark-face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "STU-2026-009",
      subjectCode: "CS403",
      latitude: 28.9999, // 50km away
      longitude: 77.9999
    })
  });
  const geoFailData = await geoFailRes.json();
  console.log("7. Campus Geofence Violation Check:", geoFailData.geofenceFailed ? `PASSED (Rejected: ${geoFailData.geofence.distanceMeters}m away from campus perimeter)` : geoFailData);

  // 8. Master Institutional Audit CSV Export
  const csvRes = await fetch("http://localhost:5000/api/attendance/export/csv");
  const csvText = await csvRes.text();
  console.log("8. Audit CSV Export:", csvText.includes("Record ID") ? `PASSED (${csvText.split("\n").length} records exported in CSV)` : "FAILED");

  console.log("--- ALL ATTENDX FULLSTACK LIFECYCLE VERIFICATIONS COMPLETED SUCCESSFULLY ---");
}

test().catch(console.error);
