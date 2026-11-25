import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  ShieldCheck,
  Video,
  VideoOff
} from 'lucide-react';

export const FaceAttendance: React.FC = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number; acc: number } | null>(null);

  useEffect(() => {
    // Load active sessions
    api.getActiveSessions()
      .then((sessions) => {
        setActiveSessions(sessions || []);
        if (sessions && sessions.length > 0) {
          setSelectedSessionId(sessions[0].session_id);
        }
      })
      .catch(() => setActiveSessions([]));

    // Request GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            acc: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('Geolocation warning:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied or unavailable. Please enable browser camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleVerify = async () => {
    if (!selectedSessionId) {
      setErrorMsg('Please select an active lecture session.');
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      setErrorMsg('Could not capture frame from camera.');
      return;
    }

    setVerifying(true);
    setErrorMsg(null);
    setVerificationResult(null);

    try {
      const result = await api.verifyFaceAttendance({
        session_id: selectedSessionId,
        face_image: frame,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lon,
        accuracy: gpsLocation?.acc,
      });
      setVerificationResult(result);
      stopCamera();
    } catch (err: any) {
      setErrorMsg(err.message || 'Face verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Facial Biometric Attendance
        </h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Verify your physical presence and record attendance in live sessions using browser face recognition.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {verificationResult && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#F8FAFC]">Attendance Recorded Successfully!</h3>
              <p className="text-xs text-[#A1AEC2]">
                Status: <span className="font-bold uppercase text-emerald-400">{verificationResult.status}</span> | Method: {verificationResult.verification_method}
              </p>
            </div>
          </div>
          <div className="text-xs bg-[#0D1525] p-3.5 rounded-xl border border-[#23334A] flex flex-wrap justify-between gap-2">
            <span>Subject: <strong className="text-[#F8FAFC]">{verificationResult.subject_name}</strong></span>
            <span>Recorded at: <strong className="text-[#F8FAFC]">{new Date(verificationResult.recorded_at).toLocaleTimeString()}</strong></span>
          </div>
        </div>
      )}

      {activeSessions.length === 0 ? (
        <EmptyState
          title="No Active Lecture Sessions Available"
          description="Your instructors have not initiated any live attendance sessions for your enrolled course and semester right now."
          icon={Camera}
        />
      ) : (
        <div className="bg-[#111D30] rounded-3xl p-6 sm:p-8 border border-[#23334A] shadow-xl space-y-6">
          {/* Lecture Session Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
              Select Active Lecture Session
            </label>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="w-full bg-[#0D1525] border border-[#23334A] text-[#F8FAFC] rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#3B82F6]"
            >
              {activeSessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.subject_name} ({s.session_code}) — Instructor: {s.teacher_name} ({s.start_time} - {s.end_time})
                </option>
              ))}
            </select>
          </div>

          {/* Camera Viewport */}
          <div className="space-y-4">
            <div className="relative w-full max-w-md mx-auto aspect-4/3 rounded-2xl bg-[#080D19] border border-[#23334A] overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  cameraActive ? 'block' : 'hidden'
                }`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!cameraActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#16243A] text-[#3B82F6] flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#A1AEC2]">
                    Camera feed is currently inactive. Click below to initialize facial biometric camera.
                  </p>
                </div>
              )}

              {cameraActive && (
                <>
                  {/* Scanning Radar Line */}
                  <div className="biometric-scanner-line" />
                  <div className="absolute top-3 left-3 bg-[#080D19]/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-mono text-[#22D3EE] border border-[#23334A] flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
                    <span>SCANNING FACE FRAME</span>
                  </div>
                </>
              )}
            </div>

            {cameraError && (
              <p className="text-center text-xs text-rose-400 font-medium">{cameraError}</p>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-md flex items-center space-x-2 transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#22D3EE] hover:opacity-95 text-[#080D19] text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Embeddings...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Capture & Verify Attendance</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 rounded-xl bg-[#16243A] hover:bg-[#1D304D] text-[#A1AEC2] text-xs font-semibold border border-[#23334A] flex items-center space-x-1.5 transition-colors"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>

            {/* Telemetry info */}
            <div className="pt-4 border-t border-[#23334A] flex flex-wrap items-center justify-between text-[11px] text-[#64748B]">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#22D3EE]" />
                GPS Telemetry:{' '}
                {gpsLocation ? (
                  <span className="text-emerald-400 ml-1">Captured (±{Math.round(gpsLocation.acc)}m)</span>
                ) : (
                  <span className="text-[#A1AEC2] ml-1">Locating campus boundary...</span>
                )}
              </span>
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Cosine distance normalized verification
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
