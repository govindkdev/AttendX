import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { StudentListItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Users,
  Search,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  X,
  Copy,
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewStudent, setViewStudent] = useState<StudentListItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const loadStudents = async (query = '') => {
    try {
      const data = await api.getStudents({ search: query || undefined });
      setStudents(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents(search);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Academic Roster
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Enrolled Students Directory
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Browse verified student credentials, academic programs, and biometric status.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Name, Roll..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B]"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      {students.length > 0 ? (
        <div className="bg-[#111D30] rounded-2xl border border-[#23334A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#23334A] text-left text-xs">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Student Info</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Course & Branch</th>
                  <th className="py-3.5 px-6">Semester</th>
                  <th className="py-3.5 px-6">Biometrics</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#F8FAFC]">{s.full_name}</div>
                      <div className="text-[11px] text-[#A1AEC2] font-mono">{s.student_id} · {s.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-[#F8FAFC]">
                      {s.roll_number}
                    </td>
                    <td className="py-4 px-6 text-[#A1AEC2]">
                      {s.course_name} — {s.branch_name}
                    </td>
                    <td className="py-4 px-6 text-[#A1AEC2] font-semibold">
                      Sem {s.semester}
                    </td>
                    <td className="py-4 px-6">
                      {s.face_enrolled ? (
                        <span className="inline-flex items-center text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-400 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={s.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setViewStudent(s)}
                        className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#3B82F6] hover:bg-[#16243A] transition-colors"
                        title="View Full Student Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Zero students are registered in the database matching this search."
        />
      )}

      {/* View Student Profile Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewStudent(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-white flex items-center justify-center font-bold font-heading text-lg">
                {viewStudent.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-[#F8FAFC]">{viewStudent.full_name}</h3>
                <span className="text-xs text-[#A1AEC2] font-medium">Student Profile & Academic Record</span>
              </div>
            </div>

            {/* Issued Student ID Box */}
            <div className="p-4 rounded-xl bg-[#0D1525] border border-[#23334A] mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider block">
                  Issued Student ID
                </span>
                <span className="text-lg font-mono font-bold text-[#F8FAFC]">
                  {viewStudent.student_id}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(viewStudent.student_id)}
                  className="px-3 py-1.5 rounded-lg bg-[#16243A] border border-[#23334A] text-[#F8FAFC] hover:border-[#3B82F6] text-xs font-semibold inline-flex items-center transition-colors"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
                <StatusBadge status={viewStudent.is_active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            </div>

            {/* Academic Program */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider pb-1.5 border-b border-[#23334A] flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Academic Enrolled Program
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block mb-0.5">Course</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.course_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Branch</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.branch_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">University Roll Number</span>
                  <span className="font-mono font-semibold text-[#F8FAFC]">{viewStudent.roll_number}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Current Semester</span>
                  <span className="font-semibold text-[#F8FAFC]">Semester {viewStudent.semester}</span>
                </div>
              </div>
            </div>

            {/* Student Contact Info */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider pb-1.5 border-b border-[#23334A]">
                Student Contact Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block mb-0.5">Registered Email</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.email}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.phone_number || 'Not provided'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#64748B] block mb-0.5">Face Biometrics Status</span>
                  <span className="font-semibold">
                    {viewStudent.face_enrolled ? (
                      <span className="text-emerald-400 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Enrolled (Verified Template)
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Pending Enrollment
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Parent & Guardian Details */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider pb-1.5 border-b border-[#23334A] flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#22D3EE]" /> Parent & Guardian Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block mb-0.5">Parent / Guardian Name</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.parent_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Parent Phone (SMS Alerts)</span>
                  <span className="font-semibold text-[#F8FAFC] flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    {viewStudent.parent_phone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Parent Email (Dispatches)</span>
                  <span className="font-semibold text-[#F8FAFC] flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-[#3B82F6]" />
                    {viewStudent.parent_email || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Residential / Campus Address</span>
                  <span className="font-medium text-[#A1AEC2] flex items-start">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#64748B] shrink-0 mt-0.5" />
                    {viewStudent.address || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#23334A] flex justify-end">
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
