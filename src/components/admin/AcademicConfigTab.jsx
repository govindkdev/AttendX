/*
=========================================================
ATTENDX - INSTITUTIONAL ACADEMIC CONFIGURATION MANAGER
=========================================================
Admin dashboard module to manage:
- Courses (B.Tech, BCA, MCA, MBA, custom programs)
- Branches per course
- Academic Years
- Subjects curriculum (filtered by Course + Branch + Year)
- Class Sections (e.g. CS-4A, IT-1A)
- Faculty Teacher-Subject-Class assignments
=========================================================
*/

import React, { useState, useEffect } from "react";
import { academicService } from "../../services/academicService";
import { userService } from "../../services/userService";
import SearchableSelect from "../common/SearchableSelect";

export default function AcademicConfigTab() {
  const [subTab, setSubTab] = useState("subjects"); // 'subjects' | 'courses' | 'classes' | 'assignments'

  // Master Data
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lectures, setLectures] = useState([]);

  // Filter for subjects view
  const [selectedCourse, setSelectedCourse] = useState("B.Tech");
  const [selectedBranch, setSelectedBranch] = useState("Computer Science & Engineering");
  const [selectedYear, setSelectedYear] = useState("4th Year");

  // Notifications / Feedback
  const [msg, setMsg] = useState({ text: "", type: "info" });

  // Modals / Form toggles
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: "", name: "", durationYears: 4 });

  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ courseCode: "B.Tech", code: "", name: "" });

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    courseCode: "B.Tech",
    branchCode: "Computer Science & Engineering",
    yearCode: "4th Year",
    subjectCode: "",
    subjectName: "",
    roomDefault: "LT-101"
  });

  const [showAddClass, setShowAddClass] = useState(false);
  const [newClass, setNewClass] = useState({
    courseCode: "B.Tech",
    branchCode: "Computer Science & Engineering",
    yearCode: "4th Year",
    sectionName: "Sec A",
    classCode: ""
  });

  const [showAddAssign, setShowAddAssign] = useState(false);
  const [newAssign, setNewAssign] = useState({
    teacherId: "",
    subjectCode: "",
    subjectName: "",
    classCode: ""
  });

  const [showAddLecture, setShowAddLecture] = useState(false);
  const [newLecture, setNewLecture] = useState({
    lectureName: "",
    subjectCode: "",
    subjectName: "",
    courseCode: "B.Tech",
    branchCode: "Computer Science & Engineering",
    yearCode: "4th Year",
    classCode: "CS-4A",
    teacherId: "",
    teacherName: "",
    room: "Lab 304",
    scheduleDay: "Monday",
    startTime: "09:00 AM",
    endTime: "10:00 AM"
  });

  const showBanner = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "info" }), 4500);
  };

  // Load all foundational academic lists
  const refreshAll = async () => {
    try {
      const [cList, yList, bList, clsList, tList, aList, lecList] = await Promise.all([
        academicService.getCourses(),
        academicService.getAcademicYears(),
        academicService.getBranches(),
        academicService.getAcademicClasses(),
        userService.fetchTeachersAsync(),
        academicService.getTeacherAssignments(),
        academicService.getScheduledLectures()
      ]);

      setCourses(cList);
      setYears(yList);
      setBranches(bList);
      setClasses(clsList);
      setTeachers(tList);
      setAssignments(aList);
      setLectures(lecList || []);
    } catch (e) {
      console.warn("refreshAll notice:", e.message);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Fetch subjects whenever selectedCourse, selectedBranch, or selectedYear changes
  useEffect(() => {
    async function loadFilteredSubjects() {
      if (!selectedCourse) return;
      const data = await academicService.getSubjects({
        course: selectedCourse,
        branch: selectedBranch,
        year: selectedYear
      });
      setSubjects(data);
    }
    loadFilteredSubjects();
  }, [selectedCourse, selectedBranch, selectedYear]);

  // Handle Add Course Submit
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.code.trim() || !newCourse.name.trim()) return;

    const res = await academicService.createCourse(newCourse);
    if (res && res.success) {
      showBanner(`Course "${newCourse.code}" added successfully.`);
      setShowAddCourse(false);
      setNewCourse({ code: "", name: "", durationYears: 4 });
      refreshAll();
    } else {
      showBanner(res?.error || "Failed to add course.", "error");
    }
  };

  // Handle Add Branch Submit
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.name.trim()) return;

    const res = await academicService.createBranch(newBranch);
    if (res && res.success) {
      showBanner(`Branch "${newBranch.name}" created under ${newBranch.courseCode}.`);
      setShowAddBranch(false);
      setNewBranch({ courseCode: selectedCourse || "B.Tech", code: "", name: "" });
      refreshAll();
    } else {
      showBanner(res?.error || "Failed to add branch.", "error");
    }
  };

  // Handle Add Subject Submit
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.subjectCode.trim() || !newSubject.subjectName.trim()) return;

    const res = await academicService.createSubject({
      ...newSubject,
      courseCode: selectedCourse,
      branchCode: selectedBranch,
      yearCode: selectedYear
    });

    if (res && res.success) {
      showBanner(`Subject "${newSubject.subjectCode}: ${newSubject.subjectName}" registered.`);
      setShowAddSubject(false);
      setNewSubject({
        courseCode: selectedCourse,
        branchCode: selectedBranch,
        yearCode: selectedYear,
        subjectCode: "",
        subjectName: "",
        roomDefault: "LT-101"
      });
      const data = await academicService.getSubjects({
        course: selectedCourse,
        branch: selectedBranch,
        year: selectedYear
      });
      setSubjects(data);
    } else {
      showBanner(res?.error || "Failed to create subject.", "error");
    }
  };

  // Handle Delete Subject
  const handleDeleteSubject = async (id, code) => {
    if (!window.confirm(`Are you sure you want to remove subject "${code}" from the curriculum?`)) return;
    const res = await academicService.deleteSubject(id);
    if (res && res.success) {
      showBanner(`Subject "${code}" removed from curriculum.`);
      setSubjects(subjects.filter((s) => s.id !== id));
    } else {
      showBanner(res?.error || "Failed to remove subject.", "error");
    }
  };

  // Handle Add Class Section
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClass.classCode.trim()) return;

    const res = await academicService.createAcademicClass({
      ...newClass,
      courseCode: selectedCourse,
      branchCode: selectedBranch,
      yearCode: selectedYear
    });

    if (res && res.success) {
      showBanner(`Class section "${newClass.classCode}" registered.`);
      setShowAddClass(false);
      setNewClass({
        courseCode: selectedCourse,
        branchCode: selectedBranch,
        yearCode: selectedYear,
        sectionName: "Sec A",
        classCode: ""
      });
      refreshAll();
    } else {
      showBanner(res?.error || "Failed to create class section.", "error");
    }
  };

  // Handle Add Teacher Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssign.teacherId || !newAssign.subjectCode || !newAssign.classCode) {
      showBanner("Please select Teacher, Subject, and Class.", "error");
      return;
    }

    const t = teachers.find((tch) => tch.teacherId === newAssign.teacherId);
    const res = await academicService.createTeacherAssignment({
      ...newAssign,
      subjectName: newAssign.subjectName || newAssign.subjectCode,
      courseCode: selectedCourse,
      branchCode: selectedBranch,
      yearCode: selectedYear
    });

    if (res && res.success) {
      showBanner(`Assigned ${newAssign.subjectCode} to ${t?.fullName || newAssign.teacherId} for ${newAssign.classCode}.`);
      setShowAddAssign(false);
      setNewAssign({ teacherId: "", subjectCode: "", subjectName: "", classCode: "" });
      const aList = await academicService.getTeacherAssignments();
      setAssignments(aList);
    } else {
      showBanner(res?.error || "Failed to create assignment.", "error");
    }
  };

  // Handle Delete Teacher Assignment
  const handleDeleteAssignment = async (id, teacherName, subCode) => {
    if (!window.confirm(`Unassign subject "${subCode}" from ${teacherName}?`)) return;
    const res = await academicService.deleteTeacherAssignment(id);
    if (res && res.success) {
      showBanner(`Assignment removed successfully.`);
      setAssignments(assignments.filter((a) => a.id !== id));
    } else {
      showBanner(res?.error || "Failed to remove assignment.", "error");
    }
  };

  // Handle Add Scheduled Lecture
  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLecture.lectureName.trim() || !newLecture.subjectCode.trim()) {
      showBanner("Please enter Lecture Name and select a Subject.", "error");
      return;
    }

    const t = teachers.find((tch) => tch.teacherId === newLecture.teacherId);
    const res = await academicService.createScheduledLecture({
      ...newLecture,
      teacherName: t ? t.fullName : newLecture.teacherName || "Dr. Rajesh Sharma"
    });

    if (res && res.success) {
      showBanner(res.message || "Lecture scheduled successfully and enabled in Face Biometric & QR Kiosks.");
      setShowAddLecture(false);
      setNewLecture({
        lectureName: "",
        subjectCode: "",
        subjectName: "",
        courseCode: selectedCourse,
        branchCode: selectedBranch,
        yearCode: selectedYear,
        classCode: "CS-4A",
        teacherId: "",
        teacherName: "",
        room: "Lab 304",
        scheduleDay: "Monday",
        startTime: "09:00 AM",
        endTime: "10:00 AM"
      });
      const lecList = await academicService.getScheduledLectures();
      setLectures(lecList);
    } else {
      showBanner(res?.error || "Failed to schedule lecture.", "error");
    }
  };

  // Handle Delete Lecture
  const handleDeleteLecture = async (id, name) => {
    if (!window.confirm(`Delete scheduled lecture "${name}"?`)) return;
    const res = await academicService.deleteScheduledLecture(id);
    if (res && res.success) {
      showBanner("Scheduled lecture removed.");
      setLectures(lectures.filter((l) => l.id !== id));
    } else {
      showBanner(res?.error || "Failed to delete lecture.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Banner Message */}
      {msg.text && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            background: msg.type === "error" ? "#FEF2F2" : "#ECFDF5",
            border: msg.type === "error" ? "1px solid #FCA5A5" : "1px solid #6EE7B7",
            color: msg.type === "error" ? "#991B1B" : "#065F46"
          }}
        >
          {msg.type === "error" ? "⚠️" : "✓"} {msg.text}
        </div>
      )}

      {/* Header & Sub-Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--attendx-border, #E2E8F0)"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--attendx-navy, #0F172A)" }}>
            Academic Curriculum & Faculty Infrastructure
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--attendx-text-muted, #64748B)" }}>
            Configure institutional courses, branches, semester curricula, sections, and faculty assignments
          </p>
        </div>

        {/* Sub-tab pills */}
        <div style={{ display: "flex", background: "#F1F5F9", padding: 3, borderRadius: 8, gap: 4 }}>
          {[
            { id: "subjects", label: "Curriculum Subjects" },
            { id: "courses", label: "Courses & Branches" },
            { id: "classes", label: "Class Sections" },
            { id: "assignments", label: "Faculty Assignments" },
            { id: "lectures", label: "Lectures & Target Schedules" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: subTab === tab.id ? "#fff" : "transparent",
                color: subTab === tab.id ? "#0F172A" : "#64748B",
                boxShadow: subTab === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          TAB 1: CURRICULUM SUBJECTS
          ========================================================= */}
      {subTab === "subjects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter Bar: Course, Branch, Year */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr 1fr auto",
              gap: 12,
              background: "#F8FAFC",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              alignItems: "end"
            }}
          >
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, color: "#475569" }}>
                Select Course
              </label>
              <SearchableSelect
                options={courses.map((c) => ({ value: c.code, label: c.code, sublabel: c.name }))}
                value={selectedCourse}
                onChange={(val) => {
                  setSelectedCourse(val);
                  const matchingBranches = branches.filter((b) => b.course_code === val);
                  if (matchingBranches.length > 0) {
                    setSelectedBranch(matchingBranches[0].name || matchingBranches[0].code);
                  }
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, color: "#475569" }}>
                Select Branch
              </label>
              <SearchableSelect
                options={branches
                  .filter((b) => !selectedCourse || b.course_code === selectedCourse)
                  .map((b) => ({ value: b.name || b.code, label: b.name || b.code, sublabel: b.code }))}
                value={selectedBranch}
                onChange={(val) => setSelectedBranch(val)}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, color: "#475569" }}>
                Select Academic Year
              </label>
              <SearchableSelect
                options={years.map((y) => ({ value: y.code, label: y.code, sublabel: y.name }))}
                value={selectedYear}
                onChange={(val) => setSelectedYear(val)}
              />
            </div>

            <button
              onClick={() => setShowAddSubject(true)}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--attendx-navy, #0F172A)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                height: 38,
                whiteSpace: "nowrap"
              }}
            >
              + Add Subject to Curriculum
            </button>
          </div>

          {/* Subjects Table */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                Configured Subjects for {selectedCourse} · {selectedBranch} ({selectedYear})
              </span>
              <span style={{ fontSize: 12, color: "#64748B" }}>Total: {subjects.length} Subjects</span>
            </div>

            {subjects.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                      <th style={{ padding: "10px 14px" }}>Subject Code</th>
                      <th style={{ padding: "10px 14px" }}>Subject Name</th>
                      <th style={{ padding: "10px 14px" }}>Default Room</th>
                      <th style={{ padding: "10px 14px" }}>Course & Branch</th>
                      <th style={{ padding: "10px 14px" }}>Year</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "monospace", color: "#1E293B" }}>
                          {sub.subject_code}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>
                          {sub.subject_name}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748B" }}>
                          {sub.room_default || "LT-101"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748B" }}>
                          {sub.course_code} · {sub.branch_code}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748B" }}>
                          {sub.year_code}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <button
                            onClick={() => handleDeleteSubject(sub.id, sub.subject_code)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#DC2626",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: "4px 8px"
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748B" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>No subjects configured yet</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                  No curriculum records exist for {selectedCourse} - {selectedBranch} ({selectedYear}). Click "+ Add Subject to Curriculum" above to configure.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: COURSES & BRANCHES
          ========================================================= */}
      {subTab === "courses" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
          {/* Courses Table */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Institutional Courses</span>
              <button
                onClick={() => setShowAddCourse(true)}
                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                + Add Course
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "8px 12px" }}>Code</th>
                  <th style={{ padding: "8px 12px" }}>Course Name</th>
                  <th style={{ padding: "8px 12px" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id || c.code} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0F172A" }}>{c.code}</td>
                    <td style={{ padding: "8px 12px", color: "#475569" }}>{c.name}</td>
                    <td style={{ padding: "8px 12px", color: "#64748B" }}>{c.duration_years || 4} Years</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Branches Table */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Department Branches</span>
              <button
                onClick={() => setShowAddBranch(true)}
                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                + Add Branch
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "8px 12px" }}>Course</th>
                  <th style={{ padding: "8px 12px" }}>Branch Code</th>
                  <th style={{ padding: "8px 12px" }}>Branch Name</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id || `${b.course_code}-${b.code}`} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0F172A" }}>{b.course_code}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#2563EB", fontWeight: 600 }}>{b.code}</td>
                    <td style={{ padding: "8px 12px", color: "#475569" }}>{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: CLASS SECTIONS
          ========================================================= */}
      {subTab === "classes" && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Class Sections & Cohorts</span>
              <span style={{ fontSize: 12, color: "#64748B", marginLeft: 8 }}>({classes.length} registered sections)</span>
            </div>
            <button
              onClick={() => setShowAddClass(true)}
              style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              + Register New Class Section
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "10px 14px" }}>Class Code</th>
                <th style={{ padding: "10px 14px" }}>Section</th>
                <th style={{ padding: "10px 14px" }}>Course</th>
                <th style={{ padding: "10px 14px" }}>Branch</th>
                <th style={{ padding: "10px 14px" }}>Year</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id || c.class_code} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "monospace", color: "#1E293B" }}>
                    {c.class_code}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>{c.section_name}</td>
                  <td style={{ padding: "10px 14px", color: "#475569" }}>{c.course_code}</td>
                  <td style={{ padding: "10px 14px", color: "#475569" }}>{c.branch_code}</td>
                  <td style={{ padding: "10px 14px", color: "#64748B" }}>{c.year_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================
          TAB 4: FACULTY ASSIGNMENTS
          ========================================================= */}
      {subTab === "assignments" && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Authorized Teacher-Subject Assignments</span>
              <span style={{ fontSize: 12, color: "#64748B", marginLeft: 8 }}>({assignments.length} assignments active)</span>
            </div>
            <button
              onClick={() => setShowAddAssign(true)}
              style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              + Assign Subject to Faculty
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "10px 14px" }}>Faculty Name</th>
                <th style={{ padding: "10px 14px" }}>Teacher ID</th>
                <th style={{ padding: "10px 14px" }}>Subject Code</th>
                <th style={{ padding: "10px 14px" }}>Subject Name</th>
                <th style={{ padding: "10px 14px" }}>Class / Cohort</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>
                    {a.teacher_name || a.teacher_id}
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#64748B" }}>
                    {a.teacher_id}
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#2563EB" }}>
                    {a.subject_code}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#334155" }}>
                    {a.subject_name}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>
                    {a.class_code}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button
                      onClick={() => handleDeleteAssignment(a.id, a.teacher_name || a.teacher_id, a.subject_code)}
                      style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================
          TAB 5: SCHEDULED LECTURES & TARGET SCHEDULES
          ========================================================= */}
      {subTab === "lectures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Scheduled Lectures ({lectures.length})
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                Lectures defined here instantly appear in Face Biometric Kiosks, QR Code Attendance, and Google Sheets Sync.
              </p>
            </div>
            <button
              onClick={() => {
                setNewLecture({
                  lectureName: "",
                  subjectCode: subjects.length > 0 ? subjects[0].subject_code : "",
                  subjectName: subjects.length > 0 ? subjects[0].subject_name : "",
                  courseCode: selectedCourse || "B.Tech",
                  branchCode: selectedBranch || "Computer Science & Engineering",
                  yearCode: selectedYear || "4th Year",
                  classCode: classes.length > 0 ? classes[0].class_code : "CS-4A",
                  teacherId: teachers.length > 0 ? teachers[0].teacherId : "",
                  teacherName: teachers.length > 0 ? teachers[0].fullName : "",
                  room: "Lab 304",
                  scheduleDay: "Monday",
                  startTime: "09:00 AM",
                  endTime: "10:00 AM"
                });
                setShowAddLecture(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(37,99,235,0.2)"
              }}
            >
              + Schedule Lecture
            </button>
          </div>

          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B", fontSize: 12 }}>
                  <th style={{ padding: "10px 14px" }}>Lecture Name</th>
                  <th style={{ padding: "10px 14px" }}>Subject</th>
                  <th style={{ padding: "10px 14px" }}>Course / Branch / Year</th>
                  <th style={{ padding: "10px 14px" }}>Class Section</th>
                  <th style={{ padding: "10px 14px" }}>Faculty / Instructor</th>
                  <th style={{ padding: "10px 14px" }}>Room & Timing</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lectures.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "28px 14px", textAlign: "center", color: "#94A3B8" }}>
                      No scheduled lectures configured yet. Click "+ Schedule Lecture" to add one.
                    </td>
                  </tr>
                ) : (
                  lectures.map((lec) => (
                    <tr key={lec.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>
                        {lec.lecture_name}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>{lec.subject_code}</span>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{lec.subject_name}</div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569" }}>
                        <div><strong>{lec.course_code}</strong> ({lec.year_code || "N/A"})</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{lec.branch_code}</div>
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>
                        {lec.class_code || "All"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#334155" }}>
                        <div style={{ fontWeight: 500 }}>{lec.teacher_name || lec.teacher_id || "Unassigned"}</div>
                        {lec.teacher_id && <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{lec.teacher_id}</div>}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#334155" }}>
                        <div>📍 {lec.room || "Room TBA"}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>
                          {lec.schedule_day || "Weekly"} {lec.start_time ? `· ${lec.start_time}` : ""} {lec.end_time ? `- ${lec.end_time}` : ""}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteLecture(lec.id, lec.lecture_name)}
                          style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD COURSE */}
      {showAddCourse && (
        <div className="attendx-modal-backdrop" onClick={() => setShowAddCourse(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Add Institutional Course</h3>
              <button className="modal-close-btn" onClick={() => setShowAddCourse(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCourse} className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Course Code (e.g. B.Des)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Des"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Design"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Duration (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={newCourse.durationYears}
                  onChange={(e) => setNewCourse({ ...newCourse, durationYears: parseInt(e.target.value, 10) || 4 })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCourse(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRANCH */}
      {showAddBranch && (
        <div className="attendx-modal-backdrop" onClick={() => setShowAddBranch(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Add Branch to Course</h3>
              <button className="modal-close-btn" onClick={() => setShowAddBranch(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBranch} className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Course</label>
                <select
                  value={newBranch.courseCode}
                  onChange={(e) => setNewBranch({ ...newBranch, courseCode: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Branch Code (e.g. UXD)</label>
                <input
                  type="text"
                  placeholder="e.g. UXD"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Branch Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. User Experience & Interaction Design"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddBranch(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBJECT */}
      {showAddSubject && (
        <div className="attendx-modal-backdrop" onClick={() => setShowAddSubject(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Add Curriculum Subject</h3>
              <button className="modal-close-btn" onClick={() => setShowAddSubject(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubject} className="modal-body">
              <div style={{ background: "#F1F5F9", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                Target: <strong>{selectedCourse}</strong> · <strong>{selectedBranch}</strong> (<strong>{selectedYear}</strong>)
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS410"
                  value={newSubject.subjectCode}
                  onChange={(e) => setNewSubject({ ...newSubject, subjectCode: e.target.value.toUpperCase() })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems"
                  value={newSubject.subjectName}
                  onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Default Room / Hall</label>
                <input
                  type="text"
                  placeholder="e.g. LT-201"
                  value={newSubject.roomDefault}
                  onChange={(e) => setNewSubject({ ...newSubject, roomDefault: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddSubject(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLASS */}
      {showAddClass && (
        <div className="attendx-modal-backdrop" onClick={() => setShowAddClass(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Register Class Section</h3>
              <button className="modal-close-btn" onClick={() => setShowAddClass(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClass} className="modal-body">
              <div style={{ background: "#F1F5F9", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                Target: <strong>{selectedCourse}</strong> · <strong>{selectedBranch}</strong> (<strong>{selectedYear}</strong>)
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Class Code (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-4C"
                  value={newClass.classCode}
                  onChange={(e) => setNewClass({ ...newClass, classCode: e.target.value.toUpperCase() })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Section Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sec C"
                  value={newClass.sectionName}
                  onChange={(e) => setNewClass({ ...newClass, sectionName: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddClass(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FACULTY ASSIGNMENT */}
      {showAddAssign && (
        <div className="attendx-modal-backdrop" onClick={() => setShowAddAssign(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Assign Subject & Class to Faculty</h3>
              <button className="modal-close-btn" onClick={() => setShowAddAssign(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAssignment} className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Faculty Member</label>
                <select
                  required
                  value={newAssign.teacherId}
                  onChange={(e) => setNewAssign({ ...newAssign, teacherId: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                >
                  <option value="">Select Faculty...</option>
                  {teachers.map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.fullName} ({t.teacherId}) - {t.department}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Subject</label>
                <select
                  required
                  value={newAssign.subjectCode}
                  onChange={(e) => {
                    const subCode = e.target.value;
                    const found = subjects.find((s) => s.subject_code === subCode);
                    setNewAssign({
                      ...newAssign,
                      subjectCode: subCode,
                      subjectName: found ? found.subject_name : subCode
                    });
                  }}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.subject_code}>
                      {s.subject_code}: {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Class Section</label>
                <select
                  required
                  value={newAssign.classCode}
                  onChange={(e) => setNewAssign({ ...newAssign, classCode: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                >
                  <option value="">Select Class Section...</option>
                  {classes.map((c) => (
                    <option key={c.class_code} value={c.class_code}>
                      {c.class_code} ({c.section_name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddAssign(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Assign Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEDULED LECTURE */}
      {showAddLecture && (
        <div className="attendx-modal-backdrop" onClick={() => setShowAddLecture(false)}>
          <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Schedule Target Lecture</h3>
              <button className="modal-close-btn" onClick={() => setShowAddLecture(false)}>✕</button>
            </div>
            <form onSubmit={handleAddLecture} className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Lecture / Session Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems - Unit 3: Concurrency"
                  value={newLecture.lectureName}
                  onChange={(e) => setNewLecture({ ...newLecture, lectureName: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Course</label>
                  <select
                    value={newLecture.courseCode}
                    onChange={(e) => {
                      const c = e.target.value;
                      const availBranches = branches.filter((b) => b.course_code === c);
                      setNewLecture({
                        ...newLecture,
                        courseCode: c,
                        branchCode: availBranches.length > 0 ? (availBranches[0].name || availBranches[0].code) : ""
                      });
                    }}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                  >
                    {courses.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Branch</label>
                  <select
                    value={newLecture.branchCode}
                    onChange={(e) => setNewLecture({ ...newLecture, branchCode: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                  >
                    {branches
                      .filter((b) => !newLecture.courseCode || b.course_code === newLecture.courseCode)
                      .map((b) => (
                        <option key={b.code} value={b.name || b.code}>
                          {b.name || b.code}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Academic Year</label>
                  <select
                    value={newLecture.yearCode}
                    onChange={(e) => setNewLecture({ ...newLecture, yearCode: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                  >
                    {years.map((y) => (
                      <option key={y.code} value={y.code}>{y.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Class Section</label>
                  <select
                    value={newLecture.classCode}
                    onChange={(e) => setNewLecture({ ...newLecture, classCode: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                  >
                    <option value="">All / Common</option>
                    {classes.map((cls) => (
                      <option key={cls.class_code} value={cls.class_code}>
                        {cls.class_code} ({cls.section_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Curriculum Subject <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select
                  required
                  value={newLecture.subjectCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const s = subjects.find((sub) => sub.subject_code === code);
                    setNewLecture({
                      ...newLecture,
                      subjectCode: code,
                      subjectName: s ? s.subject_name : code,
                      room: s?.room_default || newLecture.room
                    });
                  }}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                >
                  <option value="">Select Curriculum Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.subject_code}>
                      {s.subject_code}: {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Assigned Faculty</label>
                <select
                  value={newLecture.teacherId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    const t = teachers.find((tch) => tch.teacherId === tid);
                    setNewLecture({
                      ...newLecture,
                      teacherId: tid,
                      teacherName: t ? t.fullName : ""
                    });
                  }}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff" }}
                >
                  <option value="">Select Faculty...</option>
                  {teachers.map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.fullName} ({t.teacherId}) - {t.department}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 304"
                    value={newLecture.room}
                    onChange={(e) => setNewLecture({ ...newLecture, room: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Start Time</label>
                  <input
                    type="text"
                    placeholder="09:00 AM"
                    value={newLecture.startTime}
                    onChange={(e) => setNewLecture({ ...newLecture, startTime: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>End Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={newLecture.endTime}
                    onChange={(e) => setNewLecture({ ...newLecture, endTime: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddLecture(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save & Enable for Biometrics</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
