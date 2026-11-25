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
  ShieldCheck,
  AlertCircle
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Biometric Security Engine
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-[#3B82F6]" />
            Face Biometric Datasets
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Manage institutional biometric enrollment registry, administer on-site face captures, and reset templates.
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

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider">Total Enrolled Students</span>
          <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{students.length}</p>
        </div>
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Face Templates</span>
          <p className="text-2xl font-extrabold font-stats text-emerald-400 mt-1">{enrolledCount}</p>
        </div>
        <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Enrollment</span>
          <p className="text-2xl font-extrabold font-stats text-amber-400 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, ID or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#23334A] bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0D1525] border border-[#23334A] p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'all' ? 'bg-[#16243A] text-[#F8FAFC]' : 'text-[#A1AEC2] hover:text-[#F8FAFC]'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('enrolled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'enrolled'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-[#A1AEC2] hover:text-[#F8FAFC]'
            }`}
          >
            Enrolled ({enrolledCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-[#A1AEC2] hover:text-[#F8FAFC]'
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111D30] rounded-2xl border border-[#23334A] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#A1AEC2]">Loading face dataset records...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScanFace}
            title="No face datasets found"
            description={
              students.length === 0
                ? "The database is empty. Enroll students first in Student Management."
                : "No students matching your filter criteria."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#23334A] text-left text-xs">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Course & Branch</th>
                  <th className="px-5 py-3.5">Semester</th>
                  <th className="px-5 py-3.5">Dataset Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#F8FAFC]">{s.full_name}</div>
                      <div className="text-[11px] text-[#A1AEC2] font-mono">{s.student_id}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-[#F8FAFC]">{s.roll_number}</td>
                    <td className="px-5 py-4 text-[#A1AEC2]">
                      {s.course_name} — {s.branch_name}
                    </td>
                    <td className="px-5 py-4 text-[#A1AEC2]">Sem {s.semester}</td>
                    <td className="px-5 py-4">
                      {s.face_enrolled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.face_enrolled ? (
                          <button
                            onClick={() => handleResetBiometrics(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
                            title="Reset Biometric Template"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleOpenEnroll(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 rounded-lg transition shadow-sm"
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

      {/* Face Enrollment Modal */}
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
