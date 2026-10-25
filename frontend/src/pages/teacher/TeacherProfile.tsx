import React from 'react';
import { useAuth } from '@/features/authentication/AuthContext';
import { Link } from 'react-router-dom';
import { ProfileImageUpload } from '@/components/common/ProfileImageUpload';
import { User, Building2, Mail, Phone, Key, ShieldCheck } from 'lucide-react';

export const TeacherProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Profile</h2>
        <p className="text-xs text-slate-500 mt-1">Review your faculty designation and assigned department.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-center space-y-4">
          <ProfileImageUpload
            avatarUrl={user?.avatar_url}
            fullName={user?.full_name}
            size="md"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.full_name}</h3>
            <span className="text-xs font-mono text-slate-500 font-semibold">{user?.user_code}</span>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Designation:</span>
              <span className="font-semibold text-slate-900">{user?.details?.designation || 'Assistant Professor'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Account Status:</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Faculty Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Registered Email</span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-800">{user?.phone_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Qualification</span>
                <span className="font-semibold text-slate-800">{user?.details?.qualification || 'M.Tech / Ph.D.'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Institution</span>
                <span className="font-semibold text-slate-800">GCRG Group of Institutions, Lucknow</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Security & Passwords</h4>
            <Link
              to="/change-password"
              className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Key className="w-3.5 h-3.5 mr-1.5" /> Update Account Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
