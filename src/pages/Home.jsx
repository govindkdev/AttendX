import { useEffect, useState } from "react";
import Footer from "../components/common/Footer";
import "../style/Home.css";

/*
=========================================================
ATTENDX - HOME PAGE
=========================================================

ATTENDX REAL CONCEPT
---------------------------------------------------------
PRIMARY:
Institute/Admin Camera
        ↓
Student Camera ke saamne
        ↓
Face Detection
        ↓
Face Match
        ↓
Attendance Marked

BACKUP:
Face Match Fail
        ↓
Student Login
        ↓
Scan QR
        ↓
Teacher/Admin Generated QR
        ↓
Student Identity Validation
        ↓
Attendance Marked

MANUAL:
Admin
        ↓
Select Student
        ↓
Present / Absent / Late

IMPORTANT:
This page is currently a frontend visual/demo.
Real AI, camera, QR scanner and backend will be
connected later.
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

  switch (name) {
    case "camera":
      return (
        <svg {...props}>
          <path d="m9 6 1.4-2h3.2L15 6h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3Z" />
          <circle cx="12" cy="12.5" r="3.2" />
        </svg>
      );

    case "qr":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <path d="M14 14h3v3h-3z" />
          <path d="M19 17v3M17 19h3" />
        </svg>
      );

    case "face":
      return (
        <svg {...props}>
          <path d="M5 8V6a1 1 0 0 1 1-1h2" />
          <path d="M16 5h2a1 1 0 0 1 1 1v2" />
          <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
          <path d="M8 19H6a1 1 0 0 1-1-1v-2" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );

    case "shield":
      return (
        <svg {...props}>
          <path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "location":
      return (
        <svg {...props}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      );

    case "admin":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21a7 7 0 0 1 14 0" />
          <path d="M18 4v5M15.5 6.5h5" />
        </svg>
      );

    case "analytics":
      return (
        <svg {...props}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 3-3 3 2 5-7" />
        </svg>
      );

    case "database":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...props}>
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "menu":
      return (
        <svg {...props}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );

    case "close":
      return (
        <svg {...props}>
          <path d="m7 7 10 10" />
          <path d="M17 7 7 17" />
        </svg>
      );

    default:
      return null;
  }
}


/* =====================================================
   STUDENTS
===================================================== */

const students = [
  "Govind Kushwaha",
  "Bablu Kumar Yadav",
  "Aditya Sharma",
  "Shambhu Verma",
  "Pintu Kumar Yadav",
  "Priya Singh",
  "Anjali Gupta",
  "Neha Sharma",
  "Sneha Kumari",
  "Riya Verma",
  "Pooja Yadav",
  "Anushka Singh",
  "Rohit Kumar",
  "Aman Singh",
  "Rahul Verma",
  "Vikas Yadav",
  "Kajal Kumari",
  "Simran Patel",
];


/* =====================================================
   HOME COMPONENT
===================================================== */

function Home() {
  const [studentIndex, setStudentIndex] = useState(0);
  const [verified, setVerified] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);


  /* ===================================================
     LIVE STUDENT DEMO
  =================================================== */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVerified(false);

      window.setTimeout(() => {
        setStudentIndex(
          (value) => (value + 1) % students.length
        );

        setVerified(true);
      }, 550);
    }, 3200);

    return () => {
      window.clearInterval(timer);
    };
  }, []);


  const student = students[studentIndex];

  const initials = student
    .split(" ")
    .map((item) => item[0])
    .slice(0, 2)
    .join("");


  return (
    <div className="attendx-home">


      {/* =================================================
          FIXED HEADER
      ================================================= */}

      <header className="home-header">

        <div className="home-header-inner">


          <a
            href="/"
            className="home-brand"
            onClick={() => setMobileMenu(false)}
          >
            <img
              src="/assets/attendx-logo.png"
              alt="AttendX Logo"
              className="attendx-brand-img"
              style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 8 }}
            />

            <span className="home-brand-copy">
              <strong>AttendX</strong>
              <small>Smart Attendance Infrastructure</small>
            </span>
          </a>

          <nav
            className={`home-nav ${
              mobileMenu
                ? "open"
                : ""
            }`}
          >
            <a
              href="/"
              className="active"
              onClick={() => setMobileMenu(false)}
            >
              Home
            </a>

            <a
              href="/about"
              onClick={() => setMobileMenu(false)}
            >
              About
            </a>

            <a
              href="/features"
              onClick={() => setMobileMenu(false)}
            >
              Features
            </a>

            <a
              href="/how-it-works"
              onClick={() => setMobileMenu(false)}
            >
              How It Works
            </a>

            <a
              href="/security"
              onClick={() => setMobileMenu(false)}
            >
              Security
            </a>

            <a
              href="/contact"
              onClick={() => setMobileMenu(false)}
            >
              Contact
            </a>

            {/* Mobile Drawer Quick Portal Button */}
            <div style={{ padding: "12px 14px", marginTop: 8 }}>
              <a
                href="/login"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", textDecoration: "none", fontSize: 13 }}
              >
                Access Portals (Student / Admin) →
              </a>
            </div>
          </nav>

          <a
            href="/login"
            className="home-header-button"
          >
            Get Started
            <Icon
              name="arrow"
              size={14}
            />
          </a>


          <button
            type="button"
            className="home-mobile-button"
            onClick={() =>
              setMobileMenu((value) => !value)
            }
            aria-label="Toggle navigation"
          >

            <Icon
              name={mobileMenu ? "close" : "menu"}
              size={19}
            />

          </button>

        </div>

      </header>



      {/* =================================================
          HERO
      ================================================= */}

      <section className="home-hero">

        <div className="home-grid" />

        <div className="home-glow home-glow-one" />

        <div className="home-glow home-glow-two" />


        <div className="home-container home-hero-layout">


          {/* LEFT */}

          <div className="home-copy">

            <span className="home-kicker">
              <i />
              AI-POWERED ATTENDANCE PLATFORM
            </span>


            <h1>

              Attendance that

              <span>
                verifies first,
              </span>

              then records.

            </h1>


            <p>

              AttendX makes attendance automatic
              through an institute camera and keeps
              a controlled QR method available when
              face verification does not work.

            </p>


            <div className="home-buttons">

              <a
                href="/how-it-works"
                className="home-primary-button"
              >

                See How It Works

                <Icon
                  name="arrow"
                  size={15}
                />

              </a>


              <a
                href="/features"
                className="home-secondary-button"
              >
                Explore Features
              </a>

            </div>


            <div className="home-trust-row">

              <span>
                <Icon
                  name="camera"
                  size={13}
                />
                Camera first
              </span>

              <span>
                <Icon
                  name="qr"
                  size={13}
                />
                QR backup
              </span>

              <span>
                <Icon
                  name="shield"
                  size={13}
                />
                Identity controlled
              </span>

            </div>

          </div>



          {/* RIGHT DEMO */}

          <div className="home-demo-wrap">


            <div className="home-demo-card">


              <div className="demo-header">

                <div>

                  <span className="demo-online" />

                  <div>

                    <strong>
                      AttendX Live Verification
                    </strong>

                    <small>
                      Main Camera • Computer Science Block
                    </small>

                  </div>

                </div>


                <span className="demo-live-label">
                  LIVE
                </span>

              </div>



              {/* CAMERA */}

              <div className="demo-camera">

                <div className="demo-camera-grid" />

                <span className="camera-corner one" />
                <span className="camera-corner two" />
                <span className="camera-corner three" />
                <span className="camera-corner four" />


                <div className="camera-face">

                  <span className="camera-eye left" />
                  <span className="camera-eye right" />

                  <span className="camera-mouth" />

                </div>


                <div className="camera-face-box" />

                <div className="camera-scan" />


                <div className="camera-state">

                  <Icon
                    name={verified ? "check" : "face"}
                    size={12}
                  />

                  {verified
                    ? "FACE VERIFIED"
                    : "SCANNING FACE..."}

                </div>


                <div className="camera-online">

                  <span />

                  CAMERA ONLINE

                </div>

              </div>



              {/* STUDENT */}

              <div className="demo-student">

                <div className="student-avatar">
                  {initials}
                </div>


                <div className="student-detail">

                  <div>

                    <strong>
                      {student}
                    </strong>


                    {verified && (
                      <span className="verified">
                        <Icon
                          name="check"
                          size={9}
                        />
                        Verified
                      </span>
                    )}

                  </div>


                  <small>
                    AttendX-ID: AX-24-0917
                  </small>

                </div>


                <div className="student-presence">

                  <small>
                    RESULT
                  </small>

                  <strong>
                    {verified
                      ? "PRESENT"
                      : "CHECKING"}
                  </strong>

                </div>

              </div>



              {/* CHECKS */}

              <div className="demo-checks">

                <div className="checks-header">

                  <span>
                    Verification checks
                  </span>

                  <strong>
                    {verified ? "4 / 4" : "1 / 4"}
                  </strong>

                </div>


                <div className="checks-progress">

                  <span
                    className={
                      verified
                        ? "complete"
                        : ""
                    }
                  />

                </div>


                <div className="checks-grid">

                  <span className="done">
                    <Icon
                      name="check"
                      size={9}
                    />
                    Face
                  </span>

                  <span className={verified ? "done" : ""}>
                    <Icon
                      name="user"
                      size={9}
                    />
                    Identity
                  </span>

                  <span className={verified ? "done" : ""}>
                    <Icon
                      name="qr"
                      size={9}
                    />
                    Session
                  </span>

                  <span className={verified ? "done" : ""}>
                    <Icon
                      name="location"
                      size={9}
                    />
                    Location
                  </span>

                </div>

              </div>



              {/* FALLBACK */}

              <div className="demo-fallback">

                <div className="fallback-icon">

                  <Icon
                    name="qr"
                    size={17}
                  />

                </div>


                <div>

                  <strong>
                    Face not matched?
                  </strong>

                  <small>
                    Student can use Scan QR from login.
                  </small>

                </div>


                <span>
                  BACKUP
                </span>

              </div>

            </div>


            <div className="home-float home-float-left">

              <Icon
                name="camera"
                size={15}
              />

              <div>

                <strong>
                  Primary method
                </strong>

                <small>
                  Institute camera
                </small>

              </div>

            </div>


            <div className="home-float home-float-right">

              <Icon
                name="shield"
                size={15}
              />

              <div>

                <strong>
                  Identity protected
                </strong>

                <small>
                  Student specific
                </small>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          LONG SECTION - 01
      ================================================= */}

      <section className="home-system-section">

        <div className="home-container">


          <div className="home-section-head">

            <span className="section-kicker">
              THE ATTENDX MODEL
            </span>


            <h2>

              One attendance platform,
              <span>
                three controlled actions.
              </span>

            </h2>


            <p>

              AttendX is structured so the normal
              attendance experience remains simple,
              while the institute keeps control over
              the primary and backup methods.

            </p>

          </div>



          <div className="home-system-grid">


            <article className="system-card primary">

              <span className="card-number">
                01
              </span>

              <div className="system-icon">

                <Icon
                  name="camera"
                  size={24}
                />

              </div>

              <span className="system-label">
                PRIMARY
              </span>

              <h3>
                Camera Attendance
              </h3>

              <p>

                Student simply comes in front of
                the institute camera. Face recognition
                handles the normal attendance path.

              </p>


              <div className="system-status">

                <Icon
                  name="check"
                  size={11}
                />

                Automatic flow

              </div>

            </article>



            <article className="system-card backup">

              <span className="card-number">
                02
              </span>

              <div className="system-icon">

                <Icon
                  name="qr"
                  size={24}
                />

              </div>

              <span className="system-label">
                BACKUP
              </span>

              <h3>
                QR Attendance
              </h3>

              <p>

                If face verification does not match,
                the student logs in and scans the
                live QR generated by teacher/admin.

              </p>


              <div className="system-status">

                <Icon
                  name="shield"
                  size={11}
                />

                Controlled fallback

              </div>

            </article>



            <article className="system-card admin">

              <span className="card-number">
                03
              </span>

              <div className="system-icon">

                <Icon
                  name="admin"
                  size={24}
                />

              </div>

              <span className="system-label">
                ADMIN
              </span>

              <h3>
                Manual Attendance
              </h3>

              <p>

                Admin can select any student and
                manually record Present, Absent or
                Late attendance when required.

              </p>


              <div className="system-status">

                <Icon
                  name="check"
                  size={11}
                />

                Administrative control

              </div>

            </article>

          </div>

        </div>

      </section>



      {/* =================================================
          LONG SECTION - 02
      ================================================= */}

      <section className="home-architecture">

        <div className="home-container architecture-grid">


          <div className="architecture-copy">

            <span className="section-kicker">
              ATTENDANCE ARCHITECTURE
            </span>


            <h2>

              The system decides

              <span>
                which path to use.
              </span>

            </h2>


            <p>

              Students do not need to choose
              between multiple attendance methods
              during normal use. Camera is primary.
              QR becomes the fallback when required.

            </p>


            <div className="architecture-points">

              <div>

                <span className="architecture-number">
                  01
                </span>

                <div>

                  <strong>
                    Camera sees student
                  </strong>

                  <small>
                    Normal attendance begins automatically.
                  </small>

                </div>

              </div>


              <div>

                <span className="architecture-number">
                  02
                </span>

                <div>

                  <strong>
                    Face result is checked
                  </strong>

                  <small>
                    Registered student identity is evaluated.
                  </small>

                </div>

              </div>


              <div>

                <span className="architecture-number">
                  03
                </span>

                <div>

                  <strong>
                    QR opens as backup
                  </strong>

                  <small>
                    Student uses login → Scan QR.
                  </small>

                </div>

              </div>


              <div>

                <span className="architecture-number">
                  04
                </span>

                <div>

                  <strong>
                    Attendance is recorded
                  </strong>

                  <small>
                    Final event is attached to the student.
                  </small>

                </div>

              </div>

            </div>

          </div>



          {/* VISUAL */}

          <div className="architecture-visual">

            <div className="architecture-screen">

              <div className="screen-header">

                <span>
                  ATTENDX CONTROL
                </span>

                <span>
                  LIVE
                </span>

              </div>


              <div className="architecture-main">

                <div className="architecture-center">

                  <div className="architecture-center-icon">

                    <Icon
                      name="shield"
                      size={25}
                    />

                  </div>

                  <strong>
                    ATTENDX
                  </strong>

                  <small>
                    Attendance decision
                  </small>

                </div>


                <div className="architecture-node top">

                  <Icon
                    name="camera"
                    size={17}
                  />

                  <span>
                    CAMERA
                  </span>

                </div>


                <div className="architecture-node right">

                  <Icon
                    name="face"
                    size={17}
                  />

                  <span>
                    FACE
                  </span>

                </div>


                <div className="architecture-node bottom">

                  <Icon
                    name="qr"
                    size={17}
                  />

                  <span>
                    QR BACKUP
                  </span>

                </div>


                <div className="architecture-node left">

                  <Icon
                    name="admin"
                    size={17}
                  />

                  <span>
                    ADMIN
                  </span>

                </div>

              </div>


              <div className="architecture-footer">

                <span>
                  <Icon
                    name="check"
                    size={10}
                  />
                  Camera active
                </span>

                <span>
                  <Icon
                    name="shield"
                    size={10}
                  />
                  Identity lock
                </span>

                <span>
                  <Icon
                    name="database"
                    size={10}
                  />
                  Record ready
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          LONG SECTION - 03
      ================================================= */}

      <section className="home-roles">

        <div className="home-container">


          <div className="home-section-head">

            <span className="section-kicker">
              ROLE BASED EXPERIENCE
            </span>


            <h2>

              Different users.
              One

              <span>
                connected system.
              </span>

            </h2>

          </div>



          <div className="role-grid">


            <article className="role-card">

              <div className="role-icon">
                <Icon
                  name="user"
                  size={23}
                />
              </div>

              <span>
                STUDENT
              </span>

              <h3>
                Simple attendance
              </h3>

              <p>
                Mobile-first portal for students. Allows scanning authorized lecture QR codes, viewing personal attendance percentages, and reviewing lecture history.
              </p>
              <a href="/login?role=student" className="home-secondary-button" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 16px" }}>
                <span>Launch Student Portal</span>
                <span>→</span>
              </a>
            </article>

            <article className="role-card">
              <div className="role-icon">
                <Icon name="camera" size={23} />
              </div>
              <span>TEACHER</span>
              <h3>Faculty Session Console</h3>
              <p>
                Faculty portal for generating unique cryptographic QR codes for every lecture, tracking live verified attendees in real-time, and managing class rosters.
              </p>
              <a href="/login?role=teacher" className="home-secondary-button" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 16px" }}>
                <span>Launch Faculty Station</span>
                <span>→</span>
              </a>
            </article>

            <article className="role-card">
              <div className="role-icon">
                <Icon name="admin" size={23} />
              </div>
              <span>ADMIN</span>
              <h3>Central Authority Console</h3>
              <p>
                Admin authority dashboard for 25-sample biometric face enrollment, camera Face AI kiosk sessions, anti-proxy audit ledger, and master analytics.
              </p>
              <a href="/login?role=admin" className="home-secondary-button" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 16px" }}>
                <span>Launch Admin Console</span>
                <span>→</span>
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* =================================================
          FINAL CTA
      ================================================= */}
      <section className="home-final">
        <div className="home-container">
          <div className="home-final-box">
            <div>
              <span className="section-kicker">ENTERPRISE DEPLOYMENT</span>
              <h2>
                Attendance that is effortless to use and resilient against
                <span> proxy fraud.</span>
              </h2>
            </div>
            <a href="/login" className="home-final-button">
              Sign In to AttendX
              <Icon name="arrow" size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* Institutional Production Footer */}
      <Footer />
    </div>
  );
}

export default Home;