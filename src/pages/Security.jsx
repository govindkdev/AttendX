import { useEffect, useState } from "react";
import "../style/Security.css";

/*
=========================================================
ATTENDX - SECURITY PAGE
=========================================================

IMPORTANT SECURITY CONCEPT
---------------------------------------------------------

1. Camera attendance uses face verification.
2. QR attendance starts from the student's own login.
3. Teacher/Admin generates the active attendance QR.
4. Student identity is checked before attendance.
5. Session must be valid.
6. Admin manual attendance is permission-controlled.
7. Important attendance actions can be recorded in logs.

IMPORTANT:
This is a frontend security visualization/demo.
Real authentication, database, encryption, AI model,
QR validation and backend security will be implemented
later in the application backend.
=========================================================
*/


/* =====================================================
   ICON COMPONENT
===================================================== */

function Icon({ name, size = 20 }) {

  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };


  if (name === "shield") {

    return (
      <svg {...props}>

        <path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3Z" />

        <path d="m9 12 2 2 4-4" />

      </svg>
    );

  }


  if (name === "camera") {

    return (
      <svg {...props}>

        <path d="m9 6 1.4-2h3.2L15 6h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3Z" />

        <circle
          cx="12"
          cy="12.5"
          r="3.2"
        />

      </svg>
    );

  }


  if (name === "face") {

    return (
      <svg {...props}>

        <path d="M5 8V6a1 1 0 0 1 1-1h2" />

        <path d="M16 5h2a1 1 0 0 1 1 1v2" />

        <path d="M19 16v2a1 1 0 0 1-1 1h-2" />

        <path d="M8 19H6a1 1 0 0 1-1-1v-2" />

        <circle
          cx="12"
          cy="12"
          r="4"
        />

      </svg>
    );

  }


  if (name === "qr") {

    return (
      <svg {...props}>

        <rect
          x="4"
          y="4"
          width="6"
          height="6"
          rx="1"
        />

        <rect
          x="14"
          y="4"
          width="6"
          height="6"
          rx="1"
        />

        <rect
          x="4"
          y="14"
          width="6"
          height="6"
          rx="1"
        />

        <path d="M14 14h3v3h-3z" />

        <path d="M19 17v3" />

        <path d="M17 19h3" />

      </svg>
    );

  }


  if (name === "user") {

    return (
      <svg {...props}>

        <circle
          cx="12"
          cy="8"
          r="3.5"
        />

        <path d="M5 21a7 7 0 0 1 14 0" />

      </svg>
    );

  }


  if (name === "admin") {

    return (
      <svg {...props}>

        <circle
          cx="12"
          cy="8"
          r="3.5"
        />

        <path d="M5 21a7 7 0 0 1 14 0" />

        <path d="M18 4v5" />

        <path d="M15.5 6.5h5" />

      </svg>
    );

  }


  if (name === "database") {

    return (
      <svg {...props}>

        <ellipse
          cx="12"
          cy="5"
          rx="8"
          ry="3"
        />

        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />

        <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />

      </svg>
    );

  }


  if (name === "lock") {

    return (
      <svg {...props}>

        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2"
        />

        <path d="M8 10V7a4 4 0 0 1 8 0v3" />

        <path d="M12 14v2" />

      </svg>
    );

  }


  if (name === "check") {

    return (
      <svg {...props}>

        <path d="m5 12 4 4L19 6" />

      </svg>
    );

  }


  if (name === "close") {

    return (
      <svg {...props}>

        <path d="m7 7 10 10" />

        <path d="M17 7 7 17" />

      </svg>
    );

  }


  if (name === "arrow") {

    return (
      <svg {...props}>

        <path d="M5 12h13" />

        <path d="m13 6 6 6-6 6" />

      </svg>
    );

  }


  return null;
}


/* =====================================================
   SECURITY EVENTS
===================================================== */

const securityEvents = [

  {
    type: "verified",
    title: "Face identity verified",
    detail: "AX-24-0917 matched",
  },

  {
    type: "verified",
    title: "Attendance session verified",
    detail: "CS-204-A7 is active",
  },

  {
    type: "blocked",
    title: "Identity mismatch blocked",
    detail: "Attendance not recorded",
  },

  {
    type: "verified",
    title: "Admin action recorded",
    detail: "Manual update logged",
  },

];


/* =====================================================
   SECURITY COMPONENT
===================================================== */

function Security() {

  const [eventIndex, setEventIndex] =
    useState(0);


  const [securityState, setSecurityState] =
    useState("VERIFIED");


  /* ===================================================
     SECURITY EVENT ANIMATION
  =================================================== */

  useEffect(() => {

    const timer =
      window.setInterval(() => {

        setEventIndex(
          (value) =>
            (value + 1) % securityEvents.length
        );

      }, 2500);


    return () =>
      window.clearInterval(timer);

  }, []);


  /* ===================================================
     SECURITY STATUS
  =================================================== */

  useEffect(() => {

    const current =
      securityEvents[eventIndex];


    setSecurityState(
      current.type === "blocked"
        ? "BLOCKED"
        : "VERIFIED"
    );

  }, [eventIndex]);


  /* ===================================================
     SCROLL REVEAL
  =================================================== */

  useEffect(() => {

    const elements =
      document.querySelectorAll(
        ".security-reveal"
      );


    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                entry.isIntersecting
              ) {

                entry.target.classList.add(
                  "security-visible"
                );

              }

            }
          );

        },
        {
          threshold: 0.12,
        }
      );


    elements.forEach(
      (item) => {

        observer.observe(item);

      }
    );


    return () =>
      observer.disconnect();

  }, []);


  const currentEvent =
    securityEvents[eventIndex];


  return (

    <div className="attendx-security">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="security-header">

        <div className="security-header-inner">


          {/* BRAND */}

          <a
            href="/"
            className="security-brand"
          >

            <span className="security-logo">

              <span className="security-logo-one" />

              <span className="security-logo-two" />

              <span className="security-logo-dot" />

            </span>


            <span className="security-brand-copy">

              <strong>
                AttendX
              </strong>

              <small>
                Smart Attendance Infrastructure
              </small>

            </span>

          </a>



          {/* NAV */}

          <nav className="security-nav">

            <a href="/">
              Home
            </a>

            <a href="/about">
              About
            </a>

            <a href="/features">
              Features
            </a>

            <a href="/how-it-works">
              How It Works
            </a>

            <a
              href="/security"
              className="active"
            >
              Security
            </a>

            <a href="/contact">
              Contact
            </a>

          </nav>



          {/* CTA */}

          <a
            href="/contact"
            className="security-header-button"
          >

            Get Started

            <Icon
              name="arrow"
              size={14}
            />

          </a>


          <button
            className="security-mobile-button"
            type="button"
            aria-label="Open menu"
          >

            <span />
            <span />
            <span />

          </button>

        </div>

      </header>



      {/* =================================================
          HERO
      ================================================= */}

      <section className="security-hero">

        <div className="security-grid" />

        <div className="security-glow glow-one" />

        <div className="security-glow glow-two" />


        <div className="security-container security-hero-layout">


          {/* LEFT COPY */}

          <div className="security-copy security-reveal">

            <span className="security-kicker">
              ATTENDX SECURITY
            </span>


            <h1>

              Every attendance mark
              should have

              <span>
                proof behind it.
              </span>

            </h1>


            <p>

              AttendX is designed so an attendance
              record is not created from a simple
              click alone. The system can verify
              the relevant identity, attendance
              session and user role before recording
              an attendance event.

            </p>


            <div className="security-trust">

              <span>

                <Icon
                  name="face"
                  size={13}
                />

                Identity

              </span>


              <span>

                <Icon
                  name="qr"
                  size={13}
                />

                Session

              </span>


              <span>

                <Icon
                  name="lock"
                  size={13}
                />

                Access

              </span>


              <span>

                <Icon
                  name="database"
                  size={13}
                />

                Record

              </span>

            </div>

          </div>



          {/* =================================================
              SECURITY MONITOR
          ================================================= */}

          <div className="security-monitor security-reveal">


            <div className="monitor-top">

              <div>

                <span className="monitor-dot" />

                ATTENDX SECURITY MONITOR

              </div>


              <span className="monitor-live">
                LIVE
              </span>

            </div>



            <div className="monitor-body">


              {/* CENTRAL SHIELD */}

              <div className="security-core">

                <div className="core-ring ring-one" />

                <div className="core-ring ring-two" />

                <div
                  className={
                    securityState === "BLOCKED"
                      ? "core-icon blocked"
                      : "core-icon"
                  }
                >

                  <Icon
                    name={
                      securityState === "BLOCKED"
                        ? "close"
                        : "shield"
                    }
                    size={30}
                  />

                </div>


                <strong>
                  {securityState}
                </strong>


                <small>
                  Attendance Security State
                </small>

              </div>



              {/* SECURITY NODES */}

              <div className="security-node node-identity">

                <div>
                  <Icon
                    name="face"
                    size={17}
                  />
                </div>

                <strong>
                  Identity
                </strong>

                <small>
                  Checked
                </small>

              </div>


              <div className="security-node node-session">

                <div>
                  <Icon
                    name="qr"
                    size={17}
                  />
                </div>

                <strong>
                  Session
                </strong>

                <small>
                  Active
                </small>

              </div>


              <div className="security-node node-access">

                <div>
                  <Icon
                    name="lock"
                    size={17}
                  />
                </div>

                <strong>
                  Access
                </strong>

                <small>
                  Controlled
                </small>

              </div>


              <div className="security-node node-record">

                <div>
                  <Icon
                    name="database"
                    size={17}
                  />
                </div>

                <strong>
                  Record
                </strong>

                <small>
                  Logged
                </small>

              </div>


              {/* CONNECTING LINES */}

              <span className="secure-line line-identity" />

              <span className="secure-line line-session" />

              <span className="secure-line line-access" />

              <span className="secure-line line-record" />

            </div>



            {/* CURRENT EVENT */}

            <div
              className={`monitor-event ${
                currentEvent.type
              }`}
            >

              <div className="event-icon">

                <Icon
                  name={
                    currentEvent.type === "blocked"
                      ? "close"
                      : "check"
                  }
                  size={14}
                />

              </div>


              <div className="event-copy">

                <strong>
                  {currentEvent.title}
                </strong>

                <small>
                  {currentEvent.detail}
                </small>

              </div>


              <span className="event-state">

                {currentEvent.type === "blocked"
                  ? "BLOCKED"
                  : "VERIFIED"}

              </span>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          VALIDATION CHAIN
      ================================================= */}

      <section className="security-validation">

        <div className="security-container">


          <div className="security-section-heading security-reveal">

            <span className="security-kicker">
              VALIDATION CHAIN
            </span>


            <h2>

              Attendance passes through
              multiple

              <span>
                control points.
              </span>

            </h2>


            <p>

              The exact backend checks will be
              implemented later. The security
              architecture shown here defines the
              intended frontend product flow.

            </p>

          </div>



          <div className="validation-grid">


            {/* 01 */}

            <article className="validation-card security-reveal">

              <span className="validation-number">
                01
              </span>


              <div className="validation-icon">

                <Icon
                  name="user"
                  size={22}
                />

              </div>


              <span className="validation-label">
                IDENTITY
              </span>


              <h3>
                Student identity
              </h3>


              <p>

                Attendance is associated with
                the student's registered AttendX
                account and identity.

              </p>


              <div className="validation-result">

                <Icon
                  name="check"
                  size={11}
                />

                Identity required

              </div>

            </article>



            {/* 02 */}

            <article className="validation-card security-reveal">

              <span className="validation-number">
                02
              </span>


              <div className="validation-icon">

                <Icon
                  name="qr"
                  size={22}
                />

              </div>


              <span className="validation-label">
                SESSION
              </span>


              <h3>
                Live session
              </h3>


              <p>

                QR attendance is tied to the
                active attendance session created
                by the teacher or admin.

              </p>


              <div className="validation-result">

                <Icon
                  name="check"
                  size={11}
                />

                Session required

              </div>

            </article>



            {/* 03 */}

            <article className="validation-card security-reveal">

              <span className="validation-number">
                03
              </span>


              <div className="validation-icon">

                <Icon
                  name="lock"
                  size={22}
                />

              </div>


              <span className="validation-label">
                ACCESS
              </span>


              <h3>
                Permission control
              </h3>


              <p>

                Admin and teacher actions should
                be limited according to their
                assigned role and permissions.

              </p>


              <div className="validation-result">

                <Icon
                  name="check"
                  size={11}
                />

                Role controlled

              </div>

            </article>



            {/* 04 */}

            <article className="validation-card security-reveal">

              <span className="validation-number">
                04
              </span>


              <div className="validation-icon">

                <Icon
                  name="database"
                  size={22}
                />

              </div>


              <span className="validation-label">
                RECORD
              </span>


              <h3>
                Attendance evidence
              </h3>


              <p>

                Attendance events can carry useful
                details such as student, date,
                time and verification method.

              </p>


              <div className="validation-result">

                <Icon
                  name="check"
                  size={11}
                />

                Event recorded

              </div>

            </article>

          </div>

        </div>

      </section>



      {/* =================================================
          ATTACK / BLOCK DEMO
      ================================================= */}

      <section className="security-protection">

        <div className="security-container protection-layout">


          <div className="protection-copy security-reveal">

            <span className="security-kicker">
              CONTROLLED ATTENDANCE
            </span>


            <h2>

              Wrong identity?

              <span>
                Don't record it.
              </span>

            </h2>


            <p>

              The security model is designed around
              rejecting an attendance attempt when
              the expected student identity or active
              session does not match.

            </p>


            <div className="protection-list">

              <div>

                <span>
                  01
                </span>

                <p>

                  Student account identifies
                  the person making the request.

                </p>

              </div>


              <div>

                <span>
                  02
                </span>

                <p>

                  Active attendance session
                  identifies the current class event.

                </p>

              </div>


              <div>

                <span>
                  03
                </span>

                <p>

                  A mismatch should stop the
                  attendance record from being created.

                </p>

              </div>

            </div>

          </div>



          {/* BLOCK VISUAL */}

          <div className="protection-visual security-reveal">

            <div className="attempt-card">

              <div className="attempt-header">

                <span>
                  ATTENDANCE REQUEST
                </span>

                <span>
                  LIVE
                </span>

              </div>


              <div className="attempt-user">

                <div className="attempt-avatar">
                  GK
                </div>

                <div>

                  <strong>
                    Govind Kushwaha
                  </strong>

                  <small>
                    AX-24-0917
                  </small>

                </div>

              </div>


              <div className="attempt-checks">

                <div className="attempt-check passed">

                  <Icon
                    name="check"
                    size={11}
                  />

                  <span>
                    Student Login
                  </span>

                  <strong>
                    MATCH
                  </strong>

                </div>


                <div className="attempt-check passed">

                  <Icon
                    name="check"
                    size={11}
                  />

                  <span>
                    Session
                  </span>

                  <strong>
                    MATCH
                  </strong>

                </div>


                <div className="attempt-check failed">

                  <Icon
                    name="close"
                    size={11}
                  />

                  <span>
                    Student Identity
                  </span>

                  <strong>
                    MISMATCH
                  </strong>

                </div>

              </div>


              <div className="attempt-result">

                <div>

                  <Icon
                    name="close"
                    size={18}
                  />

                </div>


                <p>

                  <strong>
                    Attendance Blocked
                  </strong>

                  <small>
                    No attendance record created
                  </small>

                </p>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          ADMIN AUDIT
      ================================================= */}

      <section className="security-audit">

        <div className="security-container">


          <div className="audit-header security-reveal">

            <div>

              <span className="security-kicker">
                ADMIN AUDIT
              </span>


              <h2>

                Important actions should
                leave a

                <span>
                  trace.
                </span>

              </h2>

            </div>


            <span className="audit-status">

              <i />

              LOGGING ACTIVE

            </span>

          </div>



          <div className="audit-table security-reveal">


            <div className="audit-row audit-row-head">

              <span>
                ACTION
              </span>

              <span>
                USER
              </span>

              <span>
                METHOD
              </span>

              <span>
                STATUS
              </span>

              <span>
                TIME
              </span>

            </div>


            <div className="audit-row">

              <span>
                Attendance marked
              </span>

              <span>
                Govind Kushwaha
              </span>

              <span>
                Face
              </span>

              <strong className="audit-success">
                VERIFIED
              </strong>

              <span>
                11:42:08
              </span>

            </div>


            <div className="audit-row">

              <span>
                QR session generated
              </span>

              <span>
                Teacher
              </span>

              <span>
                QR
              </span>

              <strong className="audit-success">
                ACTIVE
              </strong>

              <span>
                11:42:20
              </span>

            </div>


            <div className="audit-row">

              <span>
                Identity mismatch
              </span>

              <span>
                Unknown
              </span>

              <span>
                QR
              </span>

              <strong className="audit-blocked">
                BLOCKED
              </strong>

              <span>
                11:42:31
              </span>

            </div>


            <div className="audit-row">

              <span>
                Manual attendance
              </span>

              <span>
                Admin
              </span>

              <span>
                Manual
              </span>

              <strong className="audit-success">
                LOGGED
              </strong>

              <span>
                11:43:02
              </span>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="security-final">

        <div className="security-container">

          <div className="security-final-box security-reveal">

            <div>

              <span className="security-kicker">
                ATTENDX SECURITY
              </span>


              <h2>

                Verify the person.
                Verify the session.
                Record the

                <span>
                  evidence.
                </span>

              </h2>

            </div>


            <a
              href="/contact"
              className="security-final-button"
            >

              Get Started

              <Icon
                name="arrow"
                size={15}
              />

            </a>

          </div>

        </div>

      </section>

    </div>
  );
}


export default Security;