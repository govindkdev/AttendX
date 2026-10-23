/*
=========================================================
ATTENDX - COMPLETE ADMIN DASHBOARD
=========================================================
Authority-controlled institutional admin dashboard with:
- Overview Metrics & Institute Activity
- Student Identity Management (Issue Student ID, Activate/Suspend)
- Teacher Identity Management (Issue Teacher ID, Activate/Suspend)
- Registration Approvals (Approve/Reject pending faculty requests)
- Attendance Sessions Monitor (Active sessions, force-close)
- Campus Geofencing Settings (Coordinates, perimeter radius, strict mode)
- Reports & Institutional Analytics (CSV export)
- System Settings (Seed data reset, authority allowlist)
=========================================================
*/

import React, { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { attendanceService } from "../services/attendanceService";
import { userService } from "../services/userService";
import AdminFaceEnrollModal from "../components/attendance/AdminFaceEnrollModal";
import "../styles/dashboard.css";

export default function AdminDashboard() {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pendingRegs, setPendingRegs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [geofence, setGeofence] = useState(userService.getCampusGeofence());
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Modals for Issuing IDs & Face Enrollment
  const [showIssueStudentModal, setShowIssueStudentModal] = useState(false);
  const [showIssueTeacherModal, setShowIssueTeacherModal] = useState(false);
  const [showFaceEnrollModal, setShowFaceEnrollModal] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState(null);

  // Issue Student Form
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: "",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    year: "1st Year",
    email: "",
    phone: ""
  });

  // Issue Teacher Form
  const [newTeacherForm, setNewTeacherForm] = useState({
    fullName: "",
    department: "Computer Science & Engineering",
    designation: "Assistant Professor",
    email: "",
    phone: ""
  });

  // Geofence form state
  const [geoForm, setGeoForm] = useState({
    campusName: geofence.campusName,
    latitude: geofence.latitude,
    longitude: geofence.longitude,
    radiusMeters: geofence.radiusMeters,
    strictMode: geofence.strictMode
  });

  const refreshData = () => {
    setStudents(userService.getStudents());
    setTeachers(userService.getTeachers());
    setPendingRegs(userService.getPendingRegistrations());
    setActiveSessions(attendanceService.getActiveSessions());
    const state = JSON.parse(localStorage.getItem("attendx_prototype_state_v1") || "{}");
    if (state.attendanceHistory) setAttendanceLogs(state.attendanceHistory);
    const geo = userService.getCampusGeofence();
    setGeofence(geo);
    setGeoForm(geo);
  };

  useEffect(() => {
    const user = authService.getCurrentUser() || {
      role: "admin",
      id: "ADM-2026-001",
      name: "Prof. Amitabh Verma",
      title: "Chief Attendance Administrator",
      authority: "AttendX Institutional Controller",
      email: "admin@attendx.com"
    };
    setCurrentAdmin(user);
    refreshData();
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  const showBannerMessage = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4500);
  };

  // Issue Student Handler
  const handleIssueStudentSubmit = (e) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim()) return;

    const res = userService.issueStudentId(newStudentForm);
    if (res.success) {
      showBannerMessage(res.message);
      setShowIssueStudentModal(false);
      setNewStudentForm({ fullName: "", course: "B.Tech", branch: "Computer Science & Engineering", year: "1st Year", email: "", phone: "" });
      refreshData();
    } else {
      alert(res.error);
    }
  };

  // Issue Teacher Handler
  const handleIssueTeacherSubmit = (e) => {
    e.preventDefault();
    if (!newTeacherForm.fullName.trim()) return;

    const res = userService.issueTeacherId(newTeacherForm);
    if (res.success) {
      showBannerMessage(res.message);
      setShowIssueTeacherModal(false);
      setNewTeacherForm({ fullName: "", department: "Computer Science & Engineering", designation: "Assistant Professor", email: "", phone: "" });
      refreshData();
    } else {
      alert(res.error);
    }
  };

  // Toggle student active/suspend
  const handleToggleStudent = (id) => {
    const res = userService.toggleStudentStatus(id);
    if (res.success) {
      showBannerMessage(res.message);
      refreshData();
    }
  };

  // Toggle teacher active/suspend
  const handleToggleTeacher = (id) => {
    const res = userService.toggleTeacherStatus(id);
    if (res.success) {
      showBannerMessage(res.message);
      refreshData();
    }
  };

  // Face Biometric Handlers
  const handleOpenFaceEnroll = (student) => {
    setSelectedStudentForEnroll(student);
    setShowFaceEnrollModal(true);
  };

  const handleRemoveFace = (studentId) => {
    if (window.confirm("Remove biometric facial template for this student from database?")) {
      const res = userService.removeStudentFace(studentId);
      if (res.success) {
        showBannerMessage(res.message);
        refreshData();
      }
    }
  };

  // Registration Review (Approve/Reject)
  const handleReviewReg = (id, action) => {
    const res = userService.reviewRegistration(id, action);
    if (res.success) {
      showBannerMessage(res.message);
      refreshData();
    }
  };

  // Save Geofence Settings
  const handleSaveGeofence = (e) => {
    e.preventDefault();
    userService.updateCampusGeofence({
      campusName: geoForm.campusName,
      latitude: Number(geoForm.latitude),
      longitude: Number(geoForm.longitude),
      radiusMeters: Number(geoForm.radiusMeters),
      strictMode: geoForm.strictMode
    });
    showBannerMessage("Campus Geo-Fencing configuration updated successfully.");
    refreshData();
  };

  return (
    <div className="attendx-dashboard-layout">
      {/* ===================================================
          SIDEBAR
          =================================================== */}
      <aside className={`attendx-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <a href="/admin-dashboard" className="brand-link">
            <div className="brand-symbol" style={{ background: "linear-gradient(135deg, #EB5E55 0%, #FF8E8E 100%)" }}>
              A
            </div>
            <div className="brand-meta">
              <h2>AttendX</h2>
              <span className="brand-role-badge admin">Authority Admin</span>
            </div>
          </a>
          <button
            className="modal-close-btn"
            style={{ display: sidebarOpen ? "block" : "none", color: "#fff" }}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "students" ? "active" : ""}`}
            onClick={() => { setActiveTab("students"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🎓</span>
            <span>Student Identities</span>
            <span className="nav-badge">{students.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "face-enrollment" ? "active" : ""}`}
            onClick={() => { setActiveTab("face-enrollment"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📷</span>
            <span>Face Biometrics</span>
            <span className="nav-badge" style={{ background: "rgba(101, 215, 226, 0.2)", color: "var(--attendx-aqua)" }}>
              {students.filter((s) => s.faceEnrolled).length}/{students.length}
            </span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "teachers" ? "active" : ""}`}
            onClick={() => { setActiveTab("teachers"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👨‍🏫</span>
            <span>Teacher Identities</span>
            <span className="nav-badge">{teachers.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "approvals" ? "active" : ""}`}
            onClick={() => { setActiveTab("approvals"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📋</span>
            <span>Registration Approvals</span>
            {pendingRegs.length > 0 && (
              <span className="nav-badge" style={{ background: "var(--attendx-warning)", color: "#fff" }}>
                {pendingRegs.length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => { setActiveTab("sessions"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚡</span>
            <span>Active Sessions</span>
            {activeSessions.length > 0 && <span className="nav-badge">{activeSessions.length}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "geofence" ? "active" : ""}`}
            onClick={() => { setActiveTab("geofence"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📍</span>
            <span>Campus Geo-Fencing</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("reports"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span>Reports & Analytics</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚙</span>
            <span>Authority Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>↪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===================================================
          MAIN CONTENT AREA
          =================================================== */}
      <main className="attendx-main-area">
        {/* Topbar */}
        <header className="attendx-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div className="topbar-title">
              <h1>
                {activeTab === "dashboard" && "Institutional Admin Portal"}
                {activeTab === "students" && "Student Identity Management"}
                {activeTab === "face-enrollment" && "Biometric Face Enrollment Console"}
                {activeTab === "teachers" && "Teacher Identity Management"}
                {activeTab === "approvals" && "Registration Review & Approvals"}
                {activeTab === "sessions" && "Campus Attendance Sessions"}
                {activeTab === "geofence" && "Campus Perimeter & Geo-Fencing"}
                {activeTab === "reports" && "Institute Audit Reports & Analytics"}
                {activeTab === "settings" && "System & Authority Configuration"}
              </h1>
              <p>AttendX Enterprise Infrastructure • Central Authority Console</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="campus-status-pill">
              <span className="status-dot" />
              <span>Authority Verified</span>
            </div>

            <div className="topbar-user">
              <div className="user-avatar" style={{ background: "#EB5E55" }}>
                AV
              </div>
              <div className="user-details">
                <span className="user-name">{currentAdmin?.name || "Prof. Amitabh Verma"}</span>
                <span className="user-id">{currentAdmin?.id || "ADM-2026-001"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="dashboard-content">
          {feedbackMsg && (
            <div style={{
              padding: "12px 16px",
              background: "var(--attendx-success-bg)",
              color: "var(--attendx-success)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
              border: "1px solid rgba(18, 155, 103, 0.2)"
            }}>
              ✓ {feedbackMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Admin Banner */}
              <div className="attendx-banner-card" style={{ background: "linear-gradient(135deg, #161e38 0%, #222b4c 100%)" }}>
                <div className="banner-left">
                  <span className="banner-pill" style={{ background: "rgba(235, 94, 85, 0.2)", color: "#FF8E8E" }}>
                    CENTRAL INSTITUTIONAL AUTHORITY
                  </span>
                  <h2>{currentAdmin?.name || "Prof. Amitabh Verma"}</h2>
                  <p>
                    Full administrative governance over student identities, teacher authorizations, campus geofencing,
                    and cross-department attendance analytics.
                  </p>
                  <div className="banner-actions">
                    <button className="btn-primary" onClick={() => setShowIssueStudentModal(true)}>
                      <span>+</span>
                      <span>Issue Student ID</span>
                    </button>
                    <button className="btn-secondary" onClick={() => setShowIssueTeacherModal(true)}>
                      <span>+</span>
                      <span>Issue Teacher ID</span>
                    </button>
                  </div>
                </div>

                <div className="banner-right">
                  <div className="ai-pulse-ring" style={{ borderColor: "#FF8E8E" }}>
                    <div className="ai-core">
                      <span>{students.length}</span>
                      <small>STUDENTS</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Issued Student IDs</span>
                    <div className="stat-icon purple">🎓</div>
                  </div>
                  <div className="stat-value">{students.length}</div>
                  <div className="stat-subtext">Active student records</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Authorized Teachers</span>
                    <div className="stat-icon aqua">👨‍🏫</div>
                  </div>
                  <div className="stat-value">{teachers.length}</div>
                  <div className="stat-subtext">Department faculty</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Pending Approvals</span>
                    <div className="stat-icon orange">⏳</div>
                  </div>
                  <div className="stat-value">{pendingRegs.length}</div>
                  <div className="stat-subtext">Registrations awaiting review</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Campus Attendance</span>
                    <div className="stat-icon green">%</div>
                  </div>
                  <div className="stat-value">88.4%</div>
                  <div className="stat-subtext">Institute-wide daily average</div>
                </div>
              </div>

              {/* Identity Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <div>
                      <h3>Student Identity Registry</h3>
                      <p>Issue and manage official Student IDs</p>
                    </div>
                    <button className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setShowIssueStudentModal(true)}>
                      + Issue New ID
                    </button>
                  </div>
                  <div className="attendx-table-wrapper">
                    <table className="attendx-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Course</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 4).map((s) => (
                          <tr key={s.studentId}>
                            <td><code>{s.studentId}</code></td>
                            <td>{s.fullName}</td>
                            <td>{s.branch?.split(" ")[0]} ({s.year})</td>
                            <td><span className={`status-pill ${s.status.toLowerCase()}`}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <div>
                      <h3>Teacher Authorization Register</h3>
                      <p>Approved faculty accounts</p>
                    </div>
                    <button className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setShowIssueTeacherModal(true)}>
                      + Issue Teacher ID
                    </button>
                  </div>
                  <div className="attendx-table-wrapper">
                    <table className="attendx-table">
                      <thead>
                        <tr>
                          <th>Teacher ID</th>
                          <th>Name</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.slice(0, 4).map((t) => (
                          <tr key={t.teacherId}>
                            <td><code>{t.teacherId}</code></td>
                            <td>{t.fullName}</td>
                            <td>{t.department?.split(" ")[0]}</td>
                            <td><span className={`status-pill ${t.status.toLowerCase()}`}>{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: STUDENT IDENTITIES */}
          {activeTab === "students" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Authorized Student Identity Registry</h3>
                  <p>Students must be issued an official ID by Admin before registering</p>
                </div>
                <button className="btn-primary" onClick={() => setShowIssueStudentModal(true)}>
                  + Issue New Student ID
                </button>
              </div>

              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Course & Branch</th>
                      <th>Biometric Face</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => (
                      <tr key={stu.studentId}>
                        <td><code>{stu.studentId}</code></td>
                        <td>
                          <strong>{stu.fullName}</strong>
                          <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>Guardian: {stu.parentName}</div>
                        </td>
                        <td>{stu.rollNumber}</td>
                        <td>{stu.course} - {stu.branch} ({stu.year})</td>
                        <td>
                          {stu.faceEnrolled ? (
                            <span className="status-pill present" title={`Template: ${stu.faceTemplateId || "FT-2026-9042"}`}>
                              ✓ Enrolled
                            </span>
                          ) : (
                            <span className="status-pill late">
                              ⚠️ Not Enrolled
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${stu.status === "Active" ? "active" : "suspended"}`}>
                            {stu.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => handleOpenFaceEnroll(stu)}
                            >
                              {stu.faceEnrolled ? "Re-Scan" : "📷 Enroll Face"}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: "4px 8px", color: stu.status === "Active" ? "var(--attendx-error)" : "var(--attendx-success)" }}
                              onClick={() => handleToggleStudent(stu.studentId)}
                            >
                              {stu.status === "Active" ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FACE BIOMETRIC ENROLLMENT & DATABASE REGISTRY */}
          {activeTab === "face-enrollment" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Student Face Biometric Enrollment Console</h3>
                  <p>Capture and register 512-d biometric face templates in the institutional database before students can mark attendance via Face AI.</p>
                </div>
              </div>

              {/* Status Summary Banner */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 20
              }}>
                <div style={{ background: "var(--attendx-surface-subtle)", border: "1px solid var(--attendx-border)", padding: 16, borderRadius: "var(--radius-md)" }}>
                  <small style={{ color: "var(--attendx-text-muted)" }}>Total Students</small>
                  <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{students.length}</div>
                  <div style={{ fontSize: 11, color: "var(--attendx-text-muted)", marginTop: 2 }}>Registered in Portal</div>
                </div>
                <div style={{ background: "var(--attendx-success-bg)", border: "1px solid rgba(18, 155, 103, 0.2)", padding: 16, borderRadius: "var(--radius-md)" }}>
                  <small style={{ color: "var(--attendx-success)" }}>Enrolled in Database</small>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--attendx-success)", marginTop: 4 }}>
                    {students.filter((s) => s.faceEnrolled).length}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--attendx-success)", marginTop: 2 }}>Authorized for Face AI</div>
                </div>
                <div style={{ background: "var(--attendx-warning-bg)", border: "1px solid rgba(224, 135, 20, 0.2)", padding: 16, borderRadius: "var(--radius-md)" }}>
                  <small style={{ color: "var(--attendx-warning)" }}>Pending Enrollment</small>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--attendx-warning)", marginTop: 4 }}>
                    {students.filter((s) => !s.faceEnrolled).length}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--attendx-warning)", marginTop: 2 }}>Face AI Blocked until Enrolled</div>
                </div>
                <div style={{ background: "rgba(91, 95, 239, 0.08)", border: "1px solid rgba(91, 95, 239, 0.2)", padding: 16, borderRadius: "var(--radius-md)" }}>
                  <small style={{ color: "var(--attendx-indigo)" }}>Biometric Engine</small>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--attendx-indigo)", marginTop: 6 }}>
                    FaceNet 512-d Embeddings
                  </div>
                  <div style={{ fontSize: 11, color: "var(--attendx-text-muted)", marginTop: 2 }}>Anti-Spoofing Enabled</div>
                </div>
              </div>

              {/* Students Biometric Table */}
              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Course & Branch</th>
                      <th>Biometric Database Status</th>
                      <th>Template ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => (
                      <tr key={stu.studentId}>
                        <td><code>{stu.studentId}</code></td>
                        <td>
                          <strong>{stu.fullName}</strong>
                          <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>{stu.email}</div>
                        </td>
                        <td>{stu.course} - {stu.branch?.split(" ")[0]} ({stu.year})</td>
                        <td>
                          {stu.faceEnrolled ? (
                            <span className="status-pill present">
                              ✓ Enrolled in Database
                            </span>
                          ) : (
                            <span className="status-pill late">
                              ⚠️ Pending Face Registration
                            </span>
                          )}
                        </td>
                        <td>
                          {stu.faceEnrolled ? (
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--attendx-indigo)" }}>
                              {stu.faceTemplateId || "FT-2026-9042"}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>None</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            {stu.faceEnrolled ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ fontSize: 11, padding: "5px 10px" }}
                                  onClick={() => handleOpenFaceEnroll(stu)}
                                >
                                  🔄 Re-Scan Face
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ fontSize: 11, padding: "5px 10px", color: "var(--attendx-error)", borderColor: "var(--attendx-error)" }}
                                  onClick={() => handleRemoveFace(stu.studentId)}
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ fontSize: 11, padding: "6px 12px" }}
                                onClick={() => handleOpenFaceEnroll(stu)}
                              >
                                📷 Capture & Enroll Face
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHER IDENTITIES */}
          {activeTab === "teachers" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Authorized Faculty Identity Register</h3>
                  <p>Institute Admin issues Teacher IDs linked to department and subjects</p>
                </div>
                <button className="btn-primary" onClick={() => setShowIssueTeacherModal(true)}>
                  + Issue New Teacher ID
                </button>
              </div>

              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>Teacher ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((tch) => (
                      <tr key={tch.teacherId}>
                        <td><code>{tch.teacherId}</code></td>
                        <td><strong>{tch.fullName}</strong></td>
                        <td>{tch.designation}</td>
                        <td>{tch.department}</td>
                        <td>{tch.email}</td>
                        <td>
                          <span className={`status-pill ${tch.status === "Active" ? "active" : "suspended"}`}>
                            {tch.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: 11, padding: "4px 8px", color: tch.status === "Active" ? "var(--attendx-error)" : "var(--attendx-success)" }}
                            onClick={() => handleToggleTeacher(tch.teacherId)}
                          >
                            {tch.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REGISTRATION APPROVALS */}
          {activeTab === "approvals" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Pending Registration Requests</h3>
                  <p>Faculty accounts submitted for institutional verification</p>
                </div>
              </div>

              {pendingRegs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {pendingRegs.map((req) => (
                    <div key={req.id} style={{
                      border: "1px solid var(--attendx-border)",
                      borderRadius: "var(--radius-lg)",
                      padding: 18,
                      background: "var(--attendx-surface-subtle)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 14
                    }}>
                      <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                          <span className="method-tag">{req.role.toUpperCase()}</span>
                          <strong style={{ fontSize: 16 }}>{req.fullName}</strong>
                          <code>{req.teacherId}</code>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--attendx-text-muted)" }}>
                          Department: {req.department} • Phone: {req.phone} • Email: {req.email}
                        </div>
                        <p style={{ fontSize: 12, margin: "6px 0 0", color: "var(--attendx-indigo)" }}>
                          Note: {req.notes}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          className="btn-primary"
                          style={{ background: "var(--attendx-success)", fontSize: 13 }}
                          onClick={() => handleReviewReg(req.id, "approve")}
                        >
                          ✓ Approve Faculty
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ color: "var(--attendx-error)", borderColor: "var(--attendx-error)", fontSize: 13 }}
                          onClick={() => handleReviewReg(req.id, "reject")}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 36, color: "var(--attendx-text-muted)" }}>
                  No pending registration requests. All accounts are up to date.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVE SESSIONS */}
          {activeTab === "sessions" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Campus Attendance Sessions</h3>
                  <p>Live QR and Face recognition sessions active across departments</p>
                </div>
              </div>

              {activeSessions.length > 0 ? (
                <div className="attendx-table-wrapper">
                  <table className="attendx-table">
                    <thead>
                      <tr>
                        <th>Session ID</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                        <th>Session Code</th>
                        <th>Marked Count</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSessions.map((ses) => (
                        <tr key={ses.sessionId}>
                          <td><code>{ses.sessionId}</code></td>
                          <td><strong>{ses.subjectName}</strong> ({ses.subjectCode})</td>
                          <td>{ses.teacherName}</td>
                          <td>{ses.room}</td>
                          <td><b style={{ color: "var(--attendx-indigo)" }}>{ses.sessionCode}</b></td>
                          <td><span className="status-pill present">{ses.markedCount} / {ses.totalEnrolled}</span></td>
                          <td>
                            <button
                              className="btn-secondary"
                              style={{ color: "var(--attendx-error)", padding: "4px 8px", fontSize: 11 }}
                              onClick={() => {
                                attendanceService.closeSession(ses.sessionId);
                                refreshData();
                              }}
                            >
                              Force Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 36, color: "var(--attendx-text-muted)" }}>
                  No active classroom sessions currently running.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GEOFENCING CONFIGURATION */}
          {activeTab === "geofence" && (
            <div className="dashboard-card" style={{ maxWidth: 750, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Campus Geo-Fencing Perimeter Configuration</h3>
                  <p>Enforce location-based attendance limits across institution boundaries</p>
                </div>
              </div>

              <form onSubmit={handleSaveGeofence}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Campus Name</label>
                  <input
                    type="text"
                    required
                    value={geoForm.campusName}
                    onChange={(e) => setGeoForm({ ...geoForm, campusName: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Center Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={geoForm.latitude}
                      onChange={(e) => setGeoForm({ ...geoForm, latitude: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Center Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={geoForm.longitude}
                      onChange={(e) => setGeoForm({ ...geoForm, longitude: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Perimeter Radius (Meters)</label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    required
                    value={geoForm.radiusMeters}
                    onChange={(e) => setGeoForm({ ...geoForm, radiusMeters: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                  />
                  <small style={{ color: "var(--attendx-text-muted)", fontSize: 11 }}>
                    Students beyond this radius will receive a boundary violation when marking attendance.
                  </small>
                </div>

                <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    id="strictCheck"
                    checked={geoForm.strictMode}
                    onChange={(e) => setGeoForm({ ...geoForm, strictMode: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <label htmlFor="strictCheck" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Enforce Strict Geofencing (Reject attendance if outside perimeter)
                  </label>
                </div>

                <button type="submit" className="btn-primary">
                  Save Geo-Fencing Boundaries
                </button>
              </form>
            </div>
          )}

          {/* TAB 7: REPORTS */}
          {activeTab === "reports" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Institute Audit Reports & Analytics</h3>
                  <p>Comprehensive attendance logs for all academic departments</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => attendanceService.exportToCSV(attendanceLogs, "AttendX_Master_Institutional_Audit.csv")}
                >
                  📥 Export Master Audit CSV
                </button>
              </div>

              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Date & Time</th>
                      <th>Subject</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.slice(0, 15).map((log) => (
                      <tr key={log.id}>
                        <td><code>{log.id}</code></td>
                        <td><code>{log.studentId}</code></td>
                        <td>{log.studentName}</td>
                        <td>{log.date} {log.time}</td>
                        <td>{log.subject}</td>
                        <td><span className="method-tag">{log.method}</span></td>
                        <td><span className={`status-pill ${log.status.toLowerCase()}`}>{log.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === "settings" && (
            <div className="dashboard-card" style={{ maxWidth: 750, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Authority & Prototype Configuration</h3>
                  <p>AttendX Central Authority allowlist and demo state management</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{
                  border: "1px solid var(--attendx-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 18,
                  background: "var(--attendx-surface-subtle)"
                }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 15 }}>Authorized Admin ID Allowlist</h4>
                  <p style={{ fontSize: 12, color: "var(--attendx-text-muted)", margin: "0 0 10px" }}>
                    Only Admin IDs present in this list can register or verify accounts using the simulated OTP (123456):
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["ADM-2026-001", "ADM-2026-002", "ADM-2026-003"].map((id) => (
                      <code key={id} style={{ background: "#fff", padding: "6px 12px", border: "1px solid var(--attendx-border)", borderRadius: 6, fontWeight: 700 }}>
                        {id}
                      </code>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: 18,
                  border: "1px solid var(--attendx-error)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--attendx-error-bg)"
                }}>
                  <h4 style={{ color: "var(--attendx-error)", margin: "0 0 6px" }}>Reset All Demo Records</h4>
                  <p style={{ fontSize: 12, color: "var(--attendx-text-muted)", margin: "0 0 12px" }}>
                    Wipes local prototype modifications and resets student (STU-2026-001 Govind Kushwaha), teacher (TCH-2026-001 Dr. Rajesh Sharma), and admin accounts to factory seed data.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ background: "var(--attendx-error)" }}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to reset all prototype records?")) {
                        userService.resetAllData();
                        refreshData();
                        alert("Prototype state reset to default seed records.");
                      }
                    }}
                  >
                    Reset System to Seed State
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Issue Student ID */}
      {showIssueStudentModal && (
        <div className="attendx-modal-backdrop" onClick={() => setShowIssueStudentModal(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Issue Official Student ID</h3>
              <button className="modal-close-btn" onClick={() => setShowIssueStudentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueStudentSubmit} className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyanshu Maurya"
                  value={newStudentForm.fullName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Course</label>
                  <select
                    value={newStudentForm.course}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, course: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Branch</label>
                  <select
                    value={newStudentForm.branch}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, branch: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                  >
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Information Technology">Information Tech</option>
                    <option value="Electronics & Communication">Electronics</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Student Email</label>
                <input
                  type="email"
                  placeholder="student@attendx.com"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" style={{ color: "var(--attendx-text-primary)" }} onClick={() => setShowIssueStudentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate & Authorize ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Teacher ID */}
      {showIssueTeacherModal && (
        <div className="attendx-modal-backdrop" onClick={() => setShowIssueTeacherModal(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Issue Official Teacher ID</h3>
              <button className="modal-close-btn" onClick={() => setShowIssueTeacherModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueTeacherSubmit} className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Faculty Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Harish Chandra"
                  value={newTeacherForm.fullName}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, fullName: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Department</label>
                  <select
                    value={newTeacherForm.department}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, department: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                  >
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Information Technology">Information Tech</option>
                    <option value="Electronics & Communication">Electronics</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Designation</label>
                  <select
                    value={newTeacherForm.designation}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, designation: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Faculty Email</label>
                <input
                  type="email"
                  placeholder="faculty@attendx.com"
                  value={newTeacherForm.email}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, email: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" style={{ color: "var(--attendx-text-primary)" }} onClick={() => setShowIssueTeacherModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Issue Teacher ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Biometric Face Enrollment */}
      <AdminFaceEnrollModal
        isOpen={showFaceEnrollModal}
        onClose={() => setShowFaceEnrollModal(false)}
        student={selectedStudentForEnroll}
        onEnrolled={(updatedStudent) => {
          refreshData();
          showBannerMessage(`Biometric face registered for ${updatedStudent.fullName}.`);
        }}
      />
    </div>
  );
}
