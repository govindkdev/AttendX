import React from 'react';
import { School, Target, Award, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Institutional Academic Governance</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          About AttendX
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Modernizing higher education administration with verifiable digital governance, eliminating attendance manipulation, and fostering academic discipline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">
            The Attendance Challenge in Higher Education
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            In modern universities and colleges, manual paper registers and verbal roll calls suffer from critical systemic flaws:
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Proxy attendance where students sign or call out roll numbers for absent peers.</span>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Loss of valuable teaching time (10–15 minutes per lecture lost in manual roll calls).</span>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Delayed parent communication, preventing timely academic interventions before exam eligibility cutoffs.</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-6 shadow-xl border border-slate-800">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>The AttendX Solution</span>
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            AttendX is built from the ground up as a zero-trust attendance management ecosystem:
          </p>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Hardware-Agnostic:</strong> Operates natively in standard web browsers on smartphones, tablets, and laptops without proprietary fingerprint scanners.</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Multi-Factor Verification:</strong> Combines biometric facial verification, cryptographic signed QR codes, and Haversine GPS campus boundary verification.</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Audited Governance:</strong> Full PostgreSQL/SQLAlchemy audit records ensure that every status update or administrative modification is accountable.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
