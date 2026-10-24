/*
=========================================================
ATTENDX - OFFICIAL STUDENT ID ISSUANCE MODAL
=========================================================
Authority-controlled student onboarding modal featuring:
- Searchable Course dropdown with custom course creation
- Dynamic Branch dropdown updating with selected course + custom branch creation
- Academic Year dropdown (First/Second/Third/Fourth Year)
- Automatic curriculum subject retrieval based on Course + Branch + Year
- Editable subject list (Add/Remove subjects before issuing)
- Real database persistence and login credential creation
=========================================================
*/

import React, { useState, useEffect } from "react";
import SearchableSelect from "../common/SearchableSelect";
import { academicService } from "../../services/academicService";
import { userService } from "../../services/userService";

export default function IssueStudentModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("B.Tech");
  const [branch, setBranch] = useState("Information Technology");
  const [year, setYear] = useState("1st Year");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [initialPassword, setInitialPassword] = useState("Student@123");

  // Academic Configuration Lists
  const [coursesList, setCoursesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [yearsList, setYearsList] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [noConfigWarning, setNoConfigWarning] = useState(false);

  // Manual Subject Add Form
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubRoom, setNewSubRoom] = useState("LT-101");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load initial courses and years
  useEffect(() => {
    let isMounted = true;
    async function loadAcademicMeta() {
      const courses = await academicService.getCourses();
      const years = await academicService.getAcademicYears();
      if (isMounted) {
        setCoursesList(courses);
        setYearsList(years);
        if (courses.length > 0 && !courses.some((c) => c.code === course)) {
          setCourse(courses[0].code);
        }
      }
    }
    loadAcademicMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update branches when course changes
  useEffect(() => {
    let isMounted = true;
    async function loadBranchesForCourse() {
      if (!course) return;
      const branches = await academicService.getBranches(course);
      if (isMounted) {
        setBranchesList(branches);
        if (branches.length > 0) {
          const currentValid = branches.some((b) => b.name === branch || b.code === branch);
          if (!currentValid) {
            setBranch(branches[0].name || branches[0].code);
          }
        } else {
          setBranch("");
        }
      }
    }
    loadBranchesForCourse();
    return () => {
      isMounted = false;
    };
  }, [course]);

  // Automatically fetch configured subjects when Course + Branch + Year change
  useEffect(() => {
    let isMounted = true;
    async function fetchCurriculumSubjects() {
      if (!course || !branch || !year) return;
      setLoadingSubjects(true);
      setErrorMessage("");

      try {
        const subjects = await academicService.getSubjects({ course, branch, year });
        if (isMounted) {
          if (subjects && subjects.length > 0) {
            const formatted = subjects.map((s) => ({
              code: s.subject_code || s.code,
              name: s.subject_name || s.name,
              room: s.room_default || s.room || "LT-101",
              teacher: s.teacher_name || "Faculty TBA"
            }));
            setAssignedSubjects(formatted);
            setNoConfigWarning(false);
          } else {
            setAssignedSubjects([]);
            setNoConfigWarning(true);
          }
        }
      } catch (err) {
        console.error("fetchCurriculumSubjects error:", err);
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    }

    fetchCurriculumSubjects();
    return () => {
      isMounted = false;
    };
  }, [course, branch, year]);

  // Custom Course Creator
  const handleAddCustomCourse = async (customCourseName) => {
    try {
      const res = await academicService.createCourse({
        code: customCourseName,
        name: customCourseName,
        durationYears: 4
      });
      if (res && res.success) {
        setCoursesList((prev) => [...prev, { code: customCourseName, name: customCourseName }]);
        setCourse(customCourseName);
      } else {
        setCourse(customCourseName);
      }
    } catch (e) {
      setCourse(customCourseName);
    }
  };

  // Custom Branch Creator
  const handleAddCustomBranch = async (customBranchName) => {
    try {
      const res = await academicService.createBranch({
        courseCode: course,
        code: customBranchName.slice(0, 5).toUpperCase(),
        name: customBranchName
      });
      if (res && res.success) {
        setBranchesList((prev) => [...prev, { code: customBranchName, name: customBranchName }]);
        setBranch(customBranchName);
      } else {
        setBranch(customBranchName);
      }
    } catch (e) {
      setBranch(customBranchName);
    }
  };

  // Add Subject to current student
  const handleAddSubjectToStudent = (e) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) return;

    const code = newSubCode.trim().toUpperCase();
    if (assignedSubjects.some((s) => s.code.toUpperCase() === code)) {
      setErrorMessage(`Subject code "${code}" is already in the list.`);
      return;
    }

    setAssignedSubjects([
      ...assignedSubjects,
      {
        code,
        name: newSubName.trim(),
        room: newSubRoom.trim() || "LT-101",
        teacher: "Faculty TBA"
      }
    ]);

    setNewSubCode("");
    setNewSubName("");
    setNewSubRoom("LT-101");
    setShowAddSubject(false);
    setNoConfigWarning(false);
  };

  // Remove Subject from current student
  const handleRemoveSubject = (codeToRemove) => {
    setAssignedSubjects(assignedSubjects.filter((s) => s.code !== codeToRemove));
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter student's full name.");
      return;
    }
    if (!course || !branch || !year) {
      setErrorMessage("Please select Course, Branch, and Academic Year.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter a valid student email address.");
      return;
    }

    setSubmitting(true);
    const chosenPass = initialPassword.trim() || "Student@123";
    try {
      const res = await userService.issueStudentId({
        studentId: studentId.trim() || undefined,
        fullName: fullName.trim(),
        course,
        branch,
        year,
        rollNumber: rollNumber.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        password: chosenPass,
        assignedSubjects
      });

      if (res.success) {
        onSuccess(`${res.message} (Login Password: ${chosenPass})`);
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to issue Student ID.");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="attendx-modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="attendx-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
          width: "95%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          padding: 0,
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--attendx-border, #E2E8F0)",
            background: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--attendx-navy, #0F172A)" }}>
              Issue Official Student ID
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--attendx-text-muted, #64748B)" }}>
              Academic enrollment & official ID authorization registry
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--attendx-text-muted, #64748B)"
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: "18px 22px", flex: 1 }}>
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                marginBottom: 16,
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: 13
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Full Name & Student ID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Full Name <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priyanshu Maurya"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Official Student ID <span style={{ fontSize: 11, fontWeight: 400, color: "#64748B" }}>(Auto-generated if empty)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. STU-2026-006"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  fontFamily: "monospace"
                }}
              />
            </div>
          </div>

          {/* Academic Selection: Course, Branch, Academic Year */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 12, marginBottom: 14 }}>
            {/* Course */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Course <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <SearchableSelect
                options={coursesList.map((c) => ({ value: c.code, label: c.code, sublabel: c.name }))}
                value={course}
                onChange={(val) => setCourse(val)}
                allowCustom={true}
                customLabel="Add Custom Course"
                onAddCustom={handleAddCustomCourse}
                placeholder="Select Course"
              />
            </div>

            {/* Branch */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Branch <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <SearchableSelect
                options={branchesList.map((b) => ({ value: b.name || b.code, label: b.name || b.code, sublabel: b.code }))}
                value={branch}
                onChange={(val) => setBranch(val)}
                allowCustom={true}
                customLabel="Add Custom Branch"
                onAddCustom={handleAddCustomBranch}
                placeholder="Select Branch"
                emptyMessage={`No branches for ${course}. Click below to add.`}
              />
            </div>

            {/* Academic Year */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Academic Year <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <SearchableSelect
                options={yearsList.map((y) => ({ value: y.code, label: y.code, sublabel: y.name }))}
                value={year}
                onChange={(val) => setYear(val)}
                placeholder="Select Year"
              />
            </div>
          </div>

          {/* Email, Password, Phone, Roll Number */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Student Email <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="student@attendx.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Initial Account Password <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Student@123"
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  fontFamily: "monospace"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                University Roll No.
              </label>
              <input
                type="text"
                placeholder="2100970100..."
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13
                }}
              />
            </div>
          </div>

          {/* Dynamic Subject Selection & Configuration Section */}
          <div
            style={{
              marginTop: 10,
              padding: 14,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  Assigned Subjects ({assignedSubjects.length})
                </span>
                <span style={{ fontSize: 11, color: "#64748B", marginLeft: 8 }}>
                  Curriculum for {course} · {branch} · {year}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubject(!showAddSubject)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#fff",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#0F172A"
                }}
              >
                {showAddSubject ? "Close" : "+ Add Subject"}
              </button>
            </div>

            {/* Quick Add Custom Subject Form */}
            {showAddSubject && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr 1fr auto",
                  gap: 8,
                  alignItems: "center"
                }}
              >
                <input
                  type="text"
                  placeholder="Subject Code (CS409)"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                  style={{ padding: "6px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1" }}
                />
                <input
                  type="text"
                  placeholder="Subject Title (e.g. Distributed Computing)"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1" }}
                />
                <input
                  type="text"
                  placeholder="Room (LT-201)"
                  value={newSubRoom}
                  onChange={(e) => setNewSubRoom(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1" }}
                />
                <button
                  type="button"
                  onClick={handleAddSubjectToStudent}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#0F172A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {loadingSubjects ? (
              <div style={{ padding: "14px", textAlign: "center", fontSize: 12, color: "#64748B" }}>
                Loading curriculum subjects...
              </div>
            ) : noConfigWarning && assignedSubjects.length === 0 ? (
              <div
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  background: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  fontSize: 12,
                  color: "#92400E",
                  lineHeight: 1.5
                }}
              >
                ℹ️ No subjects are currently configured for <strong>{course}</strong> → <strong>{branch}</strong> (<strong>{year}</strong>).
                You can use the <strong>"+ Add Subject"</strong> button above to assign subjects to this student, or manage standard curriculum in the <strong>Academic Setup</strong> tab.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {assignedSubjects.map((sub) => (
                  <div
                    key={sub.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#fff",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      fontSize: 12
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color: "#1E293B",
                          background: "#F1F5F9",
                          padding: "2px 6px",
                          borderRadius: 4
                        }}
                      >
                        {sub.code}
                      </span>
                      <span style={{ fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sub.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>
                        · Room: {sub.room || "LT-101"}
                      </span>
                      {sub.teacher && (
                        <span style={{ fontSize: 11, color: "#2563EB", fontWeight: 500 }}>
                          ({sub.teacher})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub.code)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        padding: "2px 6px"
                      }}
                      title="Remove subject"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              marginTop: 20
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{
                padding: "9px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: "var(--attendx-navy, #0F172A)",
                color: "#fff",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? "Authorizing ID..." : "Create & Issue Student ID"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
