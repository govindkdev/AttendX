import React from 'react';
import { Layers, Lock, Activity, UserCheck, History, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';

export const Security: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 text-[#F8FAFC]">
      <ScrollReveal className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#16243A] text-[#22D3EE] border border-[#23334A] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Platform Security & Governance</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
          Security & Access Controls
        </h1>
        <p className="text-base sm:text-lg text-[#A1AEC2] leading-relaxed">
          How AttendX safeguards academic integrity, manages role-based access, and maintains transparent audit records.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 1. Role-based access */}
        <ScrollReveal delay={0}>
          <div className="bg-[#111D30] p-7 rounded-2xl border border-[#23334A] hover:border-[#3B82F6]/40 transition-colors space-y-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#F8FAFC] text-base">Role-Based Access</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Separated portals and strict role authorization guardrails ensure students, teachers, and administrators access only their designated features and records.
            </p>
          </div>
        </ScrollReveal>

        {/* 2. Secure authentication */}
        <ScrollReveal delay={100}>
          <div className="bg-[#111D30] p-7 rounded-2xl border border-[#23334A] hover:border-[#3B82F6]/40 transition-colors space-y-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#F8FAFC] text-base">Secure Authentication</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Institutional identity verification with hashed credential storage, dedicated activation flows, and secure session management.
            </p>
          </div>
        </ScrollReveal>

        {/* 3. Attendance verification */}
        <ScrollReveal delay={200}>
          <div className="bg-[#111D30] p-7 rounded-2xl border border-[#23334A] hover:border-[#3B82F6]/40 transition-colors space-y-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#F8FAFC] text-base">Attendance Verification</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Multi-factor validation checks ensure every recorded attendance entry corresponds to an authentic session, valid time window, and verified student identity.
            </p>
          </div>
        </ScrollReveal>

        {/* 4. Protected student information */}
        <ScrollReveal delay={300}>
          <div className="bg-[#111D30] p-7 rounded-2xl border border-[#23334A] hover:border-[#3B82F6]/40 transition-colors space-y-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#F8FAFC] text-base">Protected Student Information</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Student information, contact details, and attendance records are shielded from unauthorized external exposure, maintaining student privacy.
            </p>
          </div>
        </ScrollReveal>

        {/* 5. Attendance correction history */}
        <ScrollReveal delay={400}>
          <div className="bg-[#111D30] p-7 rounded-2xl border border-[#23334A] hover:border-[#3B82F6]/40 transition-colors space-y-3 h-full md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#F8FAFC] text-base">Attendance Correction History</h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              Any manual attendance adjustment or correction by authorized faculty is transparently flagged with reasons, original status, and audit timestamps to maintain complete academic accountability.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
