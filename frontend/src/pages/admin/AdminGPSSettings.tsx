import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { GeofenceSettings } from '@/types';
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Save,
  Crosshair,
  Shield,
  Layers,
  HelpCircle,
  X,
  Radio
} from 'lucide-react';

export const AdminGPSSettings: React.FC = () => {
  const [settings, setSettings] = useState<GeofenceSettings>({
    is_enabled: true,
    latitude: 26.8467,
    longitude: 80.9462,
    radius_meters: 200,
    accuracy_threshold_meters: 100,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Location Test
  const [testLat, setTestLat] = useState<string>('');
  const [testLng, setTestLng] = useState<string>('');
  const [testResult, setTestResult] = useState<{ distance: number; inside: boolean } | null>(null);
  const [fetchingDeviceLoc, setFetchingDeviceLoc] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getGeofenceSettings();
        setSettings(data);
      } catch (err: any) {
        setFeedback({ type: 'error', text: err.message || 'Failed to load geofence settings' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await api.updateGeofenceSettings(settings);
      setSettings(updated);
      setFeedback({ type: 'success', text: 'Campus GPS Geofence parameters persisted successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update geofence parameters.' });
    } finally {
      setSaving(false);
    }
  };

  const setDefaultCampusPreset = () => {
    setSettings((prev) => ({
      ...prev,
      latitude: 26.8467,
      longitude: 80.9462,
      radius_meters: 250,
      accuracy_threshold_meters: 100,
    }));
    setFeedback({
      type: 'success',
      text: 'Default campus perimeter coordinates loaded. Click Save to persist.',
    });
  };

  const useCurrentDeviceLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setFetchingDeviceLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setFetchingDeviceLoc(false);
        setFeedback({
          type: 'success',
          text: `Acquired device coordinates (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}).`,
        });
      },
      (err) => {
        setFetchingDeviceLoc(false);
        setFeedback({ type: 'error', text: `GPS error: ${err.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Haversine Test Calculator
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleTestDistance = () => {
    const tLat = parseFloat(testLat);
    const tLng = parseFloat(testLng);
    if (isNaN(tLat) || isNaN(tLng)) {
      setFeedback({ type: 'error', text: 'Please enter valid numerical latitude and longitude to test.' });
      return;
    }
    const dist = calculateHaversine(settings.latitude, settings.longitude, tLat, tLng);
    setTestResult({
      distance: Math.round(dist),
      inside: dist <= settings.radius_meters,
    });
  };

  const getTestDeviceLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTestLat(pos.coords.latitude.toFixed(6));
        setTestLng(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        setFeedback({ type: 'error', text: `Could not fetch location: ${err.message}` });
      }
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-[#A1AEC2] text-xs">Loading geofence settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Location Security Engine
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#22D3EE]" />
            Campus GPS Geofencing
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Define institutional campus perimeter to validate physical presence during face and QR attendance sessions.
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
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#23334A]">
            <div>
              <h2 className="text-base font-bold font-heading text-[#F8FAFC]">Geofence Boundary Parameters</h2>
              <p className="text-xs text-[#A1AEC2]">Configure center coordinates and tolerance radiuses.</p>
            </div>
            <button
              type="button"
              onClick={setDefaultCampusPreset}
              className="text-xs text-[#3B82F6] hover:text-[#60A5FA] font-semibold bg-[#3B82F6]/10 px-3 py-1.5 rounded-lg border border-[#3B82F6]/20 transition"
            >
              Load Default Preset
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Enforcement Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D1525] border border-[#23334A]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#F8FAFC]">Mandatory GPS Geofencing</span>
                <p className="text-xs text-[#A1AEC2]">
                  When enabled, students outside the campus radius are blocked from checking in.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#16243A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

            {/* Coordinates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Campus Center Latitude (Decimal)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settings.latitude}
                  onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Campus Center Longitude (Decimal)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settings.longitude}
                  onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={useCurrentDeviceLocation}
                disabled={fetchingDeviceLoc}
                className="inline-flex items-center text-xs text-[#22D3EE] hover:text-[#67e8f9] font-medium"
              >
                <Crosshair className="w-3.5 h-3.5 mr-1" />
                {fetchingDeviceLoc ? 'Acquiring GPS fix...' : 'Pin to Current Device GPS Location'}
              </button>
            </div>

            {/* Radiuses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Geofence Radius (Meters)
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  required
                  value={settings.radius_meters}
                  onChange={(e) => setSettings({ ...settings, radius_meters: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Recommended: 200m to 500m</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] mb-1">
                  Accuracy Threshold (Meters)
                </label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  required
                  value={settings.accuracy_threshold_meters}
                  onChange={(e) => setSettings({ ...settings, accuracy_threshold_meters: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2.5 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Rejects poor GPS readings ({'>'} 100m error)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#23334A] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Persisting...' : 'Save Geofence Parameters'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Distance Tester */}
        <div className="bg-[#111D30] rounded-2xl border border-[#23334A] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[#23334A]">
              <h3 className="text-sm font-bold font-heading text-[#F8FAFC] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#22D3EE]" />
                Haversine Distance Simulator
              </h3>
              <p className="text-xs text-[#A1AEC2] mt-0.5">Test any coordinate pair against current campus boundaries.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#A1AEC2] mb-1">Test Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={testLat}
                  onChange={(e) => setTestLat(e.target.value)}
                  placeholder="26.846700"
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A1AEC2] mb-1">Test Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={testLng}
                  onChange={(e) => setTestLng(e.target.value)}
                  placeholder="80.946200"
                  className="w-full text-xs border border-[#23334A] rounded-xl p-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getTestDeviceLocation}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-[#23334A] bg-[#0D1525] text-xs font-medium text-[#A1AEC2] hover:text-[#F8FAFC]"
                >
                  Use Device Location
                </button>
                <button
                  type="button"
                  onClick={handleTestDistance}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold"
                >
                  Calculate
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl border text-center ${
                  testResult.inside
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                <p className="font-stats font-bold text-lg">{testResult.distance} meters</p>
                <p className="text-xs font-medium mt-1">
                  {testResult.inside ? 'Inside Authorized Campus Perimeter' : 'Outside Campus Boundary (Check-in Denied)'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#23334A] text-[11px] text-[#64748B]">
            Haversine geodesic formula applies real-time orbital mathematics to compute on-sphere distances without external map APIs.
          </div>
        </div>
      </div>
    </div>
  );
};
