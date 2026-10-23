import { useEffect, useState } from "react";
import "../style/HowItWorks.css";

/*
=========================================================
ATTENDX - HOW IT WORKS
=========================================================

REAL ATTENDX FLOW:

PRIMARY
Admin / Institute Camera
        ↓
Student appears
        ↓
Face detected
        ↓
Face matched
        ↓
Attendance marked

BACKUP
Face does not match
        ↓
Student Login
        ↓
Scan QR
        ↓
Teacher/Admin generated QR
        ↓
Student identity checked
        ↓
Attendance marked

MANUAL
Admin
        ↓
Select Student
        ↓
Present / Absent / Late

IMPORTANT:
Current page is a frontend simulation.
=========================================================
*/


/* =====================================================
   ICON
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

        <path d="M19 17v3M17 19h3" />

      </svg>
    );

  }


  if (name === "login") {

    return (
      <svg {...props}>

        <path d="M13 5h6v14h-6" />

        <path d="M11 12h9" />

        <path d="m15 8 4 4-4 4" />

        <path d="M13 12H4" />

      </svg>
    );

  }


  if (name === "shield") {

    return (
      <svg {...props}>

        <path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3Z" />

        <path d="m9 12 2 2 4-4" />

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


  if (name === "check") {

    return (
      <svg {...props}>

        <path d="m5 12 4 4L19 6" />

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


  /*
  IMPORTANT:
  default: yahan nahi lagega.
  */

  return null;
}


/* =====================================================
   COMPONENT
===================================================== */

function HowItWorks() {

  const [mode, setMode] =
    useState("camera");


  const [step, setStep] =
    useState(0);


  /* ===================================================
     DEMO STEP ANIMATION
  =================================================== */

  useEffect(() => {

    const timer =
      window.setInterval(() => {

        setStep(
          (value) =>
            (value + 1) % 4
        );

      }, 1800);


    return () =>
      window.clearInterval(timer);

  }, [mode]);


  /* ===================================================
     SCROLL REVEAL
  =================================================== */

  useEffect(() => {

    const elements =
      document.querySelectorAll(
        ".how-reveal"
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
                  "how-visible"
                );

              }

            }
          );

        },
        {
          threshold: .12,
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


  return (

    <div className="attendx-how">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="how-header">

        <div className="how-header-inner">


          <a
            href="/"
            className="how-brand"
          >

            <span className="how-logo">

              <span className="how-logo-one" />

              <span className="how-logo-two" />

              <span className="how-logo-dot" />

            </span>


            <span className="how-brand-copy">

              <strong>
                AttendX
              </strong>

              <small>
                Smart Attendance Infrastructure
              </small>

            </span>

          </a>



          <nav className="how-nav">

            <a href="/">
              Home
            </a>

            <a href="/about">
              About
            </a>

            <a href="/features">
              Features
            </a>

            <a
              href="/how-it-works"
              className="active"
            >
              How It Works
            </a>

            <a href="/security">
              Security
            </a>

            <a href="/contact">
              Contact
            </a>

          </nav>



          <a
            href="/contact"
            className="how-header-button"
          >

            Get Started

            <Icon
              name="arrow"
              size={14}
            />

          </a>

        </div>

      </header>



      {/* =================================================
          HERO
      ================================================= */}

      <section className="how-hero">

        <div className="how-grid" />


        <div className="how-container how-hero-layout">


          {/* COPY */}

          <div className="how-copy how-reveal">

            <span className="how-kicker">
              HOW ATTENDX WORKS
            </span>


            <h1>

              Automatic camera
              attendance.

              <span>
                QR when needed.
              </span>

            </h1>


            <p>

              AttendX keeps the normal student
              experience simple. The institute
              camera handles the primary flow.
              QR becomes the controlled backup
              when face verification does not match.

            </p>


            <div className="how-toggle">


              <button
                type="button"
                className={
                  mode === "camera"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMode("camera")
                }
              >

                <Icon
                  name="camera"
                  size={15}
                />

                Camera Flow

              </button>



              <button
                type="button"
                className={
                  mode === "qr"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMode("qr")
                }
              >

                <Icon
                  name="qr"
                  size={15}
                />

                QR Backup

              </button>

            </div>

          </div>



          {/* =================================================
              LIVE DEMO
          ================================================= */}

          <div className="how-demo how-reveal">


            <div className="how-demo-top">

              <span>
                ATTENDX WORKFLOW SIMULATION
              </span>

              <strong>
                LIVE
              </strong>

            </div>



            {/* CAMERA MODE */}

            {mode === "camera" && (

              <div className="camera-workflow">


                <div className="workflow-camera">

                  <div className="workflow-face">

                    <span className="eye one" />

                    <span className="eye two" />

                    <span className="mouth" />

                  </div>


                  <div className="workflow-face-frame" />


                  <div className="workflow-scan-line" />


                  <span className="camera-tag">
                    CAMERA ONLINE
                  </span>


                  <span className="detect-tag">

                    <Icon
                      name={
                        step >= 1
                          ? "check"
                          : "face"
                      }
                      size={11}
                    />

                    {step >= 1
                      ? "FACE MATCHED"
                      : "FACE DETECTED"}

                  </span>

                </div>



                <div className="workflow-status">

                  <div className="workflow-status-head">

                    <span>
                      PRIMARY FLOW
                    </span>

                    <strong>
                      {step + 1} / 4
                    </strong>

                  </div>


                  <div className="workflow-bar">

                    <span
                      style={{
                        width:
                          `${(step + 1) * 25}%`,
                      }}
                    />

                  </div>


                  <div className="workflow-steps">


                    <div
                      className={
                        step >= 0
                          ? "done"
                          : ""
                      }
                    >

                      <span>
                        01
                      </span>

                      <div>

                        <strong>
                          Student detected
                        </strong>

                        <small>
                          Camera sees the student
                        </small>

                      </div>

                    </div>



                    <div
                      className={
                        step >= 1
                          ? "done"
                          : ""
                      }
                    >

                      <span>
                        02
                      </span>

                      <div>

                        <strong>
                          Face matched
                        </strong>

                        <small>
                          Registered identity checked
                        </small>

                      </div>

                    </div>



                    <div
                      className={
                        step >= 2
                          ? "done"
                          : ""
                      }
                    >

                      <span>
                        03
                      </span>

                      <div>

                        <strong>
                          Verification passed
                        </strong>

                        <small>
                          Attendance conditions satisfied
                        </small>

                      </div>

                    </div>



                    <div
                      className={
                        step >= 3
                          ? "done final"
                          : ""
                      }
                    >

                      <span>
                        04
                      </span>

                      <div>

                        <strong>
                          Attendance marked
                        </strong>

                        <small>
                          Record created
                        </small>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            )}



            {/* =================================================
                QR MODE
            ================================================= */}

            {mode === "qr" && (

              <div className="qr-workflow">


                <div className="qr-session">

                  <div className="qr-session-header">

                    <div>

                      <small>
                        TEACHER / ADMIN
                      </small>

                      <strong>
                        Live Attendance QR
                      </strong>

                    </div>


                    <span>
                      ACTIVE
                    </span>

                  </div>



                  <div className="qr-code">

                    <span className="qr-box q1">
                      <i />
                    </span>

                    <span className="qr-box q2">
                      <i />
                    </span>

                    <span className="qr-box q3">
                      <i />
                    </span>


                    <b className="qr-cell c1" />

                    <b className="qr-cell c2" />

                    <b className="qr-cell c3" />

                    <b className="qr-cell c4" />

                    <b className="qr-cell c5" />

                    <b className="qr-cell c6" />

                    <b className="qr-cell c7" />

                    <b className="qr-cell c8" />


                    <span className="qr-scan" />

                  </div>



                  <div className="qr-id">

                    SESSION:

                    <strong>
                      CS-204-A7
                    </strong>

                  </div>

                </div>



                <div className="qr-student">

                  <span>
                    STUDENT LOGIN
                  </span>


                  <div className="qr-student-user">

                    <div>
                      GK
                    </div>


                    <p>

                      <strong>
                        Govind Kushwaha
                      </strong>

                      <small>
                        AX-24-0917
                      </small>

                    </p>

                  </div>



                  <div className="qr-check-list">


                    <div
                      className={
                        step >= 0
                          ? "done"
                          : ""
                      }
                    >

                      <span>
                        01
                      </span>

                      <p>

                        <strong>
                          Scan QR
                        </strong>

                        <small>
                          Student uses Scan QR
                        </small>

                      </p>

                    </div>



                    <div
                      className={
                        step >= 1
                          ? "done"
                          : ""
                      }
                    >

                      <span>
                        02
                      </span>

                      <p>

                        <strong>
                          Session matched
                        </strong>

                        <small>
                          Active attendance session
                        </small>

                      </p>

                    </div>



                    <div
                      className={
                        step >= 2
                          ? "done"
                          : ""
                      }
                    >

                      <span>
                        03
                      </span>

                      <p>

                        <strong>
                          Identity verified
                        </strong>

                        <small>
                          Student account checked
                        </small>

                      </p>

                    </div>



                    <div
                      className={
                        step >= 3
                          ? "done final"
                          : ""
                      }
                    >

                      <span>
                        04
                      </span>

                      <p>

                        <strong>
                          Attendance marked
                        </strong>

                        <small>
                          Student-specific record
                        </small>

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>

      </section>



      {/* =================================================
          COMPLETE FLOW
      ================================================= */}

      <section className="how-flow-section">

        <div className="how-container">


          <div className="how-heading how-reveal">

            <span className="how-kicker">
              COMPLETE FLOW
            </span>


            <h2>

              From attendance start
              to

              <span>
                final record.
              </span>

            </h2>

          </div>



          <div className="how-flow-grid">


            <article className="how-flow-card how-reveal">

              <span>
                01
              </span>

              <div>

                <Icon
                  name="camera"
                  size={22}
                />

              </div>

              <small>
                PRIMARY
              </small>

              <h3>
                Camera detects
              </h3>

              <p>
                Student appears in front of the
                institute camera.
              </p>

            </article>



            <article className="how-flow-card how-reveal">

              <span>
                02
              </span>

              <div>

                <Icon
                  name="face"
                  size={22}
                />

              </div>

              <small>
                VERIFICATION
              </small>

              <h3>
                Face matches
              </h3>

              <p>
                Registered student identity is
                checked through the face workflow.
              </p>

            </article>



            <article className="how-flow-card how-reveal">

              <span>
                03
              </span>

              <div>

                <Icon
                  name="qr"
                  size={22}
                />

              </div>

              <small>
                BACKUP
              </small>

              <h3>
                Scan QR if needed
              </h3>

              <p>
                Student logs in and scans the
                active teacher/admin QR.
              </p>

            </article>



            <article className="how-flow-card how-reveal">

              <span>
                04
              </span>

              <div>

                <Icon
                  name="shield"
                  size={22}
                />

              </div>

              <small>
                IDENTITY
              </small>

              <h3>
                Identity checked
              </h3>

              <p>
                Attendance remains linked to the
                correct student account.
              </p>

            </article>



            <article className="how-flow-card how-reveal">

              <span>
                05
              </span>

              <div>

                <Icon
                  name="admin"
                  size={22}
                />

              </div>

              <small>
                ADMIN
              </small>

              <h3>
                Manual option
              </h3>

              <p>
                Admin can manually record the
                student's attendance.
              </p>

            </article>



            <article className="how-flow-card how-reveal">

              <span>
                06
              </span>

              <div className="final">

                <Icon
                  name="database"
                  size={22}
                />

              </div>

              <small>
                RECORD
              </small>

              <h3>
                Attendance saved
              </h3>

              <p>
                The attendance event becomes
                available as a system record.
              </p>

            </article>

          </div>

        </div>

      </section>



      {/* =================================================
          QR EXPLANATION
      ================================================= */}

      <section className="how-qr-section">

        <div className="how-container how-qr-layout">


          <div className="how-qr-copy how-reveal">

            <span className="how-kicker">
              QR ATTENDANCE
            </span>


            <h2>

              How the QR backup

              <span>
                actually works.
              </span>

            </h2>


            <p>

              QR is not the normal attendance
              route. It is a backup mechanism
              available when the camera cannot
              verify the student's face.

            </p>


            <div className="qr-rules">


              <div>

                <b>
                  01
                </b>

                <p>
                  Teacher/Admin generates the active QR.
                </p>

              </div>


              <div>

                <b>
                  02
                </b>

                <p>
                  Student logs into the AttendX account.
                </p>

              </div>


              <div>

                <b>
                  03
                </b>

                <p>
                  Student opens Scan QR and scans the session.
                </p>

              </div>


              <div>

                <b>
                  04
                </b>

                <p>
                  System checks the session and student's identity.
                </p>

              </div>


              <div>

                <b>
                  05
                </b>

                <p>
                  Valid verification creates the attendance record.
                </p>

              </div>

            </div>

          </div>



          <div className="how-qr-panel how-reveal">


            <div className="qr-panel-top">

              <span>
                LIVE SESSION
              </span>

              <strong>
                ACTIVE
              </strong>

            </div>



            <div className="qr-panel-body">

              <div className="panel-qr">

                <span className="pqr-one">
                  <i />
                </span>

                <span className="pqr-two">
                  <i />
                </span>

                <span className="pqr-three">
                  <i />
                </span>


                <b className="pqr-dot d1" />

                <b className="pqr-dot d2" />

                <b className="pqr-dot d3" />

                <b className="pqr-dot d4" />

                <b className="pqr-dot d5" />

                <b className="pqr-dot d6" />


                <span className="pqr-line" />

              </div>



              <div className="panel-session">

                <small>
                  SESSION ID
                </small>

                <strong>
                  CS-204-A7
                </strong>

                <span>
                  Expires automatically
                </span>

              </div>

            </div>



            <div className="qr-panel-result">

              <div>

                <Icon
                  name="check"
                  size={17}
                />

              </div>


              <p>

                <strong>
                  Student Identity Verified
                </strong>

                <small>
                  Attendance ready to record
                </small>

              </p>


              <span>
                PRESENT
              </span>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="how-final">

        <div className="how-container">

          <div className="how-final-box how-reveal">

            <div>

              <span className="how-kicker">
                NEXT
              </span>


              <h2>

                Now see how AttendX
                protects every

                <span>
                  attendance event.
                </span>

              </h2>

            </div>


            <a
              href="/security"
              className="how-final-button"
            >

              Explore Security

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


export default HowItWorks;