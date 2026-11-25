import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Bell, Lock, LogOut, ShieldCheck, Moon } from 'lucide-react';

export const StudentSettings: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Student Settings</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Manage alert preferences, account password security, and active session state.
        </p>
      </div>

      <div className="bg-[#111D30] rounded-3xl border border-[#23334A] shadow-xl divide-y divide-[#23334A]/50 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Attendance & Absence Alerts</h4>
              <p className="text-xs text-[#A1AEC2]">Automated notifications when an absence is recorded</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Password & Authentication</h4>
              <p className="text-xs text-[#A1AEC2]">Rotate your student login password</p>
            </div>
          </div>
          <Link
            to="/change-password"
            className="text-xs font-semibold text-[#3B82F6] hover:text-[#22D3EE] transition-colors"
          >
            Update &rarr;
          </Link>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Sign Out of Portal</h4>
              <p className="text-xs text-[#A1AEC2]">Terminate the current student browser session</p>
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
