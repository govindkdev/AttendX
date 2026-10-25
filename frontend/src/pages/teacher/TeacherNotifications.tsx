import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LectureSession } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { Bell, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parent Absence Notifications</h2>
        <p className="text-xs text-slate-500 mt-1">
          Dispatch instant parent notices for students marked absent in completed or active lecture sessions.
        </p>
      </div>

      {resultMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resultMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {s.subject_name} ({s.session_code}) — {s.date}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSendAlerts}
          disabled={sending || !selectedSessionId}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center"
        >
          {sending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Dispatching Parent Alerts...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Send Absence Alerts to Registered Parents
            </>
          )}
        </button>
      </div>
    </div>
  );
};
