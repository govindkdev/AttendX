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
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<InstituteSettings>({
    institute_name: 'GCRG Group of Institutions',
    address: 'Lucknow, Uttar Pradesh, India',
    timezone: 'Asia/Kolkata',
    contact_email: 'contact@gcrg.edu.in',
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

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading institute settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          Institute Governance & Attendance Rules
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure institute identity, lecture grace windows, QR token expiry, and automated daily cutoff times.
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

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Institute Profile Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Institute Profile & Contact
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institute Official Name *</label>
              <input
                type="text"
                required
                value={settings.institute_name}
                onChange={(e) => setSettings({ ...settings, institute_name: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Location & Address *</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email *</label>
                <input
                  type="email"
                  required
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Timezone *</label>
              <input
                type="text"
                required
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Attendance Rules & Cutoffs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600" />
              Attendance Engine Rules
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Check-ins occurring after this many minutes from lecture start are automatically classified as LATE.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dynamic QR Token Validity (Minutes) *
              </label>
              <input
                type="number"
                min="5"
                max="120"
                required
                value={settings.qr_expiry_minutes}
                onChange={(e) => setSettings({ ...settings, qr_expiry_minutes: parseInt(e.target.value) || 30 })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum minutes a generated cryptographic QR code remains valid for student scanning.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default active duration for facial recognition sessions.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Automatic Cutoff Time (24h format) *
              </label>
              <input
                type="time"
                required
                value={settings.daily_cutoff_time}
                onChange={(e) => setSettings({ ...settings, daily_cutoff_time: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Background job marks absent any unrecorded students when this daily time is reached.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Governance Settings...' : 'Save Institute Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
