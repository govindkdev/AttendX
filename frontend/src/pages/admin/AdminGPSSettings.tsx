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
      setFeedback({ type: 'success', text: 'Campus GPS Geofence parameters updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update geofence parameters.' });
    } finally {
      setSaving(false);
    }
  };

  const setGcrgLucknowPreset = () => {
    setSettings((prev) => ({
      ...prev,
      latitude: 26.8467,
      longitude: 80.9462,
      radius_meters: 250,
      accuracy_threshold_meters: 100,
    }));
    setFeedback({
      type: 'success',
      text: 'GCRG Group of Institutions (Lucknow, UP) coordinate preset loaded. Click Save to persist.',
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
    return <div className="p-8 text-center text-slate-400 text-sm">Loading geofence settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MapPin className="w-7 h-7 text-indigo-600" />
          Campus GPS Geofencing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Define institutional campus boundaries to validate student presence during face or QR attendance check-ins.
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
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Geofence Boundary Parameters</h2>
              <p className="text-xs text-slate-500">Configure center coordinates and tolerance radiuses.</p>
            </div>
            <button
              type="button"
              onClick={setGcrgLucknowPreset}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
            >
              Load GCRG Lucknow Preset
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Enforcement Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-slate-800">Mandatory GPS Geofencing</span>
                <p className="text-xs text-slate-500">
                  When enabled, students outside the campus radius will be rejected during verification.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Coordinates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Center Latitude (Decimal)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settings.latitude}
                  onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Center Longitude (Decimal)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settings.longitude}
                  onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={useCurrentDeviceLocation}
                disabled={fetchingDeviceLoc}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                <Compass className="w-3.5 h-3.5" />
                {fetchingDeviceLoc ? 'Reading browser GPS...' : 'Use current device location as center'}
              </button>
            </div>

            {/* Radiuses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allowed Campus Radius (Meters)
                </label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  required
                  value={settings.radius_meters}
                  onChange={(e) => setSettings({ ...settings, radius_meters: parseInt(e.target.value) || 200 })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Recommended for GCRG Campus: 200m – 300m.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Allowed GPS Inaccuracy (Meters)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  required
                  value={settings.accuracy_threshold_meters}
                  onChange={(e) =>
                    setSettings({ ...settings, accuracy_threshold_meters: parseInt(e.target.value) || 100 })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Rejects spoofed or coarse cellular/IP locations.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Geofence Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Interactive Distance Simulator & Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-indigo-600" />
              Geofence Verification Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Test whether a student's coordinate would be accepted under the current parameters.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Test Latitude</label>
                <input
                  type="text"
                  placeholder="e.g. 26.8470"
                  value={testLat}
                  onChange={(e) => setTestLat(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Test Longitude</label>
                <input
                  type="text"
                  placeholder="e.g. 80.9465"
                  value={testLng}
                  onChange={(e) => setTestLng(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getTestDeviceLocation}
                  className="text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition"
                >
                  Fill My GPS
                </button>
                <button
                  type="button"
                  onClick={handleTestDistance}
                  className="flex-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 py-1.5 px-3 rounded-lg transition"
                >
                  Compute Distance
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs mt-3 ${
                    testResult.inside
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.inside ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    {testResult.inside ? 'Inside Campus Boundary' : 'Outside Boundary (Rejected)'}
                  </div>
                  <div className="mt-1 text-slate-600">
                    Distance to campus center: <span className="font-semibold">{testResult.distance} m</span>
                    <br />
                    Permitted radius: <span className="font-semibold">{settings.radius_meters} m</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Institutional Note */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-2 text-indigo-950 text-xs">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Shield className="w-4 h-4 text-indigo-600" />
              GCRG Group of Institutions (Lucknow)
            </h4>
            <p className="leading-relaxed text-indigo-800/90">
              Attendance check-ins combine facial biometrics with device-level WGS-84 coordinates. Even with valid
              biometrics, requests submitted from outside the Lucknow campus geofence will be flagged and rejected by
              the server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
