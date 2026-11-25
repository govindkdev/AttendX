import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, GraduationCap, User, ArrowLeft, ArrowRight } from 'lucide-react';

interface PortalOption {
  id: string;
  label: string;
  shortDescription: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
  hoverBorder: string;
}

const portalOptions: PortalOption[] = [
  {
    id: 'admin',
    label: 'Administrator',
    shortDescription: 'Institutional management',
    path: '/admin/login',
    icon: Shield,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-[#8B5CF6]',
    iconBorder: 'border-purple-500/20',
    hoverBorder: 'hover:border-[#8B5CF6]/50',
  },
  {
    id: 'teacher',
    label: 'Teacher / Faculty',
    shortDescription: 'Manage classes and attendance',
    path: '/teacher/login',
    icon: User,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-[#3B82F6]',
    iconBorder: 'border-blue-500/20',
    hoverBorder: 'hover:border-[#3B82F6]/50',
  },
  {
    id: 'student',
    label: 'Student',
    shortDescription: 'Access attendance and timetable',
    path: '/student/login',
    icon: GraduationCap,
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-[#22D3EE]',
    iconBorder: 'border-cyan-500/20',
    hoverBorder: 'hover:border-[#22D3EE]/50',
  },
];

export const PortalSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 bg-radial-subtle">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-4 sm:pt-8">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-[#A1AEC2] hover:text-[#F8FAFC] py-2 px-3 rounded-xl bg-[#111D30] border border-[#23334A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
        </Link>

        <Link to="/" className="flex items-center space-x-2.5">
          <img
            src="/assets/attendx-logo.png"
            alt="AttendX"
            className="w-8 h-8 object-contain rounded-xl"
          />
          <span className="text-lg font-bold tracking-tight text-[#F8FAFC]">
            Attend<span className="text-[#3B82F6]">X</span>
          </span>
        </Link>
      </div>

      {/* Centered Compact Portal Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-blue-950/60 text-[#F8FAFC]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-[#23334A] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <img
                src="/assets/attendx-logo.png"
                alt="AttendX"
                className="w-6 h-6 object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] font-heading">
              Welcome to AttendX
            </h1>
            <p className="text-xs sm:text-sm text-[#A1AEC2] mt-1 font-sans">
              Choose your portal to continue
            </p>
          </div>

          {/* Three Compact Clickable Portal Options */}
          <div className="space-y-3">
            {portalOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => navigate(option.path)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-[#23334A] bg-[#0D1525]/80 hover:bg-[#16243A] ${option.hoverBorder} transition-all duration-200 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] shadow-xs`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${option.iconBg} ${option.iconColor} border ${option.iconBorder} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-[#F8FAFC] group-hover:text-white transition-colors truncate">
                        {option.label}
                      </h2>
                      <p className="text-xs text-[#A1AEC2] truncate leading-tight mt-0.5">
                        {option.shortDescription}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                </button>
              );
            })}
          </div>

          {/* Bottom Link */}
          <div className="mt-5 pt-4 border-t border-[#23334A] text-center">
            <Link
              to="/"
              className="text-xs font-medium text-[#A1AEC2] hover:text-[#F8FAFC] transition-colors"
            >
              Return to Landing Page
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#64748B] pb-4">
        &copy; {new Date().getFullYear()} AttendX. Campus Attendance & Identity Verification.
      </div>
    </div>
  );
};
