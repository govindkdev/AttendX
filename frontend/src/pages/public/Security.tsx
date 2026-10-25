import React from 'react';
import { ShieldCheck, Lock, Key, FileCheck, EyeOff, Server, AlertCircle } from 'lucide-react';

export const Security: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Trust & Integrity</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Security & Privacy Architecture
        </h1>
        <p className="text-lg text-slate-600">
          How AttendX guarantees student privacy, biometric security, and zero-compromise access governance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Argon2id Password Hashing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All user credentials are encrypted using memory-hard Argon2id (Type.ID, time_cost=2, memory_cost=19456 KB), providing resistance against GPU and ASIC brute-force attacks.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Biometric Privacy Guard</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Raw student face photos are never persistently stored on our servers. Biometric templates consist of non-reversible mathematical 128-dimensional floating-point vectors.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Server-Side Authorization</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The frontend is never trusted. Every API endpoint enforces strict role validation and token signature checks. Role elevation attempts are intercepted with HTTP 403 Forbidden.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Immutable Audit Logging</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All administrative provisioning, student activations, manual attendance changes, and login attempts are logged in append-only database tables with timestamps and client IP addresses.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Formula Injection Shield</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Report generators for Excel and CSV sanitize all user-supplied text to prevent CSV injection (CWE-1236) by neutralizing active command symbols like =, +, -, and @.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Mandatory First-Login Rotation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Administrators and staff created with initial credentials are required by policy to rotate their password on initial login before receiving access to institutional controls.
          </p>
        </div>
      </div>
    </div>
  );
};
