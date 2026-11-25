import React, { useState } from 'react';
import { api } from '@/services/api';
import { FileSpreadsheet, Download, FileText, Table } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';

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
    <div className="max-w-4xl mx-auto space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Attendance Reports & Exports</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Generate and export official student attendance transcripts for records or scholarship compliance.
        </p>
      </div>

      <div className="bg-[#111D30] rounded-3xl p-6 sm:p-8 border border-[#23334A] shadow-xl space-y-6">
        <h3 className="font-bold text-[#F8FAFC] text-base">Filter Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <FormInput
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-1.5">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#0D1525] px-3.5 py-2.5 rounded-xl border border-[#23334A] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="LATE">Late Only</option>
              <option value="ABSENT">Absent Only</option>
            </select>
          </div>
        </div>

        {/* Export Formats */}
        <div className="pt-6 border-t border-[#23334A] space-y-4">
          <h4 className="text-xs font-bold text-[#A1AEC2] uppercase tracking-wider">
            Export Transcript Formats
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleDownload('excel')}
              disabled={!!downloading}
              className="p-5 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#22C55E]/40 hover:bg-[#16243A]/50 transition-all text-left flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-6 h-6 text-[#22C55E]" />
                <Download className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#F8FAFC] block">Microsoft Excel (.xlsx)</span>
                <span className="text-[11px] text-[#A1AEC2]">Formatted workbook with formulas</span>
              </div>
            </button>

            <button
              onClick={() => handleDownload('csv')}
              disabled={!!downloading}
              className="p-5 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#3B82F6]/40 hover:bg-[#16243A]/50 transition-all text-left flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <Table className="w-6 h-6 text-[#3B82F6]" />
                <Download className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#F8FAFC] block">Raw CSV Dataset (.csv)</span>
                <span className="text-[11px] text-[#A1AEC2]">Plain comma-separated data</span>
              </div>
            </button>

            <button
              onClick={() => handleDownload('pdf')}
              disabled={!!downloading}
              className="p-5 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#EF4444]/40 hover:bg-[#16243A]/50 transition-all text-left flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <FileText className="w-6 h-6 text-[#EF4444]" />
                <Download className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#F8FAFC] block">Academic Transcript (.pdf)</span>
                <span className="text-[11px] text-[#A1AEC2]">Institutional verified printable</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
