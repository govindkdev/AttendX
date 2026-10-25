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
  ShieldAlert,
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-indigo-600" />
          Institutional Reports & Data Exports
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Export verified attendance ledgers, compliance audits, and academic attendance summaries in Excel, CSV, or PDF format.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Filter Configurator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Report Parameters & Scope
          </h2>

          <div className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Department & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Generate & Download
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleDownload('excel')}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {downloadingFormat === 'excel' ? 'Exporting...' : 'Excel (.xlsx)'}
              </button>

              <button
                type="button"
                onClick={() => handleDownload('csv')}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white transition shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingFormat === 'csv' ? 'Exporting...' : 'CSV (.csv)'}
              </button>

              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {downloadingFormat === 'pdf' ? 'Generating...' : 'Official PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Standards Information */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Security & Integrity Standards
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Formula Injection Sanitization:</strong> All exported cells beginning with =, +, -, or @ are
                  prefixed to prevent spreadsheet formula execution exploits.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>UTF-8 BOM Encoding:</strong> CSV exports feature Byte Order Mark headers ensuring non-English
                  character fidelity across Microsoft Excel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Audited Generation:</strong> Every report download is recorded in the immutable audit log with
                  administrator user ID and time.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 text-xs text-indigo-950">
            <h4 className="font-bold mb-1 text-indigo-900">GCRG Academic Governance</h4>
            <p className="leading-relaxed text-indigo-800/90">
              Official PDF reports include the GCRG Group of Institutions header, Lucknow campus seal, and timestamp
              verification block for accreditation and examination eligibility reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
