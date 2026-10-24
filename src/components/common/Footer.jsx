/*
=========================================================
ATTENDX - INSTITUTIONAL PUBLIC FOOTER
=========================================================
Authentic, production-grade footer for college software platform:
- Architecture & security overview
- System health status pill
- Quick links to all roles (Admin, Faculty, Student)
- DPDP / FERPA compliance notes
=========================================================
*/

import React from "react";

export default function Footer() {
  return (
    <footer style={{
      background: "#080D1D",
      color: "#94A3B8",
      borderTop: "1px solid rgba(226, 232, 240, 0.1)",
      padding: "64px 20px 36px",
      fontSize: 14,
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 36,
        marginBottom: 48
      }}>
        {/* Brand Column */}
        <div style={{ gridColumn: "span 1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img
              src="/assets/attendx-logo.png"
              alt="AttendX Logo"
              style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }}
            />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: -0.5 }}>
              AttendX
            </span>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#94A3B8", margin: "0 0 16px" }}>
            Smart institutional attendance infrastructure engineered for modern colleges. Unifying 20-30 sample multi-angle biometric face enrollment, ephemeral cryptographic lecture QR codes, and multi-layer anti-proxy fraud defense.
          </p>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "rgba(18, 155, 103, 0.12)",
            border: "1px solid rgba(18, 155, 103, 0.3)",
            borderRadius: 9999,
            fontSize: 12,
            color: "#34D399"
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
            <span>Biometric Engine & API: Active</span>
          </div>
        </div>

        {/* Platform Links */}
        <div>
          <h4 style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>
            Architecture
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <li><a href="/" style={{ color: "#94A3B8", textDecoration: "none" }}>Platform Overview</a></li>
            <li><a href="/features" style={{ color: "#94A3B8", textDecoration: "none" }}>Features & Specifications</a></li>
            <li><a href="/how-it-works" style={{ color: "#94A3B8", textDecoration: "none" }}>Verification Engine Flow</a></li>
            <li><a href="/about" style={{ color: "#94A3B8", textDecoration: "none" }}>About AttendX Engineering</a></li>
          </ul>
        </div>

        {/* Security & Anti-Proxy */}
        <div>
          <h4 style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>
            Anti-Proxy & Security
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <li><a href="/security" style={{ color: "#94A3B8", textDecoration: "none" }}>Anti-Proxy Defense Matrix</a></li>
            <li><a href="/security#liveness" style={{ color: "#94A3B8", textDecoration: "none" }}>Micro-Challenge Liveness</a></li>
            <li><a href="/security#privacy" style={{ color: "#94A3B8", textDecoration: "none" }}>512-d Centroid Vector Security</a></li>
            <li><a href="/security#audit" style={{ color: "#94A3B8", textDecoration: "none" }}>Immutable Audit Ledger</a></li>
          </ul>
        </div>

        {/* Portals & Demo Access */}
        <div>
          <h4 style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>
            Institutional Portals
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <li><a href="/login?role=admin" style={{ color: "#94A3B8", textDecoration: "none" }}>Authority Admin Console</a></li>
            <li><a href="/login?role=teacher" style={{ color: "#94A3B8", textDecoration: "none" }}>Faculty Classroom Station</a></li>
            <li><a href="/login?role=student" style={{ color: "#94A3B8", textDecoration: "none" }}>Student Mobile Portal</a></li>
            <li><a href="/contact" style={{ color: "#94A3B8", textDecoration: "none" }}>Department Deployment & Inquiries</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Compliance & Copyright Row */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingTop: 24,
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        fontSize: 12,
        color: "#64748B"
      }}>
        <div>
          © 2026 AttendX AI Smart Attendance Systems. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span>DPDP & FERPA Aligned</span>
          <span>•</span>
          <span>Zero Raw Biometric Sharing</span>
          <span>•</span>
          <span>AES-256 Vector Security</span>
        </div>
      </div>
    </footer>
  );
}
