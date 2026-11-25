import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Subject, Department, Course } from '@/types';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Filter States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [subs, depts, crs] = await Promise.all([
          api.getSubjects(),
          api.getDepartments(),
          api.getCourses(),
        ]);
        setSubjects(subs);
        setDepartments(depts);
        setCourses(crs);
      } catch (err: any) {
        setFeedback({ type: 'error', text: err.message || 'Failed to load report filter options' });
      }
    };
    loadFilters();
  }, []);

  const handleDownload = async (format: 'excel' | 'csv' | 'pdf') => {
    setDownloadingFormat(format);
    setFeedback(null);
    try {
      await api.downloadReport(format, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        subject_id: selectedSubject ? Number(selectedSubject) : undefined,
        department_id: selectedDepartment ? Number(selectedDepartment) : undefined,
        course_id: selectedCourse ? Number(selectedCourse) : undefined,
        status: statusFilter || undefined,
      });
      setFeedback({
        type: 'success',
        text: `Official ${format.toUpperCase()} attendance report generated and downloaded.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || `Failed to export ${format.toUpperCase()} report.`,
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Institutional Audit & Export
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#3B82F6]" />
            Institutional Reports & Data Exports
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Export verified attendance ledgers, compliance audits, and academic attendance summaries in Excel, CSV, or PDF format.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-[#A1AEC2] hover:text-[#F8FAFC]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Filter Configurator */}
        <div className="lg:col-span-2 bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-6">
          <h2 className="text-sm font-bold font-heading text-[#F8FAFC] pb-3 border-b border-[#23334A] flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#3B82F6]" />
            Report Parameters & Scope
          </h2>

          <div className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>
            </div>

            {/* Department & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Academic Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Specific Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Attendance Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="">All Statuses (Present, Late, Absent, Excused)</option>
                  <option value="PRESENT">Only Present</option>
                  <option value="LATE">Only Late</option>
                  <option value="ABSENT">Only Absent</option>
                  <option value="EXCUSED">Only Excused</option>
                </select>
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="pt-6 border-t border-[#23334A] space-y-3">
            <span className="text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider block">
              Generate & Download
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleDownload('excel')}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {downloadingFormat === 'excel' ? 'Exporting...' : 'Excel (.xlsx)'}
              </button>

              <button
                type="button"
                onClick={() => handleDownload('csv')}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-[#0D1525] hover:bg-[#16243A] text-[#F8FAFC] border border-[#23334A] transition shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#3B82F6]" />
                {downloadingFormat === 'csv' ? 'Exporting...' : 'CSV (.csv)'}
              </button>

              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {downloadingFormat === 'pdf' ? 'Generating...' : 'Official PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Standards Information */}
        <div className="space-y-4">
          <div className="bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-4">
            <h3 className="text-sm font-bold font-heading text-[#F8FAFC] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
              Compliance Specifications
            </h3>
            <ul className="text-xs text-[#A1AEC2] space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="text-[#3B82F6] font-bold">&bull;</span>
                <span>All exports include immutable cryptographic timestamp metadata.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#3B82F6] font-bold">&bull;</span>
                <span>Verification vectors (Biometric Face, Signed QR, Manual Override) are distinctly tagged.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#3B82F6] font-bold">&bull;</span>
                <span>Suitable for University UGC / AICTE accreditation compliance submissions.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
