/*
=========================================================
ATTENDX - COMPLETE STUDENT DASHBOARD
=========================================================
Role-based student portal with interactive views:
- Overview (Stats, Today's Attendance, Recent logs, Schedule)
- My Attendance (Face Recognition launcher, Geofence radar)
- Scan QR (Camera scanner, session validator)
- Attendance History (Search, filter, CSV download)
- Timetable (Class schedule)
- Leave Requests (Submit leave, status tracker)
- Notifications (Real-time events)
- My Profile (Institutional record)
- Reports (Subject-wise analytics)
- Settings (Demo data reset & preferences)
- Logout
=========================================================
*/

import React, { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { attendanceService } from "../services/attendanceService";
import { userService } from "../services/userService";
import api from "../services/api";
import QRScannerModal from "../components/attendance/QRScannerModal";
import GeofenceStatus from "../components/attendance/GeofenceStatus";
import "../styles/dashboard.css";

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // QR Modal (Primary & only student attendance marking method)
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Data states
  const [history, setHistory] = useState([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [geofenceOk, setGeofenceOk] = useState(true);

  // History filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
    category: "Academic / Competition"
  });
  const [leaveMsg, setLeaveMsg] = useState("");

  const refreshData = async (studentId) => {
    if (!studentId) return;

    try {
      const fullData = await attendanceService.fetchStudentAttendanceAsync(studentId);
      if (fullData && fullData.success) {
        if (fullData.records) {
          setHistory(fullData.records.map((r) => ({
            id: r.id,
            studentId: r.student_id,
            studentName: r.student_name,
            date: r.date,
            time: r.time,
            subject: r.subject,
            subjectCode: r.subject_code,
            lectureName: r.lecture_name || r.subject,
            teacherName: r.teacher_name,
            method: r.method,
            status: r.status,
            geofenceVerified: Boolean(r.geofence_verified),
            confidence: r.confidence,
            room: r.room
          })));
        }
        if (fullData.subjectBreakdown) {
          setSubjectBreakdown(fullData.subjectBreakdown);
        }
        if (fullData.summary) {
          setAttendanceSummary(fullData.summary);
        }
      } else {
        const historyRecords = await attendanceService.fetchStudentHistoryAsync(studentId);
        setHistory(historyRecords);
      }
    } catch (e) {
      setHistory(attendanceService.getStudentHistory(studentId));
    }

    const allState = JSON.parse(localStorage.getItem("attendx_prototype_state_v1") || "{}");
    if (allState.timetable) setTimetable(allState.timetable);
    setLeaveRequests(userService.getLeaveRequests(studentId));
    setNotifications(userService.getNotifications("student", studentId));

    // Refresh student profile & biometric status from backend SQLite
    try {
      const res = await api.get(`/api/students/${studentId}`);
      if (res && res.success && res.data) {
        const st = res.data;
        setCurrentUser((prev) => ({
          ...prev,
          ...st,
          id: st.student_id || prev?.id || studentId,
          name: st.full_name || prev?.name,
          course: st.course,
          branch: st.branch,
          year: st.year,
          rollNumber: st.roll_number,
          assignedSubjects: st.assignedSubjects || prev?.assignedSubjects || [],
          overallAttendance: st.overallAttendance ?? 0.0,
          faceEnrolled: Boolean(st.face_enrolled)
        }));
      }
    } catch (err) {
      console.warn("Student profile sync notice:", err.message);
    }
  };

  // Load user session and state on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setCurrentUser(user);
    refreshData(user.id);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      setLeaveMsg("Please complete all required leave dates and reason.");
      return;
    }

    const res = userService.submitLeaveRequest({
      studentId: currentUser?.id || "STU-2026-001",
      studentName: currentUser?.name || "Student",
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate,
      reason: leaveForm.reason,
      category: leaveForm.category
    });

    if (res.success) {
      setLeaveMsg("Leave request submitted successfully. Sent for HOD review.");
      setLeaveForm({ fromDate: "", toDate: "", reason: "", category: "Academic / Competition" });
      refreshData(currentUser?.id);
    }
  };

  // Filtered History
  const filteredHistory = history.filter((rec) => {
    const matchesSearch =
      rec.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.date?.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || rec.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const presentCount = history.filter((r) => r.status === "Present").length;
  const lateCount = history.filter((r) => r.status === "Late").length;
  const absentCount = history.filter((r) => r.status === "Absent").length;
  const totalCount = history.length;
  const calculatedPercentage = totalCount > 0
    ? Math.round(((presentCount + lateCount * 0.5) / totalCount) * 100)
    : (currentUser?.overallAttendance ?? 0);

  return (
    <div className="attendx-dashboard-layout">
      {/* ===================================================
          SIDEBAR
          =================================================== */}
      <aside className={`attendx-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <a href="/student-dashboard" className="brand-link">
            <img
              src="/assets/attendx-logo.png"
              alt="AttendX Logo"
              style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 8 }}
            />
            <div className="brand-meta">
              <h2>AttendX</h2>
              <span className="brand-role-badge">Student Portal</span>
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
            className={`sidebar-nav-item ${activeTab === "scan-qr" ? "active" : ""}`}
            onClick={() => { setActiveTab("scan-qr"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">▣</span>
            <span>Scan Lecture QR</span>
            <span className="nav-badge" style={{ background: "var(--attendx-indigo)" }}>Active</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => { setActiveTab("history"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">◷</span>
            <span>Attendance History</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "timetable" ? "active" : ""}`}
            onClick={() => { setActiveTab("timetable"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📅</span>
            <span>Timetable</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "leave" ? "active" : ""}`}
            onClick={() => { setActiveTab("leave"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📝</span>
            <span>Leave Requests</span>
            {leaveRequests.filter((l) => l.status === "Pending").length > 0 && (
              <span className="nav-badge">{leaveRequests.filter((l) => l.status === "Pending").length}</span>
            )}
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
            <span>My Profile</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("reports"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            <span>Reports</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
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
                {activeTab === "dashboard" && "Student Dashboard"}
                {activeTab === "attendance" && "Attendance Verification"}
                {activeTab === "scan-qr" && "Scan Class QR Code"}
                {activeTab === "history" && "Attendance History & Logs"}
                {activeTab === "timetable" && "Weekly Class Schedule"}
                {activeTab === "leave" && "Student Leave Applications"}
                {activeTab === "notifications" && "Student Notifications"}
                {activeTab === "profile" && "Institutional Profile"}
                {activeTab === "reports" && "Subject Attendance Analytics"}
                {activeTab === "settings" && "System & Campus Settings"}
              </h1>
              <p>AttendX Smart Infrastructure • Academic Session 2026-27</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className={`campus-status-pill ${geofenceOk ? "" : "outside"}`}>
              <span className="status-dot" />
              <span>{geofenceOk ? "Campus Area: Verified" : "Outside Geofence"}</span>
            </div>

            <button
              onClick={() => setActiveTab("notifications")}
              style={{
                position: "relative",
                background: "var(--attendx-surface-subtle)",
                border: "1px solid var(--attendx-border)",
                borderRadius: "var(--radius-md)",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              🔔
              {notifications.some((n) => !n.read) && (
                <span style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--attendx-error)"
                }} />
              )}
            </button>

            <div className="topbar-user" onClick={() => setActiveTab("profile")} style={{ cursor: "pointer" }}>
              <div className="user-avatar">
                {currentUser?.name ? currentUser.name.split(" ").map((n) => n[0]).join("") : "GK"}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser?.name || "Govind Kushwaha"}</span>
                <span className="user-id">{currentUser?.id || "STU-2026-001"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            VIEW TAB CONTENTS
            =================================================== */}
        <div className="dashboard-content">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Hero Banner */}
              <div className="attendx-banner-card">
                <div className="banner-left">
                  <span className="banner-pill">⚡ LECTURE ATTENDANCE ACTIVE</span>
                  <h2>Welcome back, {currentUser?.name?.split(" ")[0] || "Govind"} 👋</h2>
                  <p>
                    Scan the dynamic QR code generated by your instructor for the current lecture.
                    Location verification confirms you are within the authorized campus perimeter.
                  </p>
                  <div className="banner-actions">
                    <button
                      className="btn-primary"
                      onClick={() => setQrModalOpen(true)}
                      style={{
                        padding: "12px 24px",
                        fontSize: 15,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #5B5FEF 0%, #65D7E2 100%)",
                        boxShadow: "0 6px 20px rgba(91, 95, 239, 0.35)"
                      }}
                    >
                      <span style={{ fontSize: 18 }}>▣</span>
                      <span>Scan Lecture QR Code</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab("history")}
                      style={{ padding: "12px 20px", fontSize: 14 }}
                    >
                      <span>📜</span>
                      <span>View History</span>
                    </button>
                  </div>
                </div>

                <div className="banner-right">
                  <div className="ai-pulse-ring">
                    <div className="ai-core">
                      <span>{calculatedPercentage}%</span>
                      <small>OVERALL</small>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--attendx-aqua)", fontWeight: 600 }}>
                    ATTENDANCE RECORD
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Overall Attendance</span>
                    <div className="stat-icon purple">%</div>
                  </div>
                  <div className="stat-value">{calculatedPercentage}%</div>
                  <div className="stat-subtext">
                    {totalCount > 0 ? `${presentCount} of ${totalCount} sessions attended` : "No sessions recorded yet"}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Present Days</span>
                    <div className="stat-icon green">✓</div>
                  </div>
                  <div className="stat-value">{presentCount}</div>
                  <div className="stat-subtext">Lectures and labs attended</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Absent Days</span>
                    <div className="stat-icon red">!</div>
                  </div>
                  <div className="stat-value">{absentCount}</div>
                  <div className="stat-subtext">Total unexcused absences</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-title">Late Arrivals</span>
                    <div className="stat-icon orange">◷</div>
                  </div>
                  <div className="stat-value">{lateCount}</div>
                  <div className="stat-subtext">Recorded &gt;10m after start</div>
                </div>
              </div>

              {/* Geo-Fencing Radar Widget */}
              <GeofenceStatus onGeofenceChange={setGeofenceOk} />

              {/* Bottom Split: Recent Attendance & Quick Profile */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                {/* Recent Table */}
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <div>
                      <h3>Recent Attendance Records</h3>
                      <p>Latest verified student check-ins</p>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ color: "var(--attendx-text-primary)", padding: "6px 12px", fontSize: 12 }}
                      onClick={() => setActiveTab("history")}
                    >
                      View All Logs
                    </button>
                  </div>

                  <div className="attendx-table-wrapper">
                    <table className="attendx-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Subject</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.length > 0 ? (
                          history.slice(0, 5).map((r) => (
                            <tr key={r.id}>
                              <td>{r.date}</td>
                              <td>
                                <strong>{r.subject}</strong>
                                <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>{r.time}</div>
                              </td>
                              <td>
                                <span className="method-tag">{r.method}</span>
                              </td>
                              <td>
                                <span className={`status-pill ${r.status?.toLowerCase()}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td>{r.room || "LT-101"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "32px 14px", color: "var(--attendx-text-muted)" }}>
                              No attendance records available yet. Scan lecture QR codes in class.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Academic Profile Card */}
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <div>
                      <h3>Academic Profile</h3>
                      <p>Institutional record</p>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ color: "var(--attendx-text-primary)", padding: "4px 10px", fontSize: 12 }}
                      onClick={() => setActiveTab("profile")}
                    >
                      View Profile
                    </button>
                  </div>

                  <div style={{ textAlign: "center", padding: "16px 0", borderBottom: "1px solid var(--attendx-border)" }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--attendx-indigo) 0%, var(--attendx-aqua) 100%)",
                      color: "#fff",
                      fontSize: 22,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px"
                    }}>
                      {currentUser?.name ? currentUser.name.split(" ").map((n) => n[0]).join("") : "ST"}
                    </div>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{currentUser?.name || "Student"}</h4>
                    <span style={{ fontSize: 12, color: "var(--attendx-text-muted)", fontFamily: "monospace" }}>
                      {currentUser?.id || "STU-XXXX-XXX"}
                    </span>
                  </div>

                  <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--attendx-text-muted)" }}>Course:</span>
                      <strong>{currentUser?.course || "N/A"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--attendx-text-muted)" }}>Branch:</span>
                      <strong>{currentUser?.branch || "N/A"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--attendx-text-muted)" }}>Year:</span>
                      <strong>{currentUser?.year || "N/A"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--attendx-text-muted)" }}>Biometric Face:</span>
                      {currentUser?.faceEnrolled ? (
                        <b style={{ color: "var(--attendx-success)" }}>Enrolled in Database ✓</b>
                      ) : (
                        <b style={{ color: "var(--attendx-warning)" }}>Pending Enrollment</b>
                      )}
                    </div>

                    {/* Assigned Subjects & Teachers List */}
                    <div style={{ borderTop: "1px solid var(--attendx-border)", paddingTop: 12, marginTop: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--attendx-navy)" }}>
                        Assigned Subjects ({(currentUser?.assignedSubjects || []).length}):
                      </div>
                      {(currentUser?.assignedSubjects || []).length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto" }}>
                          {currentUser.assignedSubjects.map((sub) => (
                            <div
                              key={sub.code || sub.subject_code}
                              style={{
                                fontSize: 11,
                                display: "flex",
                                flexDirection: "column",
                                background: "var(--attendx-surface-subtle)",
                                padding: "6px 8px",
                                borderRadius: 6
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "var(--attendx-navy)" }}>
                                {sub.code || sub.subject_code}: {sub.name || sub.subject_name}
                              </span>
                              <span style={{ color: "var(--attendx-indigo)", fontSize: 10 }}>
                                👨‍🏫 {sub.teacher || "Faculty TBA"} · {sub.room || "LT-101"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>No subjects assigned yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: SCAN LECTURE QR CODE (PRIMARY ATTENDANCE CHANNEL FOR STUDENTS) */}
          {(activeTab === "scan-qr" || activeTab === "attendance") && (
            <div style={{ maxWidth: 840, margin: "0 auto" }}>
              <div className="dashboard-card" style={{ padding: "28px 24px" }}>
                <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 28px" }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(91, 95, 239, 0.1)",
                    color: "var(--attendx-indigo, #5B5FEF)",
                    fontSize: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    boxShadow: "0 8px 24px rgba(91, 95, 239, 0.15)"
                  }}>
                    ▣
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
                    Scan Lecture QR Code
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--attendx-text-muted, #667085)", margin: 0, lineHeight: 1.5 }}>
                    Your primary method for recording attendance. Aim your smartphone or laptop camera at the dynamic QR code projected by your teacher in class.
                  </p>

                  <div style={{ marginTop: 20 }}>
                    <button
                      className="btn-primary"
                      onClick={() => setQrModalOpen(true)}
                      style={{
                        padding: "14px 32px",
                        fontSize: 16,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #5B5FEF 0%, #65D7E2 100%)",
                        boxShadow: "0 8px 25px rgba(91, 95, 239, 0.35)",
                        width: "100%",
                        maxWidth: 320
                      }}
                    >
                      <span style={{ fontSize: 20, marginRight: 8 }}>📷</span>
                      Open QR Camera Scanner
                    </button>
                  </div>
                </div>

                {/* Campus Geofence Status */}
                <div style={{ marginTop: 16 }}>
                  <GeofenceStatus onGeofenceChange={setGeofenceOk} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE HISTORY */}
          {activeTab === "history" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Attendance Records & History</h3>
                  <p>Comprehensive audit log of all recorded attendance events</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => attendanceService.exportToCSV(filteredHistory, `AttendX_${currentUser?.id}_History.csv`)}
                >
                  📥 Export CSV Report
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search subject, code, or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--attendx-border)",
                    fontSize: 13,
                    minWidth: 260
                  }}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--attendx-border)",
                    fontSize: 13,
                    background: "#fff"
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              <div className="attendx-table-wrapper">
                <table className="attendx-table">
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Subject & Lecture</th>
                      <th>Faculty</th>
                      <th>Method</th>
                      <th>Geofence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((rec) => (
                        <tr key={rec.id}>
                          <td><code>#{rec.id}</code></td>
                          <td>{rec.date}</td>
                          <td>{rec.time}</td>
                          <td>
                            <strong>{rec.subject}</strong>
                            <div style={{ fontSize: 11, color: "var(--attendx-indigo)" }}>
                              {rec.lectureName || rec.lecture_name || rec.subjectCode}
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: "#334155" }}>
                            {rec.teacherName || rec.teacher_name || "Assigned Faculty"}
                          </td>
                          <td><span className="method-tag">{rec.method}</span></td>
                          <td>
                            <span style={{ color: rec.geofenceVerified ? "var(--attendx-success)" : "var(--attendx-error)", fontSize: 12 }}>
                              {rec.geofenceVerified ? "✓ Verified" : "✗ Unverified"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${rec.status.toLowerCase()}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--attendx-text-muted)" }}>
                          No matching attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TIMETABLE & ASSIGNED CURRICULUM */}
          {activeTab === "timetable" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Weekly Class Schedule & Curriculum</h3>
                  <p>
                    Official subjects for {currentUser?.course || "Course"} · {currentUser?.branch || "Branch"} ({currentUser?.year || "Year"})
                  </p>
                </div>
              </div>

              {(currentUser?.assignedSubjects || []).length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {currentUser.assignedSubjects.map((sub, idx) => {
                    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                    const times = ["09:00 AM - 10:30 AM", "11:00 AM - 12:30 PM", "02:00 PM - 03:30 PM", "03:45 PM - 05:15 PM"];
                    const day = days[idx % days.length];
                    const time = times[idx % times.length];
                    return (
                      <div
                        key={sub.code || sub.subject_code}
                        style={{
                          border: "1px solid var(--attendx-border)",
                          borderRadius: "var(--radius-lg)",
                          padding: 18,
                          background: "var(--attendx-surface-subtle)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span className="method-tag">{day}</span>
                          <small style={{ fontWeight: 600, color: "var(--attendx-indigo)" }}>
                            {sub.code || sub.subject_code}
                          </small>
                        </div>
                        <h4 style={{ margin: "0 0 8px", fontSize: 15, color: "var(--attendx-navy)" }}>
                          {sub.name || sub.subject_name}
                        </h4>
                        <div style={{ fontSize: 12, color: "var(--attendx-text-muted)", lineHeight: 1.8 }}>
                          <div>🕒 {time}</div>
                          <div>🏛️ Room: <strong>{sub.room || "LT-101"}</strong></div>
                          <div>👨‍🏫 Instructor: <strong style={{ color: "var(--attendx-navy)" }}>{sub.teacher || "Faculty TBA"}</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : timetable.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {timetable.map((slot) => (
                    <div key={slot.id} style={{
                      border: "1px solid var(--attendx-border)",
                      borderRadius: "var(--radius-lg)",
                      padding: 18,
                      background: "var(--attendx-surface-subtle)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span className="method-tag">{slot.day}</span>
                        <small style={{ fontWeight: 600, color: "var(--attendx-indigo)" }}>{slot.type}</small>
                      </div>
                      <h4 style={{ margin: "0 0 6px", fontSize: 15 }}>{slot.subject}</h4>
                      <div style={{ fontSize: 12, color: "var(--attendx-text-muted)", lineHeight: 1.6 }}>
                        <div>🕒 {slot.time}</div>
                        <div>🏛️ {slot.room}</div>
                        <div>👨‍🏫 {slot.teacher}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--attendx-text-muted)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--attendx-navy)" }}>No lectures scheduled yet</div>
                  <div style={{ fontSize: 12, color: "var(--attendx-text-muted)", marginTop: 4 }}>
                    No subjects or schedule have been assigned to your profile by the administrator yet.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LEAVE REQUESTS */}
          {activeTab === "leave" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div className="dashboard-card">
                <div className="card-header-flex">
                  <div>
                    <h3>Apply for Leave</h3>
                    <p>Official student leave request form</p>
                  </div>
                </div>

                {leaveMsg && (
                  <div style={{
                    padding: "10px 14px",
                    background: "var(--attendx-success-bg)",
                    color: "var(--attendx-success)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    marginBottom: 16
                  }}>
                    {leaveMsg}
                  </div>
                )}

                <form onSubmit={handleLeaveSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>From Date</label>
                      <input
                        type="date"
                        required
                        value={leaveForm.fromDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                        style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>To Date</label>
                      <input
                        type="date"
                        required
                        value={leaveForm.toDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                        style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Category</label>
                    <select
                      value={leaveForm.category}
                      onChange={(e) => setLeaveForm({ ...leaveForm, category: e.target.value })}
                      style={{ width: "100%", padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", background: "#fff" }}
                    >
                      <option value="Academic / Competition">Academic / Competition (Hackathon, Conference)</option>
                      <option value="Medical Emergency">Medical Emergency</option>
                      <option value="Family Function">Family Function / Personal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Reason & Justification</label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Explain reason for leave and attach certificates on return..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)", fontSize: 13 }}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                    Submit Leave Application
                  </button>
                </form>
              </div>

              <div className="dashboard-card">
                <div className="card-header-flex">
                  <div>
                    <h3>My Leave Requests</h3>
                    <p>Status tracking and department remarks</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {leaveRequests.map((req) => (
                    <div key={req.id} style={{
                      border: "1px solid var(--attendx-border)",
                      borderRadius: "var(--radius-md)",
                      padding: 16,
                      background: "var(--attendx-surface-subtle)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <strong>{req.category}</strong>
                        <span className={`status-pill ${req.status.toLowerCase()}`}>{req.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--attendx-text-muted)", marginBottom: 8 }}>
                        Dates: <b>{req.fromDate}</b> to <b>{req.toDate}</b>
                      </div>
                      <p style={{ fontSize: 13, margin: "0 0 8px" }}>"{req.reason}"</p>
                      {req.adminRemarks && (
                        <div style={{ fontSize: 11, color: "var(--attendx-indigo)", background: "rgba(91, 95, 239, 0.08)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                          <b>Office Remarks:</b> {req.adminRemarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="dashboard-card" style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Student Notifications</h3>
                  <p>Automated attendance alerts, approvals, and reminders</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => userService.markNotificationRead(n.id)}
                    style={{
                      border: "1px solid var(--attendx-border)",
                      borderLeft: `4px solid ${n.type === "success" ? "var(--attendx-success)" : "var(--attendx-indigo)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: 16,
                      background: n.read ? "var(--attendx-surface)" : "var(--attendx-surface-subtle)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <strong style={{ fontSize: 14 }}>{n.title}</strong>
                      <span style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>{n.timestamp}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--attendx-text-muted)", margin: 0 }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: PROFILE */}
          {activeTab === "profile" && (
            <div className="dashboard-card" style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Student Institutional Profile</h3>
                  <p>Official records managed by the Institute Registrar</p>
                </div>
                <span className="status-pill present">Official Active Record</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--attendx-indigo)" }}>Academic Information</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Student ID:</span> <b>{currentUser?.id || "STU-2026-001"}</b></div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Full Name:</span> <b>{currentUser?.name || "Govind Kushwaha"}</b></div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Course:</span> <b>{currentUser?.course || "B.Tech"}</b></div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Branch:</span> <b>{currentUser?.branch || "Computer Science & Engineering"}</b></div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Year:</span> <b>{currentUser?.year || "4th Year"}</b></div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--attendx-indigo)" }}>Contact & Biometric Data</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Email:</span> <b>{currentUser?.email || "student@attendx.com"}</b></div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Mobile:</span> <b>+91 9876543210</b></div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Guardian:</span> <b>Suresh Kushwaha (+91 9876543211)</b></div>
                    <div>
                      <span style={{ color: "var(--attendx-text-muted)" }}>Face Biometric Database Status:</span>{" "}
                      {currentUser?.faceEnrolled ? (
                        <b style={{ color: "var(--attendx-success)" }}>
                          Enrolled ✓ (Template #{currentUser.faceTemplateId || "FT-2026-9042"})
                        </b>
                      ) : (
                        <b style={{ color: "var(--attendx-error)" }}>
                          ⚠️ Not Enrolled in Database (Visit Admin Office)
                        </b>
                      )}
                    </div>
                    <div><span style={{ color: "var(--attendx-text-muted)" }}>Issuing Authority:</span> <b>AttendX Campus Admin</b></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS */}
          {activeTab === "reports" && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Subject-Wise Attendance Breakdown</h3>
                  <p>Live calculated attendance records verified against the institutional 75% minimum attendance rule</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => attendanceService.exportToCSV(history, `AttendX_${currentUser?.id || "Student"}_Subject_Report.csv`)}
                >
                  Download Detailed Audit CSV
                </button>
              </div>

              {/* Attendance compliance summary banner */}
              {attendanceSummary && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 12,
                  marginBottom: 20
                }}>
                  <div style={{ padding: "12px 14px", background: "var(--attendx-surface-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--attendx-border)" }}>
                    <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>TOTAL LECTURES</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{attendanceSummary.totalClasses || history.length}</div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--attendx-success-bg)", borderRadius: "var(--radius-md)", border: "1px solid rgba(18, 155, 103, 0.2)" }}>
                    <div style={{ fontSize: 11, color: "var(--attendx-success)" }}>PRESENT</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--attendx-success)" }}>
                      {attendanceSummary.present || history.filter((h) => h.status === "Present").length}
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--attendx-warning-bg)", borderRadius: "var(--radius-md)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <div style={{ fontSize: 11, color: "var(--attendx-warning)" }}>LATE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--attendx-warning)" }}>
                      {attendanceSummary.late || history.filter((h) => h.status === "Late").length}
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--attendx-error-bg)", borderRadius: "var(--radius-md)", border: "1px solid rgba(235, 94, 85, 0.2)" }}>
                    <div style={{ fontSize: 11, color: "var(--attendx-error)" }}>ABSENT</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--attendx-error)" }}>
                      {attendanceSummary.absent || history.filter((h) => h.status === "Absent").length}
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "rgba(81, 86, 228, 0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(81, 86, 228, 0.3)" }}>
                    <div style={{ fontSize: 11, color: "var(--attendx-indigo)" }}>OVERALL RATE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--attendx-indigo)" }}>
                      {attendanceSummary.attendanceRate ?? currentUser?.overallAttendance ?? 0}%
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {(subjectBreakdown.length > 0
                  ? subjectBreakdown
                  : (currentUser?.assignedSubjects || []).length > 0
                  ? (currentUser.assignedSubjects).map((s) => {
                      const code = s.code || s.subject_code || s;
                      const name = s.name || s.subject_name || code;
                      const subHistory = history.filter((h) => h.subjectCode === code || (h.subject && h.subject.includes(code)));
                      const total = subHistory.length;
                      const pres = subHistory.filter((h) => h.status === "Present").length;
                      const rate = total > 0 ? Number(((pres / total) * 100).toFixed(1)) : 85;
                      return { code, name, teacher: s.teacher || "Assigned Faculty", percentage: rate, totalClasses: total, present: pres };
                    })
                  : [
                      { code: "CS402", name: "Machine Learning & AI", percentage: 92, teacher: "Dr. Rajesh Sharma", totalClasses: 12, present: 11 },
                      { code: "CS401", name: "Data Structures & Algorithms", percentage: 88, teacher: "Dr. Rajesh Sharma", totalClasses: 10, present: 9 },
                      { code: "CS403", name: "Cloud Computing & DevOps", percentage: 85, teacher: "Dr. Rajesh Sharma", totalClasses: 8, present: 7 }
                    ]
                ).map((subj) => (
                  <div key={subj.code} style={{
                    border: "1px solid var(--attendx-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    background: "var(--attendx-surface-subtle)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <strong>{subj.name}</strong> ({subj.code})
                        <div style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
                          {subj.teacher ? `👨‍🏫 ${subj.teacher}` : "Faculty Assigned"}
                          {subj.totalClasses !== undefined && ` • ${subj.present || 0}/${subj.totalClasses} classes attended`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: 16, color: (subj.percentage ?? subj.pct ?? 0) >= 75 ? "var(--attendx-success)" : "var(--attendx-error)" }}>
                          {subj.percentage ?? subj.pct ?? 0}%
                        </strong>
                        <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>
                          {(subj.percentage ?? subj.pct ?? 0) >= 75 ? "✓ Compliant" : "⚠️ Shortage Alert (<75%)"}
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, subj.percentage ?? subj.pct ?? 0))}%`,
                        height: "100%",
                        background: (subj.percentage ?? subj.pct ?? 0) >= 75 ? "var(--attendx-indigo)" : "var(--attendx-error)",
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === "settings" && (
            <div className="dashboard-card" style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="card-header-flex">
                <div>
                  <h3>Settings & Prototype Configuration</h3>
                  <p>Preferences, boundary controls, and demo state reset</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <GeofenceStatus onGeofenceChange={setGeofenceOk} />

                <div style={{
                  padding: 18,
                  border: "1px solid var(--attendx-error)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--attendx-error-bg)"
                }}>
                  <h4 style={{ color: "var(--attendx-error)", margin: "0 0 6px" }}>Reset Prototype Seed Data</h4>
                  <p style={{ fontSize: 12, color: "var(--attendx-text-muted)", margin: "0 0 12px" }}>
                    Restores initial student records (Govind Kushwaha STU-2026-001), teacher credentials, sessions, and sample attendance history.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ background: "var(--attendx-error)" }}
                    onClick={() => {
                      if (window.confirm("Reset all prototype demo records to original defaults?")) {
                        userService.resetAllData();
                        refreshData(currentUser?.id);
                        alert("Prototype data reset to initial state.");
                      }
                    }}
                  >
                    Reset Demo State
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Android Viewports) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span className="mobile-nav-icon">⌂</span>
          <span className="mobile-nav-label">Home</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <span className="mobile-nav-icon">◷</span>
          <span className="mobile-nav-label">History</span>
        </button>

        {/* Central Prominent Floating Scan Action */}
        <button
          className="mobile-nav-scan-cta"
          onClick={() => setQrModalOpen(true)}
          title="Scan Lecture QR Code"
        >
          <span className="scan-cta-icon">▣</span>
          <span className="scan-cta-label">Scan QR</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "timetable" ? "active" : ""}`}
          onClick={() => setActiveTab("timetable")}
        >
          <span className="mobile-nav-icon">📅</span>
          <span className="mobile-nav-label">Schedule</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <span className="mobile-nav-icon">👤</span>
          <span className="mobile-nav-label">Profile</span>
        </button>
      </nav>

      {/* Primary Student QR Scanner Modal */}
      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => { setQrModalOpen(false); refreshData(currentUser?.id); }}
        currentUser={currentUser}
        onAttendanceMarked={() => refreshData(currentUser?.id)}
      />
    </div>
  );
}
