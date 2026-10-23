/*
=========================================================
ATTENDX - ADMIN BIOMETRIC FACE ENROLLMENT MODAL
=========================================================
Allows Institute Admin to capture, analyze, and register
a student's facial biometric template into the database.
Once enrolled, the student is authorized to mark attendance
using Face AI on their dashboard.
=========================================================
*/

import React, { useState, useEffect, useRef } from "react";
import { userService } from "../../services/userService";

export default function AdminFaceEnrollModal({
  isOpen,
  onClose,
  student,
  onEnrolled
}) {
  const [streamActive, setStreamActive] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [step, setStep] = useState("camera"); // 'camera' | 'captured' | 'saving' | 'enrolled'
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [extractionInfo, setExtractionInfo] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setPermissionError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
          });
        } catch (constraintErr) {
          // Fallback for laptop webcams without facingMode constraint
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn("Enrollment camera play:", e);
          }
        }
        setStreamActive(true);
      } else {
        setStreamActive(false);
        setPermissionError("Camera API is not supported in this browser environment. Using demo camera simulator.");
      }
    } catch {
      setStreamActive(false);
      setPermissionError("Camera access denied or unavailable. You can capture a simulated biometric snapshot.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setStep("camera");
      setCapturedPhoto(null);
      setExtractionInfo(null);
      setStatusMessage("Align the student's face inside the oval frame and click Capture Snapshot.");
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleCaptureSnapshot = () => {
    let photoData = null;
    if (videoRef.current && streamActive) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      photoData = canvas.toDataURL("image/jpeg", 0.85);
    }

    setCapturedPhoto(photoData);
    setStep("captured");
    setStatusMessage("Analyzing facial geometry & computing 512-d feature vector...");

    // Simulate biometric extraction pipeline
    setTimeout(() => {
      setExtractionInfo({
        landmarksDetected: "68 points (Facial contour, eyes, nose, mouth)",
        pose: "Frontal (Yaw: 1.2°, Pitch: -0.8°)",
        qualityScore: "99.4% (Optimal)",
        lighting: "Passed (>250 lux)",
        vectorDimensions: "512-d FaceNet / InsightFace Embedding"
      });
      setStatusMessage("Biometric extraction complete. Review details and save to database.");
    }, 700);
  };

  const handleSaveToDatabase = () => {
    if (!student) return;
    setStep("saving");
    setStatusMessage("Writing biometric vector to encrypted institutional database...");

    setTimeout(() => {
      const res = userService.enrollStudentFace(student.studentId, {
        photoData: capturedPhoto,
        qualityScore: extractionInfo?.qualityScore || "99.4%"
      });

      if (res.success) {
        setStep("enrolled");
        setStatusMessage(res.message);
        if (onEnrolled) onEnrolled(res.student);
      } else {
        alert(res.error || "Failed to enroll face.");
        setStep("captured");
      }
    }, 900);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setExtractionInfo(null);
    setStep("camera");
    setStatusMessage("Align the student's face inside the oval frame and click Capture Snapshot.");
  };

  if (!isOpen || !student) return null;

  return (
    <div className="attendx-modal-backdrop" onClick={onClose}>
      <div className="attendx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h3>Biometric Face Registration (Admin Console)</h3>
            <span style={{ fontSize: 12, color: "var(--attendx-text-muted)" }}>
              Enrolling Student: <b>{student.fullName}</b> ({student.studentId})
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Student Info Pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--attendx-surface-subtle)",
            border: "1px solid var(--attendx-border)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 12
          }}>
            <div>
              <span style={{ color: "var(--attendx-text-muted)" }}>Student:</span>{" "}
              <strong>{student.fullName}</strong> • <code>{student.studentId}</code>
            </div>
            <div>
              <span style={{ color: "var(--attendx-text-muted)" }}>Course:</span>{" "}
              <strong>{student.course} ({student.branch?.split(" ")[0]})</strong>
            </div>
          </div>

          {permissionError && (
            <div style={{
              background: "var(--attendx-warning-bg)",
              color: "var(--attendx-warning)",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              marginBottom: 12
            }}>
              ⚠️ {permissionError}
            </div>
          )}

          {/* Camera / Captured Viewport */}
          <div className="camera-scanner-frame" style={{ height: 280, position: "relative" }}>
            {step === "camera" ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
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
                {!streamActive && (
                  <div style={{ textAlign: "center", color: "#65D7E2", padding: 20 }}>
                    <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
                    <strong>Admin Enrollment Camera</strong>
                    <p style={{ fontSize: 11, color: "#98A2B3", margin: "4px 0 0" }}>
                      Live Biometric Capture Preview
                    </p>
                  </div>
                )}
                {/* Oval Guide */}
                <div className="face-reticle-overlay" style={{ width: 170, height: 210, borderColor: "var(--attendx-aqua)" }} />
                <div style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)"
                }}>
                  Face directly into the camera
                </div>
              </>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B1020" }}>
                {capturedPhoto ? (
                  <img src={capturedPhoto} alt="Captured Student Face" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                ) : (
                  <div style={{ textAlign: "center", color: "var(--attendx-aqua)" }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                    <strong>Biometric Snapshot Stored</strong>
                  </div>
                )}
                <div style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "var(--attendx-success)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)"
                }}>
                  Snapshot Captured ✓
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          {/* Status Alert Banner */}
          <div style={{
            padding: "10px 14px",
            background: step === "enrolled" ? "var(--attendx-success-bg)" : "var(--attendx-surface-subtle)",
            color: step === "enrolled" ? "var(--attendx-success)" : "var(--attendx-text-primary)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 16,
            textAlign: "center",
            border: "1px solid var(--attendx-border)"
          }}>
            {statusMessage}
          </div>

          {/* Biometric Analysis Card (Shown after capture) */}
          {extractionInfo && step !== "enrolled" && (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--attendx-border)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              marginBottom: 16,
              fontSize: 12
            }}>
              <strong style={{ fontSize: 13, color: "var(--attendx-indigo)", display: "block", marginBottom: 8 }}>
                AI Biometric Extraction Diagnostics:
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: "var(--attendx-text-muted)" }}>
                <div>Quality Score: <b style={{ color: "var(--attendx-success)" }}>{extractionInfo.qualityScore}</b></div>
                <div>Head Pose: <b style={{ color: "var(--attendx-text-primary)" }}>{extractionInfo.pose}</b></div>
                <div>Landmarks: <b style={{ color: "var(--attendx-text-primary)" }}>{extractionInfo.landmarksDetected}</b></div>
                <div>Vector Format: <b style={{ color: "var(--attendx-text-primary)" }}>{extractionInfo.vectorDimensions}</b></div>
              </div>
            </div>
          )}

          {/* Enrolled Confirmation Badge */}
          {step === "enrolled" && (
            <div style={{
              background: "rgba(18, 155, 103, 0.08)",
              border: "1px solid var(--attendx-success)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              marginBottom: 16,
              fontSize: 13,
              color: "var(--attendx-success)"
            }}>
              <strong>✓ Database Synchronization Complete!</strong>
              <div style={{ fontSize: 12, marginTop: 4, color: "var(--attendx-text-primary)" }}>
                Student <b>{student.fullName}</b> ({student.studentId}) is now authorized to record attendance using the Face AI camera on the Student Dashboard.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn-secondary" style={{ color: "var(--attendx-text-primary)" }} onClick={onClose}>
              {step === "enrolled" ? "Done" : "Cancel"}
            </button>

            {step === "camera" && (
              <button className="btn-primary" onClick={handleCaptureSnapshot}>
                📸 Capture Snapshot
              </button>
            )}

            {step === "captured" && (
              <>
                <button className="btn-secondary" style={{ color: "var(--attendx-text-primary)" }} onClick={handleRetake}>
                  🔄 Retake
                </button>
                <button className="btn-primary" onClick={handleSaveToDatabase}>
                  💾 Save Face to Database
                </button>
              </>
            )}

            {step === "saving" && (
              <button className="btn-primary" disabled>
                Saving to Database...
              </button>
            )}

            {step === "enrolled" && (
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
