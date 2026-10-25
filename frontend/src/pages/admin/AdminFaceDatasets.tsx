import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { StudentListItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FaceEnrollmentModal } from '@/features/face-recognition/FaceEnrollmentModal';
import {
  ScanFace,
  CheckCircle2,
  Clock,
  RotateCcw,
  Camera,
  Search,
  X,
} from 'lucide-react';

export const AdminFaceDatasets: React.FC = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'pending'>('all');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Enroll Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleResetBiometrics = async (student: StudentListItem) => {
    if (
      !window.confirm(
        `Are you sure you want to reset the biometric face template for ${student.full_name} (${student.student_id})? The student will need to re-enroll their face.`
      )
    ) {
      return;
    }

    try {
      await api.resetFaceEnrollment(student.profile_id);
      setFeedback({
        type: 'success',
        text: `Biometric face template reset for ${student.full_name}.`,
      });
      await loadStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to reset biometric template.' });
    }
  };

  const handleOpenEnroll = (student: StudentListItem) => {
    setSelectedStudent(student);
    setEnrollModalOpen(true);
  };

  const handleEnrollSuccess = (msg: string) => {
    setEnrollModalOpen(false);
    setSelectedStudent(null);
    setFeedback({ type: 'success', text: msg });
    loadStudents();
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'enrolled') return s.face_enrolled;
    if (statusFilter === 'pending') return !s.face_enrolled;
    return true;
  });

  const enrolledCount = students.filter((s) => s.face_enrolled).length;
  const pendingCount = students.length - enrolledCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ScanFace className="w-7 h-7 text-blue-600" />
          Face Biometric Datasets
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage institution biometric enrollment status, administer on-site face registrations (25–30 samples), and reset templates.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
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

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{students.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Enrolled Datasets</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{enrolledCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Enrollment</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, ID or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('enrolled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'enrolled'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enrolled ({enrolledCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading face dataset records...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScanFace}
            title="No face datasets found"
            description={
              students.length === 0
                ? "The database is empty adhering to zero demo data policy. Enroll students first in Student Management."
                : "No students matching your filter criteria."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Course & Branch</th>
                  <th className="px-5 py-3.5">Semester</th>
                  <th className="px-5 py-3.5">Dataset Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{s.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{s.student_id}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-slate-700">{s.roll_number}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {s.course_name} — {s.branch_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">Sem {s.semester}</td>
                    <td className="px-5 py-4">
                      {s.face_enrolled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.face_enrolled ? (
                          <button
                            onClick={() => handleResetBiometrics(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                            title="Reset Biometric Template"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleOpenEnroll(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                          title="Capture and Enroll Face"
                        >
                          <Camera className="w-3.5 h-3.5" /> {s.face_enrolled ? 'Re-enroll' : 'Enroll Face'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Face Enrollment Modal (25-30 Samples Burst) */}
      <FaceEnrollmentModal
        isOpen={enrollModalOpen}
        student={selectedStudent}
        onClose={() => {
          setEnrollModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={handleEnrollSuccess}
      />
    </div>
  );
};
