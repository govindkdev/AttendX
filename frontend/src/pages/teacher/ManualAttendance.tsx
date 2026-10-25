import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LectureSession, StudentListItem, AttendanceRecord } from '@/types';
import { UserCheck, CheckCircle2, AlertCircle, RefreshCw, Edit3 } from 'lucide-react';

export const ManualAttendance: React.FC = () => {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [status, setStatus] = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [remarks, setRemarks] = useState('');

  // Correction Mode
  const [correctionMode, setCorrectionMode] = useState(false);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getActiveSessions().then((s) => {
      setSessions(s);
      if (s.length > 0) setSelectedSessionId(s[0].session_id);
    });
    api.getStudents().then((stus) => {
      setStudents(stus);
      if (stus.length > 0) setSelectedStudentId(stus[0].profile_id);
    });
    api.getAttendanceHistory().then(setExistingRecords);
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !selectedStudentId) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.markManualAttendance({
        session_id: selectedSessionId,
        student_id: selectedStudentId,
        status,
        remarks: remarks.trim() || undefined,
      });
      setSuccessMsg('Manual attendance record logged with audit trail.');
      setRemarks('');
      api.getAttendanceHistory().then(setExistingRecords);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to log manual attendance.');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId || !correctionReason.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.correctAttendance({
        record_id: selectedRecordId,
        new_status: status,
        reason: correctionReason.trim(),
      });
      setSuccessMsg('Attendance correction saved and audited.');
      setCorrectionReason('');
      api.getAttendanceHistory().then(setExistingRecords);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to correct attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Attendance & Corrections</h2>
          <p className="text-xs text-slate-500 mt-1">
            Faculty override entry and audited status adjustments with mandatory reasons.
          </p>
        </div>

        <button
          onClick={() => {
            setCorrectionMode(!correctionMode);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
        >
          {correctionMode ? 'Switch to New Manual Entry' : 'Switch to Audited Correction'}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!correctionMode ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base">Record Manual Attendance</h3>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Lecture Session *
              </label>
              <select
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                {sessions.map((s) => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.subject_name} ({s.session_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Student *
              </label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                {students.map((st) => (
                  <option key={st.profile_id} value={st.profile_id}>
                    {st.full_name} ({st.student_id} / Roll: {st.roll_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Attendance Status *
              </label>
              <div className="flex gap-4">
                {(['PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
                  <label key={st} className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={st}
                      checked={status === st}
                      onChange={() => setStatus(st)}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Approved lab manual check"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedSessionId || !selectedStudentId}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center"
            >
              {loading ? 'Recording...' : 'Commit Manual Attendance'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base flex items-center">
            <Edit3 className="w-5 h-5 mr-2 text-amber-600" />
            Audited Attendance Correction
          </h3>

          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Existing Attendance Record *
              </label>
              <select
                value={selectedRecordId || ''}
                onChange={(e) => setSelectedRecordId(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono text-xs"
              >
                <option value="">Select a record</option>
                {existingRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    ID {r.id}: {r.student_name} ({r.roll_number}) - {r.subject_code} [{r.date}] - Currently {r.status} ({r.verification_method})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Corrected Status *
              </label>
              <div className="flex gap-4">
                {(['PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
                  <label key={st} className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="corr_status"
                      value={st}
                      checked={status === st}
                      onChange={() => setStatus(st)}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mandatory Correction Reason *
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="State verified institutional justification (e.g. Student was attending university sports trial)..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              ></textarea>
              <p className="text-[11px] text-slate-400 mt-1">
                Correction reasons are permanently written to audit logs with your faculty credentials.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRecordId || !correctionReason.trim()}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md shadow-amber-600/20 flex items-center justify-center"
            >
              {loading ? 'Recording Correction...' : 'Save Audited Correction'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
