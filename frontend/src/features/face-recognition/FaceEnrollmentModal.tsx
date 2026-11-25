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
          burstIntervalRef.current = null;
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
    }, 150);

    burstIntervalRef.current = interval;
  };

  const stopBurstCapture = () => {
    if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current);
      burstIntervalRef.current = null;
    }
    setIsBursting(false);
  };

  const removeSample = (indexToRemove: number) => {
    setCapturedSamples((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!student || capturedSamples.length < 25) {
      setErrorMsg('Minimum 25 frames are required to generate an accurate biometric face template.');
      return;
    }

    setEnrolling(true);
    setErrorMsg(null);

    try {
      const res = await api.enrollFace(capturedSamples, undefined, student.profile_id);

      stopCamera();
      onSuccess(res.message || `Successfully enrolled 128-d face template for ${student.full_name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Face enrollment failed. Please retry.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111D30] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#23334A] relative max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23334A] shrink-0">
          <div>
            <h3 className="text-lg font-bold font-heading text-[#F8FAFC] flex items-center space-x-2">
              <Camera className="w-5 h-5 text-[#3B82F6]" />
              <span>Biometric Face Enrollment (25–30 Samples)</span>
            </h3>
            <p className="text-xs text-[#A1AEC2] mt-0.5">
              Enrolling: <span className="font-semibold text-[#F8FAFC]">{student.full_name}</span> ({student.student_id} · Roll: {student.roll_number})
            </p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto py-3 flex-1 pr-1">
          {/* Live Video Camera Stream with Oval Guide */}
          <div className="relative bg-[#080D19] rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-[#23334A] shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="text-center text-[#A1AEC2] p-6">
                <VideoOff className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#64748B]" />
                <p className="text-xs font-medium">Camera stream inactive</p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1d4ed8]"
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
                    isReady ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]' : 'border-[#3B82F6]'
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
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0D1525] p-3 rounded-xl border border-[#23334A]">
            <div className="flex items-center space-x-2">
              {!isBursting ? (
                <button
                  type="button"
                  onClick={startBurstCapture}
                  disabled={!cameraActive || count >= targetMax}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Auto-Capture 30 Frames (Burst)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopBurstCapture}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Auto-Capture
                </button>
              )}

              <button
                type="button"
                onClick={captureSingleFrame}
                disabled={!cameraActive || count >= targetMax || isBursting}
                className="inline-flex items-center px-3 py-2 rounded-xl bg-[#16243A] border border-[#23334A] hover:border-[#3B82F6] text-[#F8FAFC] text-xs font-medium disabled:opacity-50 transition-all"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" /> Single Frame
              </button>
            </div>

            {count > 0 && (
              <button
                type="button"
                onClick={() => setCapturedSamples([])}
                disabled={isBursting}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
              >
                Clear All ({count})
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#A1AEC2]">
                Samples Captured: <span className={isReady ? 'text-emerald-400' : 'text-[#3B82F6]'}>{count}</span> / {targetMax}
              </span>
              <span className="text-[11px] text-[#A1AEC2]">
                {isReady ? (
                  <span className="text-emerald-400 font-bold inline-flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Minimum 25 frames reached
                  </span>
                ) : (
                  `${targetMin - count} more required`
                )}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#0D1525] rounded-full overflow-hidden border border-[#23334A]">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isReady ? 'bg-emerald-400' : 'bg-[#3B82F6]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Captured Samples Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#A1AEC2] uppercase tracking-wider">
                Captured Frame Gallery ({count})
              </h4>
              <p className="text-[11px] text-[#64748B]">Hover to remove frame</p>
            </div>

            {count === 0 ? (
              <div className="p-6 text-center bg-[#0D1525] rounded-xl border border-dashed border-[#23334A] text-[#64748B] text-xs">
                No frames captured yet. Click "Auto-Capture 30 Frames" or "Single Frame" to start.
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#0D1525] rounded-xl border border-[#23334A]">
                {capturedSamples.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-[#23334A] bg-black shadow-xs"
                  >
                    <img src={src} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/80 text-[9px] text-[#F8FAFC] rounded font-mono">
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
        <div className="pt-4 border-t border-[#23334A] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={enrolling}
            className="px-4 py-2.5 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isReady || enrolling}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            {enrolling ? (
              'Extracting Embeddings & Saving...'
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Save Dataset & Generate Biometric Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
