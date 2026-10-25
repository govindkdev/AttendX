import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LectureSession } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { QrCode, RefreshCw, Clock, Check, Copy, AlertCircle, ShieldCheck } from 'lucide-react';

export const QRAttendance: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<LectureSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getActiveSessions().then((sessions) => {
      setActiveSessions(sessions);
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0].session_id);
      }
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.generateQRToken(selectedSessionId, 30);
      setQrToken(res.qr_token);
      setExpiresAt(res.expires_at);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate signed QR token.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">QR Attendance Projection</h2>
        <p className="text-xs text-slate-500 mt-1">
          Generate an HMAC-SHA256 signed, expiring QR code for classroom projection.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeSessions.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No Active Lecture Sessions"
          description="Start an active lecture session first before generating a signed QR token."
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Lecture Session *
            </label>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
            >
              {activeSessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.subject_name} ({s.session_code}) [{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}]
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedSessionId}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Signing Token...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" /> Generate Signed QR Token
              </>
            )}
          </button>

          {/* QR Display */}
          {qrToken && (
            <div className="pt-6 border-t border-slate-100 text-center space-y-4">
              <div className="inline-block p-6 rounded-3xl bg-slate-900 border-4 border-slate-800 shadow-2xl">
                {/* SVG QR Code Simulation / High contrast visual */}
                <div className="w-64 h-64 bg-white p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-slate-300">
                  <div className="w-full h-full bg-slate-100 rounded-xl flex flex-col items-center justify-center p-3 text-center border-2 border-dashed border-slate-400">
                    <QrCode className="w-24 h-24 text-slate-800 animate-pulse mb-2" />
                    <span className="font-mono text-[10px] text-slate-500 break-all line-clamp-3">
                      {qrToken}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-xs text-slate-500 space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  Expires at: <strong>{new Date(expiresAt || '').toLocaleTimeString()}</strong> (Valid 30 mins)
                </span>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  {copied ? 'Copied Token!' : 'Copy Token String'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
