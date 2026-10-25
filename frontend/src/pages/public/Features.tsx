import React from 'react';
import { Camera, QrCode, MapPin, Bot, BarChart2, Bell, FileSpreadsheet, Lock } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: Camera,
      title: 'Facial Biometric Recognition',
      desc: 'High-speed browser camera frame capture with multi-scale spatial frequency feature extraction and cosine distance verification against 128-d templates. Quality filters detect blurriness and lighting exposure before verification.',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: QrCode,
      title: 'HMAC-Signed Expiring QR Codes',
      desc: 'Teachers generate session-specific QR codes signed with HMAC-SHA256 containing lecture session IDs, nonces, and 30-minute expiry timestamps. Rejects replays and screenshots.',
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: MapPin,
      title: 'GPS Geofencing',
      desc: 'Haversine formula distance calculation confirms student physical presence within the designated campus boundary (200m radius). Enforces strict hardware accuracy limits to prevent spoofing.',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Bot,
      title: 'AttendX AI Query Assistant',
      desc: 'Ask complex natural-language queries such as "What is my attendance this month?" or "Which subjects have attendance below 75%?". Scopes permissions and provides factual evidence from database records.',
      color: 'text-violet-600 bg-violet-50',
    },
    {
      icon: BarChart2,
      title: 'Live Analytical Dashboards',
      desc: 'Real-time database analytics for students, teachers, and admins. Subject-wise breakdown, monthly percentages, and automatic late status tagging based on institute thresholds.',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Bell,
      title: 'Automated Parent Alerts',
      desc: 'Instant notifications dispatched upon lecture completion for absent students, plus daily 5:00 PM cutoff summaries to registered guardian email addresses and phone contacts.',
      color: 'text-rose-600 bg-rose-50',
    },
    {
      icon: FileSpreadsheet,
      title: 'Comprehensive Reports & Exports',
      desc: 'Generate Excel (openpyxl), CSV, and PDF reports filtered by dates, departments, courses, branches, and verification methods. Features built-in formula injection sanitization.',
      color: 'text-teal-600 bg-teal-50',
    },
    {
      icon: Lock,
      title: 'Role-Based Access & Audit Trail',
      desc: 'Strict server-side role checks with Argon2id password hashing, mandatory first-login password rotation, and tamper-evident audit logs documenting every system event.',
      color: 'text-slate-600 bg-slate-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          System Features & Capabilities
        </h1>
        <p className="text-lg text-slate-600">
          Engineered for technical robustness, real database consistency, and intuitive user workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
