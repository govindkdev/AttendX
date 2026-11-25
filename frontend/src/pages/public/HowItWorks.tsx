import React from 'react';
import { Camera, QrCode, MapPin, CheckCircle2, ShieldCheck, Clock, FileSpreadsheet } from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Faculty Starts an Attendance Session',
      actor: 'Teacher / Faculty',
      desc: 'The instructor launches a scheduled attendance session from their faculty dashboard, choosing Face Attendance or projecting a rotating QR code in the classroom.',
      icon: Clock,
      color: 'text-[#3B82F6] bg-blue-500/10 border-blue-500/20',
    },
    {
      num: '02',
      title: 'Student Verifies Identity',
      actor: 'Enrolled Student',
      desc: 'The student opens their portal on their mobile device or laptop and verifies identity using the available attendance method (facial biometric scan or scanning the dynamic session QR code).',
      icon: Camera,
      color: 'text-[#22D3EE] bg-cyan-500/10 border-cyan-500/20',
    },
    {
      num: '03',
      title: 'The System Checks Permitted Conditions',
      actor: 'AttendX Validation Engine',
      desc: 'AttendX verifies biometric similarity, confirms the student is within the campus GPS geofence perimeter, checks time boundaries, and ensures the session is currently active.',
      icon: ShieldCheck,
      color: 'text-[#8B5CF6] bg-purple-500/10 border-purple-500/20',
    },
    {
      num: '04',
      title: 'Attendance is Recorded',
      actor: 'Attendance Core',
      desc: 'The attendance record is securely persisted in the database with status (Present or Late), verification method, and timestamp, instantly updating live dashboard summaries.',
      icon: CheckCircle2,
      color: 'text-[#22C55E] bg-emerald-500/10 border-emerald-500/20',
    },
    {
      num: '05',
      title: 'Faculty and Administrators Review Reports',
      actor: 'Faculty & Administration',
      desc: 'Faculty and administrators review verified attendance records, export academic compliance spreadsheets, monitor shortages below 75%, and manage parent alerts.',
      icon: FileSpreadsheet,
      color: 'text-[#F59E0B] bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 text-[#F8FAFC]">
      <ScrollReveal className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#3B82F6] tracking-wider uppercase">
          Step-by-Step Architecture
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
          How AttendX Works
        </h1>
        <p className="text-base sm:text-lg text-[#A1AEC2] leading-relaxed">
          A clear, disciplined 5-step workflow ensuring every attendance record is verified, tamper-resistant, and actionable.
        </p>
      </ScrollReveal>

      <div className="relative border-l-2 border-[#23334A] ml-4 md:ml-12 space-y-10">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <ScrollReveal key={idx} delay={idx * 100}>
              <div className="relative pl-8 md:pl-12 group">
                {/* Step indicator node */}
                <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-[#111D30] text-[#3B82F6] border-2 border-[#3B82F6] flex items-center justify-center font-stats font-bold text-xs shadow-md">
                  {s.num}
                </div>

                <div className="bg-[#111D30] rounded-2xl p-6 sm:p-7 border border-[#23334A] hover:border-[#3B82F6]/40 transition-colors space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#3B82F6]">
                    <div className={`p-1 rounded-md border ${s.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{s.actor}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#F8FAFC] tracking-tight">{s.title}</h3>
                  <p className="text-sm text-[#A1AEC2] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
};
