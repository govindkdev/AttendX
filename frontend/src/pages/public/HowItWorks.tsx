import React from 'react';
import { ArrowDown, CheckCircle2, Shield, Users, Clock, Database, Smartphone } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Academic Structure & Timetable Setup',
      actor: 'Institute Administrator',
      desc: 'The administrator provisions departments, courses, branches, classrooms, and subjects. Timetable slots are configured with automatic conflict detection to prevent double-booking.',
      icon: Database,
    },
    {
      num: '02',
      title: 'Teacher Initiates Attendance Session',
      actor: 'Authorized Teacher',
      desc: 'Teacher logs into the portal and initiates a scheduled lecture session. The teacher selects whether to project an HMAC-signed dynamic QR token or enable Face Verification.',
      icon: Clock,
    },
    {
      num: '03',
      title: 'Student Identity & Proximity Verification',
      actor: 'Enrolled Student',
      desc: 'The student opens their mobile or laptop browser. The device requests camera and GPS permission. The frame is checked for quality and matched against the student’s biometric template.',
      icon: Smartphone,
    },
    {
      num: '04',
      title: 'Server-Side Cryptographic Validation',
      actor: 'FastAPI Backend Engine',
      desc: 'Backend verifies biometric similarity >= 65%, checks GPS coordinates against the 200m campus perimeter, ensures the session is ACTIVE, and enforces duplicate rejection.',
      icon: Shield,
    },
    {
      num: '05',
      title: 'Transactional Persistence & Live Updates',
      actor: 'PostgreSQL Database & Real-Time Sync',
      desc: 'Attendance status (Present or Late) is committed transactionally. Dashboards update immediately, audit logs are recorded, and parent notifications queue for completed lectures.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          How AttendX Works
        </h1>
        <p className="text-lg text-slate-600">
          A seamless, fraud-resistant lifecycle from timetable scheduling to parent notifications.
        </p>
      </div>

      <div className="relative border-l-2 border-blue-200 ml-4 md:ml-32 space-y-12">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="relative pl-8 md:pl-12 group">
              {/* Step indicator node */}
              <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md border-4 border-white">
                {s.num}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  <Icon className="w-4 h-4" />
                  <span>{s.actor}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
