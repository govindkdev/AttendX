import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Lock, GraduationCap, User, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname === '/admin/login' || location.search.includes('role=admin');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [roleTab, setRoleTab] = useState<'student' | 'teacher' | 'admin'>(
    isAdminRoute ? 'admin' : 'student'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminRoute) {
      setRoleTab('admin');
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    const r = searchParams.get('role');
    if (r === 'teacher' || r === 'student') {
      setRoleTab(r);
    }
  }, [location.search, isAdminRoute]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const loggedUser = await login(identifier.trim(), password);
      if (loggedUser.must_change_password) {
        navigate('/change-password');
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your ID/Email and password.');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (roleTab === 'admin') return 'Admin ID (e.g. ADM-001) or Email';
    if (roleTab === 'teacher') return 'Employee Code (e.g. TCH-001) or Email';
    return 'Student ID (e.g. STU-2026-0001) or Email';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 text-slate-900 group">
          <img
            src="/assets/attendx-logo.png"
            alt="AttendX Logo"
            className="w-11 h-11 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="text-2xl font-black tracking-tight text-slate-900">AttendX</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {isAdminRoute ? 'Administration Console' : 'Sign in to your portal'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {isAdminRoute
            ? 'Restricted authorized administrative access'
            : 'AI-Powered Smart Attendance Management'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {/* Role Tabs for Public Login - Admin is NOT exposed here */}
          {!isAdminRoute ? (
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => setRoleTab('student')}
                className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition-all ${
                  roleTab === 'student' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Student
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('teacher')}
                className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition-all ${
                  roleTab === 'teacher' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 mr-1.5" /> Teacher
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold mb-6 border border-amber-200/60">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Administrative Authorization Required</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {roleTab === 'admin' ? 'Administrator ID or Email' : roleTab === 'teacher' ? 'Teacher ID or Email' : 'Student ID or Email'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={getPlaceholder()}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {!isAdminRoute && (
                  <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
            >
              {loading ? 'Authenticating...' : isAdminRoute ? 'Sign In as Administrator' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {roleTab === 'student' && !isAdminRoute && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                New student?{' '}
                <Link to="/create-account" className="font-semibold text-blue-600 hover:underline">
                  Activate student account
                </Link>
              </p>
            </div>
          )}

          {isAdminRoute && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <Link to="/" className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Public Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};