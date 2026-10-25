import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import {
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const CreateAccount: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: Identity Challenge | Step 2: OTP & Password Setup
  const [step, setStep] = useState<1 | 2>(1);

  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: Submit Identity Challenge
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const sId = studentId.trim();
    const em = email.trim();

    if (!sId || !em) {
      setErrorMsg('Please enter both your Student ID and registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyStudentForActivation({
        student_id: sId,
        email: em,
      });
      setSuccessMsg(res.message || 'Verification challenge sent! Check your inbox for your 6-digit code.');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Identity verification failed. Please verify your Student ID and registered email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Activation & Set Password
  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.completeStudentActivation({
        student_id: studentId.trim(),
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setSuccessMsg(res.message || 'Account activated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login?role=student');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Activation failed. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center space-x-3 text-slate-900 group">
          <img
            src="/assets/attendx-logo.png"
            alt="AttendX Logo"
            className="w-11 h-11 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="text-2xl font-black tracking-tight text-slate-900">AttendX</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Student Account Activation
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Activate your enrolled institute profile and create your password
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                1
              </span>
              <span className={`text-xs font-semibold ${step === 1 ? 'text-blue-700' : 'text-slate-500'}`}>
                Verify Identity
              </span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200"></div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-blue-700' : 'text-slate-400'}`}>
                Set Password
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleVerifyIdentity} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Student ID *
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU-2026-0001"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Provided by your department administrator during enrollment
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The official email address associated with your student profile
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
              >
                {loading ? 'Verifying Identity...' : 'Send Verification Code'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCompleteActivation} className="space-y-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-semibold text-slate-800">{studentId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800">{email}</span>
                </div>
                <div className="pt-1 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-blue-600 hover:underline text-[11px] font-medium"
                  >
                    Edit details
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <KeyRound className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
              >
                {loading ? 'Activating Profile...' : 'Complete Activation & Sign In'}
                <Sparkles className="w-4 h-4 ml-2" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an active account?{' '}
              <Link to="/login?role=student" className="font-semibold text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
