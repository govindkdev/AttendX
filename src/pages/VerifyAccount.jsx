import { useState } from "react";
import "../style/VerifyAccount.css";

/*
=========================================================
ATTENDX VERIFY ACCOUNT
=========================================================

Flow:

Student / Teacher / Admin
        ↓
ID + Phone
        ↓
Check existing account
        ↓
Valid
        ↓
Send OTP
        ↓
Verify OTP
        ↓
Dashboard

For Create Account:
Student role is used.

Demo student IDs:
STU-2026-001
STU-2026-002
STU-2026-003

Demo OTP:
123456

Production backend will replace demo data.
=========================================================
*/


function Icon({ type, size = 20 }) {

  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };


  if (type === "student") {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    );
  }


  if (type === "teacher") {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h5" />
        <path d="M9 21h6" />
        <path d="M12 18v3" />
      </svg>
    );
  }


  if (type === "admin") {
    return (
      <svg {...props}>
        <path d="M12 3l8 3v5c0 4.8-3.1 8.1-8 10-4.9-1.9-8-5.2-8-10V6l8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }


  if (type === "id") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="11" r="2" />
        <path d="M5.5 16a3 3 0 0 1 5 0" />
        <path d="M13 10h5" />
        <path d="M13 14h4" />
      </svg>
    );
  }


  if (type === "phone") {
    return (
      <svg {...props}>
        <path d="M7 3h3l1.5 4-2 1.5a14 14 0 0 0 6 6L17 12.5l4 1.5v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6a2 2 0 0 1 2-3Z" />
      </svg>
    );
  }


  if (type === "shield") {
    return (
      <svg {...props}>
        <path d="M12 3l8 3v5c0 4.8-3.1 8.1-8 10-4.9-1.9-8-5.2-8-10V6l8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }


  if (type === "arrow") {
    return (
      <svg {...props}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }


  if (type === "check") {
    return (
      <svg {...props}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }


  return null;
}


export default function VerifyAccount() {

  /*
  =======================================================
  ROLE FROM URL
  =======================================================
  */

  const params = new URLSearchParams(
    window.location.search
  );

  const role =
    params.get("role") || "student";


  /*
  =======================================================
  FORM STATE
  =======================================================
  */

  const [accountId, setAccountId] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [verified, setVerified] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [checking, setChecking] =
    useState(false);

  const [success, setSuccess] =
    useState(false);


  /*
  =======================================================
  DEMO DATABASE
  =======================================================

  Later this object will be replaced by backend API.
  =======================================================
  */

  const demoDatabase = {

    student: [
      {
        id: "STU-2026-001",
        phone: "9999999999",
      },

      {
        id: "STU-2026-002",
        phone: "8888888888",
      },

      {
        id: "STU-2026-003",
        phone: "7777777777",
      },
    ],


    teacher: [
      {
        id: "TCH-2026-001",
        phone: "9999999999",
      },
    ],


    admin: [
      {
        id: "ADM-2026-001",
        phone: "9999999999",
      },
    ],

  };


  /*
  =======================================================
  ROLE LABEL
  =======================================================
  */

  const roleLabels = {

    student: {
      title: "Student",
      idLabel: "Student ID",
      placeholder: "e.g. STU-2026-001",
      icon: "student",
    },

    teacher: {
      title: "Teacher",
      idLabel: "Teacher ID",
      placeholder: "e.g. TCH-2026-001",
      icon: "teacher",
    },

    admin: {
      title: "Admin",
      idLabel: "Admin ID",
      placeholder: "e.g. ADM-2026-001",
      icon: "admin",
    },

  };


  const currentRole =
    roleLabels[role] ||
    roleLabels.student;


  /*
  =======================================================
  CHECK ACCOUNT + SEND OTP
  =======================================================
  */

  const handleSendOtp = async (event) => {

    event.preventDefault();

    setMessage("");

    setChecking(true);


    /*
    -------------------------------------------------------
    DEMO DATABASE CHECK
    -------------------------------------------------------
    */

    const records =
      demoDatabase[role] ||
      demoDatabase.student;


    const found =
      records.find(
        (item) =>
          item.id.toLowerCase() ===
            accountId.trim().toLowerCase() &&
          item.phone === phone
      );


    /*
    -------------------------------------------------------
    Small delay to simulate database request.
    -------------------------------------------------------
    */

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 600)
    );


    setChecking(false);


    if (!found) {

      setMessage(
        `Invalid ${currentRole.idLabel} or registered phone number.`
      );

      setOtpSent(false);

      return;
    }


    /*
    -------------------------------------------------------
    ACCOUNT FOUND
    -------------------------------------------------------
    */

    setOtpSent(true);

    setMessage(
      "Account verified. OTP sent successfully. Demo OTP: 123456"
    );


    /*
    Production API:

    POST /api/auth/send-otp

    {
      role,
      accountId,
      phone
    }
    */

  };


  /*
  =======================================================
  VERIFY OTP
  =======================================================
  */

  const handleVerifyOtp = (event) => {

    event.preventDefault();

    setMessage("");


    if (!otpSent) {

      setMessage(
        "Please verify your account and send OTP first."
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      setMessage(
        "Please enter a valid 6-digit OTP."
      );

      return;
    }


    /*
    -------------------------------------------------------
    DEMO OTP
    -------------------------------------------------------
    */

    if (otp !== "123456") {

      setMessage(
        "Invalid OTP. Please enter the correct OTP."
      );

      return;
    }


    /*
    -------------------------------------------------------
    OTP VERIFIED
    -------------------------------------------------------
    */

    setVerified(true);

    setSuccess(true);

    setMessage(
      "OTP verified successfully."
    );


    /*
    Production API:

    POST /api/auth/verify-otp

    {
      role,
      accountId,
      phone,
      otp
    }
    */

  };


  /*
  =======================================================
  GO TO DASHBOARD
  =======================================================
  */

  const goToDashboard = () => {

    if (role === "teacher") {
      window.location.href =
        "/teacher-dashboard";

      return;
    }


    if (role === "admin") {
      window.location.href =
        "/admin-dashboard";

      return;
    }


    window.location.href =
      "/student-dashboard";
  };


  return (

    <div className="attendx-verify-page">


      {/* =================================================
          LEFT
      ================================================= */}

      <section className="verify-left">

        <div className="verify-grid" />


        {/* BRAND */}

        <a
          href="/"
          className="verify-brand"
        >

          <span className="verify-logo">
            <span />
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



        {/* CONTENT */}

        <div className="verify-left-content">

          <span className="verify-overline">
            IDENTITY VERIFICATION
          </span>


          <h1>

            One identity.
            <span>
              One secure account.
            </span>

          </h1>


          <p>
            Verify your institute-issued ID and
            registered phone number before activating
            your AttendX account.
          </p>


          {/* CURRENT ROLE */}

          <div className="verify-role-card">

            <div className="verify-role-icon">

              <Icon
                type={currentRole.icon}
                size={19}
              />

            </div>


            <div>

              <small>
                VERIFYING ACCOUNT
              </small>

              <strong>
                {currentRole.title}
              </strong>

            </div>

          </div>


          {/* FLOW */}

          <div className="verify-flow">

            <div className="verify-flow-item">

              <span>01</span>

              <div>

                <strong>
                  Account ID
                </strong>

                <small>
                  Match institute record
                </small>

              </div>

            </div>


            <div className="verify-line" />


            <div className="verify-flow-item">

              <span>02</span>

              <div>

                <strong>
                  Phone
                </strong>

                <small>
                  Match registered number
                </small>

              </div>

            </div>


            <div className="verify-line" />


            <div className="verify-flow-item">

              <span>03</span>

              <div>

                <strong>
                  OTP
                </strong>

                <small>
                  Activate account
                </small>

              </div>

            </div>

          </div>

        </div>


        <div className="verify-left-footer">

          <span>
            © 2026 AttendX
          </span>

          <span>
            Identity • Verification • Trust
          </span>

        </div>

      </section>



      {/* =================================================
          RIGHT
      ================================================= */}

      <section className="verify-right">

        <div className="verify-container">


          {/* BACK */}

          <button
            type="button"
            className="verify-back"
            onClick={() =>
              window.location.href =
                "/login"
            }
          >

            ← Back to Login

          </button>



          {/* TITLE */}

          <div className="verify-heading">

            <span>
              ACCOUNT VERIFICATION
            </span>


            <h2>
              Verify your account
            </h2>


            <p>
              Confirm your {currentRole.idLabel.toLowerCase()}
              and registered phone number.
            </p>

          </div>



          {/* ROLE */}

          <div className="verify-role-switch">

            {Object.entries(roleLabels).map(
              ([key, item]) => (

                <button
                  key={key}
                  type="button"
                  className={
                    role === key
                      ? "active"
                      : ""
                  }
                  onClick={() => {

                    window.location.href =
                      `/verify-account?role=${key}`;

                  }}
                >

                  <Icon
                    type={item.icon}
                    size={14}
                  />

                  {item.title}

                </button>

              )
            )}

          </div>



          {/* CARD */}

          <div className="verify-card">


            {/* =================================================
                ACCOUNT SECTION
            ================================================= */}

            <div className="verify-section">

              <div
                className={
                  `verify-number ${
                    otpSent
                      ? "active"
                      : ""
                  }`
                }
              >
                01
              </div>


              <div className="verify-section-body">

                <h3>
                  Check account details
                </h3>


                <p>
                  Your ID and phone number must
                  match the institute record.
                </p>


                {/* ID */}

                <div className="verify-field">

                  <label>
                    {currentRole.idLabel}
                  </label>


                  <div className="verify-input">

                    <Icon
                      type="id"
                      size={16}
                    />


                    <input
                      type="text"
                      value={accountId}
                      onChange={(event) => {

                        setAccountId(
                          event.target.value
                        );

                        setMessage("");
                      }}
                      placeholder={
                        currentRole.placeholder
                      }
                    />

                  </div>

                </div>



                {/* PHONE */}

                <div className="verify-field">

                  <label>
                    Registered Phone Number
                  </label>


                  <div className="verify-input">

                    <Icon
                      type="phone"
                      size={16}
                    />


                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength="10"
                      value={phone}
                      onChange={(event) => {

                        setPhone(
                          event.target.value
                            .replace(/\D/g, "")
                        );

                        setMessage("");
                      }}
                      placeholder="10-digit phone number"
                    />

                  </div>

                </div>


                <button
                  type="button"
                  className="verify-button"
                  onClick={handleSendOtp}
                  disabled={checking}
                >

                  {checking
                    ? "Checking..."
                    : otpSent
                    ? "Resend OTP"
                    : "Check & Send OTP"}


                  <Icon
                    type="arrow"
                    size={14}
                  />

                </button>

              </div>

            </div>



            <div className="verify-divider" />



            {/* =================================================
                OTP SECTION
            ================================================= */}

            <div className="verify-section">

              <div
                className={
                  `verify-number ${
                    verified
                      ? "active"
                      : ""
                  }`
                }
              >
                02
              </div>


              <div className="verify-section-body">

                <h3>
                  Verify OTP
                </h3>


                <p>
                  Enter the 6-digit OTP sent to
                  your registered phone.
                </p>


                <div className="verify-field">

                  <label>
                    One-Time Password
                  </label>


                  <div className="verify-input">

                    <Icon
                      type="shield"
                      size={16}
                    />


                    <input
                      className="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      value={otp}
                      onChange={(event) => {

                        setOtp(
                          event.target.value
                            .replace(/\D/g, "")
                        );

                        setMessage("");
                      }}
                      placeholder="000000"
                    />

                  </div>

                </div>


                <button
                  type="button"
                  className="verify-button"
                  disabled={!otpSent || verified}
                  onClick={handleVerifyOtp}
                >

                  {verified
                    ? "OTP Verified"
                    : "Verify OTP"}

                  <Icon
                    type={
                      verified
                        ? "check"
                        : "shield"
                    }
                    size={14}
                  />

                </button>

              </div>

            </div>



            {/* MESSAGE */}

            {message && (

              <div
                className={
                  `verify-message ${
                    message.includes("successfully")
                      ? "success"
                      : ""
                  }`
                }
              >
                {message}
              </div>

            )}



            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (

              <div className="verification-success">

                <div className="success-check">

                  <Icon
                    type="check"
                    size={25}
                  />

                </div>


                <h3>
                  Account verified
                </h3>


                <p>
                  Your {currentRole.title.toLowerCase()}
                  account has been successfully verified.
                </p>


                <button
                  type="button"
                  className="verify-button"
                  onClick={goToDashboard}
                >

                  Continue to Dashboard

                  <Icon
                    type="arrow"
                    size={14}
                  />

                </button>

              </div>

            )}

          </div>

        </div>

      </section>

    </div>
  );
}