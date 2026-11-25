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
  LogOut,
  X,
  AlertTriangle,
  FolderLock
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'STUDENT') {
      return [
        { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/student/attendance-history', icon: History, label: 'Attendance History' },
        { to: '/student/face-attendance', icon: Camera, label: 'Face Attendance' },
        { to: '/student/scan-qr', icon: QrCode, label: 'QR Attendance' },
        { to: '/student/timetable', icon: CalendarDays, label: 'Timetable' },
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
        { to: '/teacher/start-attendance', icon: Camera, label: 'Face Attendance' },
        { to: '/teacher/qr-attendance', icon: QrCode, label: 'QR Attendance' },
        { to: '/teacher/manual-attendance', icon: UserCheck, label: 'Manual Attendance' },
        { to: '/teacher/students', icon: Users, label: 'Students' },
        { to: '/teacher/reports', icon: History, label: 'Attendance Records' },
        { to: '/teacher/reports', icon: FileSpreadsheet, label: 'Reports' },
        { to: '/teacher/notifications', icon: Bell, label: 'Parent Alerts' },
        { to: '/teacher/profile', icon: UserCircle, label: 'Profile' },
        { to: '/teacher/settings', icon: Settings, label: 'Settings' },
      ];
    }

    // ADMINISTRATOR
    return [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/students', icon: GraduationCap, label: 'Students' },
      { to: '/admin/teachers', icon: Users, label: 'Faculty' },
      { to: '/admin/departments', icon: Building2, label: 'Departments' },
      { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
      { to: '/admin/subjects', icon: FileText, label: 'Subjects' },
      { to: '/admin/classes', icon: CalendarDays, label: 'Timetable & Classes' },
      { to: '/admin/attendance', icon: History, label: 'Attendance Records' },
      { to: '/admin/face-datasets', icon: Camera, label: 'Face Datasets' },
      { to: '/admin/gps-settings', icon: MapPin, label: 'GPS Geofence' },
      { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports & Analytics' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { to: '/admin/notifications', icon: AlertTriangle, label: 'Parent Alerts' },
      { to: '/admin/audit-logs', icon: ShieldCheck, label: 'Audit Logs' },
      { to: '/admin/settings', icon: Settings, label: 'Institute Settings' },
      { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
    ];
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#23334A]">
          <Link to="/" className="flex items-center space-x-3 overflow-hidden">
            <img
              src="/assets/attendx-logo.png"
              alt="AttendX"
              className="w-8 h-8 object-contain rounded-xl shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-[#F8FAFC]">
                  Attend<span className="text-[#3B82F6]">X</span>
                </span>
                <span className="text-[10px] text-[#A1AEC2] uppercase tracking-wider font-semibold">
                  {user?.role === 'ADMIN' ? 'Admin Console' : user?.role === 'TEACHER' ? 'Faculty Portal' : 'Student Portal'}
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-[#A1AEC2] hover:text-[#F8FAFC] md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.to}-${item.label}-${idx}`}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#16243A] text-[#3B82F6] font-semibold border-l-2 border-[#3B82F6] shadow-xs'
                      : 'text-[#A1AEC2] hover:bg-[#16243A]/50 hover:text-[#F8FAFC]'
                  } ${collapsed ? 'justify-center' : 'space-x-3'}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-3 border-t border-[#23334A] space-y-1">
        <button
          onClick={logout}
          className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors ${
            collapsed ? 'justify-center' : 'space-x-3'
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggle}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-xl text-[#64748B] hover:text-[#A1AEC2] hover:bg-[#16243A] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 z-30 h-screen bg-[#0B1322] text-[#A1AEC2] transition-all duration-300 flex-col border-r border-[#23334A] ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-[#080D19]/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#0B1322] text-[#A1AEC2] border-r border-[#23334A] shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
