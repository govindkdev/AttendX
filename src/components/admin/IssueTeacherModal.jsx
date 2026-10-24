/*
=========================================================
ATTENDX - OFFICIAL TEACHER ID ISSUANCE MODAL
=========================================================
Authority-controlled faculty onboarding modal featuring:
- Faculty Name, ID, Department, Designation, Email, Phone
- Assigned Courses (searchable multi-select)
- Assigned Branches (searchable multi-select)
- Assigned Academic Years (searchable multi-select)
- Assigned Subjects (filtered by chosen academic configuration)
- Assigned Classes / Sections (e.g. CS-4A, IT-1A)
- Real database persistence, user account creation, and teacher_assignments table link
=========================================================
*/

import React, { useState, useEffect } from "react";
import SearchableSelect from "../common/SearchableSelect";
import { academicService } from "../../services/academicService";
import { userService } from "../../services/userService";

export default function IssueTeacherModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Academic Configuration Multi-Select States
  const [assignedCourses, setAssignedCourses] = useState(["B.Tech"]);
  const [assignedBranches, setAssignedBranches] = useState(["Computer Science & Engineering"]);
  const [assignedYears, setAssignedYears] = useState(["1st Year", "4th Year"]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState(["CS-4A"]);

  // Options Loaded from Academic Engine
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Manual Subject Add Form
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load baseline academic metadata
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      const courses = await academicService.getCourses();
      const years = await academicService.getAcademicYears();
      const branches = await academicService.getBranches("");
      const classes = await academicService.getAcademicClasses();

      if (isMounted) {
        setAvailableCourses(courses);
        setAvailableYears(years);
        setAvailableBranches(branches);
        setAvailableClasses(classes);
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically load available subjects based on selected courses and branches
  useEffect(() => {
    let isMounted = true;
    async function loadSubjectsForScope() {
      try {
        const subjects = await academicService.getSubjects();
        if (isMounted) {
          // Filter subjects by chosen courses and branches
          const filtered = subjects.filter((s) => {
            const matchCourse = assignedCourses.length === 0 || assignedCourses.includes(s.course_code);
            const matchBranch = assignedBranches.length === 0 || assignedBranches.some(
              (b) => b === s.branch_code || s.branch_code.includes(b)
            );
            return matchCourse && matchBranch;
          });
          setAvailableSubjects(filtered.length > 0 ? filtered : subjects);

          // If no assigned subjects yet, default to first couple matching
          if (assignedSubjects.length === 0 && filtered.length > 0) {
            setAssignedSubjects(filtered.slice(0, 2).map((s) => s.subject_code));
          }
        }
      } catch (err) {
        console.error("loadSubjectsForScope error:", err);
      }
    }
    loadSubjectsForScope();
    return () => {
      isMounted = false;
    };
  }, [assignedCourses, assignedBranches]);

  // Handle adding custom subject
  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) return;

    const code = newSubCode.trim().toUpperCase();
    if (!assignedSubjects.includes(code)) {
      setAssignedSubjects([...assignedSubjects, code]);
    }

    setAvailableSubjects((prev) => [
      ...prev,
      {
        subject_code: code,
        subject_name: newSubName.trim(),
        course_code: assignedCourses[0] || "B.Tech",
        branch_code: assignedBranches[0] || department
      }
    ]);

    setNewSubCode("");
    setNewSubName("");
    setShowAddSubject(false);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter faculty full name.");
      return;
    }
    if (!department.trim()) {
      setErrorMessage("Please specify department.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter faculty email address.");
      return;
    }
    if (assignedSubjects.length === 0) {
      setErrorMessage("Please assign at least one subject to this faculty member.");
      return;
    }
    if (assignedClasses.length === 0) {
      setErrorMessage("Please assign at least one lecture class/section.");
      return;
    }

    setSubmitting(true);
    try {
      // Format subjects to objects
      const formattedSubjects = assignedSubjects.map((subCode) => {
        const found = availableSubjects.find((s) => s.subject_code === subCode || s.code === subCode);
        return {
          code: subCode,
          name: found ? (found.subject_name || found.name) : subCode,
          room: found ? (found.room_default || found.room || "LT-101") : "LT-101"
        };
      });

      const res = await userService.issueTeacherId({
        teacherId: teacherId.trim() || undefined,
        fullName: fullName.trim(),
        department,
        designation,
        email: email.trim(),
        phone: phone.trim(),
        assignedCourses,
        assignedBranches,
        assignedYears,
        assignedSubjects: formattedSubjects,
        assignedClasses
      });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to issue Teacher ID.");
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
          maxWidth: 640,
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
              Issue Official Teacher ID
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--attendx-text-muted, #64748B)" }}>
              Faculty credentials, academic course authorization & class assignments
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

          {/* Full Name & Teacher ID */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Faculty Name <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Harish Chandra"
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
                Official Teacher ID <span style={{ fontSize: 11, fontWeight: 400, color: "#64748B" }}>(Auto-generated if empty)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. TCH-2026-005"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value.toUpperCase())}
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

          {/* Department & Designation */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Department <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science & Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
                Designation <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  fontSize: 13
                }}
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Professor & HOD">Professor & HOD</option>
                <option value="Visiting Faculty">Visiting Faculty</option>
              </select>
            </div>
          </div>

          {/* Email & Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Faculty Email <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="faculty@attendx.com"
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
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9876543220"
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
          </div>

          {/* Academic Scope Assignments */}
          <div
            style={{
              padding: 14,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              marginBottom: 16
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
              Academic Scope & Lecture Assignments
            </div>

            {/* Assigned Courses (Multi-Select) */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Assigned Courses
              </label>
              <SearchableSelect
                isMulti={true}
                options={availableCourses.map((c) => ({ value: c.code, label: c.code, sublabel: c.name }))}
                value={assignedCourses}
                onChange={(vals) => setAssignedCourses(vals)}
                placeholder="Select courses taught by faculty..."
              />
            </div>

            {/* Assigned Branches (Multi-Select) */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Assigned Branches / Departments
              </label>
              <SearchableSelect
                isMulti={true}
                options={availableBranches.map((b) => ({ value: b.name || b.code, label: b.name || b.code, sublabel: b.course_code }))}
                value={assignedBranches}
                onChange={(vals) => setAssignedBranches(vals)}
                placeholder="Select branches..."
              />
            </div>

            {/* Assigned Academic Years (Multi-Select) */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Assigned Academic Years
              </label>
              <SearchableSelect
                isMulti={true}
                options={availableYears.map((y) => ({ value: y.code, label: y.code, sublabel: y.name }))}
                value={assignedYears}
                onChange={(vals) => setAssignedYears(vals)}
                placeholder="Select academic years..."
              />
            </div>

            {/* Assigned Subjects (Multi-Select) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>
                  Assigned Subjects <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSubject(!showAddSubject)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563EB",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {showAddSubject ? "Close" : "+ Add Custom Subject"}
                </button>
              </div>

              {showAddSubject && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #CBD5E1",
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 10,
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr auto",
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
                    placeholder="Subject Name"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    style={{ padding: "6px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
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

              <SearchableSelect
                isMulti={true}
                options={availableSubjects.map((s) => ({
                  value: s.subject_code || s.code,
                  label: `${s.subject_code || s.code}: ${s.subject_name || s.name}`,
                  sublabel: `${s.course_code || ""} · ${s.branch_code || ""}`
                }))}
                value={assignedSubjects}
                onChange={(vals) => setAssignedSubjects(vals)}
                placeholder="Select subjects to assign to faculty..."
              />
            </div>

            {/* Assigned Classes / Sections (Multi-Select) */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#1E293B" }}>
                Assigned Classes / Sections <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <SearchableSelect
                isMulti={true}
                options={availableClasses.map((c) => ({
                  value: c.class_code,
                  label: c.class_code,
                  sublabel: `${c.section_name || ""} (${c.course_code || ""} ${c.branch_code || ""})`
                }))}
                value={assignedClasses}
                onChange={(vals) => setAssignedClasses(vals)}
                placeholder="Select class sections (e.g. CS-4A, IT-1A)..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              marginTop: 10
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
              {submitting ? "Authorizing Faculty..." : "Create & Issue Teacher ID"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
