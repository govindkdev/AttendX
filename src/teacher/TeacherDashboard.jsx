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
  const [selectedClass, setSelectedClass] = useState("CS-4A (Final Year)");
  const [lectureName, setLectureName] = useState("Lecture 14: Deep Learning & Neural Networks");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [sessionAttendees, setSessionAttendees] = useState([]);

  // Roster & manual marking
  const [studentsList, setStudentsList] = useState([]);
  const [rosterStatus, setRosterStatus] = useState({}); // { [studentId]: 'Present'|'Absent'|'Late' }
  const [rosterMsg, setRosterMsg] = useState("");

  // History & stats
  const [allAttendance, setAllAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Live countdown timer for active QR session
  useEffect(() => {
    if (!activeSession || !activeSession.expiresAt || activeSession.status !== "Active") {
      setSecondsRemaining(0);
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      setIsExpired(remaining <= 0);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [activeSession]);

  // Live polling of verified attendees while QR session is running
  useEffect(() => {
    if (!activeSession || activeSession.status !== "Active") return;

    const fetchAttendees = async () => {
      try {
        const res = await fetch(`/api/attendance/sessions/${activeSession.sessionId}/attendees`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.attendees) {
            setSessionAttendees(data.attendees);
            setActiveSession((prev) => (prev ? { ...prev, markedCount: data.markedCount } : null));
          }
        }
      } catch (err) {
        // Fallback to local state if backend route unreachable
        const state = JSON.parse(localStorage.getItem("attendx_prototype_state_v1") || "{}");
        const list = (state.attendanceHistory || []).filter(
          (r) => r.subjectCode === activeSession.subjectCode && r.date === new Date().toISOString().split("T")[0]
        );
        setSessionAttendees(list);
      }
    };

    fetchAttendees();
    const pollId = setInterval(fetchAttendees, 3000);
    return () => clearInterval(pollId);
  }, [activeSession?.sessionId, activeSession?.status]);

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

  const handleCreateSession = async () => {
    const subjectObj = (currentTeacher?.subjects || []).find((s) => s.code === selectedSubject) || {
      code: "CS402",
      name: "Machine Learning & AI",
      room: "Lab 304"
    };

    const duration = Number(sessionDuration) || 15;
    const safeLecture = lectureName.trim() || `Lecture Session ${new Date().toLocaleDateString()}`;

    // Create session in client service
    const newSession = attendanceService.createSession({
      subjectCode: subjectObj.code,
      subjectName: subjectObj.name,
      lectureName: safeLecture,
      classGroup: selectedClass,
      teacherId: currentTeacher?.id || "TCH-2026-001",
      teacherName: currentTeacher?.name || "Dr. Rajesh Sharma",
      room: subjectObj.room || "Lab 304",
      durationMinutes: duration
    });

    setActiveSession(newSession);
    setIsExpired(false);
    setSessionAttendees([]);
    refreshData(currentTeacher?.id);
  };

  const handleRegenerateToken = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`/api/attendance/sessions/${activeSession.sessionId}/regenerate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session);
          setIsExpired(false);
          return;
        }
      }
    } catch (e) {}

    // Local fallback regeneration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(sessionDuration) * 60 * 1000);
    const refreshed = {
      ...activeSession,
      sessionCode: "AX-" + Math.floor(1000 + Math.random() * 9000),
      token: Math.random().toString(36).slice(2),
      startTime: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    setActiveSession(refreshed);
    setIsExpired(false);
  };

  const handleCloseSession = () => {
    if (activeSession) {
      attendanceService.closeSession(activeSession.sessionId);
      setActiveSession(null);
      setSessionAttendees([]);
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
            <div style={{ maxWidth: 920, margin: "0 auto" }}>
              <div className="dashboard-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Lecture QR Attendance Session</h3>
                    <p>Dynamic cryptographic QR code bound to this specific lecture, subject, and class group</p>
                  </div>
                  {activeSession && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="btn-secondary"
                        onClick={handleRegenerateToken}
                        style={{ fontSize: 13, borderColor: "var(--attendx-indigo)", color: "var(--attendx-indigo)" }}
                      >
                        ⚡ Regenerate QR Token
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ color: "var(--attendx-error)", borderColor: "var(--attendx-error)", fontSize: 13 }}
                        onClick={handleCloseSession}
                      >
                        ⏹ End Session
                      </button>
                    </div>
                  )}
                </div>

                {!activeSession ? (
                  <div style={{
                    padding: 24,
                    border: "1px solid var(--attendx-border)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--attendx-surface-subtle)"
                  }}>
                    <h4 style={{ margin: "0 0 16px", fontSize: 16 }}>Launch New Lecture Attendance Session</h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Assigned Subject</label>
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
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Class / Batch Group</label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                        >
                          <option value="CS-4A (Final Year)">CS-4A (Final Year)</option>
                          <option value="CS-4B (Final Year)">CS-4B (Final Year)</option>
                          <option value="CS-3A (3rd Year)">CS-3A (3rd Year)</option>
                          <option value="CS-2A (2nd Year)">CS-2A (2nd Year)</option>
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
                          <option value="45">45 Minutes (Full Lecture Block)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Lecture Topic / Number</label>
                      <input
                        type="text"
                        placeholder="e.g. Lecture 14: Deep Learning & Neural Networks"
                        value={lectureName}
                        onChange={(e) => setLectureName(e.target.value)}
                        style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                      />
                    </div>

                    <button className="btn-primary" onClick={handleCreateSession} style={{ padding: "12px 24px", fontSize: 14 }}>
                      ⚡ Generate Secure Lecture QR Code
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Live Status and Countdown Bar */}
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 18px",
                      background: isExpired ? "var(--attendx-error-bg)" : "rgba(81, 86, 228, 0.08)",
                      border: `1px solid ${isExpired ? "var(--attendx-error)" : "var(--attendx-indigo)"}`,
                      borderRadius: "var(--radius-lg)",
                      marginBottom: 20
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: isExpired ? "var(--attendx-error)" : "var(--attendx-success)",
                            boxShadow: isExpired ? "none" : "0 0 10px var(--attendx-success)"
                          }}
                        />
                        <div>
                          <strong style={{ fontSize: 14, color: isExpired ? "var(--attendx-error)" : "var(--attendx-indigo)" }}>
                            {isExpired ? "SESSION EXPIRED" : "LIVE ATTENDANCE RECEIVING"}
                          </strong>
                          <div style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
                            {activeSession.subjectName} ({activeSession.subjectCode}) • {activeSession.classGroup || selectedClass}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 11, color: "var(--attendx-text-muted)", display: "block" }}>TIME REMAINING</span>
                          <span style={{
                            fontSize: 20,
                            fontWeight: 800,
                            fontFamily: "monospace",
                            color: isExpired ? "var(--attendx-error)" : secondsRemaining < 60 ? "var(--attendx-warning)" : "var(--attendx-indigo)"
                          }}>
                            {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")}
                          </span>
                        </div>
                        {isExpired && (
                          <button className="btn-primary" onClick={handleRegenerateToken} style={{ padding: "6px 14px", fontSize: 12 }}>
                            Renew Token
                          </button>
                        )}
                      </div>
                    </div>

                    {/* QR Display Card */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 24,
                      alignItems: "center",
                      marginBottom: 24
                    }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          display: "inline-block",
                          background: "#FFFFFF",
                          padding: 20,
                          borderRadius: "var(--radius-xl)",
                          boxShadow: "var(--shadow-lg)",
                          border: "2px solid var(--attendx-indigo)",
                          opacity: isExpired ? 0.45 : 1,
                          transition: "opacity 0.3s ease"
                        }}>
                          <QRCodeSVG
                            value={qrService.encodeSession(activeSession)}
                            size={230}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>Session Shortcode: </span>
                          <code style={{ fontSize: 15, fontWeight: 700, color: "var(--attendx-indigo)" }}>
                            {activeSession.sessionCode}
                          </code>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 18, margin: "0 0 6px" }}>{activeSession.lectureName || lectureName}</h4>
                        <p style={{ color: "var(--attendx-text-muted)", fontSize: 13, margin: "0 0 16px" }}>
                          Room: <b>{activeSession.room}</b> • Teacher: <b>{activeSession.teacherName}</b>
                        </p>

                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          padding: 16,
                          background: "var(--attendx-surface-subtle)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 13,
                          marginBottom: 16
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--attendx-text-muted)" }}>Session ID:</span>
                            <code>{activeSession.sessionId}</code>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--attendx-text-muted)" }}>Cryptographic Token:</span>
                            <code style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {activeSession.token || "Active Token"}
                            </code>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--attendx-text-muted)" }}>Marked Attendees:</span>
                            <b style={{ color: "var(--attendx-success)", fontSize: 15 }}>
                              {sessionAttendees.length || activeSession.markedCount || 0} Students
                            </b>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="btn-secondary" onClick={handleRegenerateToken} style={{ flex: 1, fontSize: 13 }}>
                            ⚡ Refresh QR Token
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ flex: 1, fontSize: 13, color: "var(--attendx-error)", borderColor: "var(--attendx-error)" }}
                            onClick={handleCloseSession}
                          >
                            ⏹ End Session
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Verified Attendee Roster Table */}
                    <div style={{
                      borderTop: "1px solid var(--attendx-border)",
                      paddingTop: 20,
                      marginTop: 10
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 16 }}>
                          Live Verified Students ({sessionAttendees.length})
                        </h4>
                        <span style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
                          Auto-updating in real-time
                        </span>
                      </div>

                      {sessionAttendees.length > 0 ? (
                        <div className="attendx-table-wrapper">
                          <table className="attendx-table">
                            <thead>
                              <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Time Verified</th>
                                <th>Method</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessionAttendees.map((att, idx) => (
                                <tr key={att.id || att.studentId || idx}>
                                  <td><code>{att.studentId}</code></td>
                                  <td><strong>{att.studentName || att.name}</strong></td>
                                  <td>{att.time || new Date().toLocaleTimeString()}</td>
                                  <td>
                                    <span className="method-tag" style={{ background: "rgba(81, 86, 228, 0.1)", color: "var(--attendx-indigo)" }}>
                                      QR Biometric Verified
                                    </span>
                                  </td>
                                  <td>
                                    <span className="status-pill present">
                                      {att.status || "Present"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{
                          textAlign: "center",
                          padding: "28px 16px",
                          background: "var(--attendx-surface-subtle)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--attendx-text-muted)",
                          fontSize: 13
                        }}>
                          📡 Waiting for students to scan the live QR code... Scanned attendance will populate here instantly.
                        </div>
                      )}
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
