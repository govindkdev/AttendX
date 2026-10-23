/*
=========================================================
ATTENDX - QR CODE ATTENDANCE SCANNER
=========================================================
Backup attendance method.
Features:
- Live camera stream with QR decoding
- Manual session code entry (e.g., AX-8492)
- 1-click "Instant Demo Scan" shortcut
- Session validation (active, expired, closed)
- Duplicate check prevention
- Campus geofence verification check
- Attendance recording via attendanceService
=========================================================
*/

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { qrService } from "../../services/qrService";
import { attendanceService } from "../../services/attendanceService";
import { userService } from "../../services/userService";

export default function QRScannerModal({
  isOpen,
  onClose,
  currentUser,
  onAttendanceMarked
}) {
  const [streamActive, setStreamActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Point your camera at the attendance QR code projected in class");
  const [statusType, setStatusType] = useState("info"); // 'info' | 'success' | 'error'
  const [scannedSession, setScannedSession] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setScanning(true);
      setStatusMessage("Point your camera at the attendance QR code projected in class");
      setStatusType("info");
      setScannedSession(null);
      setManualCode("");
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStreamActive(true);
        requestAnimationFrame(tickScanner);
      }
    } catch {
      setStreamActive(false);
      setStatusMessage("Camera unavailable. You can enter the 6-character session code or use the 1-click Test Scan button below.");
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const tickScanner = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && scanning) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          });

          if (code && code.data) {
            handleScannedPayload(code.data);
            return;
          }
        } catch {
          // Continue scanning
        }
      }
    }
    animFrameId.current = requestAnimationFrame(tickScanner);
  };

  const handleScannedPayload = (payloadString) => {
    setScanning(false);
    const decoded = qrService.decodePayload(payloadString);
    if (!decoded.valid) {
      setStatusMessage(decoded.error || "Invalid QR Code.");
      setStatusType("error");
      return;
    }

    const validation = qrService.validateSession(decoded);
    if (!validation.valid) {
      setStatusMessage(validation.error);
      setStatusType("error");
      return;
    }

    processAttendance(validation.session);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const validation = qrService.validateSession({ isCode: true, code: manualCode.trim() });
    if (!validation.valid) {
      setStatusMessage(validation.error);
      setStatusType("error");
      return;
    }

    processAttendance(validation.session);
  };

  const handleQuickDemoScan = () => {
    const activeSessions = attendanceService.getActiveSessions();
    if (activeSessions.length === 0) {
      setStatusMessage("No active classroom attendance sessions currently running. You can create one in the Teacher Dashboard.");
      setStatusType("error");
      return;
    }
    processAttendance(activeSessions[0]);
  };

  const processAttendance = (session) => {
    const studentId = currentUser?.id || "STU-2026-001";
    const studentName = currentUser?.name || "Govind Kushwaha";
    const geofence = userService.getCampusGeofence();
    const geofenceOk = geofence.simulationMode !== "outside";

    const result = attendanceService.markAttendance({
      studentId,
      studentName,
      subject: session.subjectName,
      subjectCode: session.subjectCode,
      method: "QR Backup",
      geofenceVerified: geofenceOk,
      confidence: "QR Token Validated",
      room: session.room,
      status: "Present"
    });

    if (result.success) {
      setStatusMessage(`Attendance Recorded! Successfully verified for ${session.subjectName}.`);
      setStatusType("success");
      setScannedSession(session);
      if (onAttendanceMarked) onAttendanceMarked();
    } else {
      setStatusMessage(result.error);
      setStatusType("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="attendx-modal-backdrop" onClick={onClose}>
      <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div>
            <h3>Scan Attendance QR Code</h3>
            <span style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
              Backup attendance channel for institutional sessions
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Scanner Viewport */}
          <div className="camera-scanner-frame" style={{ height: 280 }}>
            <video ref={videoRef} playsInline muted style={{ display: streamActive ? "block" : "none" }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {!streamActive && (
              <div style={{
                textAlign: "center",
                color: "#65D7E2",
                padding: 20
              }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
                <strong>Webcam QR Scanner</strong>
                <p style={{ fontSize: 12, color: "#98A2B3", margin: "4px 0 0" }}>
                  Hold teacher-generated QR code steady in front of camera
                </p>
              </div>
            )}

            {/* QR Target Reticle */}
            <div style={{
              position: "absolute",
              width: 170,
              height: 170,
              border: "2px solid var(--attendx-aqua)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.4)",
              pointerEvents: "none"
            }} />
          </div>

          {/* Status Message */}
          <div style={{
            padding: "12px 14px",
            background: statusType === "success" ? "var(--attendx-success-bg)" : statusType === "error" ? "var(--attendx-error-bg)" : "var(--attendx-surface-subtle)",
            color: statusType === "success" ? "var(--attendx-success)" : statusType === "error" ? "var(--attendx-error)" : "var(--attendx-text-primary)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 16,
            textAlign: "center",
            border: "1px solid var(--attendx-border)"
          }}>
            {statusMessage}
          </div>

          {/* Success Summary */}
          {scannedSession && statusType === "success" && (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--attendx-success)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              marginBottom: 16
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <strong>{scannedSession.subjectName}</strong>
                <span className="status-pill present">✓ Present</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
                Code: {scannedSession.sessionCode} | Room: {scannedSession.room} | Teacher: {scannedSession.teacherName}
              </div>
            </div>
          )}

          {/* Shortcut: Quick Demo Scan Button */}
          <div style={{
            background: "rgba(91, 95, 239, 0.05)",
            border: "1px dashed var(--attendx-indigo)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <strong style={{ fontSize: 13, color: "var(--attendx-indigo)" }}>⚡ 1-Click Demo Evaluation</strong>
              <div style={{ fontSize: 11, color: "var(--attendx-text-muted)" }}>
                Instantly simulate scanning currently active lecture QR
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ fontSize: 12, padding: "8px 14px" }}
              onClick={handleQuickDemoScan}
            >
              Test Scan Active QR
            </button>
          </div>

          {/* Manual Code Input Form */}
          <form onSubmit={handleManualSubmit} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--attendx-text-muted)" }}>
              Or Enter 6-Character Session Code (Shown below teacher's QR)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. AX-8492"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--attendx-border)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.08em"
                }}
              />
              <button type="submit" className="btn-secondary" style={{ color: "var(--attendx-text-primary)", padding: "0 18px" }}>
                Submit Code
              </button>
            </div>
          </form>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn-secondary" style={{ color: "var(--attendx-text-primary)" }} onClick={onClose}>
              {statusType === "success" ? "Done" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
