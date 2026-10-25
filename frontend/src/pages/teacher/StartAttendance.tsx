import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Subject, LectureSession, AttendanceRecord } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
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
        api.getSubjects(),
        api.getActiveSessions(),
      ]);
      setSubjects(subs);
      if (subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id);
      }
      if (active.length > 0) {
        setActiveSession(active[0]);
        // Load existing records for active session
        api.getAttendanceHistory({ session_id: active[0].session_id }).then(setSessionRecords).catch(() => {});
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (activeSession) {
        api.getAttendanceHistory({ session_id: activeSession.session_id }).then(setSessionRecords).catch(() => {});
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
      // Run automatic absence processing
      await api.processAbsences(activeSession.session_id);
      alert('Lecture session completed! Automatic absence processing completed for non-attendees.');
      setActiveSession(null);
      setSessionRecords([]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error closing session');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Lecture Attendance Session</h2>
        <p className="text-xs text-slate-500 mt-1">
          Initiate biometric and QR attendance sessions for assigned course lectures.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeSession ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                &bull; Session Live & Active
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {activeSession.subject_name}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Code: {activeSession.session_code} | Scheduled: {activeSession.start_time.slice(0, 5)} - {activeSession.end_time.slice(0, 5)}
              </p>
            </div>

            <button
              onClick={handleCloseSession}
              disabled={closing}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              {closing ? 'Finalizing Absences...' : 'Close & Finalize Session'}
            </button>
          </div>

          {/* Live attendance count */}
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-200">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Attended Students</span>
                <p className="text-xl font-extrabold text-slate-900">{sessionRecords.length} recorded</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Syncing every 5s</span>
          </div>

          {/* Live Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Real-Time Verification Feed
            </h4>
            {sessionRecords.length > 0 ? (
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {sessionRecords.map((r) => (
                  <div key={r.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{r.student_name}</span>
                      <span className="text-slate-400 font-mono ml-2">({r.student_code})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {r.status}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(r.recorded_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No attendance records submitted yet. Students can now verify via Face or QR.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base">Launch New Attendance Session</h3>

          {subjects.length > 0 ? (
            <form onSubmit={handleStartSession} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Subject *
                </label>
                <select
                  value={selectedSubjectId || ''}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — Semester {s.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Session Duration
                </label>
                <div className="flex gap-3">
                  {[5, 15, 30, 50, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        duration === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {d} mins
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={starting || !selectedSubjectId}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center"
              >
                {starting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> Start Attendance Session
                  </>
                )}
              </button>
            </form>
          ) : (
            <EmptyState
              title="No subjects available"
              description="Subjects must be configured by the administrator before starting attendance."
            />
          )}
        </div>
      )}
    </div>
  );
};
