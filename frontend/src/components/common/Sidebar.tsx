import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import {
  LayoutDashboard,
  Camera,
  QrCode,
  CalendarDays,
  History,
  FileText,
  Bell,
  UserCheck,
  Building2,
  GraduationCap,
  BookOpen,
  MapPin,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Users,
  UserCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'STUDENT') {
      return [
        { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/student/face-attendance', icon: Camera, label: 'Face Attendance' },
        { to: '/student/scan-qr', icon: QrCode, label: 'Scan QR' },
        { to: '/student/timetable', icon: CalendarDays, label: 'Timetable' },
        { to: '/student/attendance-history', icon: History, label: 'History' },
        { to: '/student/leave-requests', icon: FileCheck, label: 'Leave Requests' },
        { to: '/student/notifications', icon: Bell, label: 'Notifications' },
        { to: '/student/reports', icon: FileSpreadsheet, label: 'Reports' },
        { to: '/student/profile', icon: UserCircle, label: 'Profile' },
        { to: '/student/settings', icon: Settings, label: 'Settings' },
      ];
    }

    if (user.role === 'TEACHER') {
      return [
        { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/teacher/start-attendance', icon: Camera, label: 'Start Attendance' },
        { to: '/teacher/qr-attendance', icon: QrCode, label: 'QR Attendance' },
        { to: '/teacher/manual-attendance', icon: UserCheck, label: 'Manual Entry' },
        { to: '/teacher/students', icon: Users, label: 'Students' },
        { to: '/teacher/reports', icon: FileSpreadsheet, label: 'Reports' },
        { to: '/teacher/notifications', icon: Bell, label: 'Parent Alerts' },
        { to: '/teacher/profile', icon: UserCircle, label: 'Profile' },
        { to: '/teacher/settings', icon: Settings, label: 'Settings' },
      ];
    }

    // ADMIN
    return [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/students', icon: GraduationCap, label: 'Students' },
      { to: '/admin/teachers', icon: Users, label: 'Teachers' },
      { to: '/admin/departments', icon: Building2, label: 'Departments' },
      { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
      { to: '/admin/subjects', icon: FileText, label: 'Subjects' },
      { to: '/admin/classes', icon: CalendarDays, label: 'Timetable & Classes' },
      { to: '/admin/attendance', icon: History, label: 'Attendance Records' },
      { to: '/admin/face-datasets', icon: Camera, label: 'Face Datasets' },
      { to: '/admin/gps-settings', icon: MapPin, label: 'GPS Geofence' },
      { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { to: '/admin/audit-logs', icon: ShieldCheck, label: 'Audit Logs' },
      { to: '/admin/settings', icon: Settings, label: 'Institute Settings' },
      { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col border-r border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/" className="flex items-center space-x-3 overflow-hidden">
          <img
            src="/assets/attendx-logo.png"
            alt="AttendX Logo"
            className="w-10 h-10 object-contain rounded-xl shrink-0 shadow-lg shadow-blue-500/20"
          />
          {!collapsed && (
            <div className="leading-tight">
              <span className="font-bold text-white text-lg tracking-tight">AttendX</span>
              <span className="block text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                {user?.role} Portal
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer / Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors group"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
