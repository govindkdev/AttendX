/*
=========================================================
ATTENDX - COMPLETE TEACHER DASHBOARD
=========================================================
Role-based teacher portal with interactive views:
- Dashboard Overview (Assigned classes, today's metrics, quick actions)
- Take Attendance / Session Generator (Live QR generator with timer, Face kiosk)
- Student Roster & Manual Attendance (Toggle Present, Absent, Late)
- Class Reports (Subject-wise statistics, CSV export)
- Notifications & Profile
=========================================================
*/

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authService } from "../services/authService";
import { attendanceService } from "../services/attendanceService";
import { userService } from "../services/userService";
import { qrService } from "../services/qrService";
import "../styles/dashboard.css";

export default function TeacherDashboard() {
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Session state
  const [activeSession, setActiveSession] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(15);
  const [selectedSubject, setSelectedSubject] = useState("CS402");

  // Roster & manual marking
  const [studentsList, setStudentsList] = useState([]);
  const [rosterStatus, setRosterStatus] = useState({}); // { [studentId]: 'Present'|'Absent'|'Late' }
  const [rosterMsg, setRosterMsg] = useState("");

  // History & stats
  const [allAttendance, setAllAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const refreshData = (teacherId = "TCH-2026-001") => {
    const students = userService.getStudents();
    setStudentsList(students);

    // Initialize roster state
    const initialRoster = {};
    students.forEach((s) => {
      initialRoster[s.studentId] = s.status === "Suspended" ? "Absent" : "Present";
    });
    setRosterStatus(initialRoster);

    const activeSessions = attendanceService.getActiveSessions();
    if (activeSessions.length > 0) {
      setActiveSession(activeSessions[0]);
    }

    const state = JSON.parse(localStorage.getItem("attendx_prototype_state_v1") || "{}");
    if (state.attendanceHistory) setAllAttendance(state.attendanceHistory);
    setNotifications(userService.getNotifications("teacher", teacherId));
  };

  useEffect(() => {
    const user = authService.getCurrentUser() || {
      role: "teacher",
      id: "TCH-2026-001",
      name: "Dr. Rajesh Sharma",
      email: "teacher@attendx.com",
      department: "Computer Science & Engineering",
      designation: "Professor & HOD",
      subjects: [
        { code: "CS401", name: "Data Structures & Algorithms", room: "LT-102" },
        { code: "CS402", name: "Machine Learning & AI", room: "Lab 304" },
        { code: "CS403", name: "Cloud Computing & DevOps", room: "LT-201" }
      ]
    };
    setCurrentTeacher(user);
    refreshData(user.id);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  const handleCreateSession = () => {
    const subjectObj = (currentTeacher?.subjects || []).find((s) => s.code === selectedSubject) || {
      code: "CS402",
      name: "Machine Learning & AI",
      room: "Lab 304"
    };

    const newSession = attendanceService.createSession({
      subjectCode: subjectObj.code,
      subjectName: subjectObj.name,
      teacherId: currentTeacher?.id || "TCH-2026-001",
      teacherName: currentTeacher?.name || "Dr. Rajesh Sharma",
      room: subjectObj.room || "Lab 304",
      durationMinutes: Number(sessionDuration)
    });

    setActiveSession(newSession);
    refreshData(currentTeacher?.id);
  };

  const handleCloseSession = () => {
    if (activeSession) {
      attendanceService.closeSession(activeSession.sessionId);
      setActiveSession(null);
      refreshData(currentTeacher?.id);
    }
  };

  const handleRosterToggle = (studentId, status) => {
    setRosterStatus((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveRoster = () => {
    const subjectObj = (currentTeacher?.subjects || []).find((s) => s.code === selectedSubject) || {
      code: "CS402",
      name: "Machine Learning & AI",
      room: "Lab 304"
    };

    let markedCount = 0;
    studentsList.forEach((stu) => {
      const status = rosterStatus[stu.studentId] || "Present";
      attendanceService.markAttendance({
        studentId: stu.studentId,
        studentName: stu.fullName,
        subject: subjectObj.name,
        subjectCode: subjectObj.code,
        method: "Manual Record",
        geofenceVerified: true,
        confidence: "Teacher Verified",
        room: subjectObj.room,
        status
      });
      markedCount++;
    });

    setRosterMsg(`Attendance roster saved! Recorded status for ${markedCount} students.`);
    refreshData(currentTeacher?.id);
    setTimeout(() => setRosterMsg(""), 4000);
  };

  return (
    <div className="attendx-dashboard-layout">
      {/* ===================================================
          SIDEBAR
          =================================================== */}
      <aside className={`attendx-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <a href="/teacher-dashboard" className="brand-link">
            <div className="brand-symbol" style={{ background: "linear-gradient(135deg, #5156E4 0%, #8C90FF 100%)" }}>
              T
            </div>
            <div className="brand-meta">
              <h2>AttendX</h2>
              <span className="brand-role-badge teacher">Teacher Portal</span>
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
            className={`sidebar-nav-item ${activeTab === "session" ? "active" : ""}`}
            onClick={() => { setActiveTab("session"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">▣</span>
            <span>Live QR Attendance</span>
            {activeSession && <span className="nav-badge" style={{ background: "var(--attendx-success)" }}>Live</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "roster" ? "active" : ""}`}
            onClick={() => { setActiveTab("roster"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👥</span>
            <span>Class Roster & Manual</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("reports"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span>Class Reports</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🔔</span>
            <span>Notifications</span>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="nav-badge">{notifications.filter((n) => !n.read).length}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👤</span>
            <span>Faculty Profile</span>
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
                {activeTab === "dashboard" && "Teacher Dashboard"}
                {activeTab === "session" && "Attendance Session Generator"}
                {activeTab === "roster" && "Class Roster & Manual Attendance"}
                {activeTab === "reports" && "Class Attendance Reports"}
                {activeTab === "notifications" && "Faculty Notifications"}
                {activeTab === "profile" && "Faculty Profile & Subjects"}
              </h1>
              <p>{currentTeacher?.department || "Computer Science & Engineering"} • Department Faculty</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="campus-status-pill">
              <span className="status-dot" />
              <span>Campus Kiosk Ready</span>
            </div>

            <div className="topbar-user" onClick={() => setActiveTab("profile")} style={{ cursor: "pointer" }}>
              <div className="user-avatar" style={{ background: "var(--attendx-indigo)" }}>
                RS
              </div>
              <div className="user-details">
                <span className="user-name">{currentTeacher?.name || "Dr. Rajesh Sharma"}</span>
                <span className="user-id">{currentTeacher?.id || "TCH-2026-001"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="dashboard-content">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Teacher Hero Banner */}
              <div className="attendx-banner-card" style={{ background: "linear-gradient(135deg, #0d1730 0%, #1e2852 100%)" }}>
                <div className="banner-left">
                  <span className="banner-pill" style={{ background: "rgba(140, 144, 255, 0.2)", color: "#8C90FF" }}>
                    FACULTY CONTROL PANEL
                  </span>
                  <h2>Welcome, {currentTeacher?.name || "Dr. Rajesh Sharma"}</h2>
                  <p>
                    Manage lecture attendance, launch interactive rotating QR sessions for classroom projection,
                    and review real-time biometric student check-ins.
                  </p>
                  <div className="banner-actions">
                    <button className="btn-primary" onClick={() => setActiveTab("session")}>
                      <span>▣</span>
                      <span>Launch QR Attendance Session</span>
                    </button>
                    <button className="btn-secondary" onClick={() => setActiveTab("roster")}>
                      <span>👥</span>
                      <span>Open Student Roster</span>
                    </button>
                  </div>
                </div>

                <div className="banner-right">
                  <div className="ai-pulse-ring" style={{ borderColor: "#8C90FF" }}>
                    <div className="ai-core">
                      <span>3</span>
                      <small>COURSES</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Assigned Classes</span>
                    <div className="stat-icon purple">📚</div>
                  </div>
                  <div className="stat-value">{currentTeacher?.subjects?.length || 3}</div>
                  <div className="stat-subtext">Active semester subjects</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Total Enrolled Students</span>
                    <div className="stat-icon aqua">👥</div>
                  </div>
                  <div className="stat-value">{studentsList.length * 12 || 45}</div>
                  <div className="stat-subtext">Across all assigned batches</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Average Attendance</span>
                    <div className="stat-icon green">%</div>
                  </div>
                  <div className="stat-value">86.2%</div>
                  <div className="stat-subtext">Above 75% department threshold</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Active Live Session</span>
                    <div className="stat-icon orange">⚡</div>
                  </div>
                  <div className="stat-value">{activeSession ? "1 Active" : "None"}</div>
                  <div className="stat-subtext">{activeSession ? `${activeSession.subjectCode} (${activeSession.markedCount} marked)` : "No active session"}</div>
                </div>
              </div>

              {/* Assigned Subjects Overview */}
              <div className="dashboard-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Assigned Subjects & Lectures</h3>
                    <p>Current academic semester course allocations</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {(currentTeacher?.subjects || []).map((subj) => (
                    <div key={subj.code} style={{
                      border: "1px solid var(--attendx-border)",
                      borderRadius: "var(--radius-lg)",
                      padding: 18,
                      background: "var(--attendx-surface-subtle)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span className="method-tag">{subj.code}</span>
                        <span className="status-pill present">Room: {subj.room}</span>
                      </div>
                      <h4 style={{ margin: "0 0 6px", fontSize: 16 }}>{subj.name}</h4>
                      <p style={{ fontSize: 12, color: "var(--attendx-text-muted)", margin: "0 0 14px" }}>
                        Enrolled: 45 Students • Avg Attendance: 88%
                      </p>
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12, padding: "6px 14px", width: "100%" }}
                        onClick={() => {
                          setSelectedSubject(subj.code);
                          setActiveTab("session");
                        }}
                      >
                        Launch Attendance Session
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: LIVE QR SESSION GENERATOR */}
          {activeTab === "session" && (
            <div style={{ maxWidth: 850, margin: "0 auto" }}>
              <div className="dashboard-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Live QR Attendance Generator</h3>
                    <p>Project this screen in class for students to scan using their AttendX mobile portal</p>
                  </div>
                  {activeSession && (
                    <button className="btn-secondary" style={{ color: "var(--attendx-error)", borderColor: "var(--attendx-error)" }} onClick={handleCloseSession}>
                      End Session Now
                    </button>
                  )}
                </div>

                {!activeSession ? (
                  <div style={{
                    padding: 24,
                    border: "1px solid var(--attendx-border)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--attendx-surface-subtle)"
                  }}>
                    <h4 style={{ margin: "0 0 16px", fontSize: 16 }}>Configure New Attendance Session</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Select Subject</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                        >
                          {(currentTeacher?.subjects || []).map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.code} - {s.name} ({s.room})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Session Validity (Minutes)</label>
                        <select
                          value={sessionDuration}
                          onChange={(e) => setSessionDuration(e.target.value)}
                          style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                        >
                          <option value="5">5 Minutes (Quick Attendance)</option>
                          <option value="15">15 Minutes (Standard Lecture)</option>
                          <option value="30">30 Minutes (Extended Lab)</option>
                        </select>
                      </div>
                    </div>

                    <button className="btn-primary" onClick={handleCreateSession}>
                      ⚡ Generate Live QR Session
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{
                      display: "inline-block",
                      background: "#FFFFFF",
                      padding: 24,
                      borderRadius: "var(--radius-xl)",
                      boxShadow: "var(--shadow-lg)",
                      border: "2px solid var(--attendx-indigo)",
                      marginBottom: 16
                    }}>
                      {/* Real QR Code generated using qrcode.react */}
                      <QRCodeSVG
                        value={qrService.encodeSession(activeSession)}
                        size={240}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <h3 style={{ fontSize: 22, margin: "0 0 4px" }}>{activeSession.subjectName}</h3>
                    <p style={{ color: "var(--attendx-text-muted)", fontSize: 14, margin: "0 0 16px" }}>
                      Room: <b>{activeSession.room}</b> • Session Code: <b style={{ color: "var(--attendx-indigo)", fontSize: 16 }}>{activeSession.sessionCode}</b>
                    </p>

                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 20,
                      background: "var(--attendx-surface-subtle)",
                      padding: "10px 24px",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--attendx-border)",
                      fontSize: 13
                    }}>
                      <span>🟢 Status: <b>Live & Receiving</b></span>
                      <span>👥 Marked: <b style={{ color: "var(--attendx-success)" }}>{activeSession.markedCount}</b> / 45</span>
                    </div>

                    <div style={{
                      marginTop: 24,
                      fontSize: 12,
                      color: "var(--attendx-text-muted)",
                      maxWidth: 550,
                      margin: "24px auto 0",
                      lineHeight: 1.5
                    }}>
                      💡 <b>Teacher Note:</b> Students can scan this QR code directly through their AttendX portal camera, or enter the shortcode <code>{activeSession.sessionCode}</code>. Geofence checks enforce student physical presence inside campus.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT ROSTER & MANUAL ATTENDANCE */}
          {activeTab === "roster" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Class Roster & Manual Attendance Override</h3>
                  <p>Manually toggle Present, Absent, or Late for enrolled students</p>
                </div>
                <button className="btn-primary" onClick={handleSaveRoster}>
                  💾 Save Roster Attendance
                </button>
              </div>

              {rosterMsg && (
                <div style={{
                  padding: "10px 14px",
                  background: "var(--attendx-success-bg)",
                  color: "var(--attendx-success)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  marginBottom: 16
                }}>
                  {rosterMsg}
                </div>
              )}

              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Account Status</th>
                      <th>Today's Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((stu) => {
                      const cur = rosterStatus[stu.studentId] || "Present";
                      return (
                        <tr key={stu.studentId}>
                          <td><code>{stu.studentId}</code></td>
                          <td>
                            <strong>{stu.fullName}</strong>
                            <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>{stu.email}</div>
                          </td>
                          <td>{stu.rollNumber}</td>
                          <td>
                            <span className={`status-pill ${stu.status === "Active" ? "active" : "suspended"}`}>
                              {stu.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleRosterToggle(stu.studentId, "Present")}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: cur === "Present" ? "var(--attendx-success)" : "#fff",
                                  color: cur === "Present" ? "#fff" : "var(--attendx-success)",
                                  borderColor: "var(--attendx-success)"
                                }}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRosterToggle(stu.studentId, "Late")}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: cur === "Late" ? "var(--attendx-warning)" : "#fff",
                                  color: cur === "Late" ? "#fff" : "var(--attendx-warning)",
                                  borderColor: "var(--attendx-warning)"
                                }}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRosterToggle(stu.studentId, "Absent")}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: cur === "Absent" ? "var(--attendx-error)" : "#fff",
                                  color: cur === "Absent" ? "#fff" : "var(--attendx-error)",
                                  borderColor: "var(--attendx-error)"
                                }}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS */}
          {activeTab === "reports" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Class Attendance Reports</h3>
                  <p>Download institutional records for assigned subjects</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => attendanceService.exportToCSV(allAttendance, "Teacher_Class_Attendance_Report.csv")}
                >
                  📥 Download CSV Report
                </button>
              </div>

              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Subject</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendance.slice(0, 10).map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td><code>{r.studentId}</code></td>
                        <td>{r.studentName}</td>
                        <td>{r.subject}</td>
                        <td><span className="method-tag">{r.method}</span></td>
                        <td>
                          <span className={`status-pill ${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="dashboard-card" style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Faculty Notifications</h3>
                  <p>Department circulars, session reports, and administrative updates</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{
                    border: "1px solid var(--attendx-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    background: "var(--attendx-surface-subtle)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <strong>{n.title}</strong>
                      <span style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>{n.timestamp}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--attendx-text-muted)", margin: 0 }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === "profile" && (
            <div className="dashboard-card" style={{ maxWidth: 700, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Faculty Identity Card</h3>
                  <p>Admin-authorized faculty credentials</p>
                </div>
                <span className="status-pill present">Admin Verified ✓</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div><span style={{ color: "var(--attendx-text-muted)" }}>Faculty ID:</span> <b>{currentTeacher?.id || "TCH-2026-001"}</b></div>
                <div><span style={{ color: "var(--attendx-text-muted)" }}>Full Name:</span> <b>{currentTeacher?.name || "Dr. Rajesh Sharma"}</b></div>
                <div><span style={{ color: "var(--attendx-text-muted)" }}>Designation:</span> <b>{currentTeacher?.designation || "Professor & HOD"}</b></div>
                <div><span style={{ color: "var(--attendx-text-muted)" }}>Department:</span> <b>{currentTeacher?.department || "Computer Science & Engineering"}</b></div>
                <div><span style={{ color: "var(--attendx-text-muted)" }}>Email:</span> <b>{currentTeacher?.email || "teacher@attendx.com"}</b></div>
                <div><span style={{ color: "var(--attendx-text-muted)" }}>Authorization:</span> <b>Institute Admin Allowlist Verified</b></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
