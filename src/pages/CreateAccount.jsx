import React, { useMemo, useState } from "react";
import { authService } from "../services/authService";
import "../style/CreateAccount.css";

/*
=========================================================
ATTENDX - ROLE BASED CREATE ACCOUNT
=========================================================

STUDENT
-------
Student ID ADMIN provide karega.
Student apni academic + personal + parent details fill karega.

TEACHER
-------
Teacher ID ADMIN provide karega.
Teacher sirf required professional details fill karega.

ADMIN
-----
Admin ID ATTENDX AUTHORITIES provide karegi.
Admin registration ke liye OTP verification required hai.

DEMO ONLY
---------
Actual ID verification, OTP sending and database insertion
backend/API se hoga.

Demo OTP:
123456

Demo Student IDs:
STU-2026-001
STU-2026-002
STU-2026-003

Demo Teacher ID:
TCH-2026-001

Demo Admin ID:
ADM-2026-001
=========================================================
*/

function Icon({ type, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
      </svg>
    );
  }

  if (type === "mail") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg {...common}>
        <path d="M7 3.8 9.5 3l1.7 4.2-2.2 1.5a15 15 0 0 0 6.3 6.3l1.5-2.2 4.2 1.7-.8 2.5a2 2 0 0 1-2.3 1.4C10.5 17.2 6.8 13.5 5.6 6.1A2 2 0 0 1 7 3.8Z" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg {...common}>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 20 6v5c0 4.7-3.1 8.4-8 10-4.9-1.6-8-5.3-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (type === "building") {
    return (
      <svg {...common}>
        <path d="M4 21V5l8-3 8 3v16" />
        <path d="M8 9h1M15 9h1M8 13h1M15 13h1M8 17h1M15 17h1" />
        <path d="M10 21v-3h4v3" />
      </svg>
    );
  }

  if (type === "id") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="11" r="2" />
        <path d="M5.5 16c.6-1.6 1.4-2.4 2.5-2.4s1.9.8 2.5 2.4" />
        <path d="M13 10h5M13 14h5" />
      </svg>
    );
  }

  if (type === "eye") {
    return (
      <svg {...common}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (type === "eye-off") {
    return (
      <svg {...common}>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.1 3.7" />
        <path d="M6.2 8.3C3.8 10 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.6" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </svg>
    );
  }

  if (type === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (type === "arrow-left") {
    return (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  return null;
}

function CreateAccount() {
  /* =====================================================
     ROLE FROM URL
     /create-account?role=student
     /create-account?role=teacher
     /create-account?role=admin
  ====================================================== */

  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  const urlRole = params.get("role");

  const [role, setRole] = useState(
    urlRole === "teacher" || urlRole === "admin"
      ? urlRole
      : "student"
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [adminOtpMode, setAdminOtpMode] = useState(false);
  const [adminOtp, setAdminOtp] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [form, setForm] = useState({
    /* Student */
    studentId: "",
    fullName: "",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    year: "4th Year",
    phone: "",
    email: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    address: "",

    /* Teacher */
    teacherId: "",
    department: "",

    /* Admin */
    adminId: "",

    /* Common */
    password: "",
    confirmPassword: "",
  });

  const changeRole = (newRole) => {
    setRole(newRole);

    window.history.replaceState(
      {},
      "",
      `/create-account?role=${newRole}`
    );

    setMessage("");
    setMessageType("");
    setAdminOtpMode(false);
    setAdminOtp("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  const updatePhone = (name, value) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length <= 10) {
      setForm((prev) => ({
        ...prev,
        [name]: digits,
      }));
    }
  };

  const validatePassword = () => {
    const password = form.password;

    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const showError = (text) => {
    setMessage(text);
    setMessageType("error");
  };

  /* =====================================================
     STUDENT REGISTRATION
  ====================================================== */

  const registerStudent = async () => {
    if (!form.studentId.trim()) {
      showError("Enter the Student ID provided by your Admin.");
      return;
    }

    if (!form.fullName.trim()) {
      showError("Please enter student name.");
      return;
    }

    if (!form.phone || form.phone.length !== 10) {
      showError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!form.email.trim()) {
      showError("Enter student email address.");
      return;
    }

    if (!form.parentName.trim()) {
      showError("Enter parent / guardian name.");
      return;
    }

    if (!form.parentPhone || form.parentPhone.length !== 10) {
      showError("Enter a valid parent phone number.");
      return;
    }

    if (!form.address.trim()) {
      showError("Enter your complete address.");
      return;
    }

    if (!validatePassword()) {
      showError(
        "Password must contain 8+ characters, uppercase, lowercase, number and special symbol."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    /*
    Demo rule:
    Student ID admin-issued hona chahiye.
    Enforces authorization check against Admin records.
    */
    const result = await authService.registerStudent(form);
    if (!result.success) {
      showError(result.error);
      return;
    }

    setMessage(result.message);
    setMessageType("success");

    setTimeout(() => {
      window.location.href = `/login?role=student&registered=true&id=${encodeURIComponent(form.studentId)}`;
    }, 1200);
  };

  /* =====================================================
     TEACHER REGISTRATION
  ====================================================== */

  const registerTeacher = async () => {
    if (!form.teacherId.trim()) {
      showError("Enter the Teacher ID provided by your Admin.");
      return;
    }

    if (!form.fullName.trim()) {
      showError("Please enter teacher name.");
      return;
    }

    if (!form.department.trim()) {
      showError("Please enter department.");
      return;
    }

    if (!form.phone || form.phone.length !== 10) {
      showError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!validatePassword()) {
      showError(
        "Password must contain 8+ characters, uppercase, lowercase, number and special symbol."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    const result = await authService.registerTeacher(form);
    if (!result.success) {
      showError(result.error);
      return;
    }

    setMessage(result.message);
    setMessageType("success");

    setTimeout(() => {
      window.location.href = `/login?role=teacher&registered=true&id=${encodeURIComponent(form.teacherId)}`;
    }, 1200);
  };

  /* =====================================================
     ADMIN - SEND OTP
  ====================================================== */

  const sendAdminOtp = (e) => {
    e.preventDefault();

    if (!form.adminId.trim()) {
      showError("Enter the Admin ID provided by AttendX Authorities.");
      return;
    }

    if (!form.phone || form.phone.length !== 10) {
      showError("Enter the registered 10-digit phone number.");
      return;
    }

    if (!validatePassword()) {
      showError(
        "Password must contain 8+ characters, uppercase, lowercase, number and special symbol."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setAdminOtpMode(true);

    setMessage(
      "Simulated OTP sent to authorized phone number. For this demo prototype, enter: 123456"
    );
    setMessageType("success");
  };

  /* =====================================================
     ADMIN OTP VERIFICATION
  ====================================================== */

  const verifyAdminOtp = () => {
    if (adminOtp.length !== 6) {
      showError("Enter the 6-digit OTP.");
      return;
    }

    const result = authService.registerAdmin(form, adminOtp);
    if (!result.success) {
      showError(result.error);
      return;
    }

    setMessage(result.message);
    setMessageType("success");

    setTimeout(() => {
      window.location.href = "/admin-dashboard";
    }, 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (role === "student") {
      registerStudent();
      return;
    }

    if (role === "teacher") {
      registerTeacher();
      return;
    }

    if (role === "admin") {
      if (adminOtpMode) {
        verifyAdminOtp();
      } else {
        sendAdminOtp(e);
      }
    }
  };

  return (
    <div className={`create-page ${role}-mode`}>

      {/* =================================================
          LEFT BRAND / ANIMATED SYSTEM PANEL
      ================================================== */}

      <section className="create-brand-panel">

        <div className="brand-glow glow-one"></div>
        <div className="brand-glow glow-two"></div>

        {/* Background particles */}
        <span className="particle particle-1"></span>
        <span className="particle particle-2"></span>
        <span className="particle particle-3"></span>
        <span className="particle particle-4"></span>
        <span className="particle particle-5"></span>
        <span className="particle particle-6"></span>

        {/* Brand */}
        <div className="brand-top">
          <div className="brand-logo">
            <span className="logo-bracket left"></span>
            <span className="logo-dot"></span>
            <span className="logo-bracket right"></span>
          </div>

          <div>
            <h2>AttendX</h2>
            <p>SMART ATTENDANCE INFRASTRUCTURE</p>
          </div>
        </div>

        {/* Main visual */}
        <div className="ai-visual">

          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="orbit orbit-three"></div>

          <div className="system-core">

            <div className="core-ring ring-1"></div>
            <div className="core-ring ring-2"></div>

            <div className="core-icon">
              {role === "student" && (
                <Icon type="user" size={42} />
              )}

              {role === "teacher" && (
                <Icon type="building" size={42} />
              )}

              {role === "admin" && (
                <Icon type="shield" size={42} />
              )}
            </div>

            <div className="core-scan-line"></div>
          </div>

          {/* Status card */}
          <div className="live-system-card">

            <div className="live-header">
              <span className="live-dot"></span>
              <span>ATTENDX SYSTEM</span>
              <b>ONLINE</b>
            </div>

            <div className="system-card-title">
              {role === "student" && "Student onboarding"}
              {role === "teacher" && "Teacher onboarding"}
              {role === "admin" && "Authority verification"}
            </div>

            <div className="system-progress">
              <span></span>
            </div>

            <div className="system-card-bottom">
              <small>
                {role === "student" &&
                  "Admin-issued identity required"}

                {role === "teacher" &&
                  "Admin-issued identity required"}

                {role === "admin" &&
                  "Authority-issued identity required"}
              </small>

              <small>SECURE</small>
            </div>
          </div>

          {/* Floating ID Card */}
          <div className="floating-info-card id-floating-card">
            <div className="floating-info-icon">
              <Icon type="id" size={17} />
            </div>

            <div>
              <b>
                {role === "student" && "Student ID"}
                {role === "teacher" && "Teacher ID"}
                {role === "admin" && "Admin ID"}
              </b>

              <small>
                {role === "admin"
                  ? "Issued by AttendX Authorities"
                  : "Issued by Institute Admin"}
              </small>
            </div>
          </div>

          {/* Floating security */}
          <div className="floating-info-card security-floating-card">
            <div className="floating-security-icon">
              <Icon type="shield" size={17} />
            </div>

            <div>
              <b>
                {role === "admin"
                  ? "OTP Protected"
                  : "Identity Protected"}
              </b>

              <small>
                {role === "admin"
                  ? "Mobile verification"
                  : "Admin controlled access"}
              </small>
            </div>
          </div>

          {/* Bottom text */}
          <div className="brand-feature">

            <span className="feature-line"></span>

            <span className="feature-label">
              {role === "student" && "STUDENT PORTAL"}
              {role === "teacher" && "TEACHER PORTAL"}
              {role === "admin" && "ADMIN AUTHORITY"}
            </span>

            <h1>
              {role === "student" && (
                <>
                  Your identity.<br />
                  Your attendance.
                </>
              )}

              {role === "teacher" && (
                <>
                  Manage.<br />
                  Teach. Track.
                </>
              )}

              {role === "admin" && (
                <>
                  Control.<br />
                  Secure. Verify.
                </>
              )}
            </h1>

            <p>
              {role === "student" &&
                "Build your verified student profile and connect with the AttendX attendance ecosystem."}

              {role === "teacher" &&
                "Create your teacher profile using the identity assigned by your institute administrator."}

              {role === "admin" &&
                "Authorized administrators control users, identities, attendance policies and institute access."}
            </p>

          </div>

        </div>

        {/* Bottom status */}
        <div className="system-status">
          <span className="status-pulse"></span>
          <span>SECURE CONNECTION</span>

          <span className="status-divider"></span>

          <span>
            {role === "admin"
              ? "AUTHORITY VERIFIED FLOW"
              : "ADMIN CONTROLLED FLOW"}
          </span>
        </div>

      </section>

      {/* =================================================
          RIGHT FORM
      ================================================== */}

      <main className="create-form-panel">

        <div className="form-wrapper">

          {/* Back */}
          <a href="/login" className="back-login">
            <Icon type="arrow-left" size={16} />
            <span>Back to Login</span>
          </a>

          {/* Heading */}
          <div className="page-heading">

            <span className="eyebrow">
              CREATE ACCOUNT
            </span>

            <h1>
              {role === "student" && "Student registration"}
              {role === "teacher" && "Teacher registration"}
              {role === "admin" && "Admin registration"}
            </h1>

            <p>
              {role === "student" &&
                "Register using the Student ID provided by your institute Admin."}

              {role === "teacher" &&
                "Register using the Teacher ID provided by your institute Admin."}

              {role === "admin" &&
                "Register using the Admin ID issued by AttendX Authorities."}
            </p>

          </div>

          {/* =================================================
              ROLE SWITCHER
          ================================================== */}

          <div className="role-switcher">

            <button
              type="button"
              className={role === "student" ? "active" : ""}
              onClick={() => changeRole("student")}
            >
              <Icon type="user" size={16} />
              <span>Student</span>
            </button>

            <button
              type="button"
              className={role === "teacher" ? "active" : ""}
              onClick={() => changeRole("teacher")}
            >
              <Icon type="building" size={16} />
              <span>Teacher</span>
            </button>

            <button
              type="button"
              className={role === "admin" ? "active" : ""}
              onClick={() => changeRole("admin")}
            >
              <Icon type="shield" size={16} />
              <span>Admin</span>
            </button>

          </div>

          {/* =================================================
              AUTHORITY NOTICE
          ================================================== */}

          <div className={`authority-notice ${role}`}>

            <div className="notice-icon">

              {role === "student" && (
                <Icon type="id" size={19} />
              )}

              {role === "teacher" && (
                <Icon type="building" size={19} />
              )}

              {role === "admin" && (
                <Icon type="shield" size={19} />
              )}

            </div>

            <div>

              <strong>
                {role === "student" &&
                  "Student ID is issued by Admin"}

                {role === "teacher" &&
                  "Teacher ID is issued by Admin"}

                {role === "admin" &&
                  "Admin ID is issued by AttendX Authorities"}
              </strong>

              <p>
                {role === "student" &&
                  "Students cannot create their own Student ID."}

                {role === "teacher" &&
                  "Teachers cannot create their own Teacher ID."}

                {role === "admin" &&
                  "Admin access is restricted to authorized AttendX personnel."}
              </p>

            </div>

          </div>

          <form onSubmit={handleSubmit}>

            {/* =================================================
                STUDENT FORM
            ================================================== */}

            {role === "student" && (
              <>
                <section className="form-section">

                  <div className="section-heading">

                    <div className="section-icon">
                      <Icon type="user" size={20} />
                    </div>

                    <div>
                      <h3>Student information</h3>
                      <p>Academic and personal details</p>
                    </div>

                  </div>

                  {/* Student ID */}
                  <div className="field full-width">

                    <label>
                      Student ID <span>*</span>
                    </label>

                    <div className="input-wrap">

                      <Icon type="id" size={18} />

                      <input
                        type="text"
                        name="studentId"
                        value={form.studentId}
                        onChange={handleChange}
                        placeholder="e.g. STU-2026-001"
                      />

                    </div>

                    <small className="field-help">
                      Enter the Student ID provided by your Admin.
                    </small>

                  </div>

                  {/* Name */}
                  <div className="field full-width">

                    <label>
                      Full Name <span>*</span>
                    </label>

                    <div className="input-wrap">

                      <Icon type="user" size={18} />

                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Enter student full name"
                      />

                    </div>

                  </div>

                  <div className="two-columns">

                    {/* Course */}
                    <div className="field">

                      <label>
                        Course <span>*</span>
                      </label>

                      <div className="select-wrap">

                        <select
                          name="course"
                          value={form.course}
                          onChange={handleChange}
                        >
                          <option>B.Tech</option>
                          <option>BCA</option>
                          <option>BBA</option>
                          <option>MCA</option>
                          <option>M.Tech</option>
                          <option>Other</option>
                        </select>

                        <span>⌄</span>

                      </div>

                    </div>

                    {/* Branch */}
                    <div className="field">

                      <label>
                        Branch <span>*</span>
                      </label>

                      <div className="select-wrap">

                        <select
                          name="branch"
                          value={form.branch}
                          onChange={handleChange}
                        >
                          <option>
                            Computer Science & Engineering
                          </option>

                          <option>
                            Information Technology
                          </option>

                          <option>
                            Electronics & Communication
                          </option>

                          <option>
                            Mechanical Engineering
                          </option>

                          <option>
                            Civil Engineering
                          </option>

                          <option>Other</option>
                        </select>

                        <span>⌄</span>

                      </div>

                    </div>

                  </div>

                  <div className="two-columns">

                    {/* Year */}
                    <div className="field">

                      <label>
                        Year <span>*</span>
                      </label>

                      <div className="select-wrap">

                        <select
                          name="year"
                          value={form.year}
                          onChange={handleChange}
                        >
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>3rd Year</option>
                          <option>4th Year</option>
                        </select>

                        <span>⌄</span>

                      </div>

                    </div>

                    {/* Phone */}
                    <div className="field">

                      <label>
                        Phone Number <span>*</span>
                      </label>

                      <div className="input-wrap">

                        <Icon type="phone" size={18} />

                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={(e) =>
                            updatePhone(
                              "phone",
                              e.target.value
                            )
                          }
                          placeholder="10-digit mobile number"
                        />

                      </div>

                    </div>

                  </div>

                  {/* Email */}
                  <div className="field full-width">

                    <label>
                      Email Address <span>*</span>
                    </label>

                    <div className="input-wrap">

                      <Icon type="mail" size={18} />

                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="student@example.com"
                      />

                    </div>

                  </div>

                </section>

                {/* Parent */}
                <section className="form-section">

                  <div className="section-heading">

                    <div className="section-icon">
                      <Icon type="phone" size={20} />
                    </div>

                    <div>
                      <h3>Parent / Guardian</h3>
                      <p>Attendance notification details</p>
                    </div>

                  </div>

                  <div className="field full-width">

                    <label>
                      Parent Name <span>*</span>
                    </label>

                    <div className="input-wrap">

                      <Icon type="user" size={18} />

                      <input
                        type="text"
                        name="parentName"
                        value={form.parentName}
                        onChange={handleChange}
                        placeholder="Enter parent / guardian name"
                      />

                    </div>

                  </div>

                  <div className="two-columns">

                    <div className="field">

                      <label>
                        Parent Phone <span>*</span>
                      </label>

                      <div className="input-wrap">

                        <Icon type="phone" size={18} />

                        <input
                          type="tel"
                          name="parentPhone"
                          value={form.parentPhone}
                          onChange={(e) =>
                            updatePhone(
                              "parentPhone",
                              e.target.value
                            )
                          }
                          placeholder="10-digit number"
                        />

                      </div>

                    </div>

                    <div className="field">

                      <label>
                        Parent Email
                      </label>

                      <div className="input-wrap">

                        <Icon type="mail" size={18} />

                        <input
                          type="email"
                          name="parentEmail"
                          value={form.parentEmail}
                          onChange={handleChange}
                          placeholder="Optional email"
                        />

                      </div>

                    </div>

                  </div>

                  <div className="field full-width">

                    <label>
                      Address <span>*</span>
                    </label>

                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter complete address"
                      rows="4"
                    />

                  </div>

                </section>

              </>
            )}

            {/* =================================================
                TEACHER FORM
            ================================================== */}

            {role === "teacher" && (
              <section className="form-section">

                <div className="section-heading">

                  <div className="section-icon">
                    <Icon type="building" size={20} />
                  </div>

                  <div>
                    <h3>Teacher information</h3>
                    <p>Professional identity details</p>
                  </div>

                </div>

                <div className="field full-width">

                  <label>
                    Teacher ID <span>*</span>
                  </label>

                  <div className="input-wrap">

                    <Icon type="id" size={18} />

                    <input
                      type="text"
                      name="teacherId"
                      value={form.teacherId}
                      onChange={handleChange}
                      placeholder="e.g. TCH-2026-001"
                    />

                  </div>

                  <small className="field-help">
                    This ID must be provided by your institute Admin.
                  </small>

                </div>

                <div className="field full-width">

                  <label>
                    Teacher Name <span>*</span>
                  </label>

                  <div className="input-wrap">

                    <Icon type="user" size={18} />

                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Enter teacher full name"
                    />

                  </div>

                </div>

                <div className="field full-width">

                  <label>
                    Department <span>*</span>
                  </label>

                  <div className="input-wrap">

                    <Icon type="building" size={18} />

                    <input
                      type="text"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Computer Science & Engineering"
                    />

                  </div>

                </div>

                <div className="field full-width">

                  <label>
                    Phone Number <span>*</span>
                  </label>

                  <div className="input-wrap">

                    <Icon type="phone" size={18} />

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={(e) =>
                        updatePhone(
                          "phone",
                          e.target.value
                        )
                      }
                      placeholder="10-digit mobile number"
                    />

                  </div>

                </div>

              </section>
            )}

            {/* =================================================
                ADMIN FORM
            ================================================== */}

            {role === "admin" && (
              <section className="form-section admin-section">

                <div className="section-heading">

                  <div className="section-icon admin-icon">
                    <Icon type="shield" size={20} />
                  </div>

                  <div>
                    <h3>Authority credentials</h3>
                    <p>Restricted administrator registration</p>
                  </div>

                </div>

                <div className="admin-security-banner">

                  <Icon type="shield" size={22} />

                  <div>
                    <strong>Authorized Admin Only</strong>

                    <p>
                      Admin credentials are issued by
                      AttendX Authorities. Unauthorized
                      registration is not permitted.
                    </p>
                  </div>

                </div>

                <div className="field full-width">

                  <label>
                    Admin ID <span>*</span>
                  </label>

                  <div className="input-wrap">

                    <Icon type="id" size={18} />

                    <input
                      type="text"
                      name="adminId"
                      value={form.adminId}
                      onChange={handleChange}
                      placeholder="e.g. ADM-2026-001"
                      disabled={adminOtpMode}
                    />

                  </div>

                </div>

                <div className="field full-width">

                  <label>
                    Registered Phone Number <span>*</span>
                  </label>

                  <div className="input-wrap">

                    <Icon type="phone" size={18} />

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={(e) =>
                        updatePhone(
                          "phone",
                          e.target.value
                        )
                      }
                      placeholder="Authority registered phone"
                      disabled={adminOtpMode}
                    />

                  </div>

                </div>

                {!adminOtpMode && (
                  <div className="two-columns">

                    <div className="field">

                      <label>
                        Password <span>*</span>
                      </label>

                      <div className="input-wrap">

                        <Icon type="lock" size={18} />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          placeholder="Create password"
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                        >
                          <Icon
                            type={
                              showPassword
                                ? "eye-off"
                                : "eye"
                            }
                            size={18}
                          />
                        </button>

                      </div>

                    </div>

                    <div className="field">

                      <label>
                        Confirm Password <span>*</span>
                      </label>

                      <div className="input-wrap">

                        <Icon type="lock" size={18} />

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                        >
                          <Icon
                            type={
                              showConfirmPassword
                                ? "eye-off"
                                : "eye"
                            }
                            size={18}
                          />
                        </button>

                      </div>

                    </div>

                  </div>
                )}

                {adminOtpMode && (
                  <div className="otp-area">

                    <div className="otp-icon">
                      <Icon type="shield" size={22} />
                    </div>

                    <div className="otp-heading">
                      <h4>Verify administrator</h4>

                      <p>
                        Enter the 6-digit OTP sent to your
                        registered phone number.
                      </p>
                    </div>

                    <input
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      value={adminOtp}
                      onChange={(e) =>
                        setAdminOtp(
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      placeholder="000000"
                    />

                    <button
                      type="button"
                      className="resend-otp"
                      onClick={() => {
                        setMessage(
                          "A new OTP has been sent. Demo OTP: 123456"
                        );
                        setMessageType("success");
                      }}
                    >
                      Resend OTP
                    </button>

                  </div>
                )}

              </section>
            )}

            {/* =================================================
                PASSWORD - STUDENT / TEACHER
            ================================================== */}

            {(role === "student" || role === "teacher") && (
              <section className="form-section">

                <div className="section-heading">

                  <div className="section-icon">
                    <Icon type="lock" size={20} />
                  </div>

                  <div>
                    <h3>Account security</h3>
                    <p>Create your AttendX password</p>
                  </div>

                </div>

                <div className="two-columns">

                  <div className="field">

                    <label>
                      Password <span>*</span>
                    </label>

                    <div className="input-wrap">

                      <Icon type="lock" size={18} />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Create password"
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                      >
                        <Icon
                          type={
                            showPassword
                              ? "eye-off"
                              : "eye"
                          }
                          size={18}
                        />
                      </button>

                    </div>

                  </div>

                  <div className="field">

                    <label>
                      Confirm Password <span>*</span>
                    </label>

                    <div className="input-wrap">

                      <Icon type="lock" size={18} />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      >
                        <Icon
                          type={
                            showConfirmPassword
                              ? "eye-off"
                              : "eye"
                          }
                          size={18}
                        />
                      </button>

                    </div>

                  </div>

                </div>

                <div className="password-rules">

                  <span>Password requirements</span>

                  <div>
                    <em>8+ characters</em>
                    <em>Uppercase</em>
                    <em>Lowercase</em>
                    <em>Number</em>
                    <em>Special symbol</em>
                  </div>

                </div>

              </section>
            )}

            {/* =================================================
                MESSAGE
            ================================================== */}

            {message && (
              <div className={`form-message ${messageType}`}>
                <span>
                  {messageType === "success" ? "✓" : "!"}
                </span>

                <p>{message}</p>
              </div>
            )}

            {/* =================================================
                SUBMIT BUTTON
            ================================================== */}

            <button
              type="submit"
              className={`create-account-btn ${adminOtpMode ? "verify-btn" : ""}`}
            >
              <span>
                {role === "student" &&
                  "Create Student Account"}

                {role === "teacher" &&
                  "Create Teacher Account"}

                {role === "admin" &&
                  !adminOtpMode &&
                  "Send OTP & Continue"}

                {role === "admin" &&
                  adminOtpMode &&
                  "Verify OTP & Create Admin"}
              </span>

              <span className="btn-arrow">
                <Icon type="arrow" size={17} />
              </span>
            </button>

            <p className="login-bottom">
              Already have an account?
              <a href="/login"> Sign in</a>
            </p>

          </form>

        </div>

      </main>

    </div>
  );
}

export default CreateAccount;