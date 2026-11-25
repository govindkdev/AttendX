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
    api.getActiveSessions()
      .then((sessions) => {
        setActiveSessions(sessions || []);
        if (sessions && sessions.length > 0) {
          setSelectedSessionId(sessions[0].session_id);
        }
      })
      .catch(() => setActiveSessions([]));
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
    <div className="max-w-2xl mx-auto space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">QR Attendance Projection</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Generate a dynamic, time-limited QR token for classroom screen projection.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
        <div className="bg-[#111D30] rounded-3xl p-6 sm:p-8 border border-[#23334A] shadow-xl space-y-6">
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
                  {s.subject_name} ({s.session_code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Token...</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Generate Dynamic QR Code</span>
              </>
            )}
          </button>

          {qrToken && (
            <div className="pt-6 border-t border-[#23334A] text-center space-y-4">
              <div className="w-56 h-56 mx-auto bg-white p-4 rounded-2xl flex items-center justify-center shadow-xl border-4 border-[#3B82F6]">
                {/* SVG QR Code Simulation */}
                <div className="text-center">
                  <QrCode className="w-36 h-36 mx-auto text-[#080D19]" />
                  <span className="text-[10px] font-mono font-bold text-[#080D19] block mt-1 tracking-widest">
                    ATTENDX-SECURE-QR
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-xs text-[#A1AEC2]">
                  <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>
                    Valid until:{' '}
                    <strong className="text-[#F8FAFC]">
                      {expiresAt ? new Date(expiresAt).toLocaleTimeString() : '30 seconds'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={qrToken}
                    className="w-full max-w-sm bg-[#0D1525] border border-[#23334A] rounded-xl px-3 py-1.5 text-xs font-mono text-[#22D3EE] text-center truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-[#16243A] hover:bg-[#1D304D] text-[#A1AEC2] hover:text-[#F8FAFC] border border-[#23334A] transition-colors"
                    title="Copy token string"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
