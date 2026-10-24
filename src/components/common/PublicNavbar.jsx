/*
=========================================================
ATTENDX - REUSABLE PUBLIC NAVBAR
=========================================================
Professional, responsive top navigation bar for public pages:
- Active route detection
- Clean institutional branding
- Mobile hamburger drawer
- Quick Portal sign-in CTA
=========================================================
*/

import React, { useState } from "react";

export default function PublicNavbar({ currentPath = "/" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/security", label: "Security & Anti-Proxy" },
    { href: "/contact", label: "Contact" }
  ];

  return (
    <header className="home-header">
      <div className="home-header-inner">
        {/* Brand Logo */}
        <a href="/" className="home-brand" onClick={() => setMobileMenuOpen(false)}>
          <img
            src="/assets/attendx-logo.png"
            alt="AttendX AI Logo"
            className="attendx-brand-img"
            style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 8 }}
          />
          <span className="home-brand-copy">
            <strong>AttendX</strong>
            <small>Smart Attendance Infrastructure</small>
          </span>
        </a>

        {/* Desktop & Mobile Navigation Links */}
        <nav className={`home-nav ${mobileMenuOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={currentPath === link.href ? "active" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}

          {/* Mobile only portal button inside drawer */}
          <div className="mobile-drawer-cta" style={{ display: mobileMenuOpen ? "block" : "none", marginTop: 12 }}>
            <a
              href="/login"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
            >
              Access Portals (Student / Admin) →
            </a>
          </div>
        </nav>

        {/* Right CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <a
            href="/login"
            className="home-header-button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span>Get Started</span>
            <span style={{ fontSize: 13 }}>→</span>
          </a>

          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            className="home-mobile-button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}
