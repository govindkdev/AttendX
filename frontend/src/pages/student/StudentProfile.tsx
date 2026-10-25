import React, { useState } from 'react';
import { useAuth } from '@/features/authentication/AuthContext';
import { Link } from 'react-router-dom';
import { ProfileImageUpload } from '@/components/common/ProfileImageUpload';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Key,
  Copy,
  Check,
  BookOpen,
  Users,
  CheckCircle2
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState(false);

  const copyStudentId = () => {
    if (!user?.user_code) return;
    navigator.clipboard.writeText(user.user_code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review your enrolled institute credentials, academic standing, and parent contact information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Identity Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-center space-y-4">
            <ProfileImageUpload
              avatarUrl={user?.avatar_url}
              fullName={user?.full_name}
              size="md"
            />
            <div>
              <h3 className="text-xl font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enrolled Student</p>
            </div>

            {/* Issued Student ID Highlight Box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Issued Student ID
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg font-mono font-black text-blue-900 tracking-wide">
                  {user?.user_code || 'N/A'}
                </span>
                <button
                  type="button"
                  onClick={copyStudentId}
                  className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Copy Issued Student ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copiedId && (
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1 animate-fade-in">
                  ID copied to clipboard!
                </span>
              )}
            </div>

            {/* Quick Status Attributes */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Account Status
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {user?.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Roll Number
                </span>
                <span className="font-semibold font-mono text-slate-900">{user?.details?.roll_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Current Semester
                </span>
                <span className="font-semibold text-slate-900">
                  Semester {user?.details?.semester || '1'}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Password Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Key className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Security & Access
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Maintain account security by regularly updating your password.
            </p>
            <Link
              to="/change-password"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
            >
              Update Password
            </Link>
          </div>
        </div>

        {/* Right Column: Academic & Contact Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Profile */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center">
                <GraduationCap className="w-4 h-4 mr-2 text-blue-600" /> Academic Enrolled Program
              </h4>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Semester {user?.details?.semester || '1'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium mb-1">Enrolled Course</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {user?.details?.course_name || 'B.Tech (Bachelor of Technology)'}
                </span>
                {user?.details?.course_code && (
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                    Code: {user?.details?.course_code}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium mb-1">Branch / Specialization</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {user?.details?.branch_name || 'Computer Science & Engineering'}
                </span>
                {user?.details?.branch_code && (
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                    Code: {user?.details?.branch_code}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Academic Department</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {user?.details?.department_name || 'Engineering & Technology'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Assigned University Roll Number</span>
                <span className="font-semibold font-mono text-slate-800 text-xs">
                  {user?.details?.roll_number || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Student Contact Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <User className="w-4 h-4 mr-2 text-indigo-600" /> Student Identity & Contact
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Full Name
                </span>
                <span className="font-bold text-slate-900 text-sm">{user?.full_name}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" /> Issued Student ID
                </span>
                <span className="font-mono font-bold text-blue-700 text-sm">{user?.user_code}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Registered Email / Gmail
                </span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Student Mobile Number
                </span>
                <span className="font-semibold text-slate-800">{user?.phone_number || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Parent & Guardian Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-2 text-emerald-600" /> Parent & Guardian Information
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Alert Notifications Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Parent / Guardian Full Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {user?.details?.parent_name || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Parent Contact Number (SMS Alerts)</span>
                <span className="font-semibold text-slate-800 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  {user?.details?.parent_phone || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Parent Email / Gmail (Dispatches)</span>
                <span className="font-semibold text-slate-800 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  {user?.details?.parent_email || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Campus / Residential Address</span>
                <span className="font-medium text-slate-700 flex items-start">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                  {user?.details?.address || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
