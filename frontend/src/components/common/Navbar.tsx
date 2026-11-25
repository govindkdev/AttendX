import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/authentication/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';
import { PortalSelectionModal } from './PortalSelectionModal';

const navLinks = [
  { name: 'Home', path: '/', end: true },
  { name: 'About', path: '/about', end: false },
  { name: 'Features', path: '/features', end: false },
  { name: 'How It Works', path: '/how-it-works', end: false },
  { name: 'Security', path: '/security', end: false },
  { name: 'Contact', path: '/contact', end: false },
];

export interface NavbarProps {
  onOpenPortalModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPortalModal }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const handleOpenPortalModal = () => {
    if (onOpenPortalModal) {
      onOpenPortalModal();
    } else {
      setLocalModalOpen(true);
      window.dispatchEvent(new CustomEvent('attendx:open-portal-modal'));
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'TEACHER') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#080D19]/90 backdrop-blur-md border-b border-[#23334A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/assets/attendx-logo.png"
                alt="AttendX"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#F8FAFC]">
                  Attend<span className="text-[#3B82F6]">X</span>
                </span>
                <span className="text-[10px] text-[#A1AEC2] tracking-wider uppercase font-medium hidden sm:inline -mt-1">
                  Smart Campus
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-7 lg:space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-sm transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                      isActive
                        ? 'text-blue-600 font-semibold text-[#3B82F6] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#3B82F6] after:rounded-full'
                        : 'text-slate-600 text-[#A1AEC2] hover:text-[#F8FAFC]'
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
                  type="button"
                  onClick={() => navigate(getDashboardPath())}
                  className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenPortalModal}
                  className="inline-flex items-center px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:opacity-95 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-[#A1AEC2] hover:text-[#F8FAFC] hover:bg-[#16243A] transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#23334A] bg-[#0D1525] px-4 pt-3 pb-6 space-y-1 shadow-2xl">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 font-semibold text-[#3B82F6] bg-blue-500/10 border-l-3 border-[#3B82F6]'
                      : 'text-slate-600 text-[#A1AEC2] hover:bg-[#16243A] hover:text-[#F8FAFC]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-[#23334A]/80 flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) {
                    navigate(getDashboardPath());
                  } else {
                    handleOpenPortalModal();
                  }
                }}
                className="w-full text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white font-semibold text-xs shadow-md cursor-pointer"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Login'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Standalone Fallback Portal Selection Modal */}
      {!onOpenPortalModal && (
        <PortalSelectionModal
          isOpen={localModalOpen}
          onClose={() => setLocalModalOpen(false)}
        />
      )}
    </>
  );
};
