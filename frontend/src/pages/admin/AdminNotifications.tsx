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
  Megaphone,
  RadioTower
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Communication Dispatcher
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#8B5CF6]" />
            Campus Broadcast & Alerts
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Broadcast official institutional announcements across portals and monitor automated attendance notifications.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-[#A1AEC2] hover:text-[#F8FAFC]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <div className="bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-5">
          <div className="pb-3 border-b border-[#23334A]">
            <h2 className="text-sm font-bold font-heading text-[#F8FAFC] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#8B5CF6]" />
              Broadcast Announcement
            </h2>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Send alert to connected portal users.</p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Notice Headline *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Campus Holiday / Midterm Schedule"
                required
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'ALL', label: 'All Users' },
                  { key: 'STUDENT', label: 'Students' },
                  { key: 'TEACHER', label: 'Faculty' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTargetRole(t.key as any)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all ${
                      targetRole === t.key
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                        : 'border-[#23334A] bg-[#0D1525] text-[#A1AEC2] hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Message Content *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Compose announcement body..."
                required
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {broadcasting ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </form>
        </div>

        {/* Feed of Recent Broadcasts */}
        <div className="lg:col-span-2 bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-4">
          <div className="pb-3 border-b border-[#23334A] flex justify-between items-center">
            <h2 className="text-sm font-bold font-heading text-[#F8FAFC] flex items-center gap-2">
              <RadioTower className="w-4 h-4 text-[#22D3EE]" />
              Sent & Received Notifications ({notifications.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A1AEC2]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications dispatched"
              description="Campus broadcasts and automated alert digests will appear in this timeline."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl bg-[#0D1525] border border-[#23334A] flex items-start justify-between gap-3 hover:border-[#3B82F6]/30 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-[#F8FAFC]">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      )}
                    </div>
                    <p className="text-xs text-[#A1AEC2] leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#64748B] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : 'Recent'}
                      </span>
                      <span>Type: {n.notification_type || 'General'}</span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-[#3B82F6] hover:text-[#60A5FA] font-medium shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
