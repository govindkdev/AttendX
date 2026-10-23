import { useEffect } from "react";
import "../style/About.css";

/*
=========================================================
ATTENDX - ABOUT PAGE
=========================================================

IMPORTANT:
1. Camera = Primary attendance method
2. QR = Backup attendance method
3. Admin = Manual attendance control
4. Orbit cards actually rotate around AttendX
5. This page is frontend/demo only
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
  Yahan default: mat likhna.
  Hum switch nahi, if conditions use kar rahe hain.
  */

  return null;
}


/* =====================================================
   ABOUT COMPONENT
===================================================== */

function About() {


  /* ===================================================
     SCROLL REVEAL
  =================================================== */

  useEffect(() => {

    const elements =
      document.querySelectorAll(
        ".about-reveal"
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
                  "about-visible"
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


    return () => {

      observer.disconnect();

    };

  }, []);


  return (

    <div className="attendx-about">


      {/* =================================================
          FIXED HEADER
      ================================================= */}

      <header className="about-header">

        <div className="about-header-inner">


          {/* BRAND */}

          <a
            href="/"
            className="about-brand"
          >

            <span className="about-logo">

              <span className="about-logo-one" />

              <span className="about-logo-two" />

              <span className="about-logo-dot" />

            </span>


            <span className="about-brand-copy">

              <strong>
                AttendX
              </strong>

              <small>
                Smart Attendance Infrastructure
              </small>

            </span>

          </a>



          {/* NAVIGATION */}

          <nav className="about-nav">

            <a href="/">
              Home
            </a>

            <a
              href="/about"
              className="active"
            >
              About
            </a>

            <a href="/features">
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



          {/* CTA */}

          <a
            href="/features"
            className="about-header-button"
          >

            Explore Features

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

      <section className="about-hero">

        <div className="about-grid" />


        <div className="about-container about-hero-layout">


          {/* LEFT */}

          <div className="about-copy about-reveal">

            <span className="about-kicker">
              ABOUT ATTENDX
            </span>


            <h1>

              Attendance should feel

              <span>
                automatic first
              </span>

              and controlled when needed.

            </h1>


            <p>

              AttendX is designed around a
              primary camera workflow with a
              secure QR backup and an admin
              manual control path.

            </p>


            <div className="about-pills">

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

                QR fallback

              </span>


              <span>

                <Icon
                  name="admin"
                  size={13}
                />

                Admin control

              </span>

            </div>

          </div>



          {/* =================================================
              MOVING ORBIT
          ================================================= */}

          <div className="about-orbit about-reveal">


            <div className="orbit-ring ring-large" />

            <div className="orbit-ring ring-small" />



            {/* IMPORTANT:
                This track rotates continuously.
            */}

            <div className="orbit-track">


              <div className="orbit-card orbit-top">

                <Icon
                  name="camera"
                  size={17}
                />

                <strong>
                  Camera
                </strong>

                <small>
                  Primary
                </small>

              </div>



              <div className="orbit-card orbit-right">

                <Icon
                  name="qr"
                  size={17}
                />

                <strong>
                  QR Backup
                </strong>

                <small>
                  Fallback
                </small>

              </div>



              <div className="orbit-card orbit-bottom">

                <Icon
                  name="admin"
                  size={17}
                />

                <strong>
                  Admin
                </strong>

                <small>
                  Manual
                </small>

              </div>



              <div className="orbit-card orbit-left">

                <Icon
                  name="user"
                  size={17}
                />

                <strong>
                  Identity
                </strong>

                <small>
                  Student
                </small>

              </div>

            </div>



            {/* CENTER */}

            <div className="orbit-center">

              <div className="orbit-center-icon">

                <Icon
                  name="shield"
                  size={27}
                />

              </div>


              <strong>
                AttendX
              </strong>


              <small>
                Attendance Control
              </small>


              <span>
                SYSTEM READY
              </span>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          CORE IDEA
      ================================================= */}

      <section className="about-core">

        <div className="about-container">


          <div className="about-heading about-reveal">

            <span className="about-kicker">
              CORE IDEA
            </span>


            <h2>

              Three ways to control
              the attendance

              <span>
                event.
              </span>

            </h2>

          </div>



          <div className="about-cards">


            <article className="about-card about-reveal">

              <div className="about-card-icon">

                <Icon
                  name="camera"
                  size={23}
                />

              </div>


              <span>
                PRIMARY
              </span>


              <h3>
                Automatic Camera
              </h3>


              <p>

                The student appears before
                the institute camera and the
                face-based attendance process
                begins automatically.

              </p>

            </article>



            <article className="about-card about-reveal">

              <div className="about-card-icon">

                <Icon
                  name="qr"
                  size={23}
                />

              </div>


              <span>
                BACKUP
              </span>


              <h3>
                Student QR
              </h3>


              <p>

                When face verification does
                not match, the logged-in student
                can use Scan QR to join the
                active attendance session.

              </p>

            </article>



            <article className="about-card about-reveal">

              <div className="about-card-icon">

                <Icon
                  name="admin"
                  size={23}
                />

              </div>


              <span>
                CONTROL
              </span>


              <h3>
                Admin Manual
              </h3>


              <p>

                Admin can select the required
                student and record Present,
                Absent or Late manually.

              </p>

            </article>

          </div>

        </div>

      </section>



      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="about-final">

        <div className="about-container">

          <div className="about-final-box about-reveal">

            <div>

              <span className="about-kicker">
                NEXT
              </span>


              <h2>

                See the complete AttendX
                attendance

                <span>
                  workflow.
                </span>

              </h2>

            </div>


            <a
              href="/how-it-works"
              className="about-final-button"
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


export default About;