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
  UserCheck,
  ShieldCheck,
  Lock,
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
    api.getActiveSessions().then((sessions) => {
      setActiveSessions(sessions);
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0].session_id);
      }
    });

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
    } catch (err: any) {
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Facial Recognition Attendance
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify your physical presence and mark attendance in active lecture sessions via biometric facial recognition.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {verificationResult && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Attendance Recorded Successfully!</h3>
              <p className="text-xs text-slate-600">
                Status: <span className="font-bold uppercase text-emerald-700">{verificationResult.status}</span> | Method: {verificationResult.verification_method}
              </p>
            </div>
          </div>
          <div className="text-xs bg-white/80 p-3 rounded-xl border border-emerald-100 flex justify-between">
            <span>Subject: <strong>{verificationResult.subject_name}</strong></span>
            <span>Recorded at: <strong>{new Date(verificationResult.recorded_at).toLocaleTimeString()}</strong></span>
          </div>
        </div>
      )}

      {activeSessions.length === 0 ? (
        <EmptyState
          title="No Active Lecture Sessions Available"
          description="Your instructors have not started any active attendance sessions for your enrolled course and semester right now."
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Lecture Session Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Active Lecture Session *
            </label>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
            >
              {activeSessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.subject_name} ({s.session_code}) — {s.teacher_name} [{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}]
                </option>
              ))}
            </select>
          </div>

          {/* Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-w-lg mx-auto flex items-center justify-center border-2 border-slate-200 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Facial Oval Alignment Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 rounded-[50%] border-2 border-dashed border-blue-400/80 shadow-2xl animate-pulse"></div>
              </div>
            )}

            {!cameraActive && (
              <div className="text-center p-6 space-y-3">
                <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Camera preview inactive</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md hover:bg-blue-700 transition-colors"
                >
                  Start Camera Preview
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-xs text-rose-600 text-center font-medium">{cameraError}</p>
          )}

          {/* GPS Info pill */}
          {gpsLocation && (
            <div className="flex items-center justify-center text-xs text-slate-500 space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                GPS Location Acquired (Accuracy: &plusmn;{Math.round(gpsLocation.acc)}m)
              </span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleVerify}
              disabled={!cameraActive || verifying || !selectedSessionId}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying Face & Geofence...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" /> Verify Face Attendance
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
