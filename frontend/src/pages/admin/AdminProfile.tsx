import React, { useState } from 'react';
import { useAuth } from '@/features/authentication/AuthContext';
import { api } from '@/services/api';
import { ProfileImageUpload } from '@/components/common/ProfileImageUpload';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Fingerprint,
  Calendar,
  X,
  Lock
} from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setFeedback({ type: 'success', text: res.message || 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Administrator Security
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-[#3B82F6]" />
            Administrator Identity & Security
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Review provisioned institutional credentials and manage your account credentials.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Administrator Profile Card */}
        <div className="lg:col-span-1 bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-6 text-center">
          <div className="pb-6 border-b border-[#23334A] flex flex-col items-center">
            <ProfileImageUpload
              avatarUrl={user?.avatar_url}
              fullName={user?.full_name || 'System Administrator'}
              size="md"
            />
            <h2 className="text-lg font-bold font-heading text-[#F8FAFC] mt-3">
              {user?.full_name || 'System Administrator'}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 mt-2">
              <Shield className="w-3.5 h-3.5" />
              SYSTEM ADMINISTRATOR
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#A1AEC2] text-left">
            <div className="flex items-center justify-between py-1.5 border-b border-[#23334A]">
              <span className="flex items-center gap-2 text-[#64748B]">
                <Fingerprint className="w-4 h-4 text-[#3B82F6]" /> Admin ID
              </span>
              <span className="font-mono font-bold text-[#F8FAFC]">{user?.identifier || user?.user_code || 'ADM-MASTER'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#23334A]">
              <span className="flex items-center gap-2 text-[#64748B]">
                <Mail className="w-4 h-4 text-[#3B82F6]" /> Email Address
              </span>
              <span className="font-semibold text-[#F8FAFC]">{user?.email || 'admin@attendx.internal'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#23334A]">
              <span className="flex items-center gap-2 text-[#64748B]">
                <Building className="w-4 h-4 text-[#3B82F6]" /> Institution
              </span>
              <span className="font-semibold text-[#F8FAFC]">{user?.details?.institution || 'Campus Governance'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-2 text-[#64748B]">
                <Calendar className="w-4 h-4 text-[#3B82F6]" /> Account Status
              </span>
              <StatusBadge status="ACTIVE" />
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="lg:col-span-2 bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-6">
          <div className="pb-4 border-b border-[#23334A]">
            <h2 className="text-base font-bold font-heading text-[#F8FAFC] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#3B82F6]" />
              Change Administrator Password
            </h2>
            <p className="text-xs text-[#A1AEC2] mt-0.5">
              High-entropy cryptographic verification is enforced across all administrator sessions.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password (min. 8 characters)"
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                {saving ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
