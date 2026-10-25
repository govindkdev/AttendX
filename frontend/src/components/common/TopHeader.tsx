import React from 'react';
import { useAuth } from '@/features/authentication/AuthContext';
import { User, Bell, Bot, Shield, LogOut } from 'lucide-react';

interface TopHeaderProps {
  title: string;
  onOpenAI?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, onOpenAI }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* AttendX AI Button */}
        {onOpenAI && (
          <button
            onClick={onOpenAI}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors shadow-xs"
          >
            <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>AttendX AI</span>
          </button>
        )}

        {/* User Pill */}
        <div className="flex items-center pl-3 border-l border-slate-200 space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300 shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.charAt(0) || 'U'
            )}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-900 leading-tight">
              {user?.full_name}
            </span>
            <span className="block text-[11px] text-slate-500 font-medium">
              {user?.user_code} ({user?.role})
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors ml-2"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
