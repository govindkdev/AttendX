import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Subject, Course, Department, Branch } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FileText, Plus, AlertCircle, X, Search, Edit2, Trash2, BookOpen } from 'lucide-react';

export const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [semester, setSemester] = useState(1);
  const [credits, setCredits] = useState(3);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editSemester, setEditSemester] = useState(1);
  const [editCredits, setEditCredits] = useState(3);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [subs, crs, depts] = await Promise.all([
        api.getSubjects(),
        api.getCourses(),
        api.getDepartments(),
      ]);
      setSubjects(subs);
      setCourses(crs);
      setDepartments(depts);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !courseId || !departmentId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createSubject({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        course_id: Number(courseId),
        branch_id: branchId ? Number(branchId) : undefined,
        department_id: Number(departmentId),
        semester: Number(semester),
        credits: Number(credits),
      });
      setModalOpen(false);
      setCode('');
      setName('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditSemester(sub.semester);
    setEditCredits(sub.credits);
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.updateSubject(editingSubject.id, {
        name: editName.trim(),
        semester: Number(editSemester),
        credits: Number(editCredits),
      });
      setEditModalOpen(false);
      setEditingSubject(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (sub: Subject) => {
    setDeletingSubject(sub);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;
    setSubmitting(true);
    try {
      await api.deleteSubject(deletingSubject.id);
      setDeleteModalOpen(false);
      setDeletingSubject(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete subject: Lectures or attendance records depend on it.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Academic Courses & Subjects
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Subjects & Curriculum Directory
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">Manage curricular modules, lecture credit weightings, and semesters.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
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
            <Plus className="w-4 h-4 mr-1.5" /> Add Subject
          </button>
        </div>
      </div>

      {subjects.length > 0 ? (
        <div className="bg-[#111D30] rounded-2xl border border-[#23334A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#23334A] text-left text-xs">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Subject Code</th>
                  <th className="py-3.5 px-6">Subject Title</th>
                  <th className="py-3.5 px-6">Semester</th>
                  <th className="py-3.5 px-6">Credits</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#3B82F6]">
                      {s.code}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#F8FAFC]">
                      {s.name}
                    </td>
                    <td className="py-4 px-6 text-[#A1AEC2]">
                      Semester {s.semester}
                    </td>
                    <td className="py-4 px-6 text-[#A1AEC2]">
                      <span className="px-2 py-0.5 rounded-md bg-[#0D1525] border border-[#23334A] font-semibold text-[#F8FAFC]">
                        {s.credits} Credits
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#3B82F6] hover:bg-[#16243A] transition-colors"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(s)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-[#16243A] transition-colors"
                          title="Delete Subject"
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
          icon={FileText}
          title="No subjects registered"
          description="Register subjects to begin scheduling classes and logging attendance."
          actionText="Add First Subject"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Add Academic Subject</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">Create course module and define academic credit weighting.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Subject Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CS501"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none uppercase bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Course *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Branch (Optional)</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Semester *</label>
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
                  {submitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingSubject(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Edit Subject</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">Editing {editingSubject.code}</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Semester *</label>
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

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingSubject(null);
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

      {/* Delete Modal */}
      {deleteModalOpen && deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#23334A] text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-[#F8FAFC]">Delete Subject?</h3>
            <p className="text-xs text-[#A1AEC2] mt-2">
              Are you sure you want to remove <span className="font-semibold text-[#F8FAFC]">{deletingSubject.name}</span> ({deletingSubject.code})?
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingSubject(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#23334A] text-xs font-semibold text-[#A1AEC2] hover:bg-[#16243A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
