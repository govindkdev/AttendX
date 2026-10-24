/*
=========================================================
ATTENDX - MASTER END-TO-END REGRESSION TEST SUITE
=========================================================
Verifies all 4 core problem domains:
1. Student & Faculty Authentication (issued ID, email, case insensitivity)
2. Academic Setup & Scheduled Biometric Target Lectures
3. Student Attendance Records, History & Subject-Wise Breakdown
4. Google Sheets 20-Column Pipeline & Anti-Duplicate Guards
=========================================================
*/

const http = require("http");

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = { "Content-Type": "application/json" };
    const opts = {
      hostname: "localhost",
      port: 5000,
      path,
      method: options.method || "GET",
      headers: { ...defaultHeaders, ...(options.headers || {}) }
    };

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=========================================================");
  console.log("  ATTENDX - RUNNING MASTER COMPREHENSIVE REGRESSION SUITE");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = "") {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${desc} ${details ? `-> ${details}` : ""}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: AUTHENTICATION & LOGIN (STUDENT ID & EMAIL)
    // -------------------------------------------------------------------------
    console.log("[1/4] Testing Authentication & Case-Insensitive Login...");

    // Test 1.1: Upper Case Student ID Login
    const login1 = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: "STU-2026-001", password: "Student@123", role: "student" }
    });
    assert("Student Login with STU-2026-001", login1.status === 200 && login1.data.success && login1.data.user.role === "student", JSON.stringify(login1.data));

    // Test 1.2: Lower Case Student ID Login
    const login2 = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: "stu-2026-001", password: "Student@123", role: "student" }
    });
    assert("Student Login with lowercase stu-2026-001", login2.status === 200 && login2.data.success, JSON.stringify(login2.data));

    // Test 1.3: Registered Email Login
    const login3 = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: "student@attendx.com", password: "Student@123", role: "student" }
    });
    assert("Student Login with registered email student@attendx.com", login3.status === 200 && login3.data.success, JSON.stringify(login3.data));

    // Test 1.4: Incorrect Password Rejection (Security check)
    const login4 = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: "STU-2026-001", password: "WrongPassword999!", role: "student" }
    });
    assert("Incorrect password rejected properly", login4.status === 401 && !login4.data.success, JSON.stringify(login4.data));

    // -------------------------------------------------------------------------
    // TEST GROUP 2: ACADEMIC SETUP & LECTURE TARGETS
    // -------------------------------------------------------------------------
    console.log("\n[2/4] Testing Academic Setup & Scheduled Biometric Targets...");

    // Test 2.1: Fetch Courses
    const courses = await request("/api/academic/courses");
    const coursesList = courses.data?.data || courses.data || [];
    assert("Get institutional courses list", courses.status === 200 && Array.isArray(coursesList) && coursesList.length >= 3, `Count: ${coursesList.length}`);

    // Test 2.2: Create a Scheduled Target Lecture
    const createLec = await request("/api/academic/lectures", {
      method: "POST",
      body: {
        lectureName: "Distributed Systems - Raft Consensus",
        subjectCode: "CS410",
        subjectName: "Distributed Operating Systems",
        courseCode: "B.Tech",
        branchCode: "Computer Science & Engineering",
        yearCode: "4th Year",
        classCode: "CS-4A",
        teacherId: "TCH-2026-001",
        teacherName: "Dr. Rajesh Sharma",
        room: "Lab 304",
        scheduleDay: "Tuesday",
        startTime: "10:00 AM",
        endTime: "11:00 AM"
      }
    });
    assert("Create Scheduled Target Lecture", createLec.status === 201 && createLec.data.success, JSON.stringify(createLec.data));

    // Test 2.3: Verify Scheduled Lecture retrieved in list
    const lecs = await request("/api/academic/lectures");
    const lecsList = lecs.data?.data || lecs.data || [];
    const foundLec = (lecsList || []).find((l) => l.subject_code === "CS410" || l.lecture_name?.includes("Raft"));
    assert("Retrieve Scheduled Lecture in Biometric Target List", Boolean(foundLec), `Found: ${Boolean(foundLec)}`);

    // -------------------------------------------------------------------------
    // TEST GROUP 3: STUDENT ATTENDANCE RECORDS & AUDIT LEDGER
    // -------------------------------------------------------------------------
    console.log("\n[3/4] Testing Attendance Records, Filters & Student Subject Breakdown...");

    const testSubCode = `CS_${Date.now().toString().slice(-4)}`;

    // Test 3.1: Mark Attendance
    const markFace = await request("/api/attendance/mark-face", {
      method: "POST",
      body: {
        studentId: "STU-2026-001",
        subjectName: `Distributed Systems - ${testSubCode}`,
        subject: `Distributed Systems - ${testSubCode}`,
        subjectCode: testSubCode,
        lectureName: "Distributed Systems - Raft Consensus",
        confidence: "99.4%",
        room: "Lab 304",
        latitude: 26.984806,
        longitude: 80.923287
      }
    });
    assert("Record Attendance via Face Biometrics", (markFace.status === 200 || markFace.status === 201) && markFace.data.success, JSON.stringify(markFace.data));

    // Test 3.2: Anti-Duplicate Seat Constraint
    const dupCheck = await request("/api/attendance/mark-face", {
      method: "POST",
      body: {
        studentId: "STU-2026-001",
        subjectName: `Distributed Systems - ${testSubCode}`,
        subject: `Distributed Systems - ${testSubCode}`,
        subjectCode: testSubCode,
        lectureName: "Distributed Systems - Raft Consensus",
        confidence: "99.5%",
        room: "Lab 304",
        latitude: 26.984806,
        longitude: 80.923287
      }
    });
    assert("Anti-Duplicate Guard prevents second check-in", Boolean(dupCheck.data.duplicate || dupCheck.data.alreadyMarked), JSON.stringify(dupCheck.data));

    // Test 3.3: Fetch All Records with Filters
    const allRecords = await request(`/api/attendance/records?subjectCode=${testSubCode}`);
    assert("Fetch attendance records filtered by subject", allRecords.status === 200 && Array.isArray(allRecords.data.records) && allRecords.data.records.length > 0, `Records count: ${allRecords.data.records?.length}`);

    // Test 3.4: Fetch Student Attendance Full Breakdown
    const studentHistory = await request("/api/attendance/student/STU-2026-001");
    assert("Fetch student breakdown with metrics", studentHistory.status === 200 && studentHistory.data.success && Array.isArray(studentHistory.data.records) && studentHistory.data.summary, JSON.stringify(studentHistory.data.summary));

    // -------------------------------------------------------------------------
    // TEST GROUP 4: GOOGLE SHEETS PIPELINE & QUEUE INTEGRATION
    // -------------------------------------------------------------------------
    console.log("\n[4/4] Testing Google Sheets 20-Column Pipeline & Sync Queue...");

    // Test 4.1: Get Google Sheets Configuration
    const sheetsCfg = await request("/api/sheets/config");
    assert("Google Sheets Config retrieved", sheetsCfg.status === 200 && sheetsCfg.data.spreadsheetId === "1UTCFFTbrcm6d-EZNQPDOthI9ZL47hnDyhEiemlmqpWI", JSON.stringify(sheetsCfg.data));

    // Test 4.2: Inspect Sync Queue (Attendance records queued safely)
    const queue = await request("/api/sheets/queue");
    assert("Google Sheets Queue items accessible", queue.status === 200 && Array.isArray(queue.data.queue), `Queue count: ${queue.data.queue?.length}`);

    // Test 4.3: Test Connection Handler
    const testConn = await request("/api/sheets/test", { method: "POST", body: {} });
    assert("Google Sheets Connection test endpoint operational", testConn.status === 200, JSON.stringify(testConn.data));

    // Summary
    console.log("\n=========================================================");
    console.log(`  REGRESSION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");

    if (failed === 0) {
      console.log("✓ ALL SUITES PASSED FLAWLESSLY!\n");
      process.exit(0);
    } else {
      console.error(`✕ ${failed} TEST(S) FAILED.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  }
}

runTests();
