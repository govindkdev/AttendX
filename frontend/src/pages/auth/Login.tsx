import React from 'react';
import { useLocation } from 'react-router-dom';
import { PortalSelection } from './PortalSelection';
import { StudentLogin } from './StudentLogin';
import { TeacherLogin } from './TeacherLogin';
import { AdminLogin } from './AdminLogin';

export const Login: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get('role');

  if (location.pathname === '/admin/login' || location.pathname === '/login/admin' || role === 'admin') {
    return <AdminLogin />;
  }

  if (location.pathname === '/login/teacher' || location.pathname === '/teacher/login' || role === 'teacher') {
    return <TeacherLogin />;
  }

  if (location.pathname === '/login/student' || location.pathname === '/student/login' || role === 'student') {
    return <StudentLogin />;
  }

  // Default /login without role query opens the dedicated portal selection
  return <PortalSelection />;
};
