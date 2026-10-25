import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { AttendanceRecord, Subject } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
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
      setStatusMsg({ type: 'error', text: err.message || 'Failed to apply attendance correction.' });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (selectedMethod && r.verification_method !== selectedMethod) return false;
    return true;
  });

  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            Institutional Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time attendance logs, multi-factor verification verification, and audited status corrections.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Evaluated</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Present</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{presentCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Late</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{lateCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Absent</span>
          <p className="text-2xl font-bold text-rose-700 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading attendance records...</div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="No attendance records match the current filters. Live check-in data will appear here once lectures are conducted."
            icon={CalendarCheck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Subject & Session</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Remarks / GPS</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{rec.student_name || `ID #${rec.student_id}`}</div>
                      <div className="text-xs text-slate-400">{rec.student_roll || `Roll: —`}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{rec.subject_name || `Session #${rec.session_id}`}</div>
                      <div className="text-xs text-slate-500">{rec.subject_code}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {rec.timestamp ? new Date(rec.timestamp).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {rec.verification_method === 'FACE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Camera className="w-3 h-3" /> Face
                        </span>
                      ) : rec.verification_method === 'QR' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <QrCode className="w-3 h-3" /> QR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Edit3 className="w-3 h-3" /> Manual
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {rec.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Present
                        </span>
                      ) : rec.status === 'LATE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Late
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Absent
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {rec.remarks || (rec.gps_verified ? 'GPS Verified' : 'Standard')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingRecord(rec);
                          setNewStatus(rec.status);
                          setCorrectionReason('');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold p-1 hover:bg-indigo-50 rounded transition"
                        title="Audited Status Correction"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audited Status Correction Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                Audited Status Correction
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrection} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Student:</span>{' '}
                  {editingRecord.student_name || `#${editingRecord.student_id}`}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Subject:</span>{' '}
                  {editingRecord.subject_name || `Session #${editingRecord.session_id}`}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Current Status:</span>{' '}
                  <span className="font-bold text-slate-900">{editingRecord.status}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="EXCUSED">EXCUSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correction Justification / Audit Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Validated medical slip or classroom attendance discrepancy confirmed by faculty."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This action is permanently logged with your administrator user ID and timestamp.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
                >
                  {submittingCorrection ? 'Saving...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
