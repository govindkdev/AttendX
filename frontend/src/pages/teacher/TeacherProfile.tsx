import React from 'react';
import { useAuth } from '@/features/authentication/AuthContext';
import { Link } from 'react-router-dom';
import { ProfileImageUpload } from '@/components/common/ProfileImageUpload';
import { User, Building2, Mail, Phone, Key, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const TeacherProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
          Faculty Directory
        </span>
        <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
          Faculty Profile
        </h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Review your academic designation, department affiliation, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column Profile Card */}
        <div className="bg-[#111D30] rounded-2xl p-6 border border-[#23334A] text-center space-y-4">
          <div className="flex justify-center">
            <ProfileImageUpload
              avatarUrl={user?.avatar_url}
              fullName={user?.full_name}
              size="md"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-[#F8FAFC]">{user?.full_name}</h3>
            <span className="text-xs font-mono text-[#3B82F6] font-semibold">{user?.user_code}</span>
          </div>

          <div className="pt-4 border-t border-[#23334A] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#A1AEC2]">
              <span>Designation:</span>
              <span className="font-semibold text-[#F8FAFC]">{user?.details?.designation || 'Assistant Professor'}</span>
            </div>
            <div className="flex justify-between items-center text-[#A1AEC2]">
              <span>Account Status:</span>
              <StatusBadge status="ACTIVE" />
            </div>
          </div>
        </div>

        {/* Right Column Faculty Details */}
        <div className="md:col-span-2 bg-[#111D30] rounded-2xl p-6 border border-[#23334A] space-y-6">
          <div>
            <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-4 pb-2 border-b border-[#23334A]">
              Faculty Credentials & Academic Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#0D1525] border border-[#23334A]">
                <span className="text-[#64748B] block mb-0.5">Registered Email</span>
                <span className="font-semibold text-[#F8FAFC]">{user?.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1525] border border-[#23334A]">
                <span className="text-[#64748B] block mb-0.5">Phone Number</span>
                <span className="font-semibold text-[#F8FAFC]">{user?.phone_number || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1525] border border-[#23334A]">
                <span className="text-[#64748B] block mb-0.5">Academic Qualification</span>
                <span className="font-semibold text-[#F8FAFC]">{user?.details?.qualification || 'M.Tech / Ph.D.'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1525] border border-[#23334A]">
                <span className="text-[#64748B] block mb-0.5">Affiliated Department</span>
                <span className="font-semibold text-[#F8FAFC]">{user?.details?.department || 'Computer Science & Engineering'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#23334A]">
            <h4 className="text-xs font-bold text-[#A1AEC2] uppercase tracking-wider mb-3">Security & Passwords</h4>
            <Link
              to="/change-password"
              className="inline-flex items-center px-4 py-2 rounded-xl border border-[#23334A] bg-[#0D1525] text-xs font-semibold text-[#F8FAFC] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
            >
              <Key className="w-3.5 h-3.5 mr-1.5" /> Update Account Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
