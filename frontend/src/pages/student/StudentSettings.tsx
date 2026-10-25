import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Settings, Shield, Bell, Moon, Lock, LogOut } from 'lucide-react';

export const StudentSettings: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Manage notification preferences, privacy, and active sessions.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Email & Absence Notifications</h4>
              <p className="text-xs text-slate-500">Receive instant alerts for marked absences</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Password & Security</h4>
              <p className="text-xs text-slate-500">Change your Argon2id account password</p>
            </div>
          </div>
          <Link
            to="/change-password"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Update &rarr;
          </Link>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Sign Out of Session</h4>
              <p className="text-xs text-slate-500">Terminate current authentication session</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
