import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Subject } from '@/types';
import { FileSpreadsheet, Table, FileText, Download } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Attendance Reports</h2>
        <p className="text-xs text-slate-500 mt-1">
          Export comprehensive attendance logs for your conducted lecture sessions.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloading !== null}
            className="flex items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 shrink-0">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                Excel (.xlsx)
              </span>
              <span className="text-[11px] text-slate-500">
                {downloading === 'excel' ? 'Exporting...' : 'Complete Excel Report'}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading !== null}
            className="flex items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mr-3 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900 group-hover:text-rose-700">
                PDF Document
              </span>
              <span className="text-[11px] text-slate-500">
                {downloading === 'pdf' ? 'Generating...' : 'Printable Roster'}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading !== null}
            className="flex items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mr-3 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900 group-hover:text-blue-700">
                CSV Data
              </span>
              <span className="text-[11px] text-slate-500">
                {downloading === 'csv' ? 'Exporting...' : 'Raw CSV Export'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
