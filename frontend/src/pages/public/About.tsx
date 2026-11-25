import React from 'react';
import { Target, Award, ShieldAlert, CheckCircle2, ShieldCheck, Cpu, Users } from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 text-[#F8FAFC]">
      <ScrollReveal className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#16243A] text-[#22D3EE] border border-[#23334A] text-xs font-semibold">
          <Award className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Institutional Academic Governance</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
          About AttendX
        </h1>
        <p className="text-base sm:text-lg text-[#A1AEC2] leading-relaxed">
          Modernizing higher education administration with verifiable digital governance, eliminating attendance manipulation, and fostering academic discipline.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <ScrollReveal className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            The Attendance Challenge in Higher Education
          </h2>
          <p className="text-sm text-[#A1AEC2] leading-relaxed">
            In modern universities and colleges, manual paper registers and verbal roll calls suffer from critical systemic flaws:
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Proxy attendance where students sign or call out roll numbers for absent peers.</span>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Loss of valuable teaching time (10–15 minutes per lecture lost in manual roll calls).</span>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Delayed parent communication, preventing timely academic interventions before exam eligibility cutoffs.</span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="bg-[#111D30] text-[#F8FAFC] rounded-3xl p-7 sm:p-9 space-y-6 shadow-xl border border-[#23334A] relative overflow-hidden">
            <h3 className="text-xl font-bold flex items-center space-x-2 text-[#F8FAFC]">
              <Target className="w-5 h-5 text-[#3B82F6]" />
              <span>The AttendX Solution</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AEC2] leading-relaxed">
              AttendX is built from the ground up as a unified attendance management ecosystem:
            </p>
            <ul className="space-y-4 text-xs sm:text-sm text-[#A1AEC2]">
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#F8FAFC]">Hardware-Agnostic:</strong> Operates natively in standard web browsers on smartphones, tablets, and laptops without proprietary hardware terminals.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#F8FAFC]">Multi-Factor Verification:</strong> Combines biometric facial verification, cryptographic signed QR codes, and Haversine GPS campus boundary verification.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#F8FAFC]">Audited Governance:</strong> Full audit logs ensure every status update or administrative modification is completely transparent.
                </span>
              </li>
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
