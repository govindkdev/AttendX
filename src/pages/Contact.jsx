import { useEffect, useState } from "react";
import Footer from "../components/common/Footer";
import "../style/Contact.css";

/*
=========================================================
ATTENDX - CONTACT PAGE
=========================================================

IMPORTANT:
1. Contact page is for institute/demo enquiries.
2. Temporary contact details are used for now.
3. Form validation is frontend only.
4. Backend/email integration can be added later.
5. Header remains fixed.
6. Page is responsive for desktop/tablet/mobile.
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


  if (name === "mail") {

    return (
      <svg {...props}>

        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="m4 7 8 6 8-6" />

      </svg>
    );

  }


  if (name === "phone") {

    return (
      <svg {...props}>

        <path d="M6.5 3.5h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2 4 1.5v3c0 .8-.7 1.5-1.5 1.5C10.5 19 5 13.5 5 6.5 5 5.7 5.7 5 6.5 5Z" />

      </svg>
    );

  }


  if (name === "building") {

    return (
      <svg {...props}>

        <path d="M4 21V5l8-3 8 3v16" />

        <path d="M8 9h2M14 9h2M8 13h2M14 13h2M8 17h2M14 17h2" />

        <path d="M10 21v-3h4v3" />

      </svg>
    );

  }


  if (name === "clock") {

    return (
      <svg {...props}>

        <circle
          cx="12"
          cy="12"
          r="8.5"
        />

        <path d="M12 7v5l3 2" />

      </svg>
    );

  }


  if (name === "send") {

    return (
      <svg {...props}>

        <path d="m21 3-7.5 18-3.5-7-7-3.5L21 3Z" />

        <path d="M10 14 21 3" />

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


  if (name === "location") {

    return (
      <svg {...props}>

        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

        <circle
          cx="12"
          cy="10"
          r="2.5"
        />

      </svg>
    );

  }


  return null;
}


/* =====================================================
   CONTACT COMPONENT
===================================================== */

function Contact() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    institute: "",
    phone: "",
    role: "Institute / Admin",
    message: "",
  });


  const [submitted, setSubmitted] =
    useState(false);


  /* ===================================================
     SCROLL REVEAL
  =================================================== */

  useEffect(() => {

    const elements =
      document.querySelectorAll(
        ".contact-reveal"
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
                  "contact-visible"
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


  /* ===================================================
     HANDLE INPUT
  =================================================== */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));


    if (submitted) {
      setSubmitted(false);
    }

  };


  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit = (event) => {

    event.preventDefault();


    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim()
    ) {

      return;
    }


    setSubmitted(true);

  };


  return (

    <div className="attendx-contact">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="contact-header">

        <div className="contact-header-inner">


          {/* BRAND */}

          <a
            href="/"
            className="contact-brand"
          >

            <span className="contact-logo">

              <span className="contact-logo-one" />

              <span className="contact-logo-two" />

              <span className="contact-logo-dot" />

            </span>


            <span className="contact-brand-copy">

              <strong>
                AttendX
              </strong>

              <small>
                Smart Attendance Infrastructure
              </small>

            </span>

          </a>



          {/* NAVIGATION */}

          <nav className="contact-nav">

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

            <a href="/security">
              Security
            </a>

            <a
              href="/contact"
              className="active"
            >
              Contact
            </a>

          </nav>



          {/* HEADER CTA */}

          <a
            href="#contact-form"
            className="contact-header-button"
          >

            Contact Us

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

      <section className="contact-hero">

        <div className="contact-grid" />

        <div className="contact-glow contact-glow-one" />

        <div className="contact-glow contact-glow-two" />


        <div className="contact-container contact-hero-layout">


          {/* LEFT COPY */}

          <div className="contact-copy contact-reveal">

            <span className="contact-kicker">
              CONTACT ATTENDX
            </span>


            <h1>

              Let's build a
              better attendance

              <span>
                workflow together.
              </span>

            </h1>


            <p>

              Have a question about AttendX,
              want to discuss the institute setup,
              or want to explore a demo?
              Send us a message and we'll
              understand your requirement.

            </p>


            <div className="contact-trust-row">

              <span>

                <Icon
                  name="building"
                  size={13}
                />

                Institute Setup

              </span>


              <span>

                <Icon
                  name="camera"
                  size={13}
                />

                Camera Attendance

              </span>


              <span>

                <Icon
                  name="qr"
                  size={13}
                />

                QR Backup

              </span>

            </div>

          </div>



          {/* HERO STATUS */}

          <div className="contact-status-card contact-reveal">

            <div className="contact-status-top">

              <div>

                <span className="status-dot" />

                ATTENDX SUPPORT

              </div>


              <span>
                ONLINE
              </span>

            </div>


            <div className="contact-status-main">

              <div className="status-icon">

                <Icon
                  name="shield"
                  size={25}
                />

              </div>


              <div>

                <small>
                  WHAT WE CAN HELP WITH
                </small>

                <strong>
                  Attendance System Planning
                </strong>

              </div>

            </div>


            <div className="status-lines">

              <span>

                <Icon
                  name="check"
                  size={10}
                />

                Camera attendance workflow

              </span>


              <span>

                <Icon
                  name="check"
                  size={10}
                />

                Student QR backup flow

              </span>


              <span>

                <Icon
                  name="check"
                  size={10}
                />

                Admin dashboard planning

              </span>


              <span>

                <Icon
                  name="check"
                  size={10}
                />

                Security & identity flow

              </span>

            </div>


            <div className="status-response">

              <Icon
                name="clock"
                size={14}
              />

              <div>

                <strong>
                  Demo / Project Enquiry
                </strong>

                <small>
                  Response details can be connected later.
                </small>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          CONTACT CHANNELS
      ================================================= */}

      <section className="contact-channels">

        <div className="contact-container">


          <div className="contact-section-heading contact-reveal">

            <span className="contact-kicker">
              CONTACT CHANNELS
            </span>


            <h2>

              Choose the easiest way
              to reach

              <span>
                AttendX.
              </span>

            </h2>

          </div>



          <div className="contact-channel-grid">


            {/* EMAIL */}

            <a
              href="mailto:hello@attendx.tech"
              className="contact-channel-card contact-reveal"
            >

              <div className="channel-icon">

                <Icon
                  name="mail"
                  size={22}
                />

              </div>


              <span>
                EMAIL
              </span>


              <h3>
                hello@attendx.tech
              </h3>


              <p>
                General enquiries and project discussions.
              </p>


              <strong className="channel-link">
                Send Email
                <Icon
                  name="arrow"
                  size={12}
                />
              </strong>

            </a>



            {/* PHONE */}

            <a
              href="tel:+919999999999"
              className="contact-channel-card contact-reveal"
            >

              <div className="channel-icon">

                <Icon
                  name="phone"
                  size={22}
                />

              </div>


              <span>
                PHONE
              </span>


              <h3>
                +91 99999 99999
              </h3>


              <p>
                Temporary contact number for project demo.
              </p>


              <strong className="channel-link">
                Call Us
                <Icon
                  name="arrow"
                  size={12}
                />
              </strong>

            </a>



            {/* INSTITUTE */}

            <div className="contact-channel-card contact-reveal">

              <div className="channel-icon">

                <Icon
                  name="building"
                  size={22}
                />

              </div>


              <span>
                INSTITUTE
              </span>


              <h3>
                Demo & Setup Discussion
              </h3>


              <p>
                Discuss institute requirements,
                attendance flow and deployment planning.
              </p>


              <strong className="channel-link">

                Discuss Setup

                <Icon
                  name="arrow"
                  size={12}
                />

              </strong>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          FORM SECTION
      ================================================= */}

      <section
        className="contact-form-section"
        id="contact-form"
      >

        <div className="contact-container contact-form-layout">


          {/* FORM COPY */}

          <div className="contact-form-copy contact-reveal">

            <span className="contact-kicker">
              SEND AN ENQUIRY
            </span>


            <h2>

              Tell us what you are
              trying to

              <span>
                solve.
              </span>

            </h2>


            <p>

              Share a few details about your
              institute or project. The form is
              currently frontend-only and can be
              connected to your backend or email
              service later.

            </p>


            <div className="form-side-points">


              <div>

                <span>
                  01
                </span>

                <div>

                  <strong>
                    Institute requirement
                  </strong>

                  <small>
                    Tell us your attendance setup.
                  </small>

                </div>

              </div>


              <div>

                <span>
                  02
                </span>

                <div>

                  <strong>
                    Current challenge
                  </strong>

                  <small>
                    Explain what you want AttendX to solve.
                  </small>

                </div>

              </div>


              <div>

                <span>
                  03
                </span>

                <div>

                  <strong>
                    Demo requirement
                  </strong>

                  <small>
                    Mention camera, QR or admin requirements.
                  </small>

                </div>

              </div>

            </div>

          </div>



          {/* FORM */}

          <div className="contact-form-card contact-reveal">


            {submitted ? (

              <div className="contact-success">

                <div className="success-icon">

                  <Icon
                    name="check"
                    size={24}
                  />

                </div>


                <span>
                  MESSAGE READY
                </span>


                <h3>
                  Thanks for contacting AttendX.
                </h3>


                <p>

                  Your frontend form validation
                  was successful. Backend submission
                  can be connected next.

                </p>


                <button
                  type="button"
                  onClick={() =>
                    setSubmitted(false)
                  }
                  className="success-button"
                >

                  Send Another Message

                </button>

              </div>

            ) : (

              <form
                onSubmit={handleSubmit}
              >


                {/* NAME */}

                <div className="form-row">

                  <div className="form-field">

                    <label htmlFor="name">
                      Your Name
                    </label>


                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                    />

                  </div>


                  <div className="form-field">

                    <label htmlFor="email">
                      Email Address
                    </label>


                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                    />

                  </div>

                </div>



                {/* INSTITUTE */}

                <div className="form-row">

                  <div className="form-field">

                    <label htmlFor="institute">
                      Institute / Organization
                    </label>


                    <input
                      id="institute"
                      name="institute"
                      type="text"
                      value={form.institute}
                      onChange={handleChange}
                      placeholder="Institute name"
                    />

                  </div>


                  <div className="form-field">

                    <label htmlFor="phone">
                      Phone Number
                    </label>


                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91"
                    />

                  </div>

                </div>



                {/* ROLE */}

                <div className="form-field">

                  <label htmlFor="role">
                    You Are
                  </label>


                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >

                    <option>
                      Institute / Admin
                    </option>

                    <option>
                      Teacher
                    </option>

                    <option>
                      Student
                    </option>

                    <option>
                      Project / Demo Enquiry
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                </div>



                {/* MESSAGE */}

                <div className="form-field">

                  <label htmlFor="message">
                    Message
                  </label>


                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your requirement..."
                    required
                  />

                </div>



                {/* SUBMIT */}

                <button
                  type="submit"
                  className="contact-submit"
                >

                  Send Enquiry

                  <Icon
                    name="send"
                    size={15}
                  />

                </button>


                <small className="form-note">

                  Frontend demo form • Backend integration
                  can be added later.

                </small>

              </form>

            )}

          </div>

        </div>

      </section>



      {/* =================================================
          FAQ / QUICK HELP
      ================================================= */}

      <section className="contact-help">

        <div className="contact-container">


          <div className="contact-help-heading contact-reveal">

            <span className="contact-kicker">
              QUICK HELP
            </span>


            <h2>

              Before contacting us,
              here are the

              <span>
                basics.
              </span>

            </h2>

          </div>



          <div className="help-grid">


            <article className="help-card contact-reveal">

              <span>
                01
              </span>

              <div>
                <Icon
                  name="camera"
                  size={20}
                />
              </div>

              <h3>
                Is camera attendance primary?
              </h3>

              <p>

                Yes. The AttendX concept uses
                the institute camera as the primary
                attendance path.

              </p>

            </article>



            <article className="help-card contact-reveal">

              <span>
                02
              </span>

              <div>
                <Icon
                  name="qr"
                  size={20}
                />
              </div>

              <h3>
                When is QR used?
              </h3>

              <p>

                QR is the backup route when the
                student's face cannot be matched
                by the camera flow.

              </p>

            </article>



            <article className="help-card contact-reveal">

              <span>
                03
              </span>

              <div>
                <Icon
                  name="shield"
                  size={20}
                />
              </div>

              <h3>
                Can admin mark manually?
              </h3>

              <p>

                Yes. Admin can manually select
                a student and update attendance
                when required.

              </p>

            </article>



            <article className="help-card contact-reveal">

              <span>
                04
              </span>

              <div>
                <Icon
                  name="building"
                  size={20}
                />
              </div>

              <h3>
                Is this form connected to backend?
              </h3>

              <p>

                Not yet. This version is frontend-only.
                Backend submission can be integrated
                after the public pages are completed.

              </p>

            </article>

          </div>

        </div>

      </section>



      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="contact-final">

        <div className="contact-container">

          <div className="contact-final-box contact-reveal">

            <div>

              <span className="contact-kicker">
                ATTENDX
              </span>


              <h2>

                Ready to turn attendance into
                a more controlled

                <span>
                  workflow?
                </span>

              </h2>

            </div>


            <a
              href="#contact-form"
              className="contact-final-button"
            >
              Start a Conversation
              <Icon
                name="arrow"
                size={15}
              />
            </a>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}

export default Contact;