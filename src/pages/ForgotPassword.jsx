import { useState } from "react";
import "../style/ForgotPassword.css";

/*
=========================================================
ATTENDX - FORGOT PASSWORD PAGE
=========================================================

ROLE AWARE:
Student -> Student ID
Teacher -> Teacher ID
Admin   -> Admin ID

FLOW:
Account Details
      ↓
Send OTP
      ↓
Verify OTP
      ↓
New Password
      ↓
Confirm Password
      ↓
Reset Password
=========================================================
*/


/* =====================================================
   ICONS
===================================================== */

function Icon({ type, size = 20 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
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

  if (type === "mail") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
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

  if (type === "shield") {
    return (
      <svg {...props}>
        <path d="M12 3l8 3v5c0 4.8-3.1 8.1-8 10-4.9-1.9-8-5.2-8-10V6l8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg {...props}>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (type === "eye") {
    return (
      <svg {...props}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (type === "eyeOff") {
    return (
      <svg {...props}>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7" />
        <path d="M6.2 6.9C3.9 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.6-.3 3.7-.8" />
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

  if (type === "back") {
    return (
      <svg {...props}>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
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


/* =====================================================
   COMPONENT
===================================================== */

export default function ForgotPassword() {

  /*
  -------------------------------------------------------
  ROLE FROM URL
  -------------------------------------------------------

  /forgot-password?role=student
  /forgot-password?role=teacher
  /forgot-password?role=admin
  -------------------------------------------------------
  */

  const params = new URLSearchParams(
    window.location.search
  );

  const urlRole = params.get("role");


  const [role, setRole] = useState(
    ["student", "teacher", "admin"].includes(urlRole)
      ? urlRole
      : "student"
  );


  /* =====================================================
     ACCOUNT DATA
  ===================================================== */

  const [contact, setContact] = useState("");

  const [accountId, setAccountId] = useState("");

  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [otpVerified, setOtpVerified] =
    useState(false);


  /* =====================================================
     PASSWORD
  ===================================================== */

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  /* =====================================================
     STATE
  ===================================================== */

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  /* =====================================================
     ROLE DATA
  ===================================================== */

  const roleData = {

    student: {
      title: "Student",
      label: "Student ID",
      placeholder: "e.g. STU-2026-001",
      icon: "student",
    },

    teacher: {
      title: "Teacher",
      label: "Teacher ID",
      placeholder: "e.g. TCH-2026-001",
      icon: "teacher",
    },

    admin: {
      title: "Admin",
      label: "Admin ID",
      placeholder: "e.g. ADM-2026-001",
      icon: "admin",
    },

  };


  const currentRole = roleData[role];


  /* =====================================================
     PASSWORD VALIDATION
  ===================================================== */

  const passwordRules = {

    length:
      newPassword.length >= 8,

    uppercase:
      /[A-Z]/.test(newPassword),

    lowercase:
      /[a-z]/.test(newPassword),

    number:
      /[0-9]/.test(newPassword),

    special:
      /[^A-Za-z0-9]/.test(newPassword),

  };


  const passwordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;


  /* =====================================================
     CHANGE ROLE
  ===================================================== */

  const changeRole = (newRole) => {

    setRole(newRole);

    setContact("");
    setAccountId("");
    setPhone("");
    setOtp("");

    setOtpSent(false);
    setOtpVerified(false);

    setNewPassword("");
    setConfirmPassword("");

    setMessage("");
    setSuccess(false);

    window.history.replaceState(
      {},
      "",
      `/forgot-password?role=${newRole}`
    );
  };


  /* =====================================================
     SEND OTP
  ===================================================== */

  const handleSendOtp = (event) => {

    event.preventDefault();


    if (!contact.trim()) {

      setMessage(
        "Please enter your registered email or phone number."
      );

      return;
    }


    if (!accountId.trim()) {

      setMessage(
        `Please enter your ${currentRole.label}.`
      );

      return;
    }


    const cleanPhone =
      phone.replace(/\D/g, "");


    if (cleanPhone.length !== 10) {

      setMessage(
        "Please enter a valid 10-digit registered phone number."
      );

      return;
    }


    /*
    -------------------------------------------------------
    DEMO OTP

    Production:
    Backend should generate and send OTP.
    -------------------------------------------------------
    */

    setOtpSent(true);

    setOtpVerified(false);

    setMessage(
      "OTP sent successfully. Demo OTP: 123456"
    );
  };


  /* =====================================================
     VERIFY OTP
     ===================================================== */

  const handleVerifyOtp = (event) => {

    event.preventDefault();


    if (!otpSent) {

      setMessage(
        "Please send OTP first."
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      setMessage(
        "Please enter a valid 6-digit OTP."
      );

      return;
    }


    if (otp !== "123456") {

      setMessage(
        "Invalid OTP. Please enter the correct OTP."
      );

      return;
    }


    setOtpVerified(true);

    setMessage(
      "OTP verified successfully. Create your new password below."
    );
  };


  /* =====================================================
     RESET PASSWORD
     ===================================================== */

  const handleResetPassword = (event) => {

    event.preventDefault();


    if (!otpVerified) {

      setMessage(
        "Please verify OTP first."
      );

      return;
    }


    if (!passwordValid) {

      setMessage(
        "Password must include uppercase, lowercase, number, special symbol and minimum 8 characters."
      );

      return;
    }


    if (newPassword !== confirmPassword) {

      setMessage(
        "New password and confirm password do not match."
      );

      return;
    }


    /*
    -------------------------------------------------------
    BACKEND DATABASE API WILL BE CONNECTED HERE.

    Example:

    POST /api/auth/reset-password

    {
      role,
      contact,
      accountId,
      phone,
      otp,
      newPassword
    }

    Backend must hash the password before storing it.
    -------------------------------------------------------
    */

    console.log({
      role,
      contact,
      accountId,
      phone,
      otp,
      newPassword,
    });


    setSuccess(true);

    setMessage("");
  };


  return (

    <div className="attendx-forgot-page">


      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <section className="forgot-left">

        <div className="forgot-grid" />


        {/* BRAND */}

        <a
          href="/"
          className="forgot-brand"
        >

          <span className="forgot-logo">

            <span />

          </span>


          <span>

            <strong>
              AttendX
            </strong>

            <small>
              SMART ATTENDANCE INFRASTRUCTURE
            </small>

          </span>

        </a>



        {/* LEFT CONTENT */}

        <div className="forgot-left-content">

          <span className="forgot-overline">
            ACCOUNT RECOVERY
          </span>


          <h1>
            Recover access.
            <span>
              Stay protected.
            </span>
          </h1>


          <p>
            Securely verify your {currentRole.title.toLowerCase()}
            account before creating a new password.
          </p>


          {/* CURRENT ROLE */}

          <div className="forgot-role-status">

            <div className="forgot-role-icon">

              <Icon
                type={currentRole.icon}
                size={18}
              />

            </div>


            <div>

              <small>
                RECOVERING ACCOUNT
              </small>

              <strong>
                {currentRole.title}
              </strong>

            </div>

          </div>


          {/* RECOVERY FLOW */}

          <div className="forgot-flow">

            <div className="flow-item">

              <span>
                01
              </span>

              <div>

                <strong>
                  Identity
                </strong>

                <small>
                  {currentRole.label}
                </small>

              </div>

            </div>


            <div className="flow-line" />


            <div className="flow-item">

              <span>
                02
              </span>

              <div>

                <strong>
                  Verification
                </strong>

                <small>
                  One-time OTP
                </small>

              </div>

            </div>


            <div className="flow-line" />


            <div className="flow-item">

              <span>
                03
              </span>

              <div>

                <strong>
                  New Password
                </strong>

                <small>
                  Secure credentials
                </small>

              </div>

            </div>

          </div>

        </div>



        {/* FOOTER */}

        <div className="forgot-left-footer">

          <span>
            © 2026 AttendX
          </span>

          <span>
            Identity • Verification • Trust
          </span>

        </div>

      </section>



      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <section className="forgot-right">

        <div className="forgot-container">


          {/* BACK */}

          <button
            type="button"
            className="back-login"
            onClick={() =>
              window.location.href =
                "/login"
            }
          >

            <Icon
              type="back"
              size={15}
            />

            Back to Login

          </button>



          {/* HEADING */}

          <div className="forgot-heading">

            <span>
              ACCOUNT RECOVERY
            </span>


            <h2>
              Forgot password?
            </h2>


            <p>
              Verify your account and create
              a new secure password.
            </p>

          </div>



          {/* ROLE SELECTOR */}

          <div className="forgot-role-label">
            Account Type
          </div>


          <div className="forgot-role-switch">

            {Object.entries(roleData).map(
              ([key, item]) => (

                <button
                  key={key}
                  type="button"
                  className={
                    role === key
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    changeRole(key)
                  }
                >

                  <Icon
                    type={item.icon}
                    size={15}
                  />

                  <span>
                    {item.title}
                  </span>

                </button>

              )
            )}

          </div>



          {/* PROGRESS */}

          <div className="forgot-progress">

            <span className="active" />

            <span
              className={
                otpVerified
                  ? "active"
                  : ""
              }
            />

            <span
              className={
                success
                  ? "active"
                  : ""
              }
            />

          </div>



          {/* =================================================
              MAIN CARD
          ================================================= */}

          <div className="forgot-card">


            {/* =================================================
                SECTION 01
            ================================================= */}

            <section className="recovery-section">

              <div className="step-number">
                01
              </div>


              <div className="section-body">

                <div className="section-heading">

                  <h3>
                    Confirm your account
                  </h3>

                  <p>
                    Enter your registered details
                    to request an OTP.
                  </p>

                </div>



                {/* CONTACT */}

                <div className="recovery-field">

                  <label>
                    Email / Phone Number
                  </label>


                  <div className="recovery-input">

                    <Icon
                      type="mail"
                      size={16}
                    />


                    <input
                      type="text"
                      value={contact}
                      onChange={(event) => {

                        setContact(
                          event.target.value
                        );

                        setMessage("");
                      }}
                      placeholder="Registered email or phone"
                    />

                  </div>

                </div>



                {/* ROLE ID */}

                <div className="recovery-field">

                  <label>
                    {currentRole.label}
                  </label>


                  <div className="recovery-input">

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

                <div className="recovery-field">

                  <label>
                    Registered Phone Number
                  </label>


                  <div className="recovery-input">

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
                      placeholder="10-digit mobile number"
                    />

                  </div>

                </div>


                <button
                  type="button"
                  className="recovery-button"
                  onClick={handleSendOtp}
                >

                  {otpSent
                    ? "Resend OTP"
                    : "Send OTP"}

                  <Icon
                    type="arrow"
                    size={14}
                  />

                </button>

              </div>

            </section>



            <div className="recovery-divider" />



            {/* =================================================
                SECTION 02 - OTP
            ================================================= */}

            <section className="recovery-section">

              <div
                className={
                  `step-number ${
                    otpSent
                      ? "ready"
                      : ""
                  }`
                }
              >
                02
              </div>


              <div className="section-body">

                <div className="section-heading">

                  <h3>
                    Verify OTP
                  </h3>

                  <p>
                    Enter the 6-digit OTP sent
                    to your registered phone.
                  </p>

                </div>


                <div className="recovery-field">

                  <label>
                    One-Time Password
                  </label>


                  <div className="recovery-input">

                    <Icon
                      type="shield"
                      size={16}
                    />


                    <input
                      className="otp-input"
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
                  className="recovery-button"
                  disabled={!otpSent}
                  onClick={handleVerifyOtp}
                >

                  {otpVerified
                    ? "OTP Verified"
                    : "Verify OTP"}

                  <Icon
                    type={
                      otpVerified
                        ? "check"
                        : "shield"
                    }
                    size={14}
                  />

                </button>

              </div>

            </section>



            {/* =================================================
                SECTION 03 - PASSWORD

                IMPORTANT:
                Only shown after OTP verification.
            ================================================= */}

            {otpVerified && !success && (

              <>

                <div className="recovery-divider" />


                <section className="recovery-section">

                  <div className="step-number ready">
                    03
                  </div>


                  <div className="section-body">

                    <div className="section-heading">

                      <h3>
                        Create new password
                      </h3>

                      <p>
                        OTP verified. Create a strong
                        password for your account.
                      </p>

                    </div>



                    {/* NEW PASSWORD */}

                    <div className="recovery-field">

                      <label>
                        New Password
                      </label>


                      <div className="recovery-input">

                        <Icon
                          type="lock"
                          size={16}
                        />


                        <input
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          value={newPassword}
                          onChange={(event) => {

                            setNewPassword(
                              event.target.value
                            );

                            setMessage("");
                          }}
                          placeholder="Create a strong password"
                        />


                        <button
                          type="button"
                          className="password-eye"
                          onClick={() =>
                            setShowNewPassword(
                              (value) => !value
                            )
                          }
                        >

                          <Icon
                            type={
                              showNewPassword
                                ? "eyeOff"
                                : "eye"
                            }
                            size={15}
                          />

                        </button>

                      </div>

                    </div>



                    {/* PASSWORD RULES */}

                    <div className="password-rules">

                      <div className={
                        passwordRules.length
                          ? "valid"
                          : ""
                      }>
                        <span>✓</span>
                        8+ characters
                      </div>


                      <div className={
                        passwordRules.uppercase
                          ? "valid"
                          : ""
                      }>
                        <span>✓</span>
                        Uppercase letter
                      </div>


                      <div className={
                        passwordRules.lowercase
                          ? "valid"
                          : ""
                      }>
                        <span>✓</span>
                        Lowercase letter
                      </div>


                      <div className={
                        passwordRules.number
                          ? "valid"
                          : ""
                      }>
                        <span>✓</span>
                        One number
                      </div>


                      <div className={
                        passwordRules.special
                          ? "valid"
                          : ""
                      }>
                        <span>✓</span>
                        Special symbol
                      </div>

                    </div>



                    {/* CONFIRM PASSWORD */}

                    <div className="recovery-field">

                      <label>
                        Confirm Password
                      </label>


                      <div className="recovery-input">

                        <Icon
                          type="lock"
                          size={16}
                        />


                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={confirmPassword}
                          onChange={(event) => {

                            setConfirmPassword(
                              event.target.value
                            );

                            setMessage("");
                          }}
                          placeholder="Re-enter your password"
                        />


                        <button
                          type="button"
                          className="password-eye"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) => !value
                            )
                          }
                        >

                          <Icon
                            type={
                              showConfirmPassword
                                ? "eyeOff"
                                : "eye"
                            }
                            size={15}
                          />

                        </button>

                      </div>


                      {confirmPassword && (

                        <div
                          className={
                            `password-match ${
                              newPassword ===
                              confirmPassword
                                ? "correct"
                                : "wrong"
                            }`
                          }
                        >

                          {newPassword ===
                          confirmPassword
                            ? "✓ Passwords match"
                            : "Passwords do not match"}

                        </div>

                      )}

                    </div>



                    {/* MESSAGE */}

                    {message && (

                      <div className="recovery-message">
                        {message}
                      </div>

                    )}



                    {/* RESET BUTTON */}

                    <button
                      type="button"
                      className="recovery-button"
                      onClick={handleResetPassword}
                    >

                      Reset Password

                      <Icon
                        type="check"
                        size={14}
                      />

                    </button>

                  </div>

                </section>

              </>

            )}



            {/* =================================================
                GENERAL MESSAGE
            ================================================= */}

            {!success &&
              !otpVerified &&
              message && (

                <div className="recovery-message">
                  {message}
                </div>

              )}



            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (

              <div className="reset-success">

                <div className="success-icon">

                  <Icon
                    type="check"
                    size={24}
                  />

                </div>


                <h3>
                  Password updated
                </h3>


                <p>
                  Your {currentRole.title.toLowerCase()}
                  account password has been reset successfully.
                </p>


                <button
                  type="button"
                  className="recovery-button"
                  onClick={() =>
                    window.location.href =
                      "/login"
                  }
                >

                  Back to Login

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