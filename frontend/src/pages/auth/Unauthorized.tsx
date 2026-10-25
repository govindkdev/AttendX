import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/authentication/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'TEACHER') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Denied (403)</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your current account role ({user?.role || 'Guest'}) does not have permission to access the requested resource.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
          <Link
            to={getDashboardPath()}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Authorized Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
