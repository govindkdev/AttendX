import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Shield, ArrowLeft, ArrowRight, AlertCircle, Lock, GraduationCap, User } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';

export const AdminLogin: React.FC = () => {
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
      setErrorMsg(
        err.message || 'Invalid administrator credentials. Access restricted to authorized campus staff.'
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
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-[#8B5CF6] border border-purple-500/25 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold mb-2">
            <Lock className="w-3 h-3" />
            <span>Restricted Governance Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Administrator Login
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#A1AEC2]">
            Enter your administrative credentials to access institutional controls
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
              label="Admin ID or Email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. ADM-001 or admin@institute.edu"
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1AEC2]">
                  Master Password <span className="text-[#EF4444]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-[#23334A] text-center">
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Administrative sessions are cryptographically logged with IP telemetry. Unauthorized access attempts are strictly audited.
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
              to="/login/teacher"
              className="hover:text-[#A1AEC2] transition-colors flex items-center"
            >
              <User className="w-3.5 h-3.5 mr-1" /> Faculty Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
