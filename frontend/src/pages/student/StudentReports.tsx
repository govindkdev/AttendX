import React, { useState } from 'react';
import { api } from '@/services/api';
import { FileSpreadsheet, Download, FileText, Table } from 'lucide-react';

export const StudentReports: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'excel' | 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      await api.downloadReport(format, {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status_filter: statusFilter || undefined,
      });
    } catch (err: any) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Reports & Exports</h2>
        <p className="text-xs text-slate-500 mt-1">
          Generate and download official student attendance transcripts for your records or scholarship verifications.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-900 text-base">Filter Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="LATE">Late Only</option>
              <option value="ABSENT">Absent Only</option>
            </select>
          </div>
        </div>

        {/* Download Options */}
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
                {downloading === 'excel' ? 'Exporting...' : 'Formatted Spreadsheet'}
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
                {downloading === 'pdf' ? 'Generating...' : 'Printable Transcript'}
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
                {downloading === 'csv' ? 'Exporting...' : 'Raw UTF-8 Table'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
