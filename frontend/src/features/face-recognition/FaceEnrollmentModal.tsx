import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import type { StudentListItem } from '@/types';
import {
  Camera,
  X,
  ShieldCheck,
  VideoOff,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  student: StudentListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSuccess,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedSamples, setCapturedSamples] = useState<string[]>([]);
  const [isBursting, setIsBursting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const burstIntervalRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current);
      burstIntervalRef.current = null;
    }
    setIsBursting(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setErrorMsg('Unable to access camera. Please allow camera permissions in your browser.');
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && student) {
      setCapturedSamples([]);
      setErrorMsg(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, student, startCamera, stopCamera]);

  const captureSingleFrame = useCallback(() => {
    if (!videoRef.current || capturedSamples.length >= 30) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedSamples((prev) => (prev.length < 30 ? [...prev, dataUrl] : prev));
  }, [capturedSamples.length]);

  const startBurstCapture = () => {
    if (!cameraActive || isBursting || capturedSamples.length >= 30) return;
    setIsBursting(true);

    const interval = setInterval(() => {
      setCapturedSamples((prev) => {
        if (prev.length >= 30) {
          clearInterval(interval);
          setIsBursting(false);
          return prev;
        }
        if (!videoRef.current) return prev;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return prev;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        return [...prev, dataUrl];
      });
    }, 120);

    burstIntervalRef.current = interval;
  };

  const stopBurstCapture = () => {
    if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current);
      burstIntervalRef.current = null;
    }
    setIsBursting(false);
  };

  const removeSample = (idx: number) => {
    setCapturedSamples((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!student || capturedSamples.length < 25) return;
    setEnrolling(true);
    setErrorMsg(null);
    try {
      const res = await api.enrollFace(capturedSamples, undefined, student.profile_id);
      stopCamera();
      onSuccess(
        `Biometric enrollment complete for ${student.full_name} (${res.sample_count} frames processed, quality: ${res.quality_score}).`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Face biometric enrollment failed. Please check frame quality and retry.');
    } finally {
      setEnrolling(false);
    }
  };

  if (!isOpen || !student) return null;

  const targetMin = 25;
  const targetMax = 30;
  const count = capturedSamples.length;
  const isReady = count >= targetMin;
  const progressPct = Math.min(100, Math.round((count / targetMax) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Biometric Face Enrollment (25–30 Samples)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolling: <span className="font-semibold text-slate-800">{student.full_name}</span> ({student.student_id} · Roll: {student.roll_number})
            </p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto py-3 flex-1 pr-1">
          {/* Live Video Camera Stream with Oval Guide */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="text-center text-slate-400 p-6">
                <VideoOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Camera stream inactive</p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Start Camera
                </button>
              </div>
            )}
            {/* Oval Face Guide Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-44 h-56 border-2 border-dashed rounded-[50%] transition-colors duration-200 ${
                    isReady ? 'border-emerald-400/90 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'border-blue-400/80'
                  }`}
                />
                {isBursting && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping mr-1" />
                    Auto-Capturing...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Capture Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <div className="flex items-center space-x-2">
              {!isBursting ? (
                <button
                  type="button"
                  onClick={startBurstCapture}
                  disabled={!cameraActive || count >= targetMax}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Auto-Capture 30 Frames (Burst)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopBurstCapture}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Auto-Capture
                </button>
              )}

              <button
                type="button"
                onClick={captureSingleFrame}
                disabled={!cameraActive || count >= targetMax || isBursting}
                className="inline-flex items-center px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-50 transition-all"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Single Frame
              </button>
            </div>

            {count > 0 && (
              <button
                type="button"
                onClick={() => setCapturedSamples([])}
                disabled={isBursting}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
              >
                Clear All ({count})
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">
                Samples Captured: <span className={isReady ? 'text-emerald-600' : 'text-blue-600'}>{count}</span> / {targetMax}
              </span>
              <span className="text-[11px] text-slate-500">
                {isReady ? (
                  <span className="text-emerald-700 font-bold inline-flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Minimum 25 frames reached
                  </span>
                ) : (
                  `${targetMin - count} more required`
                )}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isReady ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Captured Samples Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Captured Frame Gallery ({count})
              </h4>
              <p className="text-[11px] text-slate-400">Hover or click sample to remove</p>
            </div>

            {count === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No frames captured yet. Click "Auto-Capture 30 Frames" or "Single Frame" to start.
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                {capturedSamples.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-slate-300/80 bg-slate-900 shadow-xs"
                  >
                    <img src={src} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/70 text-[9px] text-white rounded font-mono">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSample(idx)}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove sample"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={enrolling}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isReady || enrolling}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            {enrolling ? (
              'Extracting Embeddings & Saving...'
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Save Dataset & Generate 128-d Biometric Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
