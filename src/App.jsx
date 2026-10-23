/*
=========================================================
ATTENDX - APP ROUTING
=========================================================

PUBLIC PAGES
------------
/                       -> Home
/about                  -> About
/features               -> Features
/how-it-works           -> How It Works
/security               -> Security
/contact                -> Contact


AUTHENTICATION PAGES
--------------------
/login                  -> Login
/forgot-password        -> Forgot Password
/create-account         -> Create Account
/register               -> Create Account (Backup)
/verify-account         -> Account Verification


DASHBOARDS
----------
/student-dashboard      -> Student Dashboard
/teacher-dashboard      -> Teacher Dashboard
/admin-dashboard        -> Admin Dashboard

=========================================================
*/

import { useEffect, useState } from "react";


/* =====================================================
   PUBLIC PAGES
===================================================== */

import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Security from "./pages/Security";
import Contact from "./pages/Contact";


/* =====================================================
   AUTHENTICATION PAGES
===================================================== */

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CreateAccount from "./pages/CreateAccount";
import VerifyAccount from "./pages/VerifyAccount";


/* =====================================================
   DASHBOARD PAGES
===================================================== */

import StudentDashboard from "./student/StudentDashboard";
import TeacherDashboard from "./teacher/TeacherDashboard";
import AdminDashboard from "./admin/AdminDashboard";


/* =====================================================
   GLOBAL APP CSS
===================================================== */

import "./App.css";


/*
=========================================================
APP COMPONENT
=========================================================
*/

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    const handleClick = (event) => {
      const link = event.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const linkText = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();
      if (linkText === "get started") {
        event.preventDefault();
        event.stopPropagation();
        window.history.pushState({}, "", "/login");
        setCurrentPath("/login");
        window.scrollTo(0, 0);
        return;
      }

      // Handle internal routes
      if (href.startsWith("/")) {
        event.preventDefault();
        window.history.pushState({}, "", href);
        setCurrentPath(window.location.pathname);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);


  /*
  =======================================================
  AUTHENTICATION ROUTES
  =======================================================
  */


  /*
  -------------------------------------------------------
  LOGIN
  -------------------------------------------------------
  */

  if (currentPath === "/login") {

    return <Login />;

  }


  /*
  -------------------------------------------------------
  FORGOT PASSWORD
  -------------------------------------------------------
  */

  if (currentPath === "/forgot-password") {

    return <ForgotPassword />;

  }


  /*
  -------------------------------------------------------
  CREATE ACCOUNT
  -------------------------------------------------------
  */

  if (currentPath === "/create-account") {

    return <CreateAccount />;

  }


  /*
  -------------------------------------------------------
  REGISTER BACKUP ROUTE
  -------------------------------------------------------
  */

  if (currentPath === "/register") {

    return <CreateAccount />;

  }


  /*
  -------------------------------------------------------
  VERIFY ACCOUNT
  -------------------------------------------------------
  */

  if (currentPath === "/verify-account") {

    return <VerifyAccount />;

  }


  /*
  =======================================================
  DASHBOARD ROUTES
  =======================================================
  */


  /*
  -------------------------------------------------------
  STUDENT DASHBOARD
  -------------------------------------------------------

  IMPORTANT:
  Yahan placeholder nahi hai.

  Actual StudentDashboard component render hoga.
  -------------------------------------------------------
  */

  if (currentPath === "/student-dashboard") {

    return <StudentDashboard />;

  }


  /*
  -------------------------------------------------------
  TEACHER DASHBOARD
  -------------------------------------------------------
  */

  if (currentPath === "/teacher-dashboard") {
    return <TeacherDashboard />;
  }


  /*
  -------------------------------------------------------
  ADMIN DASHBOARD
  -------------------------------------------------------
  */

  if (currentPath === "/admin-dashboard") {
    return <AdminDashboard />;
  }


  /*
  =======================================================
  PUBLIC ROUTES
  =======================================================
  */


  /*
  -------------------------------------------------------
  HOME
  -------------------------------------------------------
  */

  if (currentPath === "/") {

    return <Home />;

  }


  /*
  -------------------------------------------------------
  ABOUT
  -------------------------------------------------------
  */

  if (currentPath === "/about") {

    return <About />;

  }


  /*
  -------------------------------------------------------
  FEATURES
  -------------------------------------------------------
  */

  if (currentPath === "/features") {

    return <Features />;

  }


  /*
  -------------------------------------------------------
  HOW IT WORKS
  -------------------------------------------------------
  */

  if (currentPath === "/how-it-works") {

    return <HowItWorks />;

  }


  /*
  -------------------------------------------------------
  SECURITY
  -------------------------------------------------------
  */

  if (currentPath === "/security") {

    return <Security />;

  }


  /*
  -------------------------------------------------------
  CONTACT
  -------------------------------------------------------
  */

  if (currentPath === "/contact") {

    return <Contact />;

  }


  /*
  =======================================================
  DEFAULT ROUTE
  =======================================================

  Unknown URL hone par Home page open hoga.
  =======================================================
  */

  return <Home />;

}


/*
=========================================================
EXPORT APP
=========================================================
*/

export default App;