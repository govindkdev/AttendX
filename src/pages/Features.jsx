import { useEffect } from "react";
import "../style/Features.css";

/*
=========================================================
ATTENDX - FEATURES
=========================================================

IMPORTANT:
1. Camera is primary.
2. QR is backup.
3. Teacher/Admin can generate QR.
4. Student identity remains controlled.
5. Admin can manually mark attendance.
=========================================================
*/


const features = [

  {
    number: "01",
    icon: "camera",
    label: "PRIMARY",
    title: "Camera Attendance",
    text:
      "Institute camera automatically detects and verifies the student during the normal attendance flow.",
    points: [
      "Live Camera",
      "Face Detection",
      "Face Match",
      "Automatic Record",
    ],
  },


  {
    number: "02",
    icon: "qr",
    label: "BACKUP",
    title: "QR Attendance",
    text:
      "Student login contains Scan QR so attendance can continue when camera face matching is unavailable.",
    points: [
      "Student Login",
      "Scan QR",
      "Session Match",
      "Identity Check",
    ],
  },


  {
    number: "03",
    icon: "generate",
    label: "SESSION",
    title: "QR Generation",
    text:
      "Teacher and admin can generate the active attendance QR for the current session.",
    points: [
      "Generate QR",
      "Live Session",
      "Expiry",
      "Session Control",
    ],
  },


  {
    number: "04",
    icon: "identity",
    label: "IDENTITY",
    title: "Student Identity",
    text:
      "Attendance remains connected with the student's registered AttendX account and identity.",
    points: [
      "AttendX-ID",
      "Account Match",
      "Controlled Access",
      "Student Specific",
    ],
  },


  {
    number: "05",
    icon: "admin",
    label: "ADMIN",
    title: "Manual Attendance",
    text:
      "Admin can directly select a student and record Present, Absent or Late attendance.",
    points: [
      "Select Student",
      "Present",
      "Absent",
      "Late",
    ],
  },


  {
    number: "06",
    icon: "history",
    label: "RECORDS",
    title: "Attendance History",
    text:
      "Attendance events can be available for date-wise, subject-wise and student-wise review.",
    points: [
      "Daily",
      "Subject",
      "Student",
      "Logs",
    ],
  },


  {
    number: "07",
    icon: "analytics",
    label: "DATA",
    title: "Analytics & Reports",
    text:
      "The dashboard can convert attendance records into useful statistics and reports.",
    points: [
      "Attendance %",
      "Analytics",
      "Reports",
      "Export",
    ],
  },


  {
    number: "08",
    icon: "notification",
    label: "ALERTS",
    title: "Notifications",
    text:
      "Attendance events can later be connected to student and parent alerts.",
    points: [
      "Email",
      "SMS",
      "Push",
      "Parent Alert",
    ],
  },

];


/* =====================================================
   ICON
===================================================== */

function Icon({ name, size = 21 }) {

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


  if (name === "generate") {

    return (
      <svg {...props}>

        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="2"
        />

        <path d="M12 8v8" />

        <path d="M8 12h8" />

      </svg>
    );

  }


  if (name === "identity") {

    return (
      <svg {...props}>

        <rect
          x="3.5"
          y="5"
          width="17"
          height="14"
          rx="2"
        />

        <circle
          cx="8"
          cy="11"
          r="2"
        />

        <path d="M12.5 10h4.5" />

        <path d="M12.5 14h3" />

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


  if (name === "history") {

    return (
      <svg {...props}>

        <circle
          cx="12"
          cy="12"
          r="8.5"
        />

        <path d="M12 7v5l3 2" />

        <path d="M4 5v4h4" />

      </svg>
    );

  }


  if (name === "analytics") {

    return (
      <svg {...props}>

        <path d="M4 19V5" />

        <path d="M4 19h16" />

        <path d="m7 15 3-3 3 2 5-7" />

      </svg>
    );

  }


  if (name === "notification") {

    return (
      <svg {...props}>

        <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8Z" />

        <path d="M10 21h4" />

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
  default: remove kiya gaya hai.
  */

  return null;
}


/* =====================================================
   FEATURES COMPONENT
===================================================== */

function Features() {


  useEffect(() => {

    const elements =
      document.querySelectorAll(
        ".feature-reveal"
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
                  "feature-visible"
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


  return (

    <div className="attendx-features">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="features-header">

        <div className="features-header-inner">


          <a
            href="/"
            className="features-brand"
          >

            <span className="features-logo">

              <span className="features-logo-one" />

              <span className="features-logo-two" />

              <span className="features-logo-dot" />

            </span>


            <span className="features-brand-copy">

              <strong>
                AttendX
              </strong>

              <small>
                Smart Attendance Infrastructure
              </small>

            </span>

          </a>



          <nav className="features-nav">

            <a href="/">
              Home
            </a>

            <a href="/about">
              About
            </a>

            <a
              href="/features"
              className="active"
            >
              Features
            </a>

            <a href="/how-it-works">
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
            className="features-header-button"
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

      <section className="features-hero">

        <div className="features-grid" />


        <div className="features-container features-hero-layout">


          <div className="features-copy feature-reveal">

            <span className="features-kicker">
              ATTENDX FEATURES
            </span>


            <h1>

              Everything around
              the attendance

              <span>
                moment.
              </span>

            </h1>


            <p>

              From the institute camera to
              student QR backup and admin
              control, AttendX keeps every
              important attendance action
              connected.

            </p>


            <div className="features-mini-list">

              <span>
                Camera First
              </span>

              <span>
                QR Backup
              </span>

              <span>
                Admin Control
              </span>

            </div>

          </div>



          <div className="features-visual feature-reveal">

            <div className="feature-visual-top">

              <span>
                ATTENDX FEATURE SYSTEM
              </span>

              <span>
                ONLINE
              </span>

            </div>


            <div className="feature-system">


              <div className="feature-system-line line-top" />

              <div className="feature-system-line line-right" />

              <div className="feature-system-line line-bottom" />

              <div className="feature-system-line line-left" />


              <div className="feature-system-center">

                <Icon
                  name="shield"
                  size={27}
                />

                <strong>
                  AttendX
                </strong>

                <small>
                  Connected System
                </small>

              </div>


              <div className="feature-system-node fs-top">

                <Icon
                  name="camera"
                  size={17}
                />

                <span>
                  CAMERA
                </span>

              </div>


              <div className="feature-system-node fs-right">

                <Icon
                  name="qr"
                  size={17}
                />

                <span>
                  QR
                </span>

              </div>


              <div className="feature-system-node fs-bottom">

                <Icon
                  name="analytics"
                  size={17}
                />

                <span>
                  DATA
                </span>

              </div>


              <div className="feature-system-node fs-left">

                <Icon
                  name="admin"
                  size={17}
                />

                <span>
                  ADMIN
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          FEATURES GRID
      ================================================= */}

      <section className="feature-main">

        <div className="features-container">


          <div className="feature-heading feature-reveal">

            <span className="features-kicker">
              CORE MODULES
            </span>


            <h2>

              Built around the actual

              <span>
                AttendX workflow.
              </span>

            </h2>

          </div>



          <div className="feature-grid">

            {features.map(
              (feature) => (

                <article
                  key={feature.number}
                  className="feature-card feature-reveal"
                >


                  <span className="feature-number">
                    {feature.number}
                  </span>


                  <span className="feature-label">
                    {feature.label}
                  </span>


                  <div className="feature-icon">

                    <Icon
                      name={feature.icon}
                      size={23}
                    />

                  </div>


                  <h3>
                    {feature.title}
                  </h3>


                  <p>
                    {feature.text}
                  </p>


                  <div className="feature-points">

                    {feature.points.map(
                      (point) => (

                        <span key={point}>

                          <Icon
                            name="check"
                            size={9}
                          />

                          {point}

                        </span>

                      )
                    )}

                  </div>

                </article>

              )
            )}

          </div>

        </div>

      </section>



      {/* =================================================
          FINAL
      ================================================= */}

      <section className="features-final">

        <div className="features-container">

          <div className="features-final-box feature-reveal">

            <div>

              <span className="features-kicker">
                NEXT
              </span>


              <h2>

                See exactly how the
                attendance flow

                <span>
                  works.
                </span>

              </h2>

            </div>


            <a
              href="/how-it-works"
              className="features-final-button"
            >

              How It Works

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


export default Features;