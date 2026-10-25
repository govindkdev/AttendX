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
  BookOpen
} from 'lucide-react';

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
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enrolled Students Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse student credentials, academic programs, and parent contact information.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Name, Roll..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Student Info</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Course & Branch</th>
                  <th className="py-3.5 px-6">Semester</th>
                  <th className="py-3.5 px-6">Face Biometrics</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{s.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{s.student_id} | {s.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-800">
                      {s.roll_number}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {s.course_name} — {s.branch_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">
                      Sem {s.semester}
                    </td>
                    <td className="py-4 px-6">
                      {s.face_enrolled ? (
                        <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-600 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setViewStudent(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Full Student Profile & Parent Details"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewStudent(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
                {viewStudent.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewStudent.full_name}</h3>
                <span className="text-xs text-slate-500 font-medium">Student Profile & Academic Record</span>
              </div>
            </div>

            {/* Issued Student ID Box */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Issued Student ID
                </span>
                <span className="text-lg font-mono font-black text-blue-900">
                  {viewStudent.student_id}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(viewStudent.student_id)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold inline-flex items-center shadow-2xs"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  viewStudent.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {viewStudent.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            {/* Academic Program */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Academic Enrolled Program
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Course</span>
                  <span className="font-semibold text-slate-900">{viewStudent.course_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Branch</span>
                  <span className="font-semibold text-slate-900">{viewStudent.branch_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">University Roll Number</span>
                  <span className="font-mono font-semibold text-slate-900">{viewStudent.roll_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Current Semester</span>
                  <span className="font-semibold text-slate-900">Semester {viewStudent.semester}</span>
                </div>
              </div>
            </div>

            {/* Student Contact Info */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                Student Contact Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Registered Gmail / Email</span>
                  <span className="font-semibold text-slate-900">{viewStudent.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-slate-900">{viewStudent.phone_number || 'Not provided'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Face Biometrics Status</span>
                  <span className="font-semibold">
                    {viewStudent.face_enrolled ? (
                      <span className="text-emerald-700 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Enrolled (25–30 Samples)
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Pending Enrollment
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Parent & Guardian Details */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider pb-1.5 border-b border-emerald-100 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Parent & Guardian Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Parent / Guardian Name</span>
                  <span className="font-bold text-slate-900">{viewStudent.parent_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Parent Phone (SMS Alerts)</span>
                  <span className="font-semibold text-slate-900 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    {viewStudent.parent_phone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Parent Gmail / Email (Dispatches)</span>
                  <span className="font-semibold text-slate-900 flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    {viewStudent.parent_email || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Residential / Campus Address</span>
                  <span className="font-medium text-slate-700 flex items-start">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                    {viewStudent.address || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
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
