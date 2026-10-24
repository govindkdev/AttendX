/*
=========================================================
ATTENDX - ENTERPRISE BACKEND SERVER
=========================================================
Smart Attendance Infrastructure Node.js/Express API Engine.
Features:
- AI-Assisted Face Recognition Attendance
- Dynamic QR-Code Backup Attendance
- Campus Geo-Fencing Enforcement (Haversine)
- Authority & Admin Identity Issuance
- Real-Time Role Dashboards & Reporting
- Static Single-Page App (SPA) Serving for 1-Click Deployment
=========================================================
*/

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Initialize Database
require("./config/database");

// Route Handlers
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const academicRoutes = require("./routes/academicRoutes");
const sheetsRoutes = require("./routes/sheetsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Allow large payloads for base64 webcam face snapshots during enrollment and attendance
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/sheets", sheetsRoutes);

// System Healthcheck Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "AttendX AI Smart Attendance Infrastructure",
    timestamp: new Date().toISOString(),
    version: "2.4.0",
    services: {
      database: "SQLite WAL (Operational)",
      biometricEngine: "512-d Cosine Vector Matcher (Active)",
      geofenceModule: "Haversine Perimeter Validator (Active)",
      authEngine: "JWT & Bcrypt Authority Guard (Active)"
    }
  });
});

// Production Deployment Static File Serving:
// If Vite build directory (dist) exists, serve frontend directly from Express!
const clientDistPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving compiled frontend client from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA Fallback for client-side routing (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(clientDistPath, "index.html"));
    }
    next();
  });
} else {
  app.get("/", (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #5B5FEF;">AttendX Backend API Online</h1>
        <p>Run <code>npm run build</code> in the root directory to generate the production frontend bundle.</p>
        <p>API Healthcheck: <a href="/api/health">/api/health</a></p>
      </div>
    `);
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error occurred.",
    message: err.message
  });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log("=========================================================");
  console.log("  ATTENDX - AI SMART ATTENDANCE INFRASTRUCTURE SERVER");
  console.log("=========================================================");
  console.log(`  ✓ API Server listening on: http://localhost:${PORT}`);
  console.log(`  ✓ Biometric Engine:        512-d L2 Vector Similarity`);
  console.log(`  ✓ Geofence Engine:         Haversine Great-Circle Algorithm`);
  console.log(`  ✓ Database:                attendx.db (SQLite WAL Mode)`);
  console.log("=========================================================");
});

module.exports = app;
