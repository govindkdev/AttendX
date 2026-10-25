import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { QrCode, CheckCircle2, AlertCircle, RefreshCw, MapPin, ScanLine } from 'lucide-react';

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
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">QR Code Attendance</h2>
        <p className="text-xs text-slate-500 mt-1">
          Scan or submit the HMAC-signed QR token projected by your course instructor.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">QR Attendance Confirmed!</h3>
              <p className="text-xs text-slate-600">
                Status: <span className="font-bold uppercase text-emerald-700">{result.status}</span> | Method: QR Scan
              </p>
            </div>
          </div>
          <div className="text-xs bg-white/80 p-3 rounded-xl border border-emerald-100 flex justify-between">
            <span>Subject: <strong>{result.subject_name}</strong></span>
            <span>Recorded: <strong>{new Date(result.recorded_at).toLocaleTimeString()}</strong></span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ScanLine className="w-8 h-8" />
        </div>

        <form onSubmit={handleVerifyQR} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              QR Code Token Data *
            </label>
            <textarea
              rows={4}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder='Paste or scan signed token: {"p":{"sid":...},"s":"..."}'
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            ></textarea>
            <p className="text-[11px] text-slate-400 mt-1">
              On supported camera scanners, scanned text is filled automatically.
            </p>
          </div>

          {gpsLocation && (
            <div className="flex items-center text-xs text-slate-500 space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus Geofence: Active (&plusmn;{Math.round(gpsLocation.acc)}m accuracy)</span>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || !tokenInput.trim()}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying Signed Token...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Submit QR Attendance
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
