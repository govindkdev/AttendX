import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Department } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Building2, Plus, AlertCircle, X, Search, Edit2, Trash2 } from 'lucide-react';

export const AdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createDepartment({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setModalOpen(false);
      setCode('');
      setName('');
      setDescription('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setEditDescription(dept.description || '');
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.updateDepartment(editingDept.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditModalOpen(false);
      setEditingDept(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (dept: Department) => {
    setDeletingDept(dept);
    setErrorMsg(null);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    setSubmitting(true);
    try {
      await api.deleteDepartment(deletingDept.id);
      setDeleteModalOpen(false);
      setDeletingDept(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete department: Ensure no courses or faculty are associated with it.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
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
            Organizational Structure
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
            Academic Departments
          </h2>
          <p className="text-xs text-[#A1AEC2] mt-1">Configure academic divisions and organizational departments.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments..."
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
            <Plus className="w-4 h-4 mr-1.5" /> New Department
          </button>
        </div>
      </div>

      {departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <div key={d.id} className="bg-[#111D30] p-6 rounded-2xl border border-[#23334A] space-y-4 flex flex-col justify-between hover:border-[#3B82F6]/50 transition-colors">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-lg border border-[#3B82F6]/20">
                    {d.code}
                  </span>
                  <StatusBadge status="ACTIVE" />
                </div>
                <h3 className="text-base font-bold font-heading text-[#F8FAFC]">{d.name}</h3>
                <p className="text-xs text-[#A1AEC2] leading-relaxed">
                  {d.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#23334A] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => openEditModal(d)}
                  className="p-1.5 rounded-lg text-[#A1AEC2] hover:text-[#3B82F6] hover:bg-[#16243A] transition-colors"
                  title="Edit Department"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteModal(d)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-[#16243A] transition-colors"
                  title="Delete Department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Zero departments registered. Click 'New Department' to configure academic divisions."
          actionText="Create Department"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Add Academic Department</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">Create top-level academic division (e.g. CSE, ECE, Mechanical).</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Department Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSE"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none uppercase bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Department Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of department..."
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
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#23334A] relative">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingDept(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-[#A1AEC2] hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading text-[#F8FAFC] mb-1">Edit Department</h3>
            <p className="text-xs text-[#A1AEC2] mb-6">Editing {editingDept.code}</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Department Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#23334A] text-xs focus:ring-2 focus:ring-[#3B82F6] focus:outline-none bg-[#0D1525] text-[#F8FAFC]"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingDept(null);
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
      {deleteModalOpen && deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111D30] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#23334A] text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-[#F8FAFC]">Delete Department?</h3>
            <p className="text-xs text-[#A1AEC2] mt-2">
              Are you sure you want to remove <span className="font-semibold text-[#F8FAFC]">{deletingDept.name}</span> ({deletingDept.code})?
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingDept(null);
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
