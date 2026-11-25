import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { AttendanceRecord, Subject } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Camera,
  QrCode,
  FileSpreadsheet,
  AlertCircle,
  X,
  RefreshCw,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Correction Modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const [hist, subs] = await Promise.all([
        api.getAttendanceHistory({
          subject_id: selectedSubject ? Number(selectedSubject) : undefined,
          status: selectedStatus || undefined,
          date: dateFilter || undefined,
        }),
        api.getSubjects(),
      ]);
      setRecords(hist);
      setSubjects(subs);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load attendance records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject, selectedStatus, dateFilter]);

  const handleCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!correctionReason.trim()) {
      setStatusMsg({ type: 'error', text: 'Audited correction reason is required.' });
      return;
    }

    setSubmittingCorrection(true);
    try {
      await api.correctAttendance({
        record_id: editingRecord.id,
        new_status: newStatus,
        reason: correctionReason.trim(),
      });
      setStatusMsg({ type: 'success', text: `Attendance updated to ${newStatus} with audit trail.` });
      setEditingRecord(null);
      setCorrectionReason('');
      await loadData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to apply correction' });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const filteredRecords = records.filter((rec) => {
    if (selectedMethod && rec.verification_method !== selectedMethod) return false;
    return true;
  });

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Master Attendance Registry
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Institutional Attendance Records
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Comprehensive audit-ready attendance stream with multi-factor verification vectors.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-[#A1AEC2] hover:text-[#F8FAFC]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Total Records</span>
          <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{records.length}</p>
        </div>
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase block">Present</span>
          <p className="text-2xl font-extrabold font-stats text-emerald-400 mt-1">{presentCount}</p>
        </div>
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-[11px] font-semibold text-amber-400 uppercase block">Late</span>
          <p className="text-2xl font-extrabold font-stats text-amber-400 mt-1">{lateCount}</p>
        </div>
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-[11px] font-semibold text-rose-400 uppercase block">Absent</span>
          <p className="text-2xl font-extrabold font-stats text-rose-400 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A] flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
            className="w-full text-xs border border-[#23334A] rounded-xl px-3 py-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs border border-[#23334A] rounded-xl px-3 py-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </div>

        <div className="w-36">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full text-xs border border-[#23334A] rounded-xl px-3 py-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="">All Methods</option>
            <option value="FACE">Face Recognition</option>
            <option value="QR">Signed QR</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div className="w-40">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs border border-[#23334A] rounded-xl px-3 py-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        {(selectedSubject || selectedStatus || selectedMethod || dateFilter) && (
          <button
            onClick={() => {
              setSelectedSubject('');
              setSelectedStatus('');
              setSelectedMethod('');
              setDateFilter('');
            }}
            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#A1AEC2] text-xs">Loading attendance records...</div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="No attendance records match the current filters. Live check-in data will appear here once lectures are conducted."
            icon={CalendarCheck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A1AEC2]">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase font-semibold border-b border-[#23334A]">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Subject & Session</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Remarks / GPS</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#F8FAFC]">{rec.student_name || `ID #${rec.student_id}`}</div>
                      <div className="text-[11px] text-[#64748B]">{rec.student_roll || `Roll: —`}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#F8FAFC]">{rec.subject_name || `Session #${rec.session_id}`}</div>
                      <div className="text-[11px] text-[#A1AEC2]">{rec.subject_code}</div>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-[#A1AEC2]">
                      {rec.timestamp ? new Date(rec.timestamp).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {rec.verification_method === 'FACE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          <Camera className="w-3 h-3" /> Face
                        </span>
                      ) : rec.verification_method === 'QR' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <QrCode className="w-3 h-3" /> QR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#16243A] text-[#A1AEC2] border border-[#23334A]">
                          <Edit3 className="w-3 h-3" /> Manual
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={rec.status as any} />
                    </td>
                    <td className="px-5 py-4 text-[11px] text-[#A1AEC2] max-w-xs truncate">
                      {rec.remarks || (rec.gps_verified ? 'GPS Verified' : 'Standard Check-in')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingRecord(rec);
                          setNewStatus(rec.status);
                          setCorrectionReason('');
                        }}
                        className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#F59E0B] hover:bg-[#16243A] transition-colors"
                        title="Audited Attendance Override"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audited Correction Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#23334A] relative">
            <button
              onClick={() => setEditingRecord(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
              <span>Audited Attendance Correction</span>
            </h3>
            <p className="text-xs text-[#A1AEC2] mb-4">
              Override attendance for <span className="font-semibold text-[#F8FAFC]">{editingRecord.student_name}</span> in {editingRecord.subject_code}.
            </p>

            <form onSubmit={handleCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">New Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        newStatus === st
                          ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F8FAFC]'
                          : 'border-[#23334A] bg-[#0D1525] text-[#A1AEC2] hover:border-[#F59E0B]/40'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Mandatory Audit Justification *
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Official justification (e.g. Approved medical certificate verified by Dean)..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Permanently archived to tamper-evident audit logs with administrator credentials.
                </p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection || !correctionReason.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-amber-500/20"
                >
                  {submittingCorrection ? 'Logging...' : 'Commit Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
