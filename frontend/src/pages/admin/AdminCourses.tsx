import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Course, Department, Branch } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { BookOpen, Plus, GitBranch, AlertCircle, X, Search, Edit2, Trash2 } from 'lucide-react';

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Record<number, Branch[]>>({});

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Course Create Modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [durationYears, setDurationYears] = useState(4);
  const [totalSemesters, setTotalSemesters] = useState(8);

  // Course Edit Modal
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(4);
  const [editSemesters, setEditSemesters] = useState(8);

  // Course Delete Modal
  const [deleteCourseModalOpen, setDeleteCourseModalOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Branch Modal
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState<number | null>(null);
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');

  // Branch Delete Modal
  const [deleteBranchModalOpen, setDeleteBranchModalOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [crs, depts] = await Promise.all([api.getCourses(), api.getDepartments()]);
      setCourses(crs);
      setDepartments(depts);

      const bMap: Record<number, Branch[]> = {};
      for (const c of crs) {
        bMap[c.id] = await api.getBranches(c.id).catch(() => []);
      }
      setBranches(bMap);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !departmentId) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createCourse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        department_id: Number(departmentId),
        duration_years: Number(durationYears),
        total_semesters: Number(totalSemesters),
      });
      setCourseModalOpen(false);
      setCode('');
      setName('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCourseModal = (course: Course) => {
    setEditingCourse(course);
    setEditName(course.name);
    setEditDuration(course.duration_years);
    setEditSemesters(course.total_semesters);
    setErrorMsg(null);
    setEditCourseModalOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editName.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.updateCourse(editingCourse.id, {
        name: editName.trim(),
        duration_years: Number(editDuration),
        total_semesters: Number(editSemesters),
      });
      setEditCourseModalOpen(false);
      setEditingCourse(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update course.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteCourseModal = (course: Course) => {
    setDeletingCourse(course);
    setDeleteCourseModalOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setSubmitting(true);
    try {
      await api.deleteCourse(deletingCourse.id);
      setDeleteCourseModalOpen(false);
      setDeletingCourse(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete course: Ensure no branches or enrolled students exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseId || !branchCode || !branchName) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createBranch({
        code: branchCode.trim().toUpperCase(),
        name: branchName.trim(),
        course_id: targetCourseId,
      });
      setBranchModalOpen(false);
      setBranchCode('');
      setBranchName('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteBranchModal = (branch: Branch) => {
    setDeletingBranch(branch);
    setDeleteBranchModalOpen(true);
  };

  const handleDeleteBranch = async () => {
    if (!deletingBranch) return;
    setSubmitting(true);
    try {
      await api.deleteBranch(deletingBranch.id);
      setDeleteBranchModalOpen(false);
      setDeletingBranch(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete branch: Ensure no enrolled students exist in this branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchesCourse = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    const matchesBranch = (branches[c.id] || []).some(
      (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
    return matchesCourse || matchesBranch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Degrees & Programs</h2>
          <p className="text-xs text-slate-500 mt-1">Configure degrees, academic durations, and specialized branches.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses & branches..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setCourseModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Degree / Course
          </button>
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      {c.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{c.name}</h3>
                    <span className="text-xs text-slate-400">
                      {c.duration_years} Years &bull; {c.total_semesters} Semesters
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setTargetCourseId(c.id);
                        setErrorMsg(null);
                        setBranchModalOpen(true);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Branch
                    </button>
                    <button
                      onClick={() => openEditCourseModal(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteCourseModal(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Branches pill list */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Specialized Branches ({branches[c.id]?.length || 0})
                  </span>
                  {branches[c.id]?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {branches[c.id].map((b) => (
                        <span
                          key={b.id}
                          className="group inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 hover:border-slate-300"
                        >
                          <GitBranch className="w-3 h-3 mr-1 text-slate-400" />
                          {b.name} ({b.code})
                          <button
                            type="button"
                            onClick={() => openDeleteBranchModal(b)}
                            className="ml-1.5 text-slate-300 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition-opacity"
                            title="Delete Branch"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No branches registered yet for this program.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses configured"
          description="Create your first academic course (e.g. B.Tech, MCA, MBA, Polytechnic)."
          actionText="Add Course"
          onAction={() => {
            setErrorMsg(null);
            setCourseModalOpen(true);
          }}
        />
      )}

      {/* Add Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setCourseModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Academic Program</h3>
            <p className="text-xs text-slate-500 mb-6">Enter program code, department, and duration.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BTECH, MCA, MBA"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bachelor of Technology"
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
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={durationYears}
                    onChange={(e) => setDurationYears(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editCourseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setEditCourseModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Edit Program</h3>
            <p className="text-xs text-slate-500 mb-5">Editing: <span className="font-mono text-slate-800">{editingCourse.code}</span></p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editSemesters}
                    onChange={(e) => setEditSemesters(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditCourseModalOpen(false)}
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

      {/* Delete Course Modal */}
      {deleteCourseModalOpen && deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Degree Program?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deletingCourse.name}</span> ({deletingCourse.code})?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Deletion will be blocked if specialized branches or students are associated with this course.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteCourseModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setBranchModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Specialized Branch</h3>
            <p className="text-xs text-slate-500 mb-6">Create a discipline under this program.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code *</label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CS, AI, ME, CE"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Machine Learning"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Branch Modal */}
      {deleteBranchModalOpen && deletingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Branch?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deletingBranch.name}</span> ({deletingBranch.code})?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Deletion will be blocked if students are enrolled in this branch.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteBranchModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBranch}
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
