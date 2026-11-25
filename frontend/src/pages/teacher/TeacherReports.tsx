import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Subject } from '@/types';
import { Table, FileText, Download, Filter, Calendar } from 'lucide-react';

export const TeacherReports: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => {});
  }, []);

  const handleDownload = async (format: 'excel' | 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      await api.downloadReport(format, {
        subject_id: subjectId ? Number(subjectId) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status_filter: statusFilter || undefined,
      });
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
          Export Engine
        </span>
        <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
          Faculty Attendance Reports
        </h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Generate compliant audit logs, session summaries, and printable registers.
        </p>
      </div>

      {/* Filter Box */}
      <div className="bg-[#111D30] rounded-2xl p-6 sm:p-8 border border-[#23334A] space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-[#23334A]">
          <Filter className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-heading font-semibold text-[#F8FAFC] text-sm uppercase tracking-wider">
            Export Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
            >
              <option value="">All Assigned Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="pt-6 border-t border-[#23334A] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloading !== null}
            className="flex items-center justify-center p-4 rounded-xl border border-[#23334A] bg-[#0D1525] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-3 shrink-0 border border-emerald-500/20">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-[#F8FAFC] group-hover:text-emerald-400 transition-colors">
                Excel (.xlsx)
              </span>
              <span className="text-[11px] text-[#A1AEC2]">
                {downloading === 'excel' ? 'Exporting...' : 'Complete Excel Report'}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading !== null}
            className="flex items-center justify-center p-4 rounded-xl border border-[#23334A] bg-[#0D1525] hover:border-rose-500/50 hover:bg-rose-500/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mr-3 shrink-0 border border-rose-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-[#F8FAFC] group-hover:text-rose-400 transition-colors">
                PDF Document
              </span>
              <span className="text-[11px] text-[#A1AEC2]">
                {downloading === 'pdf' ? 'Generating...' : 'Printable Roster'}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading !== null}
            className="flex items-center justify-center p-4 rounded-xl border border-[#23334A] bg-[#0D1525] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center mr-3 shrink-0 border border-[#3B82F6]/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-[#F8FAFC] group-hover:text-[#3B82F6] transition-colors">
                CSV Raw Data
              </span>
              <span className="text-[11px] text-[#A1AEC2]">
                {downloading === 'csv' ? 'Exporting...' : 'Tabular Raw Export'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
