/*
=========================================================
ATTENDX - USER & IDENTITY MANAGEMENT SERVICE
=========================================================
Supports Admin issuance of Student & Teacher IDs,
registration approvals, leave requests, and notifications.
=========================================================
*/

import { loadState, saveState, resetState } from "../data/demoData.js";
import { api } from "./api.js";

export const userService = {
  // Students
  getStudents() {
    return loadState().students;
  },

  issueStudentId(data) {
    const state = loadState();
    // Auto-generate next Student ID if not provided
    const nextNum = state.students.length + 1;
    const studentId = data.studentId || `STU-2026-${String(nextNum).padStart(3, "0")}`;

    const exists = state.students.some((s) => s.studentId === studentId);
    if (exists) {
      return { success: false, error: `Student ID ${studentId} is already issued.` };
    }

    const newStudent = {
      studentId,
      fullName: data.fullName,
      course: data.course || "B.Tech",
      branch: data.branch || "Computer Science & Engineering",
      year: data.year || "1st Year",
      rollNumber: data.rollNumber || `2100970100${String(nextNum).padStart(3, "0")}`,
      email: data.email || `${studentId.toLowerCase()}@attendx.com`,
      phone: data.phone || "9876500000",
      parentName: data.parentName || "Parent",
      parentPhone: data.parentPhone || "9876500001",
      parentEmail: data.parentEmail || "",
      address: data.address || "Campus Hostel Block",
      status: "Active",
      faceEnrolled: false,
      issuedDate: new Date().toISOString().split("T")[0],
      overallAttendance: 100
    };

    state.students.unshift(newStudent);
    saveState(state);

    // Fullstack: Persist to Backend SQLite
    api.post("/api/students/issue", {
      studentId,
      fullName: data.fullName,
      course: newStudent.course,
      branch: newStudent.branch,
      year: newStudent.year,
      rollNumber: newStudent.rollNumber,
      email: newStudent.email,
      phone: newStudent.phone,
      parentName: newStudent.parentName,
      parentPhone: newStudent.parentPhone,
      address: newStudent.address
    }).catch((e) => console.warn("[AttendX Fullstack] Student ID issuance backend sync:", e.message));

    return {
      success: true,
      student: newStudent,
      message: `Authorized Student ID ${studentId} issued for ${data.fullName}.`
    };
  },

  toggleStudentStatus(studentId) {
    const state = loadState();
    const student = state.students.find((s) => s.studentId === studentId);
    if (!student) return { success: false, error: "Student not found" };

    student.status = student.status === "Active" ? "Suspended" : "Active";
    saveState(state);

    // Fullstack: Sync to backend SQLite
    api.patch(`/api/students/${studentId}/status`).catch((e) => console.warn("Backend status sync:", e.message));

    return {
      success: true,
      newStatus: student.status,
      message: `Student ${student.fullName} status updated to ${student.status}.`
    };
  },

  // Face Biometric Enrollment by Admin
  enrollStudentFace(studentId, { photoData = null, qualityScore = "99.4%" } = {}) {
    const state = loadState();
    const student = state.students.find((s) => s.studentId === studentId);
    if (!student) return { success: false, error: "Student record not found." };

    student.faceEnrolled = true;
    student.faceEnrolledDate = new Date().toISOString().split("T")[0];
    student.faceTemplateId = "FT-2026-" + Math.floor(1000 + Math.random() * 9000);
    student.faceQualityScore = qualityScore;
    if (photoData) {
      student.facePhotoUrl = photoData;
    }

    // Add notification for the student
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      recipientRole: "student",
      recipientId: studentId,
      title: "Biometric Face Enrolled by Admin",
      message: `Your facial biometric template (${student.faceTemplateId}) has been registered in the database by Institute Admin. You can now mark attendance using Face AI.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "success"
    });

    saveState(state);

    // Fullstack: Enroll in Express & calculate 512-d vector in SQLite database
    api.post("/api/students/biometric-enroll", {
      studentId,
      facePhotoBase64: photoData || "attendx_captured_snapshot_payload",
      qualityScore
    }).then((res) => {
      console.log(`[AttendX Fullstack] Biometric face vector enrolled in SQLite for ${studentId}:`, res);
    }).catch((e) => console.warn("[AttendX Fullstack] Face biometric enrollment backend sync:", e.message));

    return {
      success: true,
      student,
      message: `Biometric face data successfully registered in database for ${student.fullName} (${student.studentId}). Template: ${student.faceTemplateId}.`
    };
  },

  removeStudentFace(studentId) {
    const state = loadState();
    const student = state.students.find((s) => s.studentId === studentId);
    if (!student) return { success: false, error: "Student record not found." };

    student.faceEnrolled = false;
    delete student.faceEnrolledDate;
    delete student.faceTemplateId;
    delete student.facePhotoUrl;

    saveState(state);

    // Fullstack: Delete vector from backend SQLite
    api.delete(`/api/students/${studentId}/biometric`).catch((e) => console.warn("Backend remove face sync:", e.message));

    return {
      success: true,
      message: `Biometric face template removed for ${student.fullName}.`
    };
  },

  // Teachers
  getTeachers() {
    return loadState().teachers;
  },

  issueTeacherId(data) {
    const state = loadState();
    const nextNum = state.teachers.length + 1;
    const teacherId = data.teacherId || `TCH-2026-${String(nextNum).padStart(3, "0")}`;

    const exists = state.teachers.some((t) => t.teacherId === teacherId);
    if (exists) {
      return { success: false, error: `Teacher ID ${teacherId} already exists.` };
    }

    const newTeacher = {
      teacherId,
      fullName: data.fullName,
      department: data.department || "Computer Science & Engineering",
      designation: data.designation || "Assistant Professor",
      email: data.email || `${teacherId.toLowerCase()}@attendx.com`,
      phone: data.phone || "9876599999",
      subjects: data.subjects || [{ code: "CS101", name: "Intro to Computing", room: "LT-101" }],
      status: "Active",
      issuedDate: new Date().toISOString().split("T")[0]
    };

    state.teachers.unshift(newTeacher);
    saveState(state);

    // Fullstack: Sync to backend SQLite
    api.post("/api/teachers/issue", {
      teacherId,
      fullName: data.fullName,
      department: newTeacher.department,
      designation: newTeacher.designation,
      email: newTeacher.email,
      phone: newTeacher.phone,
      subjects: newTeacher.subjects
    }).catch((e) => console.warn("Backend teacher issue sync:", e.message));

    return {
      success: true,
      teacher: newTeacher,
      message: `Official Teacher ID ${teacherId} issued to ${data.fullName}.`
    };
  },

  toggleTeacherStatus(teacherId) {
    const state = loadState();
    const teacher = state.teachers.find((t) => t.teacherId === teacherId);
    if (!teacher) return { success: false, error: "Teacher not found" };

    teacher.status = teacher.status === "Active" ? "Suspended" : "Active";
    saveState(state);

    // Fullstack: Sync to backend SQLite
    api.patch(`/api/teachers/${teacherId}/status`).catch((e) => console.warn("Backend teacher status sync:", e.message));

    return {
      success: true,
      newStatus: teacher.status,
      message: `Teacher ${teacher.fullName} is now ${teacher.status}.`
    };
  },

  // Registration approvals
  getPendingRegistrations() {
    return loadState().pendingRegistrations;
  },

  reviewRegistration(id, action) {
    const state = loadState();
    const index = state.pendingRegistrations.findIndex((r) => r.id === id);
    if (index === -1) return { success: false, error: "Registration record not found." };

    const req = state.pendingRegistrations[index];
    if (action === "approve") {
      // Add or activate teacher
      const exists = state.teachers.find((t) => t.teacherId === req.teacherId);
      if (!exists) {
        state.teachers.push({
          teacherId: req.teacherId,
          fullName: req.fullName,
          department: req.department,
          designation: "Assistant Professor",
          email: req.email,
          phone: req.phone,
          subjects: [{ code: "CS404", name: "Advanced Web Technologies", room: "Lab 102" }],
          status: "Active",
          issuedDate: new Date().toISOString().split("T")[0]
        });
      }
      state.pendingRegistrations.splice(index, 1);
      saveState(state);

      // Fullstack: Sync approval to backend
      api.patch(`/api/admin/registrations/${id}/approve`).catch((e) => console.warn("Backend approval sync:", e.message));

      return { success: true, message: `Approved faculty registration for ${req.fullName} (${req.teacherId}).` };
    } else {
      // Reject
      state.pendingRegistrations.splice(index, 1);
      saveState(state);

      // Fullstack: Sync rejection to backend
      api.patch(`/api/admin/registrations/${id}/reject`).catch((e) => console.warn("Backend reject sync:", e.message));

      return { success: true, message: `Registration request for ${req.fullName} was rejected.` };
    }
  },

  // Leave Requests
  getLeaveRequests(studentId) {
    const state = loadState();
    if (!studentId) return state.leaveRequests;
    return state.leaveRequests.filter((l) => l.studentId === studentId);
  },

  submitLeaveRequest({ studentId, studentName, fromDate, toDate, reason, category }) {
    const state = loadState();
    const newReq = {
      id: "LR-" + Math.floor(500 + Math.random() * 500),
      studentId,
      studentName,
      fromDate,
      toDate,
      reason,
      category: category || "Academic",
      submittedOn: new Date().toISOString().split("T")[0],
      status: "Pending",
      adminRemarks: "Submitted for department faculty review."
    };

    state.leaveRequests.unshift(newReq);
    saveState(state);

    // Fullstack: Sync to backend SQLite
    api.post("/api/leaves/submit", {
      studentId,
      studentName,
      fromDate,
      toDate,
      reason,
      category
    }).catch((e) => console.warn("Backend leave sync:", e.message));

    return { success: true, request: newReq, message: "Leave application submitted successfully." };
  },

  // Notifications
  getNotifications(role, userId) {
    const state = loadState();
    return state.notifications.filter(
      (n) => n.recipientRole === role || (userId && n.recipientId === userId)
    );
  },

  markNotificationRead(id) {
    const state = loadState();
    const notif = state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      saveState(state);
      api.patch(`/api/notifications/${id}/read`).catch(() => {});
    }
  },

  // Campus Geofence config
  getCampusGeofence() {
    return loadState().campusGeofence;
  },

  updateCampusGeofence(updatedConfig) {
    const state = loadState();
    state.campusGeofence = { ...state.campusGeofence, ...updatedConfig };
    saveState(state);

    // Fullstack: Sync to backend SQLite
    api.put("/api/admin/geofence", {
      campusName: state.campusGeofence.campusName,
      latitude: state.campusGeofence.latitude,
      longitude: state.campusGeofence.longitude,
      radiusMeters: state.campusGeofence.radiusMeters,
      strictMode: state.campusGeofence.strictMode
    }).catch((e) => console.warn("Backend geofence sync:", e.message));

    return { success: true, campusGeofence: state.campusGeofence };
  },

  resetAllData() {
    return resetState();
  }
};
