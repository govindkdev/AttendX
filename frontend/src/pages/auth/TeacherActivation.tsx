import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Shield, KeyRound, Lock } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';

export const TeacherActivation: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim() || !email.trim() || !verificationCode.trim()) {
      setErrorMsg('Please complete all institutional faculty identification fields.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    // Front-end activation step progression
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 400);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('Please enter and confirm your password.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password entry.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Faculty account credentials configured! You can now log in to the faculty portal.');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial-subtle">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/login/teacher"
            className="inline-flex items-center text-xs font-semibold text-[#A1AEC2] hover:text-[#F8FAFC] p-2 rounded-xl bg-[#111D30] border border-[#23334A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Faculty Login
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

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-[#3B82F6] border border-blue-500/25 flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Faculty Account Activation
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#A1AEC2]">
            Two-step institutional faculty onboarding and security credential setup
          </p>

          {/* Stepper indicator */}
          <div className="mt-6 flex items-center justify-center space-x-4 text-xs font-semibold">
            <div className={`flex items-center space-x-1.5 ${step === 1 ? 'text-[#3B82F6]' : 'text-emerald-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === 1 ? 'bg-[#3B82F6] text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span>Faculty Verification</span>
            </div>
            <span className="text-[#23334A]">—</span>
            <div className={`flex items-center space-x-1.5 ${step === 2 ? 'text-[#3B82F6]' : 'text-[#64748B]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === 2 ? 'bg-[#3B82F6] text-white' : 'bg-[#16243A] text-[#64748B] border border-[#23334A]'
              }`}>
                2
              </span>
              <span>Security Setup</span>
            </div>
          </div>
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

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm space-y-3">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => navigate('/login/teacher')}
                className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Proceed to Faculty Login &rarr;
              </button>
            </div>
          )}

          {!successMsg && step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <FormInput
                label="Employee ID"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. TCH-001 or EMP-2026-42"
                required
                helperText="Provided by Dean / Academic Registrar"
                autoFocus
              />

              <FormInput
                label="Registered Institutional Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.sharma@institute.edu"
                required
                helperText="Official university or college faculty email"
              />

              <FormInput
                label="Verification Code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Faculty activation authorization key"
                required
                helperText="Obtained from department administrative lead"
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
                >
                  <span>{loading ? 'Validating Registry...' : 'Continue to Password Setup'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {!successMsg && step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0D1525] border border-[#23334A] text-xs text-[#A1AEC2] space-y-1">
                <p>
                  Faculty Code: <span className="font-semibold text-[#F8FAFC]">{employeeId}</span>
                </p>
                <p>
                  Institutional Email: <span className="text-[#3B82F6]">{email}</span>
                </p>
              </div>

              <PasswordInput
                label="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                autoFocus
              />

              <PasswordInput
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
              />

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-3 rounded-xl font-semibold text-xs text-[#A1AEC2] bg-[#16243A] hover:bg-[#1D304D] border border-[#23334A] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
                >
                  <span>{loading ? 'Saving...' : 'Complete Activation'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-[#23334A] text-center text-xs text-[#64748B]">
            Institutional governance interface. Unauthorized activation is logged and audited.
          </div>
        </div>
      </div>
    </div>
  );
};
