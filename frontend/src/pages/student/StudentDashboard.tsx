import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AttendanceProgress } from '@/components/ui/AttendanceProgress';
import {
  Camera,
  QrCode,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  History,
  BookOpen,
  MapPin,
  Sparkles
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [aData, sData, tData, rData] = await Promise.all([
          api.getDashboardAnalytics().catch(() => null),
          api.getActiveSessions().catch(() => []),
          api.getMyTimetable().catch(() => []),
          api.getAttendanceHistory().catch(() => []),
        ]);
        setAnalytics(aData);
        setActiveSessions(sData || []);
        setTimetable(tData || []);
        setRecentRecords(Array.isArray(rData) ? rData : []);
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
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const attendancePct = analytics?.attendance_percentage ?? (
    analytics?.total_classes > 0
      ? Number(((analytics.present_count / analytics.total_classes) * 100).toFixed(1))
      : 0
  );
  const isBelow75 = attendancePct < 75 && (analytics?.total_classes || 0) > 0;

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      {/* 1. Welcome Section */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Student Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Welcome, {user?.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-[#A1AEC2]">
            Student ID: <span className="font-mono text-[#F8FAFC] font-semibold">{user?.user_code}</span> | Roll No:{' '}
            <span className="font-mono text-[#F8FAFC] font-semibold">{user?.details?.roll_number || 'N/A'}</span>
            {user?.details?.course_name && (
              <span className="hidden lg:inline text-[#A1AEC2]">
                {' '}• {user?.details?.course_name} ({user?.details?.branch_name || 'N/A'})
              </span>
            )}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to="/student/face-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
          >
            <Camera className="w-4 h-4 mr-2" /> Face Attendance
          </Link>
          <Link
            to="/student/scan-qr"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#16243A] hover:bg-[#1D304D] text-[#F8FAFC] text-xs font-semibold border border-[#23334A] transition-all"
          >
            <QrCode className="w-4 h-4 mr-2 text-[#22D3EE]" /> Scan QR
          </Link>
        </div>

        <div className="absolute inset-0 bg-radial-card opacity-50 pointer-events-none" />
      </div>

      {/* Active Lecture Banner (if any lecture is currently active) */}
      {activeSessions.length > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/20 text-[#22D3EE] border border-cyan-500/30 flex items-center justify-center animate-pulse shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#22D3EE] uppercase tracking-wider block">
                Lecture Session Active Now
              </span>
              <h4 className="text-base font-bold text-[#F8FAFC]">
                {activeSessions[0].subject_name} ({activeSessions[0].session_code})
              </h4>
              <p className="text-xs text-[#A1AEC2]">
                Instructor: {activeSessions[0].teacher_name} | {activeSessions[0].start_time} – {activeSessions[0].end_time}
              </p>
            </div>
          </div>
          <Link
            to="/student/face-attendance"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md transition-colors"
          >
            Verify Attendance Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* Low Attendance Notice */}
      {isBelow75 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center space-x-3 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>Attendance Shortage Alert:</strong> Your current attendance is {attendancePct}%, which is below the mandatory 75% examination threshold. Maintain regular presence in upcoming sessions to secure eligibility.
          </span>
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Overall Attendance"
          value={`${attendancePct}%`}
          subtitle={`${analytics?.present_count || 0} of ${analytics?.total_classes || 0} lectures`}
          icon={TrendingUp}
          accentColor="blue"
          change={{
            value: attendancePct >= 75 ? 'Eligible' : 'Shortage',
            trend: attendancePct >= 75 ? 'up' : 'down',
          }}
        />

        <StatCard
          title="Present Classes"
          value={analytics?.present_count || 0}
          subtitle="Classes successfully verified"
          icon={CheckCircle2}
          accentColor="emerald"
        />

        <StatCard
          title="Absent Classes"
          value={analytics?.absent_count || 0}
          subtitle="Unattended lectures"
          icon={XCircle}
          accentColor="rose"
        />

        <StatCard
          title="Late Attendance"
          value={analytics?.late_count || 0}
          subtitle="Recorded after threshold"
          icon={Clock}
          accentColor="amber"
        />
      </div>

      {/* 3. Middle Section: Subject-Wise Attendance & Weekly Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Subject-Wise Attendance */}
        <div className="bg-[#111D30] rounded-3xl p-6 border border-[#23334A] shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#23334A] pb-3.5">
            <div>
              <h3 className="font-bold text-[#F8FAFC] text-base tracking-tight">
                Subject-Wise Attendance
              </h3>
              <p className="text-xs text-[#A1AEC2] mt-0.5">75% threshold requirement per subject</p>
            </div>
            <Link to="/student/attendance-history" className="text-xs font-semibold text-[#3B82F6] hover:underline">
              View History &rarr;
            </Link>
          </div>

          {analytics?.subject_breakdown && analytics.subject_breakdown.length > 0 ? (
            <div className="space-y-4">
              {analytics.subject_breakdown.map((s: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#0D1525] border border-[#23334A] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">{s.subject_name}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">{s.subject_code}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-stats font-bold text-sm ${
                          s.percentage < 75 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {s.percentage}%
                      </span>
                      <span className="text-[10px] text-[#A1AEC2] block">
                        {s.present}/{s.total} attended
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#16243A] rounded-full h-2 overflow-hidden border border-[#23334A]">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        s.percentage < 75 ? 'bg-[#EF4444]' : 'bg-[#22C55E]'
                      }`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No subject records found"
              description="Your subject-wise breakdown will appear here once lecture sessions are conducted."
              icon={BookOpen}
            />
          )}
        </div>

        {/* Weekly Schedule & Upcoming Classes */}
        <div className="bg-[#111D30] rounded-3xl p-6 border border-[#23334A] shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#23334A] pb-3.5">
            <div>
              <h3 className="font-bold text-[#F8FAFC] text-base tracking-tight">
                Weekly Schedule & Classes
              </h3>
              <p className="text-xs text-[#A1AEC2] mt-0.5">Assigned lecture periods</p>
            </div>
            <Link to="/student/timetable" className="text-xs font-semibold text-[#3B82F6] hover:underline">
              Full Timetable &rarr;
            </Link>
          </div>

          {timetable.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {timetable.slice(0, 6).map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="p-3.5 rounded-2xl bg-[#0D1525] border border-[#23334A] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                      {t.subject_name}
                    </h4>
                    <p className="text-[11px] text-[#A1AEC2] flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-[#64748B]" />
                      Room {t.classroom_number || t.classroom_id || 'TBA'} • {t.teacher_name || 'Faculty'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[#16243A] text-[#22D3EE] border border-[#23334A] text-xs font-mono font-semibold">
                      {t.start_time?.slice(0, 5)} – {t.end_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No timetable assigned"
              description="Your semester timetable schedule will populate once academic slots are published by the department."
              icon={CalendarDays}
            />
          )}
        </div>
      </div>

      {/* 4. Recent Attendance Activity */}
      <div className="bg-[#111D30] rounded-3xl p-6 border border-[#23334A] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#23334A] pb-3.5">
          <div>
            <h3 className="font-bold text-[#F8FAFC] text-base tracking-tight">
              Recent Attendance Activity
            </h3>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Verified lecture logs and methods</p>
          </div>
          <Link to="/student/attendance-history" className="text-xs font-semibold text-[#3B82F6] hover:underline">
            View All History &rarr;
          </Link>
        </div>

        {recentRecords.length > 0 ? (
          <div className="divide-y divide-[#23334A]/50 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 font-semibold">Subject</th>
                  <th className="py-2.5 font-semibold">Date & Time</th>
                  <th className="py-2.5 font-semibold">Verification Method</th>
                  <th className="py-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]/30">
                {recentRecords.slice(0, 5).map((rec: any, idx: number) => (
                  <tr key={rec.id || idx} className="hover:bg-[#16243A]/40 transition-colors">
                    <td className="py-3 font-semibold text-[#F8FAFC]">
                      {rec.subject_name || rec.subject_code || 'Lecture'}
                    </td>
                    <td className="py-3 text-[#A1AEC2]">
                      {rec.date} • {rec.start_time?.slice(0, 5)}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#16243A] text-[#22D3EE] font-mono text-[10px] border border-[#23334A]">
                        {rec.verification_method || 'FACE'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={rec.status || 'PRESENT'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No recent attendance logs"
            description="Your recorded class attendances will appear here with method badges and timestamps."
            icon={History}
          />
        )}
      </div>
    </div>
  );
};
