/*
=========================================================
ATTENDX - AUTHENTICATION & ROLE AUTHORIZATION MIDDLEWARE
=========================================================
Verifies JWT tokens and enforces role-based access control:
- student
- teacher
- admin
=========================================================
*/

const jwt = require("jsonwebtoken");
const db = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "attendx-enterprise-jwt-secret-2026";

/**
 * Verify JWT Bearer token on incoming requests
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication token required. Please log in."
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Session expired or invalid token. Please log in again."
    });
  }
}

/**
 * Authorize only specified roles
 * e.g. requireRole(['admin']) or requireRole(['teacher', 'admin'])
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized access" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const hasRole = allowedRoles.map((r) => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: [${allowedRoles.join(", ")}]. Current role: '${userRole}'`
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};
