import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Camera,
  QrCode,
  MapPin,
  Bot,
  BarChart3,
  Bell,
  Lock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';

export const Home: React.FC = () => {
  return (
    <div className="space-y-24 pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-28 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="hero-animate-badge inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Next-Generation Institute Management Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              <span className="hero-word-1 mr-2 sm:mr-3">Smart Attendance.</span>
              <span className="hero-word-2 mr-2 sm:mr-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
                  Verified Identity.
                </span>
              </span>
              <span className="hero-word-3">Trusted Insights.</span>
            </h1>

            <p className="hero-animate-desc text-lg text-slate-600 leading-relaxed font-normal">
              Eliminate proxy attendance, paper registers, and manual errors. AttendX combines computer-vision face verification, cryptographic signed QR tokens, and GPS geofencing into a unified, privacy-first platform.
            </p>

            <div className="hero-animate-cta flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:scale-[1.02] transition-all"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:border-slate-400 transition-all"
              >
                Explore Features
              </Link>
            </div>

            {/* Micro Trust Indicators */}
            <div className="hero-animate-indicators pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" /> 128-d Biometric Verification</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" /> HMAC-SHA256 Signed QR</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" /> Haversine GPS Geofencing</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" /> Zero Demo Data Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Triple Verification Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase">Verification Engine</h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Triple-Tier Attendance Integrity
          </p>
          <p className="text-slate-600 text-sm">
            Multiple authentic verification vectors working in synergy to ensure students are genuinely present on campus in the classroom.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Face Verification */}
          <ScrollReveal delay={0}>
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group h-full">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Facial Biometrics</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Real-time browser camera frame analysis. Extracts normalized 128-dimensional biometric embeddings and verifies cosine similarity against enrolled templates.
              </p>
              <ul className="text-xs space-y-2 text-slate-500 font-medium">
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" /> Blur & lighting exposure check</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" /> Zero raw image storage for privacy</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" /> Strict confidence thresholding</li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Card 2: QR Attendance */}
          <ScrollReveal delay={150}>
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group h-full">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Signed Expiring QR</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Teachers project a dynamically generated QR token with an embedded HMAC-SHA256 digital signature, nonces, and automatic expiration.
              </p>
              <ul className="text-xs space-y-2 text-slate-500 font-medium">
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0" /> 30-minute configurable validity</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0" /> Anti-replay and screenshot protection</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0" /> Bound to specific lecture sessions</li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Card 3: GPS Geofencing */}
          <ScrollReveal delay={300}>
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group h-full">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">GPS Geofencing</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Mathematical Haversine formula calculation ensures student coordinates fall strictly within the authorized campus perimeter.
              </p>
              <ul className="text-xs space-y-2 text-slate-500 font-medium">
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" /> Configurable center & radius (200m)</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" /> Hardware accuracy threshold check</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" /> Audited reject reasons for anomalies</li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-blue-400 tracking-wider uppercase">Capabilities</h2>
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Institute Management Suite
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal delay={0}>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 h-full">
                <Bot className="w-8 h-8 text-blue-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">AttendX AI Assistant</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Natural-language attendance queries backed strictly by database evidence. Never fabricates numbers or executes unverified SQL.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 h-full">
                <BarChart3 className="w-8 h-8 text-emerald-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Live Analytics</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real database aggregates for students, faculty, and administrators. Track subjects below 75%, attendance trends, and daily metrics.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 h-full">
                <Bell className="w-8 h-8 text-amber-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Parent Alerts</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated absence dispatches at lecture completion and daily 5:00 PM cutoff to verified parent contacts.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 h-full">
                <Lock className="w-8 h-8 text-rose-400 mb-4" />
                <h4 className="text-lg font-bold mb-2">Immutable Audit Logs</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every login, status change, manual correction, and configuration update is cryptographically logged with IP and actor role.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Institutional FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 space-y-2">
          <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase">Answers</h2>
          <h3 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h3>
        </ScrollReveal>

        <div className="space-y-4">
          <ScrollReveal delay={0}>
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">How does AttendX protect biometric privacy?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                AttendX does not store unencrypted raw photos of students. During enrollment, facial frames are converted to normalized 128-dimensional mathematical feature vectors. Biometric templates cannot be reverse-engineered into facial photographs.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">What is the No-Demo-Data policy?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                AttendX never inserts fictional students, fake attendance, or fabricated charts. All metrics, attendance percentages, and analytics in dashboards originate exclusively from actual database transactions initiated by authorized users.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">Can a teacher manually correct attendance?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Yes. When exceptional situations occur, authorized teachers can correct a record. However, the system enforces a mandatory justification reason and creates an immutable audit correction record preserving the original verification method.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};
