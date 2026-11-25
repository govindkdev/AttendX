import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  FileSpreadsheet,
  Bell,
  Play
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aData, sData, tData] = await Promise.all([
          api.getDashboardAnalytics().catch(() => null),
          api.getActiveSessions().catch(() => []),
          api.getMyTimetable().catch(() => []),
        ]);
        setAnalytics(aData);
        setActiveSessions(sData || []);
        setTimetable(tData || []);
        setRecentSessions(sData || []);
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
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalAssignedStudents = analytics?.total_students || analytics?.student_count || 0;
  const attendanceRecorded = analytics?.total_attendance_records || analytics?.attendance_recorded || 0;
  const avgAttendance = analytics?.average_attendance ?? 0;

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      {/* 1. Welcome Header Banner */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Faculty Instruction Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Welcome, {user?.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-[#A1AEC2]">
            Employee Code: <span className="font-mono text-[#F8FAFC] font-semibold">{user?.user_code}</span> | Role: Faculty Instructor
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to="/teacher/start-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
          >
            <Camera className="w-4 h-4 mr-2" /> Start Session
          </Link>
          <Link
            to="/teacher/qr-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#16243A] hover:bg-[#1D304D] text-[#F8FAFC] text-xs font-semibold border border-[#23334A] transition-all"
          >
            <QrCode className="w-4 h-4 mr-2 text-[#22D3EE]" /> Project QR
          </Link>
          <Link
            to="/teacher/manual-attendance"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#16243A] hover:bg-[#1D304D] text-[#F8FAFC] text-xs font-semibold border border-[#23334A] transition-all"
          >
            <UserCheck className="w-4 h-4 mr-2 text-[#8B5CF6]" /> Manual Entry
          </Link>
        </div>

        <div className="absolute inset-0 bg-radial-card opacity-50 pointer-events-none" />
      </div>

      {/* Active Session Highlight (if running) */}
      {activeSessions.length > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/20 text-[#22D3EE] border border-cyan-500/30 flex items-center justify-center animate-pulse shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#22D3EE] uppercase tracking-wider block">
                Session Currently Active
              </span>
              <h4 className="text-base font-bold text-[#F8FAFC]">
                {activeSessions[0].subject_name} ({activeSessions[0].session_code})
              </h4>
              <p className="text-xs text-[#A1AEC2]">
                {activeSessions[0].attendance_count || 0} students recorded | {activeSessions[0].start_time} - {activeSessions[0].end_time}
              </p>
            </div>
          </div>
          <Link
            to="/teacher/start-attendance"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md transition-colors"
          >
            Manage Session &rarr;
          </Link>
        </div>
      )}

      {/* 2. Key Metrics Row (Requirement: Total assigned students, Active sessions, Attendance recorded, Average attendance) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Assigned Students"
          value={totalAssignedStudents}
          subtitle="Enrolled in your batches"
          icon={Users}
          accentColor="blue"
        />

        <StatCard
          title="Active Sessions"
          value={activeSessions.length}
          subtitle={activeSessions.length > 0 ? 'Concurrently running' : 'No active sessions'}
          icon={Play}
          accentColor="cyan"
        />

        <StatCard
          title="Attendance Recorded"
          value={attendanceRecorded}
          subtitle="Verified lecture submissions"
          icon={CheckCircle2}
          accentColor="emerald"
        />

        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle="Classroom attendance rate"
          icon={TrendingUp}
          accentColor="purple"
          change={{
            value: avgAttendance >= 75 ? 'Healthy' : 'Below 75%',
            trend: avgAttendance >= 75 ? 'up' : 'down',
          }}
        />
      </div>

      {/* 3. Middle Section: Today's Timetable & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Today's Timetable */}
        <div className="bg-[#111D30] rounded-3xl p-6 border border-[#23334A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#23334A] pb-3.5">
            <div>
              <h3 className="font-bold text-[#F8FAFC] text-base tracking-tight">Today's Timetable</h3>
              <p className="text-xs text-[#A1AEC2] mt-0.5">Assigned lecture schedules</p>
            </div>
            <span className="text-xs text-[#22D3EE] font-mono font-semibold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>

          {timetable.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {timetable.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="p-3.5 rounded-2xl bg-[#0D1525] border border-[#23334A] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                      {t.subject_name}
                    </h4>
                    <p className="text-[11px] text-[#A1AEC2]">
                      Room {t.classroom_number || 'TBA'} • Semester {t.semester || '1'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[#16243A] text-[#3B82F6] border border-[#23334A] text-xs font-mono font-semibold">
                      {t.start_time?.slice(0, 5)} - {t.end_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No lectures scheduled today"
              description="Your instructional slots will populate once the semester timetable is configured."
              icon={CalendarDays}
            />
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-[#111D30] rounded-3xl p-6 border border-[#23334A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#23334A] pb-3.5">
            <div>
              <h3 className="font-bold text-[#F8FAFC] text-base tracking-tight">Recent Sessions</h3>
              <p className="text-xs text-[#A1AEC2] mt-0.5">Conducted lectures & attendance counts</p>
            </div>
            <Link to="/teacher/reports" className="text-xs font-semibold text-[#3B82F6] hover:underline">
              Session Reports &rarr;
            </Link>
          </div>

          {recentSessions.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recentSessions.map((s, idx) => (
                <div
                  key={s.session_id || idx}
                  className="p-3.5 rounded-2xl bg-[#0D1525] border border-[#23334A] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#3B82F6] uppercase">
                      Code: {s.session_code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                      {s.subject_name}
                    </h4>
                    <p className="text-[11px] text-[#A1AEC2]">
                      {s.attendance_count || 0} students logged attendance
                    </p>
                  </div>
                  <StatusBadge status={s.status || 'COMPLETED'} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent sessions"
              description="Click 'Start Session' above to begin taking verified attendance for your class."
              icon={Clock}
            />
          )}
        </div>
      </div>

      {/* 4. Quick Actions Hub */}
      <div className="bg-[#111D30] rounded-3xl p-6 sm:p-7 border border-[#23334A] shadow-xl space-y-4">
        <h3 className="font-bold text-[#F8FAFC] text-base">Faculty Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/teacher/start-attendance"
            className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#3B82F6]/50 hover:bg-[#16243A]/40 transition-all flex items-center space-x-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-[#F8FAFC] block">Start Session</span>
              <span className="text-[11px] text-[#A1AEC2]">Begin attendance</span>
            </div>
          </Link>

          <Link
            to="/teacher/qr-attendance"
            className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#8B5CF6]/50 hover:bg-[#16243A]/40 transition-all flex items-center space-x-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-[#F8FAFC] block">Project QR Code</span>
              <span className="text-[11px] text-[#A1AEC2]">Dynamic 15s rotating</span>
            </div>
          </Link>

          <Link
            to="/teacher/students"
            className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#22D3EE]/50 hover:bg-[#16243A]/40 transition-all flex items-center space-x-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-[#22D3EE] border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-[#F8FAFC] block">Student Roster</span>
              <span className="text-[11px] text-[#A1AEC2]">View enrolled students</span>
            </div>
          </Link>

          <Link
            to="/teacher/notifications"
            className="p-4 rounded-2xl bg-[#0D1525] border border-[#23334A] hover:border-[#EF4444]/50 hover:bg-[#16243A]/40 transition-all flex items-center space-x-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-[#EF4444] border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-[#F8FAFC] block">Parent Alerts</span>
              <span className="text-[11px] text-[#A1AEC2]">Shortage notifications</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
