/*
=========================================================
ATTENDX - FACE RECOGNITION ATTENDANCE COMPONENT
=========================================================
Primary attendance method.
Features:
- Camera permission handling via getUserMedia
- Interactive video preview with fallback simulator
- Oval face frame & scanning laser line animation
- 68-point landmark tracking simulation
- Liveness detection simulation
- Geofence verification check
- Attendance recording via attendanceService
- Architecture callout for backend ML pipeline
=========================================================
*/

import React, { useState, useEffect, useRef } from "react";
import { attendanceService } from "../../services/attendanceService";
import { userService } from "../../services/userService";

export default function FaceAttendanceModal({
  isOpen,
  onClose,
  currentUser,
  selectedSubject = "Machine Learning & AI",
  subjectCode = "CS402",
  onAttendanceMarked
}) {
  const [streamActive, setStreamActive] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("ready"); // 'ready' | 'detecting' | 'liveness' | 'matching' | 'success' | 'error'
  const [scanMessage, setScanMessage] = useState("Align your face within the frame to begin verification");
  const [resultData, setResultData] = useState(null);
  const [geofenceOk, setGeofenceOk] = useState(true);
  const [isFaceEnrolled, setIsFaceEnrolled] = useState(true);
  const [studentTemplate, setStudentTemplate] = useState("FT-2026-9042");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setPermissionError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStreamActive(true);
      } else {
        setStreamActive(false);
        setPermissionError("Camera API is not supported in this browser environment. Using demo camera simulator.");
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setStreamActive(false);
      setPermissionError("Camera permission denied or device not found. AttendX will use the simulated camera preview for evaluation.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const resetModal = () => {
    setIsScanning(false);
    setScanStep("ready");
    setScanMessage("Align your face within the frame to begin verification");
    setResultData(null);
  };

  // Check current geofence status and biometric enrollment in database
  useEffect(() => {
    if (isOpen) {
      const geo = userService.getCampusGeofence();
      setGeofenceOk(geo.simulationMode !== "outside");

      const studentId = currentUser?.id || "STU-2026-001";
      const students = userService.getStudents();
      const currentStu = students.find((s) => s.studentId === studentId);
      const enrolled = currentStu ? !!currentStu.faceEnrolled : true;
      setIsFaceEnrolled(enrolled);
      setStudentTemplate(currentStu?.faceTemplateId || "FT-2026-9042");

      if (!enrolled) {
        setScanStep("not_enrolled");
        setScanMessage("Face Not Enrolled in Database: The Institute Admin has not yet registered your facial biometric data. You must be enrolled in the Admin Portal before you can mark attendance.");
      } else {
        setScanStep("ready");
        setScanMessage("Align your face within the frame to begin verification");
      }

      startCamera();
    } else {
      stopCamera();
      resetModal();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleSimulateAdminEnrollment = () => {
    const studentId = currentUser?.id || "STU-2026-001";
    const res = userService.enrollStudentFace(studentId, { qualityScore: "99.4%" });
    if (res.success) {
      setIsFaceEnrolled(true);
      setStudentTemplate(res.student.faceTemplateId);
      setScanStep("ready");
      setScanMessage("Face enrolled into database! You can now mark attendance.");
    }
  };

  const triggerFaceRecognition = () => {
    if (!isFaceEnrolled) {
      setScanStep("not_enrolled");
      setScanMessage("Face Biometric Not Enrolled: Please visit the Admin Portal to enroll your face into the database.");
      return;
    }

    setIsScanning(true);
    setScanStep("detecting");
    setScanMessage("Detecting face in frame... (Haar/YOLO bounding box)");

    // Simulated multi-step AI inference pipeline
    setTimeout(() => {
      setScanStep("liveness");
      setScanMessage("Liveness check: Tracking micro-blinks and depth parallax... [PASSED]");

      setTimeout(() => {
        setScanStep("matching");
        setScanMessage("Extracting 512-d FaceNet embeddings & matching institutional database...");

        setTimeout(() => {
          // Attempt attendance recording
          const studentId = currentUser?.id || "STU-2026-001";
          const studentName = currentUser?.name || "Govind Kushwaha";

          const markResult = attendanceService.markAttendance({
            studentId,
            studentName,
            subject: selectedSubject,
            subjectCode,
            method: "Face AI",
            geofenceVerified: geofenceOk,
            confidence: "99.4%",
            room: "Lab 304",
            status: "Present"
          });

          if (markResult.success) {
            setScanStep("success");
            setScanMessage("Identity Verified! Attendance successfully logged.");
            setResultData({
              matchedName: studentName,
              matchedId: studentId,
              confidence: "99.4%",
              status: "Present",
              recordId: markResult.record.id,
              time: markResult.record.time
            });
            if (onAttendanceMarked) onAttendanceMarked();
          } else {
            setScanStep("error");
            setScanMessage(markResult.error || "Attendance verification failed.");
          }
          setIsScanning(false);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="attendx-modal-backdrop" onClick={onClose}>
      <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <h3>AI Face Attendance Verification</h3>
            <span style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
              {selectedSubject} ({subjectCode})
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Biometric Registry Status Pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isFaceEnrolled ? "var(--attendx-surface-subtle)" : "var(--attendx-error-bg)",
            border: `1px solid ${isFaceEnrolled ? "var(--attendx-border)" : "var(--attendx-error)"}`,
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            marginBottom: 12,
            fontSize: 12
          }}>
            <span>
              Database Biometric Status:{" "}
              <b style={{ color: isFaceEnrolled ? "var(--attendx-success)" : "var(--attendx-error)" }}>
                {isFaceEnrolled ? `Enrolled (Template #${studentTemplate})` : "Not Registered in Database"}
              </b>
            </span>
            <span className={`status-pill ${isFaceEnrolled ? "present" : "absent"}`}>
              {isFaceEnrolled ? "Authorized" : "Admin Enrollment Required"}
            </span>
          </div>

          {/* Permission warning banner if camera unavailable */}
          {permissionError && (
            <div style={{
              background: "var(--attendx-warning-bg)",
              color: "var(--attendx-warning)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              marginBottom: 14,
              border: "1px solid rgba(224, 135, 20, 0.2)"
            }}>
              ⚠️ {permissionError}
            </div>
          )}

          {/* Camera Frame */}
          <div className="camera-scanner-frame">
            {streamActive ? (
              <video ref={videoRef} autoPlay playsInline muted />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #091020 0%, #15223e 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#65D7E2"
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>AttendX Camera Stream</span>
                <small style={{ color: "#98A2B3", fontSize: 11 }}>Interactive Facial Reticle Active</small>
              </div>
            )}

            {/* Oval Reticle Frame */}
            <div className="face-reticle-overlay" style={{
              borderColor: scanStep === "success" ? "var(--attendx-success)" : scanStep === "error" ? "var(--attendx-error)" : "var(--attendx-aqua)"
            }} />

            {/* Scanning Laser Line */}
            {isScanning && <div className="laser-scanner-line" />}

            {/* Overlay Status Pill */}
            <div className="scanner-indicators">
              <span>
                {scanStep === "ready" && "🟢 System Ready"}
                {scanStep === "detecting" && "🟡 Detecting Face..."}
                {scanStep === "liveness" && "🔵 Verifying Liveness..."}
                {scanStep === "matching" && "🟣 Matching Enrolled Template..."}
                {scanStep === "success" && "✅ Verified 99.4%"}
                {scanStep === "error" && "❌ Failed"}
              </span>
              <span>
                {geofenceOk ? "📍 Campus Geofence: OK" : "⚠️ Outside Geofence"}
              </span>
            </div>
          </div>

          {/* Scanning Progress Message */}
          <div style={{
            padding: "12px 16px",
            background: scanStep === "success" ? "var(--attendx-success-bg)" : scanStep === "error" ? "var(--attendx-error-bg)" : "var(--attendx-surface-subtle)",
            color: scanStep === "success" ? "var(--attendx-success)" : scanStep === "error" ? "var(--attendx-error)" : "var(--attendx-text-primary)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
            textAlign: "center",
            border: "1px solid var(--attendx-border)"
          }}>
            {scanMessage}
          </div>

          {/* Success Summary Card */}
          {resultData && scanStep === "success" && (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--attendx-success)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>{resultData.matchedName}</strong>
                <span className="status-pill present">✓ {resultData.status}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "var(--attendx-text-muted)" }}>
                <div>Student ID: <b style={{ color: "var(--attendx-text-primary)" }}>{resultData.matchedId}</b></div>
                <div>Recorded Time: <b style={{ color: "var(--attendx-text-primary)" }}>{resultData.time}</b></div>
                <div>Confidence: <b style={{ color: "var(--attendx-success)" }}>{resultData.confidence}</b></div>
                <div>Campus Area: <b style={{ color: "var(--attendx-text-primary)" }}>Lab 304 (Verified)</b></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="btn-secondary" style={{ color: "var(--attendx-text-primary)" }} onClick={onClose}>
              {scanStep === "success" ? "Done" : "Cancel"}
            </button>

            {!isFaceEnrolled ? (
              <button
                className="btn-primary"
                style={{ background: "var(--attendx-indigo)" }}
                onClick={handleSimulateAdminEnrollment}
              >
                ⚡ Enroll Face into Database (Admin Action)
              </button>
            ) : scanStep !== "success" ? (
              <button
                className="btn-primary"
                onClick={triggerFaceRecognition}
                disabled={isScanning}
              >
                {isScanning ? "Analyzing Face..." : "Start Face Scan"}
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={resetModal}
              >
                Scan Another
              </button>
            )}
          </div>

          {/* Technical Architecture Callout */}
          <div style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: "1px solid var(--attendx-border)",
            fontSize: 11,
            color: "var(--attendx-text-muted)",
            lineHeight: 1.5
          }}>
            <strong>Engineering Note:</strong> In production, camera frames are sent over secure WebRTC/WSS to an institutional edge inference container running FaceNet/InsightFace. Embeddings are compared against 512-dimensional biometric templates stored in an encrypted vector database.
          </div>
        </div>
      </div>
    </div>
  );
}
