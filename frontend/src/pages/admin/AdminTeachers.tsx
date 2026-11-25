import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { TeacherListItem, Department } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Plus,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Building2,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react';

export const AdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selected for Edit / Delete
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherListItem | null>(null);

  // Form State
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [initialPassword, setInitialPassword] = useState('Teacher@123');

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');

  // Success Created
  const [createdTeacher, setCreatedTeacher] = useState<TeacherListItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [tList, dList] = await Promise.all([
        api.getTeachers(),
        api.getDepartments(),
      ]);
      setTeachers(tList);
      setDepartments(dList);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (profileId: number, currentStatus: boolean) => {
    try {
      await api.toggleTeacherStatus(profileId, !currentStatus);
      setTeachers((prev) =>
        prev.map((t) => (t.profile_id === profileId ? { ...t, is_active: !currentStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !departmentId) {
      setErrorMsg('Please complete all mandatory fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const newTch = await api.createTeacher({
        employee_code: employeeCode.trim() || undefined,
        full_name: fullName.trim(),
        email: email.trim(),
        department_id: Number(departmentId),
        designation: designation.trim() || undefined,
        qualification: qualification.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        password: initialPassword.trim() || undefined,
      });

      setModalOpen(false);
      setCreatedTeacher(newTch);

      // Reset
      setEmployeeCode('');
      setFullName('');
      setEmail('');
      setDepartmentId('');
      setDesignation('Assistant Professor');
      setQualification('');
      setPhoneNumber('');
      setInitialPassword('Teacher@123');

      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create teacher account.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (t: TeacherListItem) => {
    setSelectedTeacher(t);
    setEditFullName(t.full_name);
    setEditDesignation(t.designation || 'Assistant Professor');
    setEditQualification(t.qualification || '');
    setEditPhoneNumber(t.phone_number || '');
    setEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.updateTeacher(selectedTeacher.profile_id, {
        full_name: editFullName.trim(),
        designation: editDesignation.trim() || undefined,
        qualification: editQualification.trim() || undefined,
        phone_number: editPhoneNumber.trim() || undefined,
      });
      setEditModalOpen(false);
      setSelectedTeacher(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update faculty profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (t: TeacherListItem) => {
    setSelectedTeacher(t);
    setDeleteModalOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    setSubmitting(true);
    try {
      await api.deleteTeacher(selectedTeacher.profile_id);
      setDeleteModalOpen(false);
      setSelectedTeacher(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete faculty member.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.full_name.toLowerCase().includes(term) ||
      t.employee_code.toLowerCase().includes(term) ||
      t.email.toLowerCase().includes(term) ||
      (t.department_name && t.department_name.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Faculty Directory
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Faculty Members & Instructors
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Provision faculty accounts, assign departments, and maintain teaching authorizations.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B]"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Faculty
          </button>
        </div>
      </div>

      {/* Main Table */}
      {filteredTeachers.length > 0 ? (
        <div className="bg-[#111D30] rounded-2xl border border-[#23334A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#23334A] text-left text-xs">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Faculty Member</th>
                  <th className="py-3.5 px-6">Employee Code</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Designation</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#F8FAFC]">{t.full_name}</div>
                      <div className="text-[11px] text-[#A1AEC2]">{t.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-[#3B82F6]">
                      {t.employee_code}
                    </td>
                    <td className="py-4 px-6 text-[#A1AEC2]">
                      {t.department_name || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-[#A1AEC2]">
                      {t.designation || 'Instructor'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#3B82F6] hover:bg-[#16243A] transition-colors"
                          title="Edit Faculty Info"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t.profile_id, t.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            t.is_active
                              ? 'text-[#64748B] hover:text-amber-400 hover:bg-[#16243A]'
                              : 'text-[#64748B] hover:text-emerald-400 hover:bg-[#16243A]'
                          }`}
                          title={t.is_active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(t)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-[#16243A] transition-colors"
                          title="Delete Faculty Member"
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
          icon={Users}
          title="No faculty members found"
          description="Zero faculty records match this search. Click 'Add Faculty' to provision instructor credentials."
          actionText="Add Faculty Member"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Add Teacher Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Provision Faculty Member</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">Create authorized faculty account for session attendance and course conduction.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Employee Code <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Auto-generated if blank (TCH-YYYY-XXXX)"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none uppercase bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
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
                  placeholder="faculty@institution.edu"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(Number(e.target.value))}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Assistant Professor"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="Ph.D., M.Tech"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Initial Password <span className="text-[#64748B] font-normal">(Default: Teacher@123)</span>
                </label>
                <input
                  type="text"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Teacher@123"
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
                  {submitting ? 'Provisioning...' : 'Provision Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal Showing Issued Employee Code */}
      {createdTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading text-[#F8FAFC]">Faculty Account Provisioned!</h3>
            <p className="text-xs text-[#A1AEC2] mt-1">
              Provide this official Employee ID to the faculty member to log in to AttendX.
            </p>

            <div className="my-6 p-4 rounded-xl bg-[#0D1525] border border-[#23334A] flex items-center justify-between">
              <span className="font-mono font-bold text-lg text-[#F8FAFC]">{createdTeacher.employee_code}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(createdTeacher.employee_code)}
                className="px-3 py-1.5 rounded-lg bg-[#16243A] border border-[#23334A] text-[#F8FAFC] hover:border-[#3B82F6] text-xs font-semibold inline-flex items-center"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCreatedTeacher(null)}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Done & Return to Directory
            </button>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedTeacher(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Edit Faculty Profile</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">
              Update credentials for <span className="font-semibold text-[#F8FAFC]">{selectedTeacher.full_name}</span> ({selectedTeacher.employee_code})
            </p>

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editQualification}
                    onChange={(e) => setEditQualification(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedTeacher(null);
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
      {deleteModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#23334A] text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-[#F8FAFC]">Delete Faculty Member?</h3>
            <p className="text-xs text-[#A1AEC2] mt-2">
              Are you sure you want to remove <span className="font-semibold text-[#F8FAFC]">{selectedTeacher.full_name}</span> ({selectedTeacher.employee_code})?
            </p>
            <p className="text-[11px] text-[#64748B] mt-1">
              If lectures have been conducted by this instructor, account will be deactivated instead to safeguard audit logs.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedTeacher(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
