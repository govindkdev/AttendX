import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { AttendanceRecord } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { History, Camera, QrCode, UserCheck, Calendar, Filter } from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<string>('');

  useEffect(() => {
    api.getAttendanceHistory().then((data) => {
      setRecords(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = methodFilter
    ? records.filter((r) => r.verification_method === methodFilter)
    : records;

  const getMethodBadge = (m: string) => {
    if (m === 'FACE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Camera className="w-3 h-3 mr-1" /> Face Biometrics
        </span>
      );
    }
    if (m === 'QR') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <QrCode className="w-3 h-3 mr-1" /> Signed QR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <UserCheck className="w-3 h-3 mr-1" /> Manual / Correction
      </span>
    );
  };

  const getStatusBadge = (s: string) => {
    if (s === 'PRESENT') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Present</span>;
    }
    if (s === 'LATE') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Late</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Absent</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete verifiable log of your past lecture attendances and methods.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
          >
            <option value="">All Verification Methods</option>
            <option value="FACE">Face Biometrics</option>
            <option value="QR">Signed QR Code</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {r.subject_name} ({r.subject_code})
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>{r.date}</div>
                      <span className="text-[11px] text-slate-400">{new Date(r.recorded_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-4 px-6">{getMethodBadge(r.verification_method)}</td>
                    <td className="py-4 px-6">{getStatusBadge(r.status)}</td>
                    <td className="py-4 px-6 text-slate-500">
                      {r.remarks || '-'}
                      {r.is_corrected && (
                        <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                          Audited Correction
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No attendance records available"
          description="You do not have any recorded attendance transactions matching the selected criteria yet."
        />
      )}
    </div>
  );
};
