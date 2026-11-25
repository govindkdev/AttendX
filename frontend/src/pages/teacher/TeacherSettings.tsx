import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Lock, LogOut, Shield, BellRing, Smartphone } from 'lucide-react';

export const TeacherSettings: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
          Preferences
        </span>
        <h2 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight">
          Faculty Settings
        </h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Manage session authorization, alerts, and security preferences.
        </p>
      </div>

      <div className="bg-[#111D30] rounded-2xl border border-[#23334A] divide-y divide-[#23334A] overflow-hidden">
        <div className="p-6 flex items-center justify-between hover:bg-[#16243A]/40 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Account Password</h4>
              <p className="text-xs text-[#A1AEC2]">Rotate your faculty portal password</p>
            </div>
          </div>
          <Link
            to="/change-password"
            className="text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
          >
            Update &rarr;
          </Link>
        </div>

        <div className="p-6 flex items-center justify-between hover:bg-[#16243A]/40 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Attendance Notifications</h4>
              <p className="text-xs text-[#A1AEC2]">Automated absent digests after lecture closure</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-400">Enabled</span>
        </div>

        <div className="p-6 flex items-center justify-between hover:bg-[#16243A]/40 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Sign Out</h4>
              <p className="text-xs text-[#A1AEC2]">End active faculty session securely</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
