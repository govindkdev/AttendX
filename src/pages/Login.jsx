import { useState } from "react";
import { authService } from "../services/authService";

/*
=========================================================
ATTENDX LOGIN PAGE
=========================================================

LOGIN FLOW
----------
1. Student / Teacher / Admin select
2. Login credentials enter
3. Temporary Student credentials validate
4. Student -> /student-dashboard
5. Teacher/Admin -> frontend demo message

TEMPORARY STUDENT CREDENTIALS
-----------------------------
Student ID : STU-2026-001
Email      : student@attendx.com
Password   : Student@123

STUDENT NAME
------------
Govind Kushwaha

IMPORTANT
---------
Abhi backend/database connected nahi hai.
Ye frontend demo authentication hai.

Backend ke baad:
- Database authentication
- JWT/session
- OTP
- Role permissions
- Password hashing
implement kiya jayega.
=========================================================
*/

function Icon({ type, size = 20 }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  /* STUDENT */
  if (type === "student") {
    return (
      <svg {...p}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  /* TEACHER */
  if (type === "teacher") {
    return (
      <svg {...p}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h5" />
        <path d="M9 21h6" />
        <path d="M12 18v3" />
      </svg>
    );
  }

  /* ADMIN */
  if (type === "admin") {
    return (
      <svg {...p}>
        <path d="M12 3l8 3v5c0 4.8-3.1 8.1-8 10-4.9-1.9-8-5.2-8-10V6l8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  /* MAIL */
  if (type === "mail") {
    return (
      <svg {...p}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  /* LOCK */
  if (type === "lock") {
    return (
      <svg {...p}>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  /* EYE */
  if (type === "eye") {
    return (
      <svg {...p}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  /* EYE OFF */
  if (type === "eyeOff") {
    return (
      <svg {...p}>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7" />
        <path d="M6.2 6.9C3.9 8.4 2.5 12 2.5 12s3.5 6 9.5 6" />
      </svg>
    );
  }

  /* ARROW */
  if (type === "arrow") {
    return (
      <svg {...p}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  /* CHECK */
  if (type === "check") {
    return (
      <svg {...p}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  /* SCAN */
  if (type === "scan") {
    return (
      <svg {...p}>
        <path d="M5 8V6a1 1 0 0 1 1-1h2" />
        <path d="M16 5h2a1 1 0 0 1 1 1v2" />
        <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
        <path d="M8 19H6a1 1 0 0 1-1-1v-2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return null;
}

export default function Login() {

  /* =====================================================
     STATE
  ===================================================== */

  const [role, setRole] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /* =====================================================
     ROLE DATA
  ===================================================== */

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Attendance & records",
      icon: "student",
    },

    {
      id: "teacher",
      title: "Teacher",
      description: "Classes & attendance",
      icon: "teacher",
    },

    {
      id: "admin",
      title: "Admin",
      description: "System & reports",
      icon: "admin",
    },
  ];

  const selectedRole = roles.find(
    (item) => item.id === role
  );

  /* =====================================================
     LOGIN FUNCTION
  ===================================================== */

  const handleLogin = (event) => {
    event.preventDefault();

    setMessage("");

    /* -----------------------------------------------
       STEP 1 - ROLE CHECK
    ----------------------------------------------- */

    if (!role) {
      setMessage(
        "Please select your account type."
      );
      return;
    }

    /* -----------------------------------------------
       STEP 2 - ID / EMAIL CHECK
    ----------------------------------------------- */

    if (!email.trim()) {
      setMessage(
        "Please enter your Email or AttendX ID."
      );
      return;
    }

    /* -----------------------------------------------
       STEP 3 - PASSWORD CHECK
    ----------------------------------------------- */

    if (!password) {
      setMessage(
        "Please enter your password."
      );
      return;
    }

    /*
    ===================================================
    ATTENDX MULTI-ROLE AUTHENTICATION (DEMO)
    ===================================================
    */
    const result = authService.login(role, email, password);

    if (result.success) {
      if (remember && role === "student") {
        localStorage.setItem("attendx_remember_student", "true");
      }
      setMessage(`Login successful. Opening ${selectedRole?.title || "User"} Dashboard...`);
      setTimeout(() => {
        window.location.href = result.redirect || (
          role === "student" ? "/student-dashboard" :
          role === "teacher" ? "/teacher-dashboard" : "/admin-dashboard"
        );
      }, 400);
      return;
    }

    setMessage(result.error || "Invalid AttendX ID / Email or Password.");
  };

  return (
    <div className="attendx-login">

      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
        }

        body {
          font-family:
            Inter,
            "Segoe UI",
            Arial,
            sans-serif;

          background: #f5f7fb;
        }

        button,
        input {
          font-family: inherit;
        }

        .attendx-login {
          min-height: 100vh;

          display: grid;

          grid-template-columns:
            43% 57%;

          background:
            #f5f7fb;
        }

        /* =============================================
           LEFT PANEL
        ============================================= */

        .login-left {
          position: relative;

          min-height: 100vh;

          overflow: hidden;

          display: flex;

          flex-direction: column;

          justify-content:
            space-between;

          padding:
            36px clamp(28px, 4vw, 65px);

          color: white;

          background:
            radial-gradient(
              circle at 85% 15%,
              rgba(101,215,226,.16),
              transparent 28%
            ),

            radial-gradient(
              circle at 10% 85%,
              rgba(91,95,239,.25),
              transparent 36%
            ),

            linear-gradient(
              145deg,
              #080e1c,
              #10182c 52%,
              #151e35
            );
        }

        .login-grid {
          position: absolute;

          inset: 0;

          opacity: .15;

          background-image:
            linear-gradient(
              rgba(255,255,255,.06) 1px,
              transparent 1px
            ),

            linear-gradient(
              90deg,
              rgba(255,255,255,.06) 1px,
              transparent 1px
            );

          background-size:
            48px 48px;

          pointer-events: none;
        }

        /* =============================================
           BRAND
        ============================================= */

        .login-brand {
          position: relative;

          z-index: 2;

          display: flex;

          align-items: center;

          gap: 11px;

          width: fit-content;

          color: white;

          text-decoration: none;
        }

        .login-logo {
          position: relative;

          width: 42px;
          height: 42px;

          flex-shrink: 0;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #7478ff,
              #5055df
            );

          box-shadow:
            0 10px 28px
            rgba(91,95,239,.3);

          animation:
            logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .login-logo::before {
          content: "";

          position: absolute;

          top: 9px;
          left: 9px;

          width: 11px;
          height: 11px;

          border:
            2px solid white;

          border-right: 0;
          border-bottom: 0;
        }

        .login-logo::after {
          content: "";

          position: absolute;

          right: 9px;
          bottom: 9px;

          width: 11px;
          height: 11px;

          border:
            2px solid white;

          border-left: 0;
          border-top: 0;
        }

        .login-logo-dot {
          position: absolute;

          width: 5px;
          height: 5px;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          border-radius: 50%;

          background:
            #65d7e2;

          box-shadow:
            0 0 13px #65d7e2;
        }

        .login-brand strong {
          display: block;

          font-family:
            "Space Grotesk",
            "Segoe UI",
            sans-serif;

          font-size: 20px;

          letter-spacing: -.04em;
        }

        .login-brand small {
          display: block;

          margin-top: 3px;

          color: #8290a6;

          font-size: 6px;

          letter-spacing: .12em;

          text-transform:
            uppercase;
        }

        /* =============================================
           LEFT CONTENT
        ============================================= */

        .login-left-content {
          position: relative;

          z-index: 2;

          max-width: 550px;

          margin: auto 0;
        }

        .login-overline {
          display: inline-flex;

          align-items: center;

          gap: 8px;

          color: #65d7e2;

          font-size: 8px;

          font-weight: 800;

          letter-spacing: .14em;
        }

        .login-overline::before {
          content: "";

          width: 18px;

          height: 1px;

          background:
            #65d7e2;
        }

        .login-left-content h2 {
          max-width: 550px;

          margin:
            18px 0 0;

          font-family:
            "Space Grotesk",
            "Segoe UI",
            sans-serif;

          font-size:
            clamp(40px, 4.5vw, 63px);

          line-height: .97;

          letter-spacing: -.06em;
        }

        .login-left-content h2 span {
          display: block;

          color:
            #65d7e2;
        }

        .login-left-description {
          max-width: 455px;

          margin:
            22px 0 0;

          color:
            #aab5c7;

          font-size:
            12px;

          line-height:
            1.8;
        }

        /* =============================================
           SYSTEM CARD
        ============================================= */

        .system-card {
          max-width: 465px;

          margin-top: 30px;

          padding: 16px;

          border:
            1px solid
            rgba(255,255,255,.09);

          border-radius: 16px;

          background:
            rgba(255,255,255,.045);

          backdrop-filter:
            blur(15px);

          animation:
            systemFloat 5s ease-in-out infinite;
        }

        @keyframes systemFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        .system-top {
          display: flex;

          align-items: center;

          justify-content:
            space-between;
        }

        .system-top span:first-child {
          color:
            #7f8ca2;

          font-size:
            7px;

          font-weight:
            800;

          letter-spacing:
            .1em;
        }

        .system-status {
          padding:
            5px 8px;

          border-radius:
            20px;

          color:
            #69ddaa;

          background:
            rgba(18,155,103,.11);

          font-size:
            6px;

          font-weight:
            800;
        }

        .system-body {
          display:
            flex;

          align-items:
            center;

          gap:
            17px;

          margin-top:
            17px;
        }

        .scan-circle {
          position: relative;

          width: 78px;
          height: 78px;

          flex-shrink: 0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(101,215,226,.22);

          border-radius: 50%;
        }

        .scan-circle::before {
          content: "";

          position: absolute;

          inset: 10px;

          border:
            1px solid
            rgba(101,215,226,.18);

          border-radius: 50%;
        }

        .scan-ring {
          position: absolute;

          inset: -1px;

          border:
            2px solid transparent;

          border-top-color:
            #65d7e2;

          border-radius: 50%;

          animation:
            loginRotate 2.4s linear infinite;
        }

        @keyframes loginRotate {
          to {
            transform:
              rotate(360deg);
          }
        }

        .scan-icon {
          position: relative;

          z-index: 2;

          width: 32px;
          height: 32px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            9px;

          color:
            #65d7e2;

          background:
            rgba(101,215,226,.08);
        }

        .system-body strong {
          display: block;

          color:
            white;

          font-size:
            11px;
        }

        .system-body p {
          margin:
            5px 0 8px;

          color:
            #7f8b9e;

          font-size:
            7px;
        }

        .verified {
          color:
            #69dda9;

          font-size:
            7px;

          font-weight:
            800;
        }

        /* =============================================
           TEMP DEMO CREDENTIAL CARD
        ============================================= */

        .demo-credentials {
          margin-top: 12px;

          padding: 11px 12px;

          border:
            1px solid
            rgba(101,215,226,.13);

          border-radius: 11px;

          background:
            rgba(101,215,226,.035);
        }

        .demo-title {
          display: block;

          color: #65d7e2;

          font-size: 7px;

          font-weight: 800;

          letter-spacing: .12em;

          margin-bottom: 8px;
        }

        .demo-row {
          display: flex;

          justify-content:
            space-between;

          gap: 15px;

          padding: 4px 0;

          color: #7f8da4;

          font-size: 7px;
        }

        .demo-row b {
          color: #d4ddec;

          font-size: 7px;

          font-weight: 700;
        }

        /* =============================================
           LEFT FOOTER
        ============================================= */

        .login-left-footer {
          position: relative;

          z-index: 2;

          display:
            flex;

          justify-content:
            space-between;

          color:
            #68758b;

          font-size:
            7px;
        }

        /* =============================================
           RIGHT
        ============================================= */

        .login-right {
          min-height:
            100vh;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          padding:
            45px clamp(30px,6vw,90px);

          background:
            #f7f8fb;
        }

        .login-right-inner {
          width: 100%;

          max-width:
            570px;
        }

        /* =============================================
           BACK HOME
        ============================================= */

        .back-home {
          display:
            flex;

          justify-content:
            flex-end;

          margin-bottom:
            28px;

          color:
            #667085;

          font-size:
            10px;

          font-weight:
            700;

          text-decoration:
            none;

          transition:
            .2s ease;
        }

        .back-home:hover {
          color:
            #5b5fef;
        }

        /* =============================================
           HEADING
        ============================================= */

        .login-heading-label {
          color:
            #5b5fef;

          font-size:
            8px;

          font-weight:
            800;

          letter-spacing:
            .14em;
        }

        .login-heading h1 {
          margin:
            10px 0 0;

          font-family:
            "Space Grotesk",
            "Segoe UI",
            sans-serif;

          font-size:
            clamp(36px,4vw,50px);

          line-height:
            1;

          letter-spacing:
            -.055em;

          color:
            #111827;
        }

        .login-heading p {
          max-width:
            430px;

          margin:
            13px 0 0;

          color:
            #667085;

          font-size:
            11px;

          line-height:
            1.7;
        }

        /* =============================================
           ROLE
        ============================================= */

        .role-title {
          margin:
            27px 0 9px;

          color:
            #344054;

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            .05em;

          text-transform:
            uppercase;
        }

        .role-grid {
          display:
            grid;

          grid-template-columns:
            repeat(3,1fr);

          gap:
            9px;
        }

        .role-card {
          position:
            relative;

          min-height:
            88px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items:
            flex-start;

          padding:
            14px;

          border:
            1px solid #e0e5ec;

          border-radius:
            12px;

          background:
            white;

          color:
            #172033;

          cursor:
            pointer;

          text-align:
            left;

          transition:
            .2s ease;
        }

        .role-card:hover {
          transform:
            translateY(-2px);

          border-color:
            #b9bdf5;

          box-shadow:
            0 10px 25px
            rgba(16,24,40,.06);
        }

        .role-card.active {
          border-color:
            #5b5fef;

          background:
            #fafaff;

          box-shadow:
            0 10px 25px
            rgba(91,95,239,.1);
        }

        .role-icon {
          width:
            35px;

          height:
            35px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          margin-bottom:
            9px;

          border-radius:
            9px;

          color:
            #5b5fef;

          background:
            #f0f1ff;
        }

        .role-card.active .role-icon {
          color:
            white;

          background:
            #5b5fef;
        }

        .role-card strong {
          display:
            block;

          font-size:
            10px;

          font-weight:
            800;
        }

        .role-card-description {
          display:
            block;

          margin-top:
            3px;

          color:
            #98a2b3;

          font-size:
            7px;
        }

        .role-check {
          position:
            absolute;

          top:
            8px;

          right:
            8px;

          width:
            18px;

          height:
            18px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          color:
            white;

          background:
            #5b5fef;

          opacity:
            0;
        }

        .role-card.active .role-check {
          opacity:
            1;
        }

        /* =============================================
           LOGIN FORM
        ============================================= */

        .login-form-container {
          margin-top:
            22px;

          padding-top:
            21px;

          border-top:
            1px solid
            #e6e9ef;

          animation:
            formIn .25s ease;
        }

        @keyframes formIn {
          from {
            opacity:
              0;

            transform:
              translateY(8px);
          }

          to {
            opacity:
              1;

            transform:
              translateY(0);
          }
        }

        /* =============================================
           SELECTED ROLE
        ============================================= */

        .selected-role {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          margin-bottom:
            18px;

          padding:
            10px 12px;

          border-radius:
            10px;

          background:
            #f0f2f6;
        }

        .selected-role-left {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;
        }

        .selected-icon {
          width:
            32px;

          height:
            32px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            8px;

          color:
            #5b5fef;

          background:
            white;
        }

        .selected-role small {
          display:
            block;

          color:
            #98a2b3;

          font-size:
            6px;

          font-weight:
            800;

          letter-spacing:
            .09em;
        }

        .selected-role strong {
          display:
            block;

          margin-top:
            2px;

          font-size:
            9px;
        }

        .change-role {
          border:
            0;

          color:
            #5b5fef;

          background:
            transparent;

          font-size:
            8px;

          font-weight:
            800;

          cursor:
            pointer;
        }

        /* =============================================
           FIELDS
        ============================================= */

        .field {
          margin-bottom:
            15px;
        }

        .field-label {
          display:
            block;

          margin-bottom:
            6px;

          color:
            #344054;

          font-size:
            8px;

          font-weight:
            800;
        }

        .password-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          margin-bottom:
            6px;
        }

        .password-head label {
          color:
            #344054;

          font-size:
            8px;

          font-weight:
            800;
        }

        .forgot-link {
          border:
            0;

          padding:
            0;

          color:
            #5b5fef;

          background:
            transparent;

          font-size:
            7px;

          font-weight:
            800;

          cursor:
            pointer;
        }

        .input-box {
          height:
            47px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            0 11px;

          border:
            1px solid
            #dfe4eb;

          border-radius:
            9px;

          background:
            white;

          transition:
            .2s ease;
        }

        .input-box:focus-within {
          border-color:
            #7377ef;

          box-shadow:
            0 0 0 4px
            rgba(91,95,239,.055);
        }

        .input-box > svg {
          flex-shrink:
            0;

          color:
            #9aa5b6;
        }

        .input-box input {
          width:
            100%;

          height:
            43px;

          min-width:
            0;

          border:
            0;

          outline:
            0;

          background:
            transparent;

          color:
            #172033;

          font-size:
            10px;
        }

        .input-box input::placeholder {
          color:
            #b1b8c4;
        }

        .password-eye {
          width:
            28px;

          height:
            28px;

          flex-shrink:
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            0;

          color:
            #9aa5b6;

          background:
            transparent;

          cursor:
            pointer;

          border-radius:
            7px;

          transition:
            .2s ease;
        }

        .password-eye:hover {
          color:
            #5b5fef;

          background:
            #f2f3ff;
        }

        /* =============================================
           REMEMBER
        ============================================= */

        .remember {
          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          margin:
            2px 0 14px;

          color:
            #667085;

          font-size:
            8px;

          cursor:
            pointer;
        }

        .remember input {
          width:
            13px;

          height:
            13px;

          margin:
            0;

          accent-color:
            #5b5fef;
        }

        /* =============================================
           MESSAGE
        ============================================= */

        .login-message {
          margin-bottom:
            12px;

          padding:
            10px 11px;

          border:
            1px solid
            #dfe3f8;

          border-radius:
            8px;

          background:
            #f7f8ff;

          color:
            #5d6680;

          font-size:
            7px;

          line-height:
            1.5;

          animation:
            messageIn .2s ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform:
              translateY(-3px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        /* =============================================
           BUTTON
        ============================================= */

        .sign-in-button {
          width:
            100%;

          height:
            47px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          border:
            0;

          border-radius:
            9px;

          background:
            linear-gradient(
              135deg,
              #7074ff,
              #5559e5
            );

          color:
            white;

          box-shadow:
            0 10px 22px
            rgba(91,95,239,.18);

          font-size:
            9px;

          font-weight:
            800;

          cursor:
            pointer;

          transition:
            .2s ease;
        }

        .sign-in-button:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 14px 27px
            rgba(91,95,239,.24);
        }

        .sign-in-button:active {
          transform:
            translateY(0);
        }

        /* =============================================
           CREATE ACCOUNT
        ============================================= */

        .register {
          display:
            flex;

          justify-content:
            center;

          align-items:
            center;

          gap:
            5px;

          margin-top:
            20px;

          color:
            #98a2b3;

          font-size:
            7px;
        }

        .register a {
          color:
            #5b5fef;

          font-weight:
            800;

          text-decoration:
            none;

          cursor:
            pointer;
        }

        .register a:hover {
          text-decoration:
            underline;
        }

        /* =============================================
           SECURITY
        ============================================= */

        .secure-line {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          margin-top:
            15px;

          padding-top:
            12px;

          border-top:
            1px solid
            #eaedf1;

          color:
            #a0a8b4;

          font-size:
            6px;
        }

        .secure-dot {
          width:
            5px;

          height:
            5px;

          border-radius:
            50%;

          background:
            #18a36e;

          box-shadow:
            0 0 8px
            rgba(24,163,110,.35);
        }

        /* =============================================
           TABLET
        ============================================= */

        @media (max-width: 1000px) {

          .attendx-login {
            grid-template-columns:
              1fr;
          }

          .login-left {
            min-height:
              450px;

            padding:
              30px 7vw;
          }

          .login-left-content {
            margin:
              55px 0 45px;
          }

          .login-left-footer {
            display:
              none;
          }

          .login-right {
            min-height:
              auto;

            padding:
              60px 7vw 80px;
          }
        }

        /* =============================================
           MOBILE
        ============================================= */

        @media (max-width: 600px) {

          .login-left {
            min-height:
              340px;

            padding:
              23px 20px 28px;
          }

          .login-left-content {
            margin:
              38px 0 0;
          }

          .login-left-content h2 {
            font-size:
              37px;
          }

          .login-left-description {
            font-size:
              10px;
          }

          .system-card {
            display:
              none;
          }

          .demo-credentials {
            display:
              none;
          }

          .login-right {
            padding:
              38px 20px 55px;
          }

          .back-home {
            display:
              none;
          }

          .login-heading h1 {
            font-size:
              34px;
          }

          .role-grid {
            grid-template-columns:
              1fr;
          }

          .role-card {
            min-height:
              64px;

            flex-direction:
              row;

            align-items:
              center;

            gap:
              10px;
          }

          .role-icon {
            margin-bottom:
              0;
          }

          .role-check {
            top:
              50%;

            transform:
              translateY(-50%);
          }

          .register {
            flex-wrap:
              wrap;
          }
        }

      `}</style>

      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <section className="login-left">

        <div className="login-grid" />

        {/* BRAND */}

        <a
          href="/"
          className="login-brand"
        >

          <span className="login-logo">
            <span className="login-logo-dot" />
          </span>

          <span>

            <strong>
              AttendX
            </strong>

            <small>
              Smart Attendance Infrastructure
            </small>

          </span>

        </a>

        {/* LEFT CONTENT */}

        <div className="login-left-content">

          <span className="login-overline">
            ATTENDANCE INTELLIGENCE
          </span>

          <h2>
            Secure access.
            <span>
              Smarter attendance.
            </span>
          </h2>

          <p className="login-left-description">
            One platform for students, teachers
            and administrators to manage attendance
            with confidence.
          </p>

          {/* SYSTEM CARD */}

          <div className="system-card">

            <div className="system-top">

              <span>
                ATTENDX SYSTEM
              </span>

              <span className="system-status">
                ● SYSTEM ONLINE
              </span>

            </div>

            <div className="system-body">

              <div className="scan-circle">

                <div className="scan-ring" />

                <div className="scan-icon">

                  <Icon
                    type="scan"
                    size={18}
                  />

                </div>

              </div>

              <div>

                <strong>
                  Identity verification ready
                </strong>

                <p>
                  Camera recognition + QR backup
                </p>

                <div className="verified">
                  ✓ Secure attendance flow active
                </div>

              </div>

            </div>

            {/* TEMPORARY DEMO CREDENTIALS */}

            <div className="demo-credentials">

              <span className="demo-title">
                TEMPORARY STUDENT ACCESS
              </span>

              <div className="demo-row">
                <span>Student ID</span>
                <b>STU-2026-001</b>
              </div>

              <div className="demo-row">
                <span>Email</span>
                <b>student@attendx.com</b>
              </div>

              <div className="demo-row">
                <span>Password</span>
                <b>Student@123</b>
              </div>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="login-left-footer">

          <span>
            © 2026 AttendX
          </span>

          <span>
            Identity • Attendance • Trust
          </span>

        </div>

      </section>

      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <section className="login-right">

        <div className="login-right-inner">

          {/* BACK */}

          <a
            href="/"
            className="back-home"
          >
            ← Back to Home
          </a>

          {/* HEADING */}

          <div className="login-heading">

            <span className="login-heading-label">
              SECURE ACCESS
            </span>

            <h1>
              Welcome back.
            </h1>

            <p>
              Select your account type and continue
              to your AttendX workspace.
            </p>

          </div>

          {/* ROLE */}

          <div className="role-title">
            Choose account type
          </div>

          <div className="role-grid">

            {roles.map((item) => (

              <button
                key={item.id}
                type="button"

                className={
                  `role-card ${
                    role === item.id
                      ? "active"
                      : ""
                  }`
                }

                onClick={() => {

                  setRole(item.id);

                  setEmail("");

                  setPassword("");

                  setMessage("");

                }}
              >

                <div className="role-icon">

                  <Icon
                    type={item.icon}
                    size={18}
                  />

                </div>

                <div>

                  <strong>
                    {item.title}
                  </strong>

                  <span className="role-card-description">
                    {item.description}
                  </span>

                </div>

                <div className="role-check">

                  {role === item.id && (
                    <Icon
                      type="check"
                      size={10}
                    />
                  )}

                </div>

              </button>

            ))}

          </div>

          {/* =================================================
              LOGIN FORM
          ================================================= */}

          {role && selectedRole && (

            <div className="login-form-container">

              {/* SELECTED ROLE */}

              <div className="selected-role">

                <div className="selected-role-left">

                  <div className="selected-icon">

                    <Icon
                      type={selectedRole.icon}
                      size={16}
                    />

                  </div>

                  <div>

                    <small>
                      SIGNING IN AS
                    </small>

                    <strong>
                      {selectedRole.title}
                    </strong>

                  </div>

                </div>

                <button
                  type="button"
                  className="change-role"

                  onClick={() => {

                    setRole("");

                    setEmail("");

                    setPassword("");

                    setMessage("");

                  }}
                >
                  Change
                </button>

              </div>

              {/* DEMO AUTOFILL SHORTCUT */}
              <div style={{
                background: "rgba(91, 95, 239, 0.08)",
                border: "1px dashed var(--attendx-indigo, #5B5FEF)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px"
              }}>
                <div style={{ fontSize: "12px", color: "#172033" }}>
                  <strong>Demo Evaluation:</strong><br />
                  <span style={{ color: "#667085", fontSize: "11px" }}>
                    {role === "student" && "STU-2026-001 • Student@123"}
                    {role === "teacher" && "TCH-2026-001 • Teacher@123"}
                    {role === "admin" && "ADM-2026-001 • Admin@123"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (role === "student") {
                      setEmail("STU-2026-001");
                      setPassword("Student@123");
                    } else if (role === "teacher") {
                      setEmail("TCH-2026-001");
                      setPassword("Teacher@123");
                    } else if (role === "admin") {
                      setEmail("ADM-2026-001");
                      setPassword("Admin@123");
                    }
                    setMessage("");
                  }}
                  style={{
                    background: "#5B5FEF",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  ⚡ Auto-Fill Credentials
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={handleLogin}
              >

                {/* EMAIL / ID */}

                <div className="field">

                  <label
                    htmlFor="login-email"
                    className="field-label"
                  >
                    {role === "student"
                      ? "Student ID / Email"
                      : role === "teacher"
                      ? "Teacher ID / Email"
                      : "Admin ID / Email"}
                  </label>

                  <div className="input-box">

                    <Icon
                      type="mail"
                      size={16}
                    />

                    <input
                      id="login-email"
                      type="text"

                      value={email}

                      onChange={(event) => {

                        setEmail(
                          event.target.value
                        );

                        setMessage("");

                      }}

                      placeholder={
                        role === "student"
                          ? "e.g. STU-2026-001"
                          : role === "teacher"
                          ? "e.g. TCH-2026-001"
                          : "e.g. ADM-2026-001"
                      }
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div className="field">

                  <div className="password-head">

                    <label>
                      Password
                    </label>

                    {/* FORGOT PASSWORD */}

                    <button
                      type="button"
                      className="forgot-link"

                      onClick={() => {

                        window.location.href =
                          `/forgot-password?role=${role}`;

                      }}
                    >
                      Forgot password?
                    </button>

                  </div>

                  <div className="input-box">

                    <Icon
                      type="lock"
                      size={16}
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }

                      value={password}

                      onChange={(event) => {

                        setPassword(
                          event.target.value
                        );

                        setMessage("");

                      }}

                      placeholder={
                        role === "student"
                          ? "Enter Student password"
                          : role === "teacher"
                          ? "Enter Teacher password"
                          : "Enter Admin password"
                      }
                    />

                    <button
                      type="button"
                      className="password-eye"

                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                    >

                      <Icon
                        type={
                          showPassword
                            ? "eyeOff"
                            : "eye"
                        }
                        size={16}
                      />

                    </button>

                  </div>

                </div>

                {/* REMEMBER */}

                <label className="remember">

                  <input
                    type="checkbox"
                    checked={remember}

                    onChange={(event) =>
                      setRemember(
                        event.target.checked
                      )
                    }
                  />

                  Remember me

                </label>

                {/* MESSAGE */}

                {message && (

                  <div className="login-message">
                    {message}
                  </div>

                )}

                {/* SIGN IN */}

                <button
                  type="submit"
                  className="sign-in-button"
                >

                  Sign In

                  <Icon
                    type="arrow"
                    size={14}
                  />

                </button>

              </form>

            </div>

          )}

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

          <div className="register">

            <span>
              Don't have an AttendX account?
            </span>

            <a
              href={
                role
                  ? `/create-account?role=${role}`
                  : "/create-account"
              }
            >
              Create Account
            </a>

          </div>

          {/* SECURITY */}

          <div className="secure-line">

            <span className="secure-dot" />

            Secure role-based access

          </div>

        </div>

      </section>

    </div>
  );
}