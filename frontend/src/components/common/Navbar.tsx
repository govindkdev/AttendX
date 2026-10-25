import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { ShieldCheck, User, GraduationCap, Lock, Menu, X, ArrowRight } from 'lucide-react';

const navLinks = [
  { name: 'Home', path: '/', end: true },
  { name: 'About', path: '/about', end: false },
  { name: 'Features', path: '/features', end: false },
  { name: 'How It Works', path: '/how-it-works', end: false },
  { name: 'Security', path: '/security', end: false },
  { name: 'Contact', path: '/contact', end: false },
];

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'TEACHER') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/assets/attendx-logo.png"
                alt="AttendX"
                className="w-10 h-10 object-contain rounded-xl shadow-xs"
              />
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                  Attend<span className="text-blue-600">X</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                      isActive
                        ? 'text-blue-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:rounded-full'
                        : 'text-slate-600 hover:text-blue-600'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                >
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Get Started
                  </button>
                  <Link
                    to="/admin/login"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Administrative Access"
                  >
                    <Lock className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full text-center py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm shadow-sm"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started / Sign In'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Get Started Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Sign in to AttendX</h3>
              <p className="text-sm text-slate-500 mt-1">Select your portal to continue</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  navigate('/login?role=student');
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Student Portal
                    </h4>
                    <p className="text-xs text-slate-500">Attendance, face verification & reports</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  navigate('/login?role=teacher');
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Teacher Portal
                    </h4>
                    <p className="text-xs text-slate-500">Start sessions, generate QR & mark attendance</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  New student?{' '}
                  <Link
                    to="/create-account"
                    onClick={() => setLoginModalOpen(false)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Activate your account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
