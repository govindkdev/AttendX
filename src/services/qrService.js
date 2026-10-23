/*
=========================================================
ATTENDX - QR SERVICE
=========================================================
Encodes and decodes smart attendance session tokens.

PRODUCTION LIMITATION NOTE:
In production, QR payloads use cryptographically signed
TOTP-like dynamic tokens rotated every 15-30 seconds to
prevent screenshot and relay attacks.
=========================================================
*/

import { loadState } from "../data/demoData.js";

export const qrService = {
  /**
   * Format session data into QR payload string
   */
  encodeSession(session) {
    const payload = {
      app: "AttendX",
      type: "ATTENDANCE_SESSION",
      sessionId: session.sessionId,
      sessionCode: session.sessionCode,
      subjectCode: session.subjectCode,
      subjectName: session.subjectName,
      teacherId: session.teacherId,
      expiresAt: session.expiresAt
    };
    return JSON.stringify(payload);
  },

  /**
   * Parse QR scanned text
   */
  decodePayload(text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.app === "AttendX" && parsed.sessionId) {
        return { valid: true, data: parsed };
      }
      return { valid: false, error: "QR code is not an AttendX attendance session." };
    } catch {
      // Check if user entered shortcode directly (e.g., AX-8492)
      const clean = text.trim().toUpperCase();
      if (clean.startsWith("AX-") || clean.length >= 4) {
        return { valid: true, isCode: true, code: clean };
      }
      return { valid: false, error: "Unrecognized QR code format." };
    }
  },

  /**
   * Validate session payload against active sessions in state
   */
  validateSession(parsedResult) {
    const state = loadState();
    const now = Date.now();

    let targetSession = null;
    if (parsedResult.isCode) {
      targetSession = state.activeSessions.find(
        (s) => s.sessionCode.toUpperCase() === parsedResult.code.toUpperCase()
      );
    } else if (parsedResult.data) {
      targetSession = state.activeSessions.find(
        (s) => s.sessionId === parsedResult.data.sessionId
      );
    }

    if (!targetSession) {
      return {
        valid: false,
        error: "Invalid Session: No active attendance session matching this QR or code was found."
      };
    }

    if (new Date(targetSession.expiresAt).getTime() < now) {
      return {
        valid: false,
        error: "Session Expired: This QR code session has expired. Request teacher to refresh session."
      };
    }

    if (targetSession.status !== "Active") {
      return {
        valid: false,
        error: "Session Closed: The teacher has concluded this attendance session."
      };
    }

    return { valid: true, session: targetSession };
  }
};
