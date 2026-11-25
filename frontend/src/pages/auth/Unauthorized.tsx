import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/authentication/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/get-started';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'TEACHER') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F8FAFC] flex items-center justify-center p-4 bg-radial-subtle">
      <div className="bg-[#111D30] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-[#23334A]">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Access Restricted (403)</h2>
        <p className="mt-2 text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
          Your current account role ({user?.role || 'Guest'}) does not have authorization to access the requested portal.
        </p>

        <div className="mt-6 pt-6 border-t border-[#23334A] flex justify-center">
          <Link
            to={getDashboardPath()}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors shadow-md shadow-blue-500/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Authorized Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
