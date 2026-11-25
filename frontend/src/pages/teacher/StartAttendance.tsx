import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Subject, LectureSession, AttendanceRecord } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Camera, Play, StopCircle, Clock, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const StartAttendance: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(50);

  const [activeSession, setActiveSession] = useState<LectureSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);

  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [subs, active] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getActiveSessions().catch(() => []),
      ]);
      setSubjects(subs || []);
      if (subs && subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id);
      }
      if (active && active.length > 0) {
        setActiveSession(active[0]);
        api.getAttendanceHistory({ session_id: active[0].session_id })
          .then((recs) => setSessionRecords(recs || []))
          .catch(() => {});
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (activeSession) {
        api.getAttendanceHistory({ session_id: activeSession.session_id })
          .then((recs) => setSessionRecords(recs || []))
          .catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSession?.session_id]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;

    setStarting(true);
    setErrorMsg(null);

    try {
      const sess = await api.startSession({
        subject_id: selectedSubjectId,
        duration_minutes: duration,
      });
      setActiveSession(sess);
      setSessionRecords([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start lecture session.');
    } finally {
      setStarting(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    setClosing(true);
    try {
      await api.closeSession(activeSession.session_id);
      await api.processAbsences(activeSession.session_id).catch(() => {});
      setActiveSession(null);
      setSessionRecords([]);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to close lecture session.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Initiate & Manage Attendance Session
        </h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Launch a live verified attendance window for enrolled students to mark presence via facial recognition or QR token.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Session Console */}
      {activeSession ? (
        <div className="bg-[#111D30] rounded-3xl p-6 sm:p-8 border border-[#23334A] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#23334A] pb-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-pulse" />
                <span className="text-xs font-mono font-bold text-[#22D3EE] uppercase tracking-wider">
                  LIVE SESSION ACTIVE
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
                {activeSession.subject_name}
              </h3>
              <p className="text-xs text-[#A1AEC2]">
                Session Code: <span className="font-mono text-[#F8FAFC] font-semibold">{activeSession.session_code}</span> | Duration: {activeSession.start_time} - {activeSession.end_time}
              </p>
            </div>

            <button
              onClick={handleCloseSession}
              disabled={closing}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              {closing ? 'Ending Session...' : 'End & Process Absences'}
            </button>
          </div>

          {/* Real-time counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A]">
              <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">
                Logged Attendees
              </span>
              <p className="font-stats text-2xl font-bold text-emerald-400 mt-1">
                {sessionRecords.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A]">
              <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">
                Face Biometrics
              </span>
              <p className="font-stats text-2xl font-bold text-[#3B82F6] mt-1">
                {sessionRecords.filter((r) => r.verification_method === 'FACE').length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A] col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">
                QR Scans
              </span>
              <p className="font-stats text-2xl font-bold text-[#8B5CF6] mt-1">
                {sessionRecords.filter((r) => r.verification_method === 'QR').length}
              </p>
            </div>
          </div>

          {/* Real-time Attendee Stream */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#A1AEC2] uppercase tracking-wider">
              Real-Time Verified Stream (Live Polling)
            </h4>
            {sessionRecords.length > 0 ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-[#23334A]/50 bg-[#0D1525] rounded-2xl border border-[#23334A]">
                {sessionRecords.map((rec) => (
                  <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">{rec.student_name}</span>
                      <span className="text-[10px] text-[#A1AEC2] font-mono">{rec.roll_number || rec.student_code}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {new Date(rec.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <StatusBadge status={rec.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#0D1525] rounded-2xl border border-[#23334A] text-xs text-[#64748B]">
                Waiting for student submissions... Ensure students are verifying via Face Attendance or QR scan.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Launch Session Form */
        <div className="bg-[#111D30] rounded-3xl p-6 sm:p-8 border border-[#23334A] shadow-xl max-w-xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F8FAFC]">Start New Attendance Session</h3>
              <p className="text-xs text-[#A1AEC2]">Select subject and active window duration</p>
            </div>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Course Subject
              </label>
              <select
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full bg-[#0D1525] border border-[#23334A] text-[#F8FAFC] rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#3B82F6]"
                required
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code}) — Semester {sub.semester}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Lecture Window Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#0D1525] border border-[#23334A] text-[#F8FAFC] rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#3B82F6]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={starting || subjects.length === 0}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <Play className="w-4 h-4" />
              <span>{starting ? 'Initializing Session...' : 'Start Live Lecture Session'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
