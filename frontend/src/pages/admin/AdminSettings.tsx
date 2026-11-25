import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { InstituteSettings } from '@/types';
import {
  Settings,
  Building2,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  MapPin,
  Sliders
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<InstituteSettings>({
    institute_name: 'Campus Management Authority',
    address: 'Campus Main Enclave',
    timezone: 'Asia/Kolkata',
    contact_email: 'admin@attendx.internal',
    contact_phone: '+91 522 000000',
    late_threshold_minutes: 15,
    qr_expiry_minutes: 30,
    face_session_minutes: 45,
    daily_cutoff_time: '18:00',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getInstituteSettings();
        setSettings(data);
      } catch (err: any) {
        setFeedback({ type: 'error', text: err.message || 'Failed to load institute settings' });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await api.updateInstituteSettings(settings);
      setSettings(updated);
      setFeedback({ type: 'success', text: 'Institute governance settings updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save institute settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Global Configuration
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#3B82F6]" />
            Institute & Policy Governance
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Configure institutional identities, attendance cutoff thresholds, token expiry intervals, and timezone standards.
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

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Institute Profile Information */}
          <div className="bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-4">
            <h2 className="text-sm font-bold font-heading text-[#F8FAFC] flex items-center gap-2 pb-3 border-b border-[#23334A]">
              <Building2 className="w-4 h-4 text-[#3B82F6]" />
              Institute Profile & Contact
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Institute Official Name *</label>
              <input
                type="text"
                required
                value={settings.institute_name}
                onChange={(e) => setSettings({ ...settings, institute_name: e.target.value })}
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Campus Location & Address *</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Official Contact Email *</label>
                <input
                  type="email"
                  required
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">Standard Timezone *</label>
              <input
                type="text"
                required
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* Attendance Rules & Cutoffs */}
          <div className="bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-4">
            <h2 className="text-sm font-bold font-heading text-[#F8FAFC] flex items-center gap-2 pb-3 border-b border-[#23334A]">
              <Clock className="w-4 h-4 text-[#22D3EE]" />
              Attendance Engine Rules
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                Late Arrival Grace Period (Minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={settings.late_threshold_minutes}
                onChange={(e) =>
                  setSettings({ ...settings, late_threshold_minutes: parseInt(e.target.value) || 15 })
                }
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <p className="text-[10px] text-[#64748B] mt-1">
                Check-ins occurring after this threshold from session start are classified as LATE.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                Dynamic QR Token Validity (Minutes) *
              </label>
              <input
                type="number"
                min="5"
                max="120"
                required
                value={settings.qr_expiry_minutes}
                onChange={(e) => setSettings({ ...settings, qr_expiry_minutes: parseInt(e.target.value) || 30 })}
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <p className="text-[10px] text-[#64748B] mt-1">
                Maximum duration a generated signed QR code remains active for student scanning.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                Face Verification Session Duration (Minutes) *
              </label>
              <input
                type="number"
                min="10"
                max="180"
                required
                value={settings.face_session_minutes}
                onChange={(e) =>
                  setSettings({ ...settings, face_session_minutes: parseInt(e.target.value) || 45 })
                }
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <p className="text-[10px] text-[#64748B] mt-1">Default active window for facial recognition radar verification.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                Daily Automatic Cutoff Time (24h format) *
              </label>
              <input
                type="time"
                required
                value={settings.daily_cutoff_time}
                onChange={(e) => setSettings({ ...settings, daily_cutoff_time: e.target.value })}
                className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <p className="text-[10px] text-[#64748B] mt-1">
                Background batch scheduler flags absent any unrecorded students when this daily time arrives.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Governance Settings...' : 'Save Institute Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
