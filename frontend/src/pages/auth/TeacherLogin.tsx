import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { User, ArrowLeft, ArrowRight, AlertCircle, Shield, GraduationCap } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';

export const TeacherLogin: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
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
      } else if (loggedUser.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Invalid faculty credentials. Please verify your Employee ID/Email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial-subtle">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/get-started"
            className="inline-flex items-center text-xs font-semibold text-[#A1AEC2] hover:text-[#F8FAFC] p-2 rounded-xl bg-[#111D30] border border-[#23334A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> All Portals
          </Link>
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/assets/attendx-logo.png"
              alt="AttendX"
              className="w-8 h-8 object-contain rounded-xl"
            />
            <span className="text-lg font-bold tracking-tight text-[#F8FAFC]">AttendX</span>
          </Link>
        </div>

        {/* Card Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/25 flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Teacher & Faculty Login
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#A1AEC2]">
            Enter your Employee Code or institutional faculty email
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111D30] py-8 px-6 sm:px-8 rounded-3xl border border-[#23334A] shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Employee ID or Email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. TCH-001 or professor@institute.edu"
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1AEC2]">
                  Password <span className="text-[#EF4444]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#3B82F6] hover:text-[#22D3EE] font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your faculty password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in as Faculty'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Account Activation Callout */}
          <div className="pt-4 border-t border-[#23334A] text-center">
            <p className="text-xs text-[#A1AEC2]">
              New faculty member?{' '}
              <Link
                to="/activate/teacher"
                className="text-[#3B82F6] hover:text-[#22D3EE] font-semibold underline underline-offset-2 ml-1"
              >
                Activate faculty account
              </Link>
            </p>
          </div>

          {/* Other Portal Quick Switcher */}
          <div className="pt-2 flex items-center justify-between text-xs text-[#64748B]">
            <Link
              to="/login/student"
              className="hover:text-[#A1AEC2] transition-colors flex items-center"
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1" /> Student Login
            </Link>
            <Link
              to="/login/admin"
              className="hover:text-[#A1AEC2] transition-colors flex items-center"
            >
              <Shield className="w-3.5 h-3.5 mr-1" /> Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
