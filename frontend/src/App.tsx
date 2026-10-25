import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/authentication/AuthContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { UserRole } from '@/types';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { PortalLayout } from '@/layouts/PortalLayout';

// Public Pages
import { Home } from '@/pages/public/Home';
import { About } from '@/pages/public/About';
import { Features } from '@/pages/public/Features';
import { HowItWorks } from '@/pages/public/HowItWorks';
import { Security } from '@/pages/public/Security';
import { Contact } from '@/pages/public/Contact';

// Auth Pages
import { Login } from '@/pages/auth/Login';
import { CreateAccount } from '@/pages/auth/CreateAccount';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ChangePassword } from '@/pages/auth/ChangePassword';
import { Unauthorized } from '@/pages/auth/Unauthorized';

// Student Pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { FaceAttendance } from '@/pages/student/FaceAttendance';
import { ScanQR } from '@/pages/student/ScanQR';
import { StudentTimetable } from '@/pages/student/StudentTimetable';
import { AttendanceHistory } from '@/pages/student/AttendanceHistory';
import { StudentLeaveRequests } from '@/pages/student/StudentLeaveRequests';
import { StudentNotifications } from '@/pages/student/StudentNotifications';
import { StudentReports } from '@/pages/student/StudentReports';
import { StudentProfile } from '@/pages/student/StudentProfile';
import { StudentSettings } from '@/pages/student/StudentSettings';

// Teacher Pages
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { StartAttendance } from '@/pages/teacher/StartAttendance';
import { QRAttendance } from '@/pages/teacher/QRAttendance';
import { ManualAttendance } from '@/pages/teacher/ManualAttendance';
import { TeacherStudents } from '@/pages/teacher/TeacherStudents';
import { TeacherReports } from '@/pages/teacher/TeacherReports';
import { TeacherNotifications } from '@/pages/teacher/TeacherNotifications';
import { TeacherProfile } from '@/pages/teacher/TeacherProfile';
import { TeacherSettings } from '@/pages/teacher/TeacherSettings';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminStudents } from '@/pages/admin/AdminStudents';
import { AdminTeachers } from '@/pages/admin/AdminTeachers';
import { AdminDepartments } from '@/pages/admin/AdminDepartments';
import { AdminCourses } from '@/pages/admin/AdminCourses';
import { AdminSubjects } from '@/pages/admin/AdminSubjects';
import { AdminClasses } from '@/pages/admin/AdminClasses';
import { AdminAttendance } from '@/pages/admin/AdminAttendance';
import { AdminFaceDatasets } from '@/pages/admin/AdminFaceDatasets';
import { AdminGPSSettings } from '@/pages/admin/AdminGPSSettings';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminNotifications } from '@/pages/admin/AdminNotifications';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminProfile } from '@/pages/admin/AdminProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/security" element={<Security />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Student Portal Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="face-attendance" element={<FaceAttendance />} />
              <Route path="scan-qr" element={<ScanQR />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="attendance-history" element={<AttendanceHistory />} />
              <Route path="leave-requests" element={<StudentLeaveRequests />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="reports" element={<StudentReports />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>

            {/* Teacher Portal Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="start-attendance" element={<StartAttendance />} />
              <Route path="qr-attendance" element={<QRAttendance />} />
              <Route path="manual-attendance" element={<ManualAttendance />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="reports" element={<TeacherReports />} />
              <Route path="notifications" element={<TeacherNotifications />} />
              <Route path="profile" element={<TeacherProfile />} />
              <Route path="settings" element={<TeacherSettings />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="teachers" element={<AdminTeachers />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="classes" element={<AdminClasses />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="face-datasets" element={<AdminFaceDatasets />} />
              <Route path="gps-settings" element={<AdminGPSSettings />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
