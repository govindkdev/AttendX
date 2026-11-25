import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getProfilePath = () => {
    if (user.role === 'ADMIN') return '/admin/profile';
    if (user.role === 'TEACHER') return '/teacher/profile';
    return '/student/profile';
  };

  const getSettingsPath = () => {
    if (user.role === 'ADMIN') return '/admin/settings';
    if (user.role === 'TEACHER') return '/teacher/settings';
    return '/student/settings';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#16243A] transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-[#16243A] border border-[#23334A] text-[#3B82F6] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
          ) : (
            user.full_name?.charAt(0) || 'U'
          )}
        </div>
        <div className="hidden sm:block text-left pr-1">
          <span className="block text-xs font-bold text-[#F8FAFC] leading-none">
            {user.full_name}
          </span>
          <span className="block text-[10px] text-[#A1AEC2] mt-0.5">
            {user.user_code}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#111D30] border border-[#23334A] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 border-b border-[#23334A]">
            <p className="font-semibold text-[#F8FAFC] truncate">{user.full_name}</p>
            <p className="text-[11px] text-[#A1AEC2] truncate mt-0.5">{user.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-blue-500/10 text-[#3B82F6] border border-blue-500/20">
              {user.role}
            </span>
          </div>

          <div className="py-1">
            <Link
              to={getProfilePath()}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] transition-colors"
            >
              <User className="w-4 h-4 mr-2.5 text-[#64748B]" />
              My Profile
            </Link>
            <Link
              to={getSettingsPath()}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] transition-colors"
            >
              <Settings className="w-4 h-4 mr-2.5 text-[#64748B]" />
              Settings
            </Link>
          </div>

          <div className="pt-1 border-t border-[#23334A]">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center px-4 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 mr-2.5 text-rose-400" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
