import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { QrCode, CheckCircle2, AlertCircle, RefreshCw, MapPin, ScanLine } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';

export const ScanQR: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number; acc: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            acc: pos.coords.accuracy,
          });
        },
        (err) => console.warn(err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleVerifyQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setVerifying(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await api.verifyQRAttendance({
        qr_token: tokenInput.trim(),
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lon,
        accuracy: gpsLocation?.acc,
      });
      setResult(res);
      setTokenInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'QR verification failed. Verify that code is not expired.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">QR Attendance</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Submit the dynamic time-limited QR token projected by your course instructor in the lecture hall.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#F8FAFC]">QR Attendance Confirmed!</h3>
              <p className="text-xs text-[#A1AEC2]">
                Status: <span className="font-bold uppercase text-emerald-400">{result.status}</span> | Method: Dynamic QR
              </p>
            </div>
          </div>
          <div className="text-xs bg-[#0D1525] p-3.5 rounded-xl border border-[#23334A] flex justify-between">
            <span>Subject: <strong className="text-[#F8FAFC]">{result.subject_name || 'Lecture'}</strong></span>
            <span>Recorded at: <strong className="text-[#F8FAFC]">{new Date(result.recorded_at).toLocaleTimeString()}</strong></span>
          </div>
        </div>
      )}

      <div className="bg-[#111D30] rounded-3xl p-6 sm:p-8 border border-[#23334A] shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/25 flex items-center justify-center mx-auto">
          <ScanLine className="w-8 h-8" />
        </div>

        <form onSubmit={handleVerifyQR} className="space-y-4">
          <FormInput
            label="QR Token or Session Code"
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste raw QR token string or 6-character code"
            helperText="Tokens rotate automatically every 15-30s in class"
            required
            autoFocus
          />

          <button
            type="submit"
            disabled={verifying || !tokenInput.trim()}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#2563EB] to-[#22D3EE] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying QR Signature...</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Submit & Record Attendance</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#23334A] flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-[#22D3EE]" />
            Location Validation: {gpsLocation ? <span className="text-emerald-400 ml-1">Within Perimeter</span> : <span className="ml-1 text-[#A1AEC2]">Acquiring...</span>}
          </span>
          <span>Single-device enforcement</span>
        </div>
      </div>
    </div>
  );
};
