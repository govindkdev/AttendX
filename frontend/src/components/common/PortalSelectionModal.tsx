import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, GraduationCap, ArrowRight, X } from 'lucide-react';

export interface PortalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  badge?: string;
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

export const PortalSelectionModal: React.FC<PortalSelectionModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPortal = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-modal-heading"
      aria-describedby="portal-modal-subheading"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080D19]/80 backdrop-blur-md modal-backdrop-animate"
    >
      <div
        className="relative w-full max-w-md bg-[#111D30] border border-[#23334A] rounded-2xl p-5 sm:p-7 shadow-2xl shadow-blue-950/60 text-[#F8FAFC] modal-card-animate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Quick Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 pr-6 pl-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-[#23334A] flex items-center justify-center mx-auto mb-3 shadow-inner">
            <img
              src="/assets/attendx-logo.png"
              alt="AttendX"
              className="w-6 h-6 object-contain"
            />
          </div>
          <h2
            id="portal-modal-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] font-heading"
          >
            Welcome to AttendX
          </h2>
          <p
            id="portal-modal-subheading"
            className="text-xs sm:text-sm text-[#A1AEC2] mt-1 font-sans"
          >
            Choose your portal to continue
          </p>
        </div>

        {/* 3 Compact Clickable Portal Options */}
        <div className="space-y-3">
          {portalOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectPortal(option.path)}
                className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-[#23334A] bg-[#0D1525]/80 hover:bg-[#16243A] ${option.hoverBorder} transition-all duration-200 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] shadow-xs`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl ${option.iconBg} ${option.iconColor} border ${option.iconBorder} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-[#F8FAFC] group-hover:text-white transition-colors truncate">
                      {option.label}
                    </h3>
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

        {/* Modal Bottom Section */}
        <div className="mt-5 pt-4 border-t border-[#23334A] flex flex-col items-center space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-[#A1AEC2] hover:text-[#F8FAFC] bg-[#16243A]/80 hover:bg-[#16243A] border border-[#23334A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
