/*
=========================================================
ATTENDX - END-TO-END ACADEMIC & ID ISSUANCE TEST SUITE
=========================================================
Comprehensive automated verification script testing:
1. Academic Configuration (Courses, Branches, Years, Subjects, Classes)
2. Custom Course & Branch Creation
3. Dynamic Subject Retrieval per Course + Branch + Year
4. Official Student ID Issuance with Assigned Subjects & 0% Initial Attendance
5. Official Teacher ID Issuance with Multi-Subject & Class Assignments
6. Genuine Profile Retrieval from SQLite
7. Multi-Role Authentication with newly issued IDs
8. Duplicate ID collision rejection
=========================================================
*/

const http = require("http");

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log("=========================================================");
  console.log("   ATTENDX AI - ACADEMIC DATA & ID ISSUANCE VERIFICATION");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const PORT = process.env.PORT || 5000;
  const baseUrl = {
    hostname: "127.0.0.1",
    port: PORT,
    headers: { "Content-Type": "application/json" }
  };

  try {
    // 1. Healthcheck
    const health = await request({ ...baseUrl, path: "/api/health", method: "GET" });
    assert(health.status === 200 && health.data.status === "online", "System Healthcheck is Operational");

    // 2. Fetch Courses
    const coursesRes = await request({ ...baseUrl, path: "/api/academic/courses", method: "GET" });
    assert(
      coursesRes.status === 200 &&
      coursesRes.data.success &&
      coursesRes.data.data.some((c) => c.code === "B.Tech") &&
      coursesRes.data.data.some((c) => c.code === "BCA") &&
      coursesRes.data.data.some((c) => c.code === "MBA"),
      "Configured Courses (B.Tech, BCA, MBA, etc.) retrieved successfully"
    );

    // 3. Create Custom Course
    const customCourseCode = `BDES_${Date.now().toString().slice(-4)}`;
    const addCourseRes = await request(
      { ...baseUrl, path: "/api/academic/courses", method: "POST" },
      { code: customCourseCode, name: "Bachelor of Design", durationYears: 4 }
    );
    assert(
      addCourseRes.status === 201 && addCourseRes.data.success,
      `Admin can create custom course (${customCourseCode})`
    );

    // 4. Fetch Branches for Course
    const branchesRes = await request({ ...baseUrl, path: "/api/academic/branches?courseCode=B.Tech", method: "GET" });
    assert(
      branchesRes.status === 200 &&
      branchesRes.data.data.some((b) => b.name === "Information Technology") &&
      branchesRes.data.data.some((b) => b.name === "Computer Science & Engineering"),
      "Course-specific branches (IT, CSE) dynamically retrieved for B.Tech"
    );

    // 5. Create Custom Branch
    const addBranchRes = await request(
      { ...baseUrl, path: "/api/academic/branches", method: "POST" },
      { courseCode: customCourseCode, code: "UXD", name: "User Experience Design" }
    );
    assert(
      addBranchRes.status === 201 && addBranchRes.data.success,
      `Admin can create custom branch (UXD) under (${customCourseCode})`
    );

    // 6. Fetch Academic Years
    const yearsRes = await request({ ...baseUrl, path: "/api/academic/years", method: "GET" });
    assert(
      yearsRes.status === 200 &&
      yearsRes.data.data.some((y) => y.code === "1st Year") &&
      yearsRes.data.data.some((y) => y.code === "4th Year"),
      "Academic Years (1st Year, 2nd Year, 3rd Year, 4th Year) retrieved"
    );

    // 7. Verify Distinct Subjects per exact Course + Branch + Year
    const sub1stIT = await request({
      ...baseUrl,
      path: `/api/academic/subjects?course=B.Tech&branch=${encodeURIComponent("Information Technology")}&year=1st%20Year`,
      method: "GET"
    });
    const sub4thIT = await request({
      ...baseUrl,
      path: `/api/academic/subjects?course=B.Tech&branch=${encodeURIComponent("Information Technology")}&year=4th%20Year`,
      method: "GET"
    });

    const it1Codes = sub1stIT.data.data.map((s) => s.subject_code);
    const it4Codes = sub4thIT.data.data.map((s) => s.subject_code);

    assert(
      it1Codes.includes("BAS101") && it1Codes.includes("CS101") && !it1Codes.includes("CS403"),
      "B.Tech IT 1st Year loads foundational curriculum (BAS101, CS101)"
    );
    assert(
      it4Codes.includes("CS403") && it4Codes.includes("CS402") && !it4Codes.includes("BAS101"),
      "B.Tech IT 4th Year loads distinct advanced curriculum (CS403, CS402) - No year overlap"
    );

    // 8. Issue Fresh Student ID with Subjects & Zero Fake Attendance
    const testStudentId = `STU-TEST-${Date.now().toString().slice(-4)}`;
    const studentEmail = `student.${Date.now().toString().slice(-4)}@attendx.com`;
    const issueStudentRes = await request(
      { ...baseUrl, path: "/api/students/issue", method: "POST" },
      {
        studentId: testStudentId,
        fullName: "Aryan Malhotra",
        course: "B.Tech",
        branch: "Information Technology",
        year: "1st Year",
        email: studentEmail,
        phone: "9876501234",
        assignedSubjects: [
          { code: "BAS101", name: "Engineering Mathematics I", room: "LT-101" },
          { code: "CS101", name: "Programming in C", room: "Lab 102" }
        ]
      }
    );

    assert(
      issueStudentRes.status === 201 && issueStudentRes.data.success,
      `Official Student ID (${testStudentId}) issued successfully`
    );
    assert(
      issueStudentRes.data.student.overallAttendance === 0.0,
      "Freshly issued student initializes with exactly 0.0% attendance (Zero Fake Demo Data)"
    );

    // 9. Verify Student Profile & Teacher Name Enrichment from SQLite
    const studentProfileRes = await request({
      ...baseUrl,
      path: `/api/students/${testStudentId}`,
      method: "GET"
    });
    assert(
      studentProfileRes.status === 200 &&
      studentProfileRes.data.success &&
      studentProfileRes.data.data.assignedSubjects.length === 2 &&
      studentProfileRes.data.data.overallAttendance === 0.0,
      `Student profile retrieved from SQLite with assigned subjects and live 0% attendance`
    );

    // 10. Issue Fresh Teacher ID with Academic Scope & Class Assignments
    const testTeacherId = `TCH-TEST-${Date.now().toString().slice(-4)}`;
    const teacherEmail = `faculty.${Date.now().toString().slice(-4)}@attendx.com`;
    const issueTeacherRes = await request(
      { ...baseUrl, path: "/api/teachers/issue", method: "POST" },
      {
        teacherId: testTeacherId,
        fullName: "Dr. Kameshwar Rao",
        department: "Information Technology",
        designation: "Associate Professor",
        email: teacherEmail,
        phone: "9876505678",
        assignedCourses: ["B.Tech"],
        assignedBranches: ["Information Technology"],
        assignedYears: ["1st Year", "4th Year"],
        assignedSubjects: [
          { code: "CS101", name: "Programming in C", room: "Lab 102" },
          { code: "CS405", name: "Information & Cyber Security", room: "Lab 305" }
        ],
        assignedClasses: ["IT-1A", "IT-4A"]
      }
    );

    assert(
      issueTeacherRes.status === 201 && issueTeacherRes.data.success,
      `Official Teacher ID (${testTeacherId}) issued with academic classes and subjects`
    );

    // 11. Verify Teacher Profile & Assignments from SQLite
    const teacherProfileRes = await request({
      ...baseUrl,
      path: `/api/teachers/${testTeacherId}`,
      method: "GET"
    });
    assert(
      teacherProfileRes.status === 200 &&
      teacherProfileRes.data.success &&
      teacherProfileRes.data.data.assignedClasses.includes("IT-1A") &&
      teacherProfileRes.data.data.assignments.length >= 2,
      `Teacher profile and teacher_assignments records verified in database`
    );

    // 12. Authenticate Newly Issued Student with Credentials
    const studentLoginRes = await request(
      { ...baseUrl, path: "/api/auth/login", method: "POST" },
      { identifier: testStudentId, password: "Student@123", role: "student" }
    );
    assert(
      studentLoginRes.status === 200 &&
      studentLoginRes.data.success &&
      studentLoginRes.data.token &&
      studentLoginRes.data.user.profile.student_id === testStudentId,
      `Newly issued student successfully logs into portal with JWT authentication`
    );

    // 13. Authenticate Newly Issued Teacher with Credentials
    const teacherLoginRes = await request(
      { ...baseUrl, path: "/api/auth/login", method: "POST" },
      { identifier: testTeacherId, password: "Teacher@123", role: "teacher" }
    );
    assert(
      teacherLoginRes.status === 200 &&
      teacherLoginRes.data.success &&
      teacherLoginRes.data.token &&
      teacherLoginRes.data.user.profile.teacher_id === testTeacherId,
      `Newly issued faculty successfully logs into portal with JWT authentication`
    );

    // 14. Reject Duplicate Student ID
    const duplicateStudentRes = await request(
      { ...baseUrl, path: "/api/students/issue", method: "POST" },
      {
        studentId: testStudentId,
        fullName: "Another Student",
        course: "B.Tech",
        branch: "IT",
        year: "1st Year",
        email: "duplicate@attendx.com"
      }
    );
    assert(
      duplicateStudentRes.status === 400 && !duplicateStudentRes.data.success,
      "Duplicate Student ID issuance properly blocked by database integrity guard"
    );

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log("\n=========================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("=========================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
