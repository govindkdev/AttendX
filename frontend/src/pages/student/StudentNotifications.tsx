import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { NotificationItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { Bell, Check, Clock } from 'lucide-react';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // Ignored
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System & Absence Notices</h2>
        <p className="text-xs text-slate-500 mt-1">
          Stay notified of lecture absences, leave decisions, and timetable schedule adjustments.
        </p>
      </div>

      {notifications.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-white' : 'bg-blue-50/40'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-blue-600'}`}></span>
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-4">{n.message}</p>
                <span className="block text-[11px] text-slate-400 pl-4">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications available"
          description="You are completely up to date. Alerts and academic notices will appear here."
        />
      )}
    </div>
  );
};
