import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/features/authentication/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  FileText,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  MapPin,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardAnalytics()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isEmpty = (stats?.total_students || 0) === 0 && (stats?.total_teachers || 0) === 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Institutional Command Console</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            GCRG Group of Institutions — Lucknow
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Administrator: <span className="font-semibold text-white">{user?.full_name}</span> ({user?.user_code})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/students"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <GraduationCap className="w-4 h-4 mr-2" /> Add Student
          </Link>
          <Link
            to="/admin/teachers"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            <Users className="w-4 h-4 mr-2" /> Add Teacher
          </Link>
        </div>
      </div>

      {/* Metrics Row 1: Core Academic Structure */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Academic Structure (Live Database Queries)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Students</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_students || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Faculty</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_teachers || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Departments</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_departments || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Courses</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_courses || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Subjects</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_subjects || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Sessions</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_lectures || 0}</p>
          </div>
        </div>
      </div>

      {/* Metrics Row 2: Real-time Attendance Aggregates */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Attendance Engine Aggregates
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Institute Average</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {stats?.attendance_percentage || 0}%
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {stats?.total_attendance_records || 0} total records logged
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">
              {stats?.present_count || 0}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Verified on-campus</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Late (After 15m)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">
              {stats?.late_count || 0}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Exceeded threshold</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Absent</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-3xl font-extrabold text-rose-600 mt-2">
              {stats?.absent_count || 0}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Non-attendee records</span>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="p-6 rounded-3xl bg-blue-50/60 border border-blue-200">
          <EmptyState
            title="Database Initialized (Zero Demo Data Policy)"
            description="The database is fresh and ready for production enrollment. As authorized administrator, provision departments, courses, teachers, and students to begin scheduling lectures."
            actionText="Configure Departments & Courses"
            onAction={() => window.location.href = '/admin/departments'}
          />
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/attendance"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Attendance Records</h4>
            <p className="text-xs text-slate-500 mt-0.5">Filter by Face, QR & Manual</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </Link>

        <Link
          to="/admin/gps-settings"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Campus Geofence</h4>
            <p className="text-xs text-slate-500 mt-0.5">GCRG Lucknow (200m radius)</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Audit Trail</h4>
            <p className="text-xs text-slate-500 mt-0.5">{stats?.recent_audit_events || 0} events logged</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Reports & Exports</h4>
            <p className="text-xs text-slate-500 mt-0.5">Excel, CSV & PDF downloads</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </Link>
      </div>
    </div>
  );
};
