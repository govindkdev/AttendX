import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Settings, Lock, Bell, LogOut } from 'lucide-react';

export const TeacherSettings: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Manage session controls and security preferences.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Account Password</h4>
              <p className="text-xs text-slate-500">Rotate your faculty portal password</p>
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
              <h4 className="text-sm font-semibold text-slate-900">Sign Out</h4>
              <p className="text-xs text-slate-500">End active faculty session</p>
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
