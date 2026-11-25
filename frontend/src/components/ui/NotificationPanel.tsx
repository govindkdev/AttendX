import React from 'react';
import { Bell, CheckCheck, X, Clock } from 'lucide-react';
import type { NotificationItem } from '@/types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onItemClick?: (item: NotificationItem) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onItemClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-[#080D19]/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111D30] border-l border-[#23334A] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#23334A] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#3B82F6] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">Notifications</h3>
                <p className="text-[11px] text-[#A1AEC2]">
                  {notifications.filter((n) => !n.is_read).length} unread updates
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-[#3B82F6] hover:text-[#22D3EE] font-medium flex items-center p-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 mr-1" /> Read all
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#16243A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#23334A]/50">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-[#64748B]">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No notifications to display</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick && onItemClick(item)}
                  className={`p-4 hover:bg-[#16243A]/50 transition-colors cursor-pointer ${
                    !item.is_read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      {item.title}
                    </span>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-[#A1AEC2] mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="flex items-center space-x-1 mt-2 text-[10px] text-[#64748B]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
