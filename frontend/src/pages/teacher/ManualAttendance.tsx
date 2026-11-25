import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LectureSession, StudentListItem, AttendanceRecord } from '@/types';
import { CheckCircle2, AlertCircle, Edit3, UserCheck, ShieldCheck, FileCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
      setSuccessMsg('Manual attendance record logged with verified audit trail.');
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
      setSuccessMsg('Audited attendance correction committed to immutable log.');
      setCorrectionReason('');
      api.getAttendanceHistory().then(setExistingRecords);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to correct attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Faculty Verification Desk
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Manual Entry & Audited Corrections
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Faculty authorized attendance overrides with timestamped audit justifications.
          </p>
        </div>

        <button
          onClick={() => {
            setCorrectionMode(!correctionMode);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className="px-4 py-2 rounded-xl border border-[#23334A] bg-[#0D1525] text-xs font-semibold text-[#F8FAFC] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors flex items-center space-x-2"
        >
          {correctionMode ? (
            <>
              <UserCheck className="w-4 h-4 text-[#3B82F6]" />
              <span>Switch to New Manual Entry</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 text-[#F59E0B]" />
              <span>Switch to Audited Correction</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!correctionMode ? (
        <div className="bg-[#111D30] rounded-2xl p-6 sm:p-8 border border-[#23334A] space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#23334A]">
            <FileCheck className="w-5 h-5 text-[#3B82F6]" />
            <h3 className="font-heading font-semibold text-[#F8FAFC] text-base">Record Manual Attendance</h3>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Active Lecture Session *
              </label>
              <select
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#23334A] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
              >
                {sessions.length === 0 && <option value="">No active sessions available</option>}
                {sessions.map((s) => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.subject_name} ({s.session_code}) — {s.date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Student *
              </label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#23334A] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
              >
                {students.length === 0 && <option value="">No enrolled students found</option>}
                {students.map((st) => (
                  <option key={st.profile_id} value={st.profile_id}>
                    {st.full_name} ({st.student_id} / Roll: {st.roll_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Attendance Status *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
                  <label
                    key={st}
                    className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                      status === st
                        ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#F8FAFC] font-semibold'
                        : 'border-[#23334A] bg-[#0D1525] text-[#A1AEC2] hover:border-[#3B82F6]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={st}
                      checked={status === st}
                      onChange={() => setStatus(st)}
                      className="sr-only"
                    />
                    <StatusBadge status={st} />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Faculty Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Verified lab report checkpoint"
                className="w-full px-4 py-2.5 rounded-xl border border-[#23334A] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedSessionId || !selectedStudentId}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Recording...' : 'Commit Manual Attendance'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-[#111D30] rounded-2xl p-6 sm:p-8 border border-[#23334A] space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#23334A]">
            <Edit3 className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="font-heading font-semibold text-[#F8FAFC] text-base">Audited Attendance Correction</h3>
          </div>

          <form onSubmit={handleCorrectionSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Select Existing Attendance Record *
              </label>
              <select
                value={selectedRecordId || ''}
                onChange={(e) => setSelectedRecordId(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#23334A] text-xs font-mono focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
              >
                <option value="">Select a logged record</option>
                {existingRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    ID {r.id}: {r.student_name} ({r.roll_number}) — {r.subject_code} [{r.date}] — Current: {r.status} ({r.verification_method})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                New Corrected Status *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
                  <label
                    key={st}
                    className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                      status === st
                        ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F8FAFC] font-semibold'
                        : 'border-[#23334A] bg-[#0D1525] text-[#A1AEC2] hover:border-[#F59E0B]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="corr_status"
                      value={st}
                      checked={status === st}
                      onChange={() => setStatus(st)}
                      className="sr-only"
                    />
                    <StatusBadge status={st} />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                Mandatory Correction Reason *
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="State verified institutional justification (e.g. Student represented university in official sports tournament)..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#23334A] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B]"
              />
              <p className="text-[11px] text-[#64748B] mt-1.5 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Correction reasons are permanently written to audit logs with faculty identity tag.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRecordId || !correctionReason.trim()}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Recording Correction...' : 'Save Audited Correction'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
