import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { NotificationItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Users,
  X,
  MailCheck,
  Megaphone,
} from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setBroadcasting(true);
    setFeedback(null);
    try {
      const res = await api.broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        target_role: targetRole === 'ALL' ? undefined : targetRole,
      });
      setFeedback({ type: 'success', text: res.message });
      setTitle('');
      setMessage('');
      await loadNotifications();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Broadcast failed' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to mark notification as read' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-7 h-7 text-indigo-600" />
          Institutional Notification Dispatch
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Broadcast official announcements across the institute and monitor automated attendance absence dispatch logs.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Announcement Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Compose Announcement
          </h2>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTargetRole('ALL')}
                  className={`py-1.5 rounded-md transition ${
                    targetRole === 'ALL' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('STUDENT')}
                  className={`py-1.5 rounded-md transition ${
                    targetRole === 'STUDENT' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('TEACHER')}
                  className={`py-1.5 rounded-md transition ${
                    targetRole === 'TEACHER' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  Teachers
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Headline *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-term Exam Schedule Announced"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter official institutional notice details..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {broadcasting ? 'Broadcasting...' : 'Broadcast Notice'}
            </button>
          </form>
        </div>

        {/* System & Absence Notification Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Notices & Absence Alerts</h2>
              <p className="text-xs text-slate-500">Live feed of notifications dispatched across AttendX.</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full">
              {notifications.length} Total
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading notification logs...</div>
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications dispatched"
              description="No notices or alerts have been dispatched yet. When faculty end lectures with absent students, automated alerts appear here."
              icon={Bell}
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition ${
                    n.is_read
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-indigo-50/40 border-indigo-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{n.title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {n.notification_type}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" title="Unread"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap p-1"
                        title="Mark as Read"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MailCheck className="w-3.5 h-3.5 text-emerald-600" /> Dispatched
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
