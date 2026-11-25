import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { AttendanceRecord } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SearchBar } from '@/components/ui/SearchBar';
import { History, Camera, QrCode, UserCheck, Filter, Calendar } from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');

  useEffect(() => {
    api.getAttendanceHistory()
      .then((data) => {
        setRecords(data || []);
        setLoading(false);
      })
      .catch(() => {
        setRecords([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = records.filter((r) => {
    const matchesMethod = methodFilter ? r.verification_method === methodFilter : true;
    const matchesSearch = search
      ? (r.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.subject_code || '').toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesMethod && matchesSearch;
  });

  const getMethodBadge = (m: string) => {
    if (m === 'FACE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-[#3B82F6] border border-blue-500/20">
          <Camera className="w-3 h-3 mr-1" /> Face Biometrics
        </span>
      );
    }
    if (m === 'QR') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20">
          <QrCode className="w-3 h-3 mr-1" /> Dynamic QR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#16243A] text-[#A1AEC2] border border-[#23334A]">
        <UserCheck className="w-3 h-3 mr-1" /> Manual Override
      </span>
    );
  };

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Attendance History</h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Complete verifiable log of past lecture attendance sessions and verification vectors.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <SearchBar value={search} onChange={setSearch} placeholder="Filter by subject..." />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#64748B]" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#0D1525] border border-[#23334A] text-[#F8FAFC] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="">All Verification Vectors</option>
              <option value="FACE">Face Biometrics</option>
              <option value="QR">Dynamic QR</option>
              <option value="MANUAL">Manual Entry</option>
              <option value="CORRECTION">Correction History</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No attendance records found"
          description="Records will populate here automatically as your faculty conducts attendance sessions."
          icon={History}
        />
      ) : (
        <div className="bg-[#111D30] rounded-3xl border border-[#23334A] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D1525] border-b border-[#23334A] text-[#A1AEC2] uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-semibold">Subject</th>
                  <th className="px-5 py-3.5 font-semibold">Date & Lecture Period</th>
                  <th className="px-5 py-3.5 font-semibold">Verification Vector</th>
                  <th className="px-5 py-3.5 font-semibold">GPS Telemetry</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]/50">
                {filtered.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-[#16243A]/40 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-[#F8FAFC] text-sm block">
                        {r.subject_name || r.subject_code}
                      </span>
                      {r.subject_code && (
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {r.subject_code}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#A1AEC2]">
                      <div className="flex items-center space-x-1.5 font-medium text-[#F8FAFC]">
                        <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>{r.date}</span>
                      </div>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        {r.start_time?.slice(0, 5)} – {r.end_time?.slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-5 py-4">{getMethodBadge(r.verification_method)}</td>
                    <td className="px-5 py-4">
                      {r.gps_verified ? (
                        <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                          ✓ Verified on campus
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#64748B]">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
