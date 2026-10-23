/*
=========================================================
ATTENDX - MOBILE-FIRST STUDENT QR ATTENDANCE SCANNER
=========================================================
Primary attendance method for students.
Features:
- Live mobile camera stream with front/rear flip
- Desktop webcam auto-fallback
- High-speed jsQR decoding
- Server-side validation against active lecture sessions
- Expiry, duplicate, and unauthorized detection
- Lecture, Subject & Teacher verification card
- Clear success animation
=========================================================
*/

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { qrService } from "../../services/qrService";
import { attendanceService } from "../../services/attendanceService";
import { userService } from "../../services/userService";
import { api } from "../../services/api";

export default function QRScannerModal({
  isOpen,
  onClose,
  currentUser,
  onAttendanceMarked
}) {
  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" (rear) | "user" (front)
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Point your camera at the teacher's lecture QR code");
  const [statusType, setStatusType] = useState("info"); // 'info' | 'success' | 'error'
  const [scannedSession, setScannedSession] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameId = useRef(null);

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not supported in this browser. Enter the 6-character code below.");
        setStreamActive(false);
        return;
      }

      // Stop previous tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch (err) {
        // Fallback for laptops/desktops without environment camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Video play:", e);
        }
      }
      setStreamActive(true);
      requestAnimationFrame(tickScanner);
    } catch (err) {
      setStreamActive(false);
      setCameraError("Camera access denied or unavailable. You can enter the session code manually below.");
      setStatusMessage("Camera unavailable. Enter the lecture session code below.");
      setStatusType("error");
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      setStatusMessage("Point your camera at the teacher's lecture QR code");
      setStatusType("info");
      setScannedSession(null);
      setManualCode("");
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const tickScanner = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && scanning) {
      const canvas = canvasRef.current || document.createElement("canvas");
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
        // Continue loop
      }
    }
    animFrameId.current = requestAnimationFrame(tickScanner);
  };

  const handleScannedPayload = (payloadString) => {
    setScanning(false);
    const decoded = qrService.decodePayload(payloadString);
    if (!decoded.valid) {
      setStatusMessage(decoded.error || "Invalid QR Code format.");
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
      setStatusMessage("No active classroom attendance sessions currently running. Start a session in the Teacher Dashboard.");
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
      setStatusMessage(`✓ Attendance Verified! Successfully recorded for ${session.subjectName}.`);
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
      <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: "95%" }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Scan Lecture QR Code</h3>
            <span style={{ fontSize: 12, color: "var(--attendx-text-muted, #667085)" }}>
              Official Student Attendance Scanner
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal-body">
          {/* Scanner Viewport */}
          <div className="camera-scanner-frame" style={{
            height: 260,
            borderRadius: "var(--radius-lg, 16px)",
            background: "#091020",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Video permanently mounted to avoid black screen bug */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: streamActive ? "block" : "none"
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.play().catch(() => {});
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {!streamActive && (
              <div style={{ textAlign: "center", color: "#65D7E2", padding: 20 }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
                <strong style={{ fontSize: 14, color: "#FFFFFF" }}>Mobile Camera Scanner</strong>
                <p style={{ fontSize: 12, color: "#98A2B3", margin: "4px 0 12px" }}>
                  {cameraError || "Align camera with teacher's lecture QR code"}
                </p>
                <button
                  className="btn-secondary"
                  onClick={startCamera}
                  style={{ fontSize: 12, padding: "6px 14px", color: "#FFFFFF", borderColor: "#374151" }}
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Scanning Laser Line */}
            {streamActive && scanning && (
              <div className="laser-scanner-line" style={{ width: "80%" }} />
            )}

            {/* Target Reticle */}
            {streamActive && (
              <div style={{
                position: "absolute",
                width: 170,
                height: 170,
                border: "2px solid #65D7E2",
                borderRadius: "var(--radius-md, 12px)",
                boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.45)",
                pointerEvents: "none"
              }} />
            )}

            {/* Camera Switch Pill (Mobile) */}
            {streamActive && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  background: "rgba(11, 16, 32, 0.75)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                🔄 Flip ({facingMode === "environment" ? "Rear" : "Front"})
              </button>
            )}
          </div>

          {/* Status Message Banner */}
          <div style={{
            padding: "12px 14px",
            background: statusType === "success" ? "rgba(18, 155, 103, 0.1)" : statusType === "error" ? "rgba(216, 90, 100, 0.1)" : "#F8FAFC",
            color: statusType === "success" ? "var(--attendx-success, #129B67)" : statusType === "error" ? "var(--attendx-error, #D85A64)" : "var(--attendx-text-primary, #172033)",
            borderRadius: "var(--radius-md, 8px)",
            fontSize: 13,
            fontWeight: 600,
            margin: "14px 0",
            textAlign: "center",
            border: `1px solid ${statusType === "success" ? "var(--attendx-success, #129B67)" : statusType === "error" ? "var(--attendx-error, #D85A64)" : "var(--attendx-border, #E3E7EF)"}`
          }}>
            {statusMessage}
          </div>

          {/* Verified Session Card on Success */}
          {scannedSession && statusType === "success" && (
            <div style={{
              background: "#FFFFFF",
              border: "2px solid var(--attendx-success, #129B67)",
              borderRadius: "var(--radius-lg, 16px)",
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 4px 14px rgba(18, 155, 103, 0.15)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 15, color: "var(--attendx-navy, #0B1020)" }}>
                  {scannedSession.subjectName}
                </strong>
                <span className="status-pill present" style={{ fontSize: 11 }}>
                  ✓ Present
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "var(--attendx-text-muted, #667085)" }}>
                <div>Lecture: <strong style={{ color: "var(--attendx-navy, #0B1020)" }}>{scannedSession.lectureName || "Live Lecture"}</strong></div>
                <div>Code: <strong style={{ color: "var(--attendx-navy, #0B1020)" }}>{scannedSession.sessionCode}</strong></div>
                <div>Instructor: <strong style={{ color: "var(--attendx-navy, #0B1020)" }}>{scannedSession.teacherName}</strong></div>
                <div>Room: <strong style={{ color: "var(--attendx-navy, #0B1020)" }}>{scannedSession.room}</strong></div>
              </div>
            </div>
          )}

          {/* Quick Demo Test Scan Shortcut */}
          <div style={{
            background: "rgba(91, 95, 239, 0.05)",
            border: "1px dashed var(--attendx-indigo, #5B5FEF)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "12px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}>
            <div>
              <strong style={{ fontSize: 13, color: "var(--attendx-indigo, #5B5FEF)" }}>⚡ 1-Click Evaluation Test</strong>
              <div style={{ fontSize: 11, color: "var(--attendx-text-muted, #667085)" }}>
                Simulate scanning teacher's active lecture QR
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: 12, padding: "8px 14px" }}
              onClick={handleQuickDemoScan}
            >
              Test Scan QR
            </button>
          </div>

          {/* Manual Session Code Input */}
          <form onSubmit={handleManualSubmit} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--attendx-text-muted, #667085)" }}>
              Or Enter Lecture Session Code
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
                  borderRadius: "var(--radius-md, 8px)",
                  border: "1px solid var(--attendx-border, #E3E7EF)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.08em"
                }}
              />
              <button
                type="submit"
                className="btn-secondary"
                style={{ color: "var(--attendx-text-primary, #172033)", padding: "0 18px", fontWeight: 600 }}
              >
                Submit
              </button>
            </div>
          </form>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {statusType === "error" && (
              <button
                type="button"
                className="btn-secondary"
                style={{ marginRight: "auto" }}
                onClick={() => {
                  setScanning(true);
                  setStatusType("info");
                  setStatusMessage("Point your camera at the teacher's lecture QR code");
                }}
              >
                ↺ Scan Again
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              style={{ padding: "8px 24px" }}
              onClick={onClose}
            >
              {statusType === "success" ? "Done" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
