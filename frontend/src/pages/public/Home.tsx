import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
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
  ArrowRight,
  Sparkles,
  Layers,
  History,
  Activity,
  UserCheck,
  Check
} from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';
import { FeatureCard } from '@/components/ui/FeatureCard';
import type { PublicOutletContext } from '@/layouts/PublicLayout';

const ROTATING_HIGHLIGHTS = [
  'AI Face Biometrics',
  'Dynamic Rotating QR Tokens',
  'Haversine GPS Geofencing',
  'Real-Time Campus Analytics',
];

export const Home: React.FC = () => {
  const outletCtx = useOutletContext<PublicOutletContext | null>();
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) => (prev + 1) % ROTATING_HIGHLIGHTS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const handleOpenPortal = () => {
    if (outletCtx && typeof outletCtx.onOpenPortalModal === 'function') {
      outletCtx.onOpenPortalModal();
    } else {
      window.dispatchEvent(new CustomEvent('attendx:open-portal-modal'));
    }
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-x-hidden text-[#F8FAFC]">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative pt-12 md:pt-20 lg:pt-28 bg-radial-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Badge */}
            <div className="hero-animate-badge inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#16243A] border border-[#23334A] text-[#22D3EE] text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>AI-Powered Campus Attendance & Identity Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.1]">
              <span className="hero-word-1 mr-2 sm:mr-3">Smart Attendance.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]">
                Smarter Campus.
              </span>
            </h1>

            {/* Supporting Headline */}
            <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#A1AEC2]">
              <span className="hero-word-2 mr-2 text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                Verified Identity.
              </span>
              <span className="hero-word-3 text-[#F8FAFC]">Trusted Insights.</span>
            </p>

            {/* Rotating Technology Highlight */}
            <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A1AEC2] bg-[#0D1525]/80 px-3.5 py-1.5 rounded-full border border-[#23334A] shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
              <span className="text-[#64748B]">active.module:</span>
              <span className="text-[#22D3EE] font-semibold transition-all duration-300">
                {ROTATING_HIGHLIGHTS[activeHighlightIndex]}
              </span>
            </div>

            {/* Description */}
            <p className="hero-animate-desc text-base sm:text-lg text-[#A1AEC2] leading-relaxed max-w-2xl mx-auto font-normal">
              AttendX brings intelligent face verification, secure QR attendance and campus location validation together to simplify attendance management.
            </p>

            {/* CTAs */}
            <div className="hero-animate-cta flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleOpenPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <Link
                to="/features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold rounded-xl text-[#F8FAFC] bg-[#111D30] hover:bg-[#16243A] border border-[#23334A] transition-all"
              >
                Explore Features
              </Link>
            </div>

            {/* Indicators */}
            <div className="hero-animate-indicators pt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-medium text-[#A1AEC2]">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] mr-1.5 shrink-0" /> Real-Time Face Verification
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] mr-1.5 shrink-0" /> Dynamic Rotating QR Tokens
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] mr-1.5 shrink-0" /> Haversine GPS Geofencing
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] mr-1.5 shrink-0" /> Role-Based Access Governance
              </span>
            </div>

            {/* Product Console Visual Preview */}
            <div className="pt-10 sm:pt-14">
              <div className="relative mx-auto max-w-5xl rounded-2xl border border-[#23334A] bg-[#0D1525] p-2 sm:p-4 shadow-2xl shadow-blue-950/40">
                {/* Console Window Top bar */}
                <div className="flex items-center justify-between pb-3 px-3 border-b border-[#23334A]/80 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#22C55E]/80 inline-block" />
                    <span className="ml-2 font-mono text-[11px] text-[#64748B]">attendx.campus.internal/live-session</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-[#A1AEC2]">
                    <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
                    <span>SESSION IN PROGRESS</span>
                  </div>
                </div>

                {/* Console Interior */}
                <div className="p-4 sm:p-6 bg-[#080D19]/60 rounded-xl mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
                  {/* Session Overview */}
                  <div className="bg-[#111D30] border border-[#23334A] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-semibold uppercase text-[#3B82F6]">Current Lecture</span>
                        <h4 className="text-sm font-bold text-[#F8FAFC] mt-0.5">CS-402 Artificial Intelligence</h4>
                        <p className="text-xs text-[#A1AEC2]">Room 304, Academic Block A</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/30">
                        ACTIVE
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#23334A] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Recorded</span>
                        <span className="font-stats font-bold text-emerald-400 text-lg">42</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Enrolled Total</span>
                        <span className="font-stats font-bold text-[#F8FAFC] text-lg">48</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Vectors */}
                  <div className="bg-[#111D30] border border-[#23334A] rounded-xl p-4 space-y-2.5">
                    <span className="text-[11px] font-semibold uppercase text-[#A1AEC2] block">Multi-Factor Vectors</span>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-[#23334A]/60">
                      <span className="flex items-center text-[#F8FAFC]">
                        <Camera className="w-3.5 h-3.5 text-[#3B82F6] mr-2" /> Facial Biometrics
                      </span>
                      <span className="text-emerald-400 font-semibold text-[11px]">Enforced</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-[#23334A]/60">
                      <span className="flex items-center text-[#F8FAFC]">
                        <QrCode className="w-3.5 h-3.5 text-[#8B5CF6] mr-2" /> Dynamic QR
                      </span>
                      <span className="text-emerald-400 font-semibold text-[11px]">Rotating 15s</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="flex items-center text-[#F8FAFC]">
                        <MapPin className="w-3.5 h-3.5 text-[#22D3EE] mr-2" /> GPS Geofence
                      </span>
                      <span className="text-emerald-400 font-semibold text-[11px]">Within 150m</span>
                    </div>
                  </div>

                  {/* Real-Time Live Feed */}
                  <div className="bg-[#111D30] border border-[#23334A] rounded-xl p-4 space-y-2">
                    <span className="text-[11px] font-semibold uppercase text-[#A1AEC2] block">Recent Verifications</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16243A]">
                        <span className="font-medium text-[#F8FAFC]">Aarav Sharma</span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Face Verified</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16243A]">
                        <span className="font-medium text-[#F8FAFC]">Priya Patel</span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">QR + GPS</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16243A]">
                        <span className="font-medium text-[#F8FAFC]">Rohan Gupta</span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Face Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURES SECTION (8 PLANNED CORE CAPABILITIES)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#3B82F6] tracking-wider uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Engineered for Modern Campus Administration
          </h2>
          <p className="text-sm sm:text-base text-[#A1AEC2] leading-relaxed">
            AttendX brings together cutting-edge computer vision, location verification, and administrative governance to streamline institutional attendance.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. AI Face Recognition */}
          <ScrollReveal delay={0}>
            <FeatureCard
              icon={Camera}
              badge="Biometrics"
              title="AI Face Recognition"
              description="Real-time browser-based face verification utilizing computer vision to match facial landmark embeddings against enrolled templates."
              points={[
                'Instant webcam/mobile capture',
                'Anti-spoofing pose validation',
                'Normalized embedding storage',
              ]}
            />
          </ScrollReveal>

          {/* 2. QR-Based Attendance */}
          <ScrollReveal delay={100}>
            <FeatureCard
              icon={QrCode}
              badge="Cryptographic"
              title="QR-Based Attendance"
              description="Dynamically refreshing, time-limited QR codes projected by faculty and securely scanned by students in the lecture hall."
              points={[
                'Auto-refreshes every 15-30s',
                'Prevents screenshot sharing',
                'One-scan per device binding',
              ]}
            />
          </ScrollReveal>

          {/* 3. GPS Geofencing */}
          <ScrollReveal delay={200}>
            <FeatureCard
              icon={MapPin}
              badge="Haversine"
              title="GPS Geofencing"
              description="Validates student physical presence within institutional classroom and campus boundaries using precision geolocation calculations."
              points={[
                'Configurable campus perimeter',
                'Location spoofing deterrence',
                'Zero continuous tracking',
              ]}
            />
          </ScrollReveal>

          {/* 4. Attendance Analytics */}
          <ScrollReveal delay={300}>
            <FeatureCard
              icon={BarChart3}
              badge="Insights"
              title="Attendance Analytics"
              description="Institutional dashboard telemetry visualizing subject-wise trends, batch performance, and early warnings for attendance shortages."
              points={[
                '75% eligibility cutoff tracking',
                'Departmental comparisons',
                'Exportable XLSX and PDF reports',
              ]}
            />
          </ScrollReveal>

          {/* 5. Parent Notifications */}
          <ScrollReveal delay={400}>
            <FeatureCard
              icon={Bell}
              badge="Alerts"
              title="Parent Notifications"
              description="Automated alerts and notifications keeping guardians informed regarding attendance shortages before examination cutoffs."
              points={[
                'Automated shortage triggers',
                'Institutional communication log',
                'Customizable alert thresholds',
              ]}
            />
          </ScrollReveal>

          {/* 6. AttendX AI Assistant */}
          <ScrollReveal delay={500}>
            <FeatureCard
              icon={Bot}
              badge="AI Copilot"
              title="AttendX AI Assistant"
              description="Context-aware campus assistant answering attendance questions, explaining percentages, and summarizing institutional trends."
              points={[
                'Role-specific intelligence',
                'Shortage queries & timetable check',
                'Faculty & admin insights',
              ]}
            />
          </ScrollReveal>

          {/* 7. Secure Authentication */}
          <ScrollReveal delay={600}>
            <FeatureCard
              icon={Lock}
              badge="Access Control"
              title="Secure Authentication"
              description="Strict role-based access management with separated administrative, faculty, and student portals preventing unauthorized elevation."
              points={[
                'Isolated role login portals',
                'Two-step account activation',
                'Tokenized session management',
              ]}
            />
          </ScrollReveal>

          {/* 8. Attendance Audit Logs */}
          <ScrollReveal delay={700}>
            <FeatureCard
              icon={ShieldCheck}
              badge="Compliance"
              title="Attendance Audit Logs"
              description="Comprehensive historical logging of every attendance event, verification vector, manual override, and institutional modification."
              points={[
                'Immutable timestamp tracking',
                'Faculty correction tracking',
                'Academic audit readiness',
              ]}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (5-STEP WORKFLOW)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#3B82F6] tracking-wider uppercase">
            System Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            How AttendX Works
          </h2>
          <p className="text-sm sm:text-base text-[#A1AEC2] leading-relaxed">
            A seamless, frictionless five-step operational workflow from lecture initiation to administrative review.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Step 1 */}
          <ScrollReveal delay={0}>
            <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6 h-full flex flex-col justify-between hover:border-[#3B82F6]/40 transition-colors">
              <div>
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center text-xs font-bold font-stats mb-4">
                  01
                </span>
                <h3 className="text-base font-bold text-[#F8FAFC] mb-2">Faculty Starts Session</h3>
                <p className="text-xs text-[#A1AEC2] leading-relaxed">
                  Instructor selects subject and initiates a live attendance session from their faculty portal.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 2 */}
          <ScrollReveal delay={100}>
            <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6 h-full flex flex-col justify-between hover:border-[#3B82F6]/40 transition-colors">
              <div>
                <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/20 flex items-center justify-center text-xs font-bold font-stats mb-4">
                  02
                </span>
                <h3 className="text-base font-bold text-[#F8FAFC] mb-2">Student Verifies Identity</h3>
                <p className="text-xs text-[#A1AEC2] leading-relaxed">
                  Student uses camera for AI face recognition or scans the dynamic classroom QR code.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 3 */}
          <ScrollReveal delay={200}>
            <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6 h-full flex flex-col justify-between hover:border-[#3B82F6]/40 transition-colors">
              <div>
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20 flex items-center justify-center text-xs font-bold font-stats mb-4">
                  03
                </span>
                <h3 className="text-base font-bold text-[#F8FAFC] mb-2">System Checks Conditions</h3>
                <p className="text-xs text-[#A1AEC2] leading-relaxed">
                  The system validates biometric confidence, QR validity window, and campus GPS geofence.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 4 */}
          <ScrollReveal delay={300}>
            <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6 h-full flex flex-col justify-between hover:border-[#3B82F6]/40 transition-colors">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 flex items-center justify-center text-xs font-bold font-stats mb-4">
                  04
                </span>
                <h3 className="text-base font-bold text-[#F8FAFC] mb-2">Attendance Recorded</h3>
                <p className="text-xs text-[#A1AEC2] leading-relaxed">
                  Status is instantly logged in the database with verification method and immutable timestamp.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 5 */}
          <ScrollReveal delay={400}>
            <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-6 h-full flex flex-col justify-between hover:border-[#3B82F6]/40 transition-colors">
              <div>
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 flex items-center justify-center text-xs font-bold font-stats mb-4">
                  05
                </span>
                <h3 className="text-base font-bold text-[#F8FAFC] mb-2">Review & Reports</h3>
                <p className="text-xs text-[#A1AEC2] leading-relaxed">
                  Faculty and administrators review verified records, generate reports, and trigger alerts.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================================================
          SECURITY SECTION
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#3B82F6] tracking-wider uppercase">
            Security & Governance
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Academic Integrity & Data Protection
          </h2>
          <p className="text-sm sm:text-base text-[#A1AEC2] leading-relaxed">
            AttendX is architected with disciplined access controls, verifiable attendance records, and privacy-conscious design.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-7 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Role-Based Access</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Separated authentication portals and permission guardrails ensure students, teachers, and administrators access only their designated features.
            </p>
          </div>

          <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-7 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Secure Authentication</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Institutional identity verification with hashed credential storage, dedicated activation flows, and secure session management.
            </p>
          </div>

          <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-7 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Attendance Verification</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Multi-factor validation checks ensure that every recorded attendance record corresponds to an authentic session and verified identity.
            </p>
          </div>

          <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-7 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Protected Student Information</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Student details and attendance records are shielded from unauthorized external exposure, maintaining institutional student privacy.
            </p>
          </div>

          <div className="bg-[#111D30] border border-[#23334A] rounded-2xl p-7 space-y-3 md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Attendance Correction History</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Any manual attendance adjustment or correction by authorized faculty is transparently flagged with reasons and audit timestamps to maintain complete academic accountability.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION SECTION
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111D30] border border-[#23334A] rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
              Ready to Upgrade Your Campus Attendance?
            </h2>
            <p className="text-sm sm:text-base text-[#A1AEC2]">
              Choose your institutional portal to get started with AttendX intelligent attendance management.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleOpenPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Access Portals <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <Link
                to="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold rounded-xl text-[#F8FAFC] bg-[#16243A] hover:bg-[#1D304D] border border-[#23334A] transition-colors"
              >
                View Workflow
              </Link>
            </div>
          </div>
          <div className="absolute inset-0 bg-radial-card opacity-50 pointer-events-none" />
        </div>
      </section>
    </div>
  );
};
