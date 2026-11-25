import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/authentication/AuthContext';
import { api } from '@/services/api';
import { Bot, Bell, Menu, Shield } from 'lucide-react';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import type { NotificationItem } from '@/types';

interface TopHeaderProps {
  title: string;
  onOpenAI?: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  onOpenAI,
  onToggleMobileMenu,
}) => {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Fetch notifications if user is authenticated
    if (user) {
      api.getNotifications()
        .then((data: NotificationItem[]) => setNotifications(data || []))
        .catch(() => {
          // Fallback empty list
          setNotifications([]);
        });
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <header className="h-16 bg-[#0D1525] border-b border-[#23334A] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-2 rounded-xl text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] md:hidden transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider hidden sm:block">
            {user?.role === 'ADMIN' ? 'Administration' : user?.role === 'TEACHER' ? 'Faculty Portal' : 'Student Portal'}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight truncate max-w-[200px] sm:max-w-md">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* AttendX AI Assistant Button */}
        {onOpenAI && (
          <button
            onClick={onOpenAI}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-[#3B82F6] hover:bg-blue-500/20 text-xs font-semibold border border-blue-500/20 transition-all shadow-xs"
            title="Open AttendX AI Assistant"
          >
            <Bot className="w-3.5 h-3.5 animate-pulse text-[#22D3EE]" />
            <span className="hidden sm:inline">AttendX AI</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={() => setNotificationsOpen(true)}
          className="relative p-2 rounded-xl text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] transition-colors border border-transparent hover:border-[#23334A]"
          title="Notifications"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#0D1525]" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="pl-2 border-l border-[#23334A]">
          <ProfileDropdown />
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
      />
    </header>
  );
};
