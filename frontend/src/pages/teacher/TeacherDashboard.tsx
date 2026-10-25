import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Camera,
  QrCode,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aData, sData, tData] = await Promise.all([
          api.getDashboardAnalytics(),
          api.getActiveSessions(),
          api.getMyTimetable(),
        ]);
        setAnalytics(aData);
        setActiveSessions(sData);
        setTimetable(tData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Faculty Portal</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user?.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Employee Code: <span className="font-mono text-white font-semibold">{user?.user_code}</span> | Role: Faculty Instructor
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/teacher/start-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Camera className="w-4 h-4 mr-2" /> Start Session
          </Link>
          <Link
            to="/teacher/qr-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            <QrCode className="w-4 h-4 mr-2" /> Project QR
          </Link>
        </div>
      </div>

      {/* Active Session Highlight */}
      {activeSessions.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Session Currently Active</span>
              <h4 className="text-base font-bold text-slate-900">
                {activeSessions[0].subject_name} ({activeSessions[0].session_code})
              </h4>
              <p className="text-xs text-slate-500">
                {activeSessions[0].attendance_count || 0} students recorded | {activeSessions[0].start_time} - {activeSessions[0].end_time}
              </p>
            </div>
          </div>
          <Link
            to="/teacher/start-attendance"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
          >
            Manage Session &rarr;
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conducted</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {analytics?.sessions_conducted || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Lecture sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule</span>
            <CalendarDays className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2">
            {analytics?.assigned_classes || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Assigned timetable slots</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {analytics?.present_records || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Attendances marked</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Turnout</span>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-violet-600 mt-2">
            {analytics?.attendance_percentage || 0}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Average class percentage</span>
        </div>
      </div>

      {/* Grid: Timetable & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Your Assigned Classes</h3>
            <span className="text-xs text-slate-400 font-medium">Weekly schedule</span>
          </div>

          {timetable.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {timetable.map((t) => (
                <div key={t.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{t.subject_name}</h4>
                    <p className="text-xs text-slate-500">
                      Room {t.classroom_number} | Semester {t.semester}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-medium">
                    {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No timetable configured"
              description="You have not been assigned to any course timetable entries yet."
            />
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/teacher/start-attendance"
              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
            >
              <Camera className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-slate-900">Start Session</h4>
              <p className="text-xs text-slate-500 mt-1">Initiate biometric face attendance</p>
            </Link>

            <Link
              to="/teacher/qr-attendance"
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-left group"
            >
              <QrCode className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-slate-900">Project QR Token</h4>
              <p className="text-xs text-slate-500 mt-1">Project signed 30-min expiring QR</p>
            </Link>

            <Link
              to="/teacher/manual-attendance"
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
            >
              <UserCheck className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-slate-900">Manual Entry</h4>
              <p className="text-xs text-slate-500 mt-1">Record or correct attendance with audit</p>
            </Link>

            <Link
              to="/teacher/reports"
              className="p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all text-left group"
            >
              <FileSpreadsheet className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-slate-900">Export Reports</h4>
              <p className="text-xs text-slate-500 mt-1">Download Excel/CSV attendance logs</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
