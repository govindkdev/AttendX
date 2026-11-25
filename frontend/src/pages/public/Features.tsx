import React from 'react';
import { Camera, QrCode, MapPin, Bot, BarChart3, Bell, Lock, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';
import { FeatureCard } from '@/components/ui/FeatureCard';

export const Features: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 text-[#F8FAFC]">
      <ScrollReveal className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#3B82F6] tracking-wider uppercase">
          Planned & Supported Capabilities
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
          AttendX Platform Features
        </h1>
        <p className="text-base sm:text-lg text-[#A1AEC2] leading-relaxed">
          Engineered for technical precision, academic governance, and privacy-conscious campus attendance management.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScrollReveal delay={0}>
          <FeatureCard
            icon={Camera}
            badge="Biometrics"
            title="AI Face Recognition"
            description="Browser-based face verification with facial landmark capture and cosine similarity matching against registered student templates."
            points={['Quality filter exposure check', 'Zero raw image persistence', 'Anti-spoofing verification']}
          />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <FeatureCard
            icon={QrCode}
            badge="Cryptographic"
            title="QR-Based Attendance"
            description="Dynamic, time-limited QR codes projected by faculty in class and scanned by students on their mobile devices."
            points={['Dynamic token refresh', 'Single-device verification', 'Protected replay deterrence']}
          />
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <FeatureCard
            icon={MapPin}
            badge="Geolocation"
            title="GPS Geofencing"
            description="Haversine distance verification ensuring students are physically present on campus during attendance recording."
            points={['Custom campus boundary', 'Accuracy threshold checks', 'Strict privacy compliance']}
          />
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <FeatureCard
            icon={BarChart3}
            badge="Analytics"
            title="Attendance Analytics"
            description="Live analytical metrics for students, faculty, and administrators with subject-wise breakdown and 75% cutoff status."
            points={['Subject-level telemetry', 'Department comparisons', 'Automated shortage flags']}
          />
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <FeatureCard
            icon={Bell}
            badge="Alerts"
            title="Parent Notifications"
            description="Configurable automated alert triggers to notify guardians regarding student absenteeism and threshold shortages."
            points={['Daily cutoff summaries', 'Low attendance warnings', 'Communication audit logs']}
          />
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <FeatureCard
            icon={Bot}
            badge="AI Assistant"
            title="AttendX AI Assistant"
            description="Floating campus assistant offering guidance on attendance percentages, policies, and timetable queries."
            points={['Role-specific guidance', 'Policy query assistance', 'Attendance explanations']}
          />
        </ScrollReveal>

        <ScrollReveal delay={600}>
          <FeatureCard
            icon={Lock}
            badge="Auth"
            title="Secure Authentication"
            description="Dedicated login portals for Administrator, Teacher, and Student with role-based authorization guardrails."
            points={['Separated portal logins', 'Two-step account activation', 'Secure session tokens']}
          />
        </ScrollReveal>

        <ScrollReveal delay={700}>
          <FeatureCard
            icon={ShieldCheck}
            badge="Governance"
            title="Attendance Audit Logs"
            description="Comprehensive audit trail recording every attendance submission, method vector, and manual adjustment."
            points={['Immutable timestamps', 'Correction reason tracking', 'Institutional compliance']}
          />
        </ScrollReveal>
      </div>
    </div>
  );
};
