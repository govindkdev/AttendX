/*
=========================================================
ATTENDX - 10 AUTHENTICATION TEST CASES VERIFICATION
=========================================================
Tests all 10 authentication scenarios required by AttendX:
1. Valid Student ID + correct password (STU-2026-006 + Student@123)
2. Valid Student Email + correct password (govindkush749@gmail.com + Student@123)
3. Valid Student ID + wrong password (STU-2026-006 + WrongPass@99)
4. Unknown Student ID (STU-9999-999)
5. Unknown Email (nobody@attendx.com)
6. Inactive / Suspended Student account
7. Valid Teacher ID / Email + password (TCH-2026-001 / teacher@attendx.com + Teacher@123)
8. Valid Admin ID / Email + password (ADM-2026-001 / admin@attendx.com + Admin@123)
9. Student credentials submitted to Teacher portal (Role mismatch)
10. Valid session token generation & verification
=========================================================
*/

const http = require("http");
const db = require("../config/database");

function request(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("=========================================================");
  console.log("RUNNING ATTENDX 10 AUTHENTICATION VERIFICATION TEST CASES");
  console.log("=========================================================");

  let passed = 0;
  let total = 10;

  // TEST 1: Valid Student ID + correct password
  try {
    const res = await request("/api/auth/login", {
      identifier: "STU-2026-006",
      password: "Student@123",
      role: "student"
    });
    if (res.status === 200 && res.body.success && res.body.token && res.body.user.identifier === "STU-2026-006") {
      console.log("✓ TEST 1 PASSED: Valid Student ID (STU-2026-006) authenticated successfully.");
      passed++;
    } else {
      console.error("✗ TEST 1 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 1 ERROR:", e.message);
  }

  // TEST 2: Valid Student Email + correct password
  try {
    const res = await request("/api/auth/login", {
      identifier: "govindkush749@gmail.com",
      password: "Student@123",
      role: "student"
    });
    if (res.status === 200 && res.body.success && res.body.token && res.body.user.email === "govindkush749@gmail.com") {
      console.log("✓ TEST 2 PASSED: Valid Student Email (govindkush749@gmail.com) authenticated successfully.");
      passed++;
    } else {
      console.error("✗ TEST 2 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 2 ERROR:", e.message);
  }

  // TEST 3: Valid Student ID + wrong password
  try {
    const res = await request("/api/auth/login", {
      identifier: "STU-2026-006",
      password: "WrongPassword999!",
      role: "student"
    });
    if (res.status === 401 && !res.body.success && res.body.error.includes("Incorrect password")) {
      console.log("✓ TEST 3 PASSED: Wrong password correctly rejected with 401.");
      passed++;
    } else {
      console.error("✗ TEST 3 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 3 ERROR:", e.message);
  }

  // TEST 4: Unknown Student ID
  try {
    const res = await request("/api/auth/login", {
      identifier: "STU-9999-999",
      password: "Student@123",
      role: "student"
    });
    if (res.status === 401 && !res.body.success && res.body.error.includes("No active student account found")) {
      console.log("✓ TEST 4 PASSED: Unknown Student ID correctly rejected with 401.");
      passed++;
    } else {
      console.error("✗ TEST 4 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 4 ERROR:", e.message);
  }

  // TEST 5: Unknown Email
  try {
    const res = await request("/api/auth/login", {
      identifier: "nobody@attendx-not-found.com",
      password: "Student@123",
      role: "student"
    });
    if (res.status === 401 && !res.body.success && res.body.error.includes("No active student account found")) {
      console.log("✓ TEST 5 PASSED: Unknown Email correctly rejected with 401.");
      passed++;
    } else {
      console.error("✗ TEST 5 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 5 ERROR:", e.message);
  }

  // TEST 6: Inactive or Suspended Student
  try {
    // Temporarily mark a student as Suspended
    db.prepare("UPDATE students SET status = 'Suspended' WHERE student_id = 'STU-TEST-0336'").run();
    const res = await request("/api/auth/login", {
      identifier: "STU-TEST-0336",
      password: "Student@123",
      role: "student"
    });
    // Restore status
    db.prepare("UPDATE students SET status = 'Active' WHERE student_id = 'STU-TEST-0336'").run();

    if (res.status === 403 && !res.body.success && res.body.error.includes("deactivated")) {
      console.log("✓ TEST 6 PASSED: Suspended account blocked with 403 status.");
      passed++;
    } else {
      console.error("✗ TEST 6 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 6 ERROR:", e.message);
  }

  // TEST 7: Valid Teacher ID / Email + password
  try {
    const res = await request("/api/auth/login", {
      identifier: "TCH-2026-001",
      password: "Teacher@123",
      role: "teacher"
    });
    if (res.status === 200 && res.body.success && res.body.role === "teacher") {
      console.log("✓ TEST 7 PASSED: Valid Teacher ID authenticated successfully.");
      passed++;
    } else {
      console.error("✗ TEST 7 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 7 ERROR:", e.message);
  }

  // TEST 8: Valid Admin ID / Email + password
  try {
    const res = await request("/api/auth/login", {
      identifier: "ADM-2026-001",
      password: "Admin@123",
      role: "admin"
    });
    if (res.status === 200 && res.body.success && res.body.role === "admin") {
      console.log("✓ TEST 8 PASSED: Valid Admin ID authenticated successfully.");
      passed++;
    } else {
      console.error("✗ TEST 8 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 8 ERROR:", e.message);
  }

  // TEST 9: Student credentials submitted on Teacher portal (Role mismatch)
  try {
    const res = await request("/api/auth/login", {
      identifier: "STU-2026-006",
      password: "Student@123",
      role: "teacher"
    });
    if (res.status === 401 && !res.body.success && res.body.error.includes("registered under the Student portal")) {
      console.log("✓ TEST 9 PASSED: Role mismatch blocked with explanatory message.");
      passed++;
    } else {
      console.error("✗ TEST 9 FAILED:", res.status, res.body);
    }
  } catch (e) {
    console.error("✗ TEST 9 ERROR:", e.message);
  }

  // TEST 10: Valid Token Verification & Route Protection
  try {
    const loginRes = await request("/api/auth/login", {
      identifier: "STU-2026-006",
      password: "Student@123",
      role: "student"
    });
    const token = loginRes.body.token;

    // Verify token endpoint
    const meRes = await new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/me",
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      };
      const req = http.request(options, (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
      });
      req.on("error", reject);
      req.end();
    });

    if (meRes.status === 200 && meRes.body.success && meRes.body.user.identifier === "STU-2026-006") {
      console.log("✓ TEST 10 PASSED: JWT Bearer token validated and profile returned.");
      passed++;
    } else {
      console.error("✗ TEST 10 FAILED:", meRes.status, meRes.body);
    }
  } catch (e) {
    console.error("✗ TEST 10 ERROR:", e.message);
  }

  console.log("=========================================================");
  console.log(`TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log("=========================================================");
}

runTests();
