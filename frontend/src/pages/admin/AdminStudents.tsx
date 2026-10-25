import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { StudentListItem, Department, Course, Branch } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FaceEnrollmentModal } from '@/features/face-recognition/FaceEnrollmentModal';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Power,
  Camera,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Eye,
  MapPin,
  Mail,
  Phone,
  User,
  Users,
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Success Modal for newly created student
  const [createdStudent, setCreatedStudent] = useState<StudentListItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Student selected for Edit / Delete / Face Enrollment / View
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [viewStudent, setViewStudent] = useState<StudentListItem | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Student Form State
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [semester, setSemester] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [initialPassword, setInitialPassword] = useState('');

  // Edit Student Form State
  const [editFullName, setEditFullName] = useState('');
  const [editRollNumber, setEditRollNumber] = useState('');
  const [editSemester, setEditSemester] = useState(1);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const loadData = async (query = '') => {
    try {
      const [stus, depts, crs] = await Promise.all([
        api.getStudents({ search: query || undefined }),
        api.getDepartments(),
        api.getCourses(),
      ]);
      setStudents(stus);
      setDepartments(depts);
      setCourses(crs);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (courseId) {
      api.getBranches(Number(courseId)).then(setBranches).catch(() => setBranches([]));
    } else {
      setBranches([]);
    }
  }, [courseId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

  const handleToggleStatus = async (profileId: number, currentStatus: boolean) => {
    try {
      await api.toggleStudentStatus(profileId, !currentStatus);
      setStudents((prev) =>
        prev.map((s) => (s.profile_id === profileId ? { ...s, is_active: !currentStatus } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !rollNumber || !courseId || !branchId || !departmentId) {
      setErrorMsg('Please fill in all mandatory fields (Name, Email, Roll Number, Academic selections).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const newStu = await api.createStudent({
        student_id: studentId.trim() || undefined,
        full_name: fullName.trim(),
        email: email.trim(),
        roll_number: rollNumber.trim(),
        department_id: Number(departmentId),
        course_id: Number(courseId),
        branch_id: Number(branchId),
        semester: Number(semester),
        phone_number: phoneNumber.trim() || undefined,
        parent_name: parentName.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        parent_email: parentEmail.trim() || undefined,
        address: address.trim() || undefined,
        initial_password: initialPassword.trim() || undefined,
      });

      setModalOpen(false);
      // Reset form
      setStudentId('');
      setFullName('');
      setEmail('');
      setRollNumber('');
      setPhoneNumber('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setAddress('');
      setInitialPassword('');

      // Open Success Modal with copyable ID
      setCreatedStudent(newStu);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to provision student.');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = (stu: StudentListItem) => {
    setViewStudent(stu);
    setViewModalOpen(true);
  };

  const openEditModal = (stu: StudentListItem) => {
    setSelectedStudent(stu);
    setEditFullName(stu.full_name);
    setEditRollNumber(stu.roll_number);
    setEditSemester(stu.semester);
    setEditPhoneNumber(stu.phone_number || '');
    setEditParentName(stu.parent_name || '');
    setEditParentPhone(stu.parent_phone || '');
    setEditParentEmail(stu.parent_email || '');
    setEditAddress(stu.address || '');
    setEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.updateStudent(selectedStudent.profile_id, {
        full_name: editFullName.trim(),
        roll_number: editRollNumber.trim(),
        semester: Number(editSemester),
        phone_number: editPhoneNumber.trim() || undefined,
        parent_name: editParentName.trim() || undefined,
        parent_phone: editParentPhone.trim() || undefined,
        parent_email: editParentEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
      });
      setEditModalOpen(false);
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update student profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (stu: StudentListItem) => {
    setSelectedStudent(stu);
    setDeleteModalOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await api.deleteStudent(selectedStudent.profile_id);
      setDeleteModalOpen(false);
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setSubmitting(false);
    }
  };

  const openFaceEnroll = (stu: StudentListItem) => {
    setSelectedStudent(stu);
    setEnrollModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Enrollment Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Provision unique student IDs, enroll academic profiles, and manage active statuses.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Enroll Student
          </button>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Student Identity</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Course & Branch</th>
                  <th className="py-3.5 px-6">Semester</th>
                  <th className="py-3.5 px-6">Face Biometrics</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{s.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1.5 mt-0.5">
                        <span>{s.student_id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(s.student_id)}
                          className="text-slate-400 hover:text-blue-600"
                          title="Copy Student ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <span>· {s.email}</span>
                      </div>
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
                        <button
                          onClick={() => openFaceEnroll(s)}
                          className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold text-[11px] transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1 text-amber-600" /> Enroll Face
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openViewModal(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Full Student Profile & Parent Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openFaceEnroll(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title={s.face_enrolled ? 'Re-enroll Face Biometrics' : 'Enroll Face Biometrics'}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Student Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s.profile_id, s.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.is_active
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={s.is_active ? 'Deactivate Student' : 'Activate Student'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description="The student database is currently empty adhering to the zero-demo-data policy. Click 'Enroll Student' to add real academic enrollment records."
          actionText="Enroll New Student"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Enroll Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Provision New Student</h3>
            <p className="text-xs text-slate-500 mb-6">Create authorized student enrollment. Leaves student in pending-activation until self-activated.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Auto-generated if blank (STU-YYYY-XXXX)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank to auto-generate unique sequence</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 210052010001"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@example.com"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}
                    required
                    disabled={!courseId}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white disabled:opacity-50"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Phone</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Guardian Name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Phone (Alerts)</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Email (Alerts)</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus / Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Hostels / Permanent residential address"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Leave empty for pending self-activation flow"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  If omitted, student will self-activate their account at /create-account using their Student ID & OTP.
                </p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                >
                  {submitting ? 'Enrolling...' : 'Provision Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Success Modal with Copyable ID */}
      {createdStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Student Enrolled Successfully</h3>
            <p className="text-xs text-slate-500 mt-1">
              Record created for <span className="font-semibold text-slate-800">{createdStudent.full_name}</span>
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Allocated Student ID
              </p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl font-mono font-black text-blue-700">
                  {createdStudent.student_id}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdStudent.student_id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition-colors"
                  title="Copy Student ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Share this ID with the student to activate their portal at <span className="font-mono text-slate-700">/create-account</span>
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const stu = createdStudent;
                  setCreatedStudent(null);
                  openFaceEnroll(stu);
                }}
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Camera className="w-4 h-4 mr-2" /> Enroll Face Biometrics Now (25–30 Samples)
              </button>
              <button
                type="button"
                onClick={() => setCreatedStudent(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedStudent(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Student Profile</h3>
            <p className="text-xs text-slate-500 mb-5">
              Editing profile for <span className="font-mono text-slate-800">{selectedStudent.student_id}</span>
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editRollNumber}
                    onChange={(e) => setEditRollNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editSemester}
                    onChange={(e) => setEditSemester(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  value={editParentEmail}
                  onChange={(e) => setEditParentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus / Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Hostels / Permanent address"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Student Record?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{selectedStudent.full_name}</span> ({selectedStudent.student_id})?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              If attendance records exist, the student will be safely deactivated to preserve historical compliance.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Profile Modal */}
      {viewModalOpen && viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setViewModalOpen(false);
                setViewStudent(null);
              }}
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
                <span className="text-xs text-slate-500 font-medium">Enrolled Student Profile</span>
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
                  {viewStudent.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                </span>
              </div>
            </div>

            {/* Academic Credentials */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                Academic Program
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

            {/* Student Contact Information */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                Student Contact Info
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Registered Gmail / Email</span>
                  <span className="font-semibold text-slate-900">{viewStudent.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Student Mobile Number</span>
                  <span className="font-semibold text-slate-900">{viewStudent.phone_number || 'Not provided'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Face Biometrics</span>
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

            {/* Parent & Guardian Information */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider pb-1.5 border-b border-emerald-100">
                Parent & Guardian Details
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

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  const s = viewStudent;
                  setViewModalOpen(false);
                  setViewStudent(null);
                  openEditModal(s);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Edit Student Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  setViewStudent(null);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Enrollment Modal (25-30 Samples Burst) */}
      <FaceEnrollmentModal
        isOpen={enrollModalOpen}
        student={selectedStudent}
        onClose={() => {
          setEnrollModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={(msg) => {
          setEnrollModalOpen(false);
          setSelectedStudent(null);
          alert(msg);
          loadData();
        }}
      />
    </div>
  );
};
