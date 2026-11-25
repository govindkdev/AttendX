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
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  CalendarCheck
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { AttendanceProgress } from '@/components/ui/AttendanceProgress';

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
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = (stats?.total_students || 0) === 0 && (stats?.total_teachers || 0) === 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D1525] via-[#111D30] to-[#16243A] text-white rounded-2xl p-6 sm:p-8 border border-[#23334A] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 uppercase tracking-wider">
              Institutional Command Console
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight mt-2 text-[#F8FAFC]">
            {stats?.institution_name || user?.details?.institution_name || 'Academic Command Hub'}
          </h2>
          <p className="text-xs sm:text-sm text-[#A1AEC2] mt-1">
            Administrator: <span className="font-semibold text-[#F8FAFC]">{user?.full_name}</span> · <span className="font-mono text-[#3B82F6]">{user?.user_code}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/students"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            <GraduationCap className="w-4 h-4 mr-2" /> Add Student
          </Link>
          <Link
            to="/admin/teachers"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#0D1525] hover:bg-[#16243A] text-[#F8FAFC] text-xs font-semibold border border-[#23334A] transition-all"
          >
            <Users className="w-4 h-4 mr-2 text-[#22D3EE]" /> Add Faculty
          </Link>
        </div>
      </div>

      {/* Metrics Row 1: Core Academic Structure */}
      <div>
        <h3 className="text-xs font-bold text-[#A1AEC2] uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Academic Structure (Live Database Registry)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
            <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Students</span>
            <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{stats?.total_students || 0}</p>
          </div>
          <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
            <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Faculty</span>
            <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{stats?.total_teachers || 0}</p>
          </div>
          <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
            <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Departments</span>
            <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{stats?.total_departments || 0}</p>
          </div>
          <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
            <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Courses</span>
            <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{stats?.total_courses || 0}</p>
          </div>
          <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
            <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Subjects</span>
            <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{stats?.total_subjects || 0}</p>
          </div>
          <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A]">
            <span className="text-[11px] font-semibold text-[#A1AEC2] uppercase block">Sessions</span>
            <p className="text-2xl font-extrabold font-stats text-[#F8FAFC] mt-1">{stats?.total_lectures || 0}</p>
          </div>
        </div>
      </div>

      {/* Metrics Row 2: Real-time Attendance Aggregates */}
      <div>
        <h3 className="text-xs font-bold text-[#A1AEC2] uppercase tracking-wider mb-3 flex items-center space-x-2">
          <CalendarCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span>Institutional Attendance Aggregates</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#111D30] p-5 rounded-2xl border border-[#23334A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A1AEC2] uppercase">Campus Average</span>
              <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
            </div>
            <p className="text-3xl font-extrabold font-stats text-[#F8FAFC] mt-2">
              {stats?.attendance_percentage || 0}%
            </p>
            <div className="mt-3">
              <AttendanceProgress percentage={stats?.attendance_percentage || 0} size="sm" showStatusBadge={false} />
            </div>
            <span className="text-[11px] text-[#64748B] mt-2 block">
              {stats?.total_attendance_records || 0} total records logged
            </span>
          </div>

          <div className="bg-[#111D30] p-5 rounded-2xl border border-[#23334A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A1AEC2] uppercase">Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold font-stats text-emerald-400 mt-2">
              {stats?.present_count || 0}
            </p>
            <span className="text-[11px] text-[#64748B] mt-2 block">Verified on-campus</span>
          </div>

          <div className="bg-[#111D30] p-5 rounded-2xl border border-[#23334A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A1AEC2] uppercase">Late (Grace Exceeded)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold font-stats text-amber-400 mt-2">
              {stats?.late_count || 0}
            </p>
            <span className="text-[11px] text-[#64748B] mt-2 block">Threshold exceeded</span>
          </div>

          <div className="bg-[#111D30] p-5 rounded-2xl border border-[#23334A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A1AEC2] uppercase">Absent</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-3xl font-extrabold font-stats text-rose-400 mt-2">
              {stats?.absent_count || 0}
            </p>
            <span className="text-[11px] text-[#64748B] mt-2 block">Non-attendee records</span>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="p-6 rounded-2xl bg-[#111D30] border border-[#23334A]">
          <EmptyState
            title="Database Initialized (Clean State Policy)"
            description="The database is configured and ready for live institutional provisioning. As administrator, provision departments, courses, teachers, and students to commence lecture scheduling."
            actionText="Configure Departments & Courses"
            onAction={() => window.location.href = '/admin/departments'}
          />
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/attendance"
          className="p-5 rounded-2xl bg-[#111D30] border border-[#23334A] hover:border-[#3B82F6] hover:bg-[#16243A]/60 transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold font-heading text-[#F8FAFC] text-sm group-hover:text-[#3B82F6] transition-colors">
              Attendance Records
            </h4>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Filter by Face, QR & Manual</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/gps-settings"
          className="p-5 rounded-2xl bg-[#111D30] border border-[#23334A] hover:border-[#22D3EE] hover:bg-[#16243A]/60 transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold font-heading text-[#F8FAFC] text-sm group-hover:text-[#22D3EE] transition-colors">
              Campus Geofence
            </h4>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Perimeter Boundary Validation</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#22D3EE] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 rounded-2xl bg-[#111D30] border border-[#23334A] hover:border-[#8B5CF6] hover:bg-[#16243A]/60 transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold font-heading text-[#F8FAFC] text-sm group-hover:text-[#8B5CF6] transition-colors">
              Audit Trail
            </h4>
            <p className="text-xs text-[#A1AEC2] mt-0.5">{stats?.recent_audit_events || 0} events logged</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 rounded-2xl bg-[#111D30] border border-[#23334A] hover:border-emerald-400 hover:bg-[#16243A]/60 transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold font-heading text-[#F8FAFC] text-sm group-hover:text-emerald-400 transition-colors">
              Reports & Exports
            </h4>
            <p className="text-xs text-[#A1AEC2] mt-0.5">Excel, CSV & PDF downloads</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};
