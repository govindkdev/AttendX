/*
=========================================================
ATTENDX - AUTHENTICATION SERVICE (DEMO ARCHITECTURE)
=========================================================
Handles role-based authentication, temporary demo sessions,
allowlist validation, and registration approval workflows.

PRODUCTION LIMITATION NOTE:
This frontend demo validates against client-side mock data.
In production, authentication requires:
- Bcrypt/Argon2 password hashing
- HttpOnly JWT access/refresh tokens
- Rate-limited authorization endpoints
- Institutional SSO / LDAP integration
- Server-side multi-factor OTP via SMS/TOTP
=========================================================
*/

import { loadState, saveState } from "../data/demoData.js";
import { api, setAuthToken } from "./api.js";

const AUTH_USER_KEY = "attendx_authenticated_user";
export const DEMO_OTP = "123456";

export const authService = {
  /**
   * Authenticate role-based user
   * @param {'student'|'teacher'|'admin'} role
   * @param {string} identifier - Student ID, Teacher ID, Admin ID, or Email
   * @param {string} password
   */
  login(role, identifier, password) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const state = loadState();

    if (!role) {
      return { success: false, error: "Please select an account type." };
    }
    if (!cleanId) {
      return { success: false, error: "Please enter your AttendX ID or registered email." };
    }
    if (!cleanPass) {
      return { success: false, error: "Please enter your password." };
    }

    // Fullstack: Authenticate with Express Backend & obtain JWT Token
    api.post("/api/auth/login", {
      identifier: cleanId,
      password: cleanPass,
      role
    }).then((res) => {
      if (res && res.token) {
        setAuthToken(res.token);
        console.log(`[AttendX Fullstack] JWT authenticated for ${cleanId} (${role}). Token secured in localStorage.`);
      }
    }).catch((err) => {
      console.warn("[AttendX Fullstack] Backend login sync notification:", err.message);
    });

    // 1. STUDENT LOGIN
    if (role === "student") {
      // Hardcoded temporary demo account check
      const isDefaultDemo =
        (cleanId === "stu-2026-001" || cleanId === "student@attendx.com") &&
        cleanPass === "Student@123";

      // Dynamic check from demo state students
      const matchedStudent = state.students.find(
        (s) =>
          s.studentId.toLowerCase() === cleanId ||
          s.email.toLowerCase() === cleanId
      );

      if (isDefaultDemo || (matchedStudent && (cleanPass === "Student@123" || cleanPass === matchedStudent.tempPassword))) {
        const studentRecord = matchedStudent || state.students[0];
        if (studentRecord.status === "Suspended") {
          return { success: false, error: "Account is suspended by Institute Admin. Contact department." };
        }

        const userSession = {
          role: "student",
          id: studentRecord.studentId,
          name: studentRecord.fullName,
          email: studentRecord.email,
          course: studentRecord.course,
          branch: studentRecord.branch,
          year: studentRecord.year,
          rollNumber: studentRecord.rollNumber,
          phone: studentRecord.phone,
          faceEnrolled: studentRecord.faceEnrolled,
          overallAttendance: studentRecord.overallAttendance,
          loginTime: new Date().toISOString()
        };

        this.setSession(userSession);
        return { success: true, user: userSession, redirect: "/student-dashboard" };
      }

      return {
        success: false,
        error: "Invalid Student credentials. Try STU-2026-001 or student@attendx.com with Student@123"
      };
    }

    // 2. TEACHER LOGIN
    if (role === "teacher") {
      const isDefaultDemo =
        (cleanId === "tch-2026-001" || cleanId === "teacher@attendx.com") &&
        cleanPass === "Teacher@123";

      const matchedTeacher = state.teachers.find(
        (t) =>
          t.teacherId.toLowerCase() === cleanId ||
          t.email.toLowerCase() === cleanId
      );

      if (isDefaultDemo || (matchedTeacher && (cleanPass === "Teacher@123" || cleanPass === matchedTeacher.tempPassword))) {
        const teacherRecord = matchedTeacher || state.teachers[0];
        if (teacherRecord.status === "Suspended") {
          return { success: false, error: "Teacher ID has been deactivated by the Admin." };
        }

        const userSession = {
          role: "teacher",
          id: teacherRecord.teacherId,
          name: teacherRecord.fullName,
          email: teacherRecord.email,
          department: teacherRecord.department,
          designation: teacherRecord.designation,
          phone: teacherRecord.phone,
          subjects: teacherRecord.subjects,
          loginTime: new Date().toISOString()
        };

        this.setSession(userSession);
        return { success: true, user: userSession, redirect: "/teacher-dashboard" };
      }

      return {
        success: false,
        error: "Invalid Teacher credentials. Try TCH-2026-001 or teacher@attendx.com with Teacher@123 (Must be an Admin-issued Teacher ID)"
      };
    }

    // 3. ADMIN LOGIN
    if (role === "admin") {
      const isDefaultDemo =
        (cleanId === "adm-2026-001" || cleanId === "admin@attendx.com") &&
        cleanPass === "Admin@123";

      const matchedAdmin = state.admins.find(
        (a) =>
          a.adminId.toLowerCase() === cleanId ||
          a.email.toLowerCase() === cleanId
      );

      if (isDefaultDemo || (matchedAdmin && (cleanPass === "Admin@123" || cleanPass === matchedAdmin.tempPassword))) {
        const adminRecord = matchedAdmin || state.admins[0];
        const userSession = {
          role: "admin",
          id: adminRecord.adminId,
          name: adminRecord.fullName,
          email: adminRecord.email,
          title: adminRecord.title,
          authority: adminRecord.authority,
          phone: adminRecord.phone,
          loginTime: new Date().toISOString()
        };

        this.setSession(userSession);
        return { success: true, user: userSession, redirect: "/admin-dashboard" };
      }

      return {
        success: false,
        error: "Invalid Administrator credentials. Admin IDs must be authority-issued (e.g. ADM-2026-001 with Admin@123)."
      };
    }

    return { success: false, error: "Unsupported account role." };
  },

  /**
   * Register a new student
   * Validates that Student ID was pre-issued or pre-authorized by Institute Admin
   */
  registerStudent(formData) {
    const state = loadState();
    const cleanId = (formData.studentId || "").trim().toUpperCase();

    // Verification rule: Student ID must already exist in Admin's issued records
    const authorizedSlot = state.students.find(
      (s) => s.studentId.toUpperCase() === cleanId
    );

    if (!authorizedSlot) {
      return {
        success: false,
        error: `Student ID "${cleanId}" is not in the Admin Authorization Register. Student IDs must be issued by the Institute Admin before creating an account.`
      };
    }

    // Update authorized slot with student registration details
    authorizedSlot.fullName = formData.fullName.trim();
    authorizedSlot.course = formData.course;
    authorizedSlot.branch = formData.branch;
    authorizedSlot.year = formData.year;
    authorizedSlot.phone = formData.phone;
    authorizedSlot.email = formData.email.trim();
    authorizedSlot.parentName = formData.parentName;
    authorizedSlot.parentPhone = formData.parentPhone;
    authorizedSlot.parentEmail = formData.parentEmail || "";
    authorizedSlot.address = formData.address;
    authorizedSlot.tempPassword = formData.password; // Mock storage for prototype
    authorizedSlot.status = "Active";

    saveState(state);

    // Fullstack: Sync student registration to backend SQLite
    api.post("/api/auth/register", {
      role: "student",
      studentId: cleanId,
      fullName: formData.fullName.trim(),
      course: formData.course,
      branch: formData.branch,
      year: formData.year,
      phone: formData.phone,
      email: formData.email.trim(),
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail || "",
      address: formData.address,
      password: formData.password
    }).catch((e) => console.warn("[AttendX Fullstack] Student registration sync:", e.message));

    return {
      success: true,
      message: `Account created successfully for ${authorizedSlot.fullName} (${cleanId}). You may now log in.`
    };
  },

  /**
   * Register a new teacher
   * Validates Teacher ID against Admin-issued list
   */
  registerTeacher(formData) {
    const state = loadState();
    const cleanId = (formData.teacherId || "").trim().toUpperCase();

    const authorizedSlot = state.teachers.find(
      (t) => t.teacherId.toUpperCase() === cleanId
    );

    if (!authorizedSlot) {
      return {
        success: false,
        error: `Teacher ID "${cleanId}" is not recognized. Teacher IDs must be created and issued by the Institute Admin.`
      };
    }

    authorizedSlot.fullName = formData.fullName.trim();
    authorizedSlot.department = formData.department;
    authorizedSlot.phone = formData.phone;
    authorizedSlot.tempPassword = formData.password;
    authorizedSlot.status = "Active";

    // Add to pending approvals or record
    const pendingIndex = state.pendingRegistrations.findIndex((p) => p.teacherId === cleanId);
    if (pendingIndex >= 0) {
      state.pendingRegistrations.splice(pendingIndex, 1);
    }

    saveState(state);

    return {
      success: true,
      message: `Teacher registration completed for ${authorizedSlot.fullName}. Your ID ${cleanId} is verified.`
    };
  },

  /**
   * Register an administrator
   * Enforces AttendX Authority allowlist and simulated OTP 123456
   */
  registerAdmin(formData, otp) {
    const cleanOtp = (otp || "").trim();
    if (cleanOtp !== DEMO_OTP) {
      return {
        success: false,
        error: "Invalid simulated OTP. For this prototype, use demo verification code: 123456."
      };
    }

    const cleanId = (formData.adminId || "").trim().toUpperCase();
    const state = loadState();

    if (!state.authorityAllowlist.includes(cleanId)) {
      return {
        success: false,
        error: `Admin ID "${cleanId}" is not present in the AttendX Authority Allowlist. Only authorized campus officers may create Admin accounts.`
      };
    }

    let adminRecord = state.admins.find((a) => a.adminId === cleanId);
    if (!adminRecord) {
      adminRecord = {
        adminId: cleanId,
        fullName: formData.fullName || "Institutional Administrator",
        title: "Campus Administrator",
        authority: "AttendX Authority Certified",
        phone: formData.phone,
        email: formData.email || `${cleanId.toLowerCase()}@attendx.com`,
        status: "Active",
        tempPassword: formData.password
      };
      state.admins.push(adminRecord);
    } else {
      adminRecord.phone = formData.phone;
      adminRecord.tempPassword = formData.password;
    }

    saveState(state);

    return {
      success: true,
      message: `Admin ID ${cleanId} successfully registered and verified with simulated authority OTP.`
    };
  },

  /**
   * Reset Password with OTP verification
   */
  resetPassword(role, identifier, otp, newPassword) {
    if (otp !== DEMO_OTP) {
      return { success: false, error: "Invalid simulated OTP. Use 123456." };
    }

    const state = loadState();
    const cleanId = (identifier || "").trim().toLowerCase();

    if (role === "student") {
      const student = state.students.find(
        (s) => s.studentId.toLowerCase() === cleanId || s.email.toLowerCase() === cleanId
      );
      if (!student) return { success: false, error: "Student record not found." };
      student.tempPassword = newPassword;
      saveState(state);
      return { success: true, message: "Password reset successful! You may now login with your new password." };
    }

    if (role === "teacher") {
      const teacher = state.teachers.find(
        (t) => t.teacherId.toLowerCase() === cleanId || t.email.toLowerCase() === cleanId
      );
      if (!teacher) return { success: false, error: "Teacher record not found." };
      teacher.tempPassword = newPassword;
      saveState(state);
      return { success: true, message: "Password reset successful! You may now login." };
    }

    if (role === "admin") {
      const admin = state.admins.find(
        (a) => a.adminId.toLowerCase() === cleanId || a.email.toLowerCase() === cleanId
      );
      if (!admin) return { success: false, error: "Admin record not found." };
      admin.tempPassword = newPassword;
      saveState(state);
      return { success: true, message: "Administrator password reset successfully." };
    }

    return { success: false, error: "Invalid role specified." };
  },

  setSession(user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Backwards compatibility keys with existing project
    if (user.role === "student") {
      localStorage.setItem("attendx_student_logged_in", "true");
      localStorage.setItem("attendx_student_id", user.id);
      localStorage.setItem("attendx_student_name", user.name);
      localStorage.setItem("attendx_student_email", user.email);
    }
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (raw) return JSON.parse(raw);
      // Fallback for default student if legacy flag is set
      if (localStorage.getItem("attendx_student_logged_in") === "true") {
        return {
          role: "student",
          id: localStorage.getItem("attendx_student_id") || "STU-2026-001",
          name: localStorage.getItem("attendx_student_name") || "Govind Kushwaha",
          email: localStorage.getItem("attendx_student_email") || "student@attendx.com",
          course: "B.Tech",
          branch: "Computer Science & Engineering",
          year: "4th Year",
          overallAttendance: 87.5
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  logout() {
    setAuthToken("");
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem("attendx_student_logged_in");
    localStorage.removeItem("attendx_student_id");
    localStorage.removeItem("attendx_student_name");
    localStorage.removeItem("attendx_student_email");
  }
};
