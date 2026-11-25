import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LectureSession } from '@/types';
import { Bell, Send, CheckCircle2, AlertCircle, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export const TeacherNotifications: React.FC = () => {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getActiveSessions().then((s) => {
      setSessions(s);
      if (s.length > 0) setSelectedSessionId(s[0].session_id);
    });
  }, []);

  const handleSendAlerts = async () => {
    if (!selectedSessionId) return;
    setSending(true);
    setResultMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.sendSessionAlerts(selectedSessionId);
      setResultMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch absence alerts.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
          Automated Dispatches
        </span>
        <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
          Parent Absence Notifications
        </h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Dispatch instant parent notices for students marked absent in completed or active lecture sessions.
        </p>
      </div>

      {resultMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resultMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-[#111D30] rounded-2xl p-6 sm:p-8 border border-[#23334A] space-y-6">
        <div>
          <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
            Target Lecture Session *
          </label>
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-[#23334A] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
          >
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {s.subject_name} ({s.session_code}) — {s.date}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1525] border border-[#23334A] space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#22D3EE]">
            <ShieldAlert className="w-4 h-4" />
            <span>Policy Guard</span>
          </div>
          <p className="text-xs text-[#A1AEC2]">
            Alerts are queued through SMS/Email endpoints only for students flagged as ABSENT in this session. Verified parent contacts receive timestamped classroom session codes.
          </p>
        </div>

        <button
          onClick={handleSendAlerts}
          disabled={sending || !selectedSessionId}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
        >
          {sending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Dispatching Parent Alerts...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Absence Alerts to Registered Parents</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
