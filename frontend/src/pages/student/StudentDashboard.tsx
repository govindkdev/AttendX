import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Camera,
  QrCode,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
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
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const attendancePct = analytics?.attendance_percentage || 0;
  const isBelow75 = attendancePct < 75 && (analytics?.total_classes || 0) > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">Student Portal</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user?.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Student ID: <span className="font-mono text-white font-semibold">{user?.user_code}</span> | Roll No: <span className="font-mono text-white font-semibold">{user?.details?.roll_number || 'N/A'}</span>
            {user?.details?.course_name && (
              <span className="hidden md:inline"> | <span className="text-blue-200 font-medium">{user?.details?.course_name} ({user?.details?.branch_name || 'N/A'})</span></span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/student/face-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Camera className="w-4 h-4 mr-2" /> Mark Attendance
          </Link>
          <Link
            to="/student/scan-qr"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            <QrCode className="w-4 h-4 mr-2" /> Scan QR
          </Link>
        </div>
      </div>

      {/* Active Lecture Banner (if any lecture is currently active) */}
      {activeSessions.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Lecture Session</span>
              <h4 className="text-base font-bold text-slate-900">
                {activeSessions[0].subject_name} ({activeSessions[0].session_code})
              </h4>
              <p className="text-xs text-slate-500">
                Conducted by {activeSessions[0].teacher_name} | {activeSessions[0].start_time} - {activeSessions[0].end_time}
              </p>
            </div>
          </div>
          <Link
            to="/student/face-attendance"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
          >
            Verify Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* Low Attendance Warning */}
      {isBelow75 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Attention:</strong> Your cumulative attendance is currently {attendancePct}%, which is below the mandatory 75% examination threshold. Attend scheduled lectures to avoid exam disqualification.
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {attendancePct}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {analytics?.present_count || 0} / {analytics?.total_classes || 0} classes
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {analytics?.present_count || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Lectures attended</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {analytics?.late_count || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">After 15 min threshold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
            {analytics?.absent_count || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Recorded absences</span>
        </div>
      </div>

      {/* Grid: Subject Breakdown & Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject-Wise Analytics */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Subject-Wise Attendance</h3>
            <span className="text-xs text-slate-400 font-medium">Real-time DB query</span>
          </div>

          {analytics?.subject_breakdown && analytics.subject_breakdown.length > 0 ? (
            <div className="space-y-4">
              {analytics.subject_breakdown.map((s: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{s.subject_name} ({s.subject_code})</span>
                    <span className={s.percentage < 75 ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                      {s.percentage}% ({s.present}/{s.total})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        s.percentage < 75 ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No subject attendance records available"
              description="Your subject attendance analytics will calculate automatically as lecture sessions are completed."
            />
          )}
        </div>

        {/* Timetable Snippet */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Your Weekly Schedule</h3>
            <Link to="/student/timetable" className="text-xs font-semibold text-blue-600 hover:underline">
              View full timetable &rarr;
            </Link>
          </div>

          {timetable.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {timetable.slice(0, 5).map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{t.subject_name}</h4>
                    <p className="text-xs text-slate-500">
                      Room {t.classroom_number} | Instructor: {t.teacher_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                      {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No timetable configured"
              description="Your semester timetable schedule will appear here once assigned by the administrator."
            />
          )}
        </div>
      </div>
    </div>
  );
};
