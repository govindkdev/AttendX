import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { TeacherListItem, Department } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
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
        designation,
        qualification: qualification.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        initial_password: initialPassword || 'Teacher@123',
      });
      setModalOpen(false);
      setEmployeeCode('');
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setQualification('');
      setCreatedTeacher(newTch);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (t: TeacherListItem) => {
    setSelectedTeacher(t);
    setEditFullName(t.full_name);
    setEditDesignation(t.designation);
    setEditQualification(t.qualification || '');
    setEditPhoneNumber(t.phone_number || '');
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !editFullName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.updateTeacher(selectedTeacher.profile_id, {
        full_name: editFullName.trim(),
        designation: editDesignation.trim(),
        qualification: editQualification.trim() || undefined,
        phone_number: editPhoneNumber.trim() || undefined,
      });
      setEditModalOpen(false);
      setSelectedTeacher(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update faculty member.');
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
      alert(err.message || 'Cannot delete faculty: Active timetable slots or lecture sessions are linked to this teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.full_name.toLowerCase().includes(q) ||
      t.employee_code.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.department_name && t.department_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Directory & Assignments</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage instructional staff, departments, and active teaching statuses.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Faculty Member
          </button>
        </div>
      </div>

      {teachers.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Faculty Name</th>
                  <th className="py-3.5 px-6">Employee Code</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Designation</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{t.full_name}</div>
                      <div className="text-[11px] text-slate-500">{t.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <span>{t.employee_code}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(t.employee_code)}
                          className="text-slate-400 hover:text-blue-600"
                          title="Copy Code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {t.department_name || 'Department'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {t.designation}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Faculty Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t.profile_id, t.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            t.is_active
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={t.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Faculty"
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
          description="The faculty directory is empty. Click 'Add Faculty Member' to register instructional staff."
          actionText="Add Faculty Member"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Add Teacher Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Faculty Member</h3>
            <p className="text-xs text-slate-500 mb-6">Create teacher identity with departmental assignment.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    placeholder="Auto-generated if blank (TCH-YYYY-XXXX)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank to auto-generate unique sequence</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@institution.edu"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

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
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. Ph.D, M.Tech"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Teacher@123"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Register Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Success Modal */}
      {createdTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Faculty Provisioned Successfully</h3>
            <p className="text-xs text-slate-500 mt-1">
              Account created for <span className="font-semibold text-slate-800">{createdTeacher.full_name}</span>
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Allocated Employee Code
              </p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl font-mono font-black text-blue-700">
                  {createdTeacher.employee_code}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdTeacher.employee_code)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-200 transition-colors"
                  title="Copy Employee Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Faculty can sign in at <span className="font-mono text-slate-700">/login?role=teacher</span> with this code or their email.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreatedTeacher(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedTeacher(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Edit Faculty Profile</h3>
            <p className="text-xs text-slate-500 mb-5">
              Editing: <span className="font-mono text-slate-800">{selectedTeacher.employee_code}</span>
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <select
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Lab Instructor">Lab Instructor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={editQualification}
                  onChange={(e) => setEditQualification(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedTeacher(null);
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

      {/* Delete Teacher Modal */}
      {deleteModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Faculty Member?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{selectedTeacher.full_name}</span> ({selectedTeacher.employee_code})?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Deletion will be blocked if active timetable slots or lecture sessions are linked to this faculty.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
