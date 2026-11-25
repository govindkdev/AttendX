import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { StudentListItem, Department, Course, Branch } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FaceEnrollmentModal } from '@/features/face-recognition/FaceEnrollmentModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  Eye,
  MapPin,
  Mail,
  Phone,
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

  const handleDepartmentChange = async (deptId: number) => {
    setDepartmentId(deptId);
    setCourseId('');
    setBranchId('');
    setBranches([]);
    try {
      const crs = await api.getCourses(deptId);
      setCourses(crs);
    } catch {
      setCourses([]);
    }
  };

  const handleCourseChange = async (cId: number) => {
    setCourseId(cId);
    setBranchId('');
    try {
      const brs = await api.getBranches(cId);
      setBranches(brs);
    } catch {
      setBranches([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !rollNumber || !departmentId || !courseId || !branchId) {
      setErrorMsg('Please fill in all required academic enrollment fields.');
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
        password: initialPassword.trim() || undefined,
      });

      setModalOpen(false);
      setCreatedStudent(newStu);

      // Reset form
      setStudentId('');
      setFullName('');
      setEmail('');
      setRollNumber('');
      setDepartmentId('');
      setCourseId('');
      setBranchId('');
      setSemester(1);
      setPhoneNumber('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setAddress('');
      setInitialPassword('');

      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enroll student.');
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Student Management Registry
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Student Enrollment Management
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
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
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B]"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          </form>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Main Table */}
      {students.length > 0 ? (
        <div className="bg-[#111D30] rounded-2xl border border-[#23334A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#23334A] text-left text-xs">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase tracking-wider font-semibold">
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
              <tbody className="divide-y divide-[#23334A]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#F8FAFC]">{s.full_name}</div>
                      <div className="text-[11px] text-[#A1AEC2] font-mono flex items-center space-x-1.5 mt-0.5">
                        <span>{s.student_id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(s.student_id)}
                          className="text-[#64748B] hover:text-[#3B82F6]"
                          title="Copy Student ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <span>· {s.email}</span>
                      </div>
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
                        <button
                          onClick={() => openFaceEnroll(s)}
                          className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-semibold text-[11px] transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1" /> Enroll Face
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={s.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openViewModal(s)}
                          className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#3B82F6] hover:bg-[#16243A] transition-colors"
                          title="View Full Student Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openFaceEnroll(s)}
                          className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#22D3EE] hover:bg-[#16243A] transition-colors"
                          title={s.face_enrolled ? 'Re-enroll Face Biometrics' : 'Enroll Face Biometrics'}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-purple-400 hover:bg-[#16243A] transition-colors"
                          title="Edit Student Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s.profile_id, s.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.is_active
                              ? 'text-[#64748B] hover:text-amber-400 hover:bg-[#16243A]'
                              : 'text-[#64748B] hover:text-emerald-400 hover:bg-[#16243A]'
                          }`}
                          title={s.is_active ? 'Deactivate Student' : 'Activate Student'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(s)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-[#16243A] transition-colors"
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
          description="The student registry is currently empty. Click 'Enroll Student' to provision academic student profiles."
          actionText="Enroll New Student"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Enroll Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Provision New Student</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">Create authorized student enrollment. Leaves student in pending-activation until self-activated.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                    Student ID <span className="text-[#64748B] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Auto-generated if blank (STU-YYYY-XXXX)"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none uppercase bg-[#0D1525] text-[#F8FAFC]"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">Leave blank to auto-generate unique sequence</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 210052010001"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Student Full Name"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@institution.edu"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              {/* Department, Course, Branch, Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => handleDepartmentChange(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
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
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Course *</label>
                  <select
                    value={courseId}
                    onChange={(e) => handleCourseChange(Number(e.target.value))}
                    required
                    disabled={!departmentId}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] disabled:opacity-50"
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Branch *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(Number(e.target.value))}
                    required
                    disabled={!courseId}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] disabled:opacity-50"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Current Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal & Parent Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Student Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Parent Full Name"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Parent Mobile (SMS Alerts)</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Parent Email (Dispatches)</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Campus / Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Campus Hostel / Permanent address"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Initial Password <span className="text-[#64748B] font-normal">(Default: Student@123)</span>
                </label>
                <input
                  type="text"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Student@123"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  {submitting ? 'Provisioning...' : 'Provision Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal Showing Issued Student ID */}
      {createdStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading text-[#F8FAFC]">Student Provisioned!</h3>
            <p className="text-xs text-[#A1AEC2] mt-1">
              Provide this official Student ID to the student to activate their AttendX account.
            </p>

            <div className="my-6 p-4 rounded-xl bg-[#0D1525] border border-[#23334A] flex items-center justify-between">
              <span className="font-mono font-bold text-lg text-[#F8FAFC]">{createdStudent.student_id}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(createdStudent.student_id)}
                className="px-3 py-1.5 rounded-lg bg-[#16243A] border border-[#23334A] text-[#F8FAFC] hover:border-[#3B82F6] text-xs font-semibold inline-flex items-center"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCreatedStudent(null)}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Done & Return to Directory
            </button>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedStudent(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Edit Student Profile</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">
              Update details for <span className="font-semibold text-[#F8FAFC]">{selectedStudent.full_name}</span> ({selectedStudent.student_id})
            </p>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">University Roll Number *</label>
                  <input
                    type="text"
                    value={editRollNumber}
                    onChange={(e) => setEditRollNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Current Semester *</label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Student Phone Number</label>
                <input
                  type="tel"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Parent Mobile Number</label>
                  <input
                    type="tel"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Parent Email</label>
                <input
                  type="email"
                  value={editParentEmail}
                  onChange={(e) => setEditParentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Campus / Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Hostels / Permanent address"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#23334A] text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-[#F8FAFC]">Delete Student Record?</h3>
            <p className="text-xs text-[#A1AEC2] mt-2">
              Are you sure you want to remove <span className="font-semibold text-[#F8FAFC]">{selectedStudent.full_name}</span> ({selectedStudent.student_id})?
            </p>
            <p className="text-[11px] text-[#64748B] mt-1">
              If attendance records exist, the student will be safely deactivated to preserve historical compliance.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setViewModalOpen(false);
                setViewStudent(null);
              }}
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
                <span className="text-xs text-[#A1AEC2] font-medium">Enrolled Student Profile</span>
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
                  className="px-3 py-1.5 rounded-lg bg-[#16243A] border border-[#23334A] text-[#F8FAFC] hover:border-[#3B82F6] text-xs font-semibold inline-flex items-center"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
                <StatusBadge status={viewStudent.is_active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            </div>

            {/* Academic Credentials */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider pb-1.5 border-b border-[#23334A] flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" />
                Academic Program
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

            {/* Student Contact Information */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider pb-1.5 border-b border-[#23334A]">
                Student Contact Info
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block mb-0.5">Registered Email</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.email}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-0.5">Student Mobile Number</span>
                  <span className="font-semibold text-[#F8FAFC]">{viewStudent.phone_number || 'Not provided'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#64748B] block mb-0.5">Face Biometrics</span>
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

            {/* Parent & Guardian Information */}
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider pb-1.5 border-b border-[#23334A] flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#22D3EE]" /> Parent & Guardian Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block mb-0.5">Parent / Guardian Name</span>
                  <span className="font-bold text-[#F8FAFC]">{viewStudent.parent_name || 'Not provided'}</span>
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

            <div className="pt-4 border-t border-[#23334A] flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  const s = viewStudent;
                  setViewModalOpen(false);
                  setViewStudent(null);
                  openEditModal(s);
                }}
                className="px-4 py-2 rounded-xl bg-[#16243A] hover:bg-[#23334A] text-[#F8FAFC] font-semibold text-xs transition-colors border border-[#23334A]"
              >
                Edit Student Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  setViewStudent(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Enrollment Modal */}
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
