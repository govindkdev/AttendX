import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B1322] text-[#A1AEC2] text-sm border-t border-[#23334A]">
      <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 text-[#F8FAFC]">
              <img
                src="/assets/attendx-logo.png"
                alt="AttendX"
                className="w-9 h-9 object-contain rounded-xl"
              />
              <span className="text-xl font-bold tracking-tight">
                Attend<span className="text-[#3B82F6]">X</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#A1AEC2] max-w-sm">
              Smart Attendance. Smarter Campus. Verified Identity. Trusted Insights. Intelligent face verification, cryptographic signed QR tokens, and campus location validation.
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              <span>Campus Identity & Attendance Platform</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold text-xs tracking-wider uppercase mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-[#F8FAFC] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#F8FAFC] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#F8FAFC] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('attendx:open-portal-modal'))}
                  className="hover:text-[#3B82F6] transition-colors cursor-pointer text-left"
                >
                  Portals & Login
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold text-xs tracking-wider uppercase mb-4">
              Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/features" className="hover:text-[#F8FAFC] transition-colors">
                  AI Face Recognition
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#F8FAFC] transition-colors">
                  QR-Based Attendance
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#F8FAFC] transition-colors">
                  GPS Geofencing
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#F8FAFC] transition-colors">
                  Attendance Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Contact */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold text-xs tracking-wider uppercase mb-4">
              Security & Contact
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/security" className="hover:text-[#F8FAFC] transition-colors">
                  Role-Based Access
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-[#F8FAFC] transition-colors">
                  Audit Logs
                </Link>
              </li>
              <li className="pt-2 flex items-center text-[#A1AEC2]">
                <Mail className="w-3.5 h-3.5 mr-2 text-[#3B82F6]" /> support@attendx.com
              </li>
              <li className="flex items-center text-[#A1AEC2]">
                <Phone className="w-3.5 h-3.5 mr-2 text-[#3B82F6]" /> +91 (522) 200-4000
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#23334A] flex flex-col sm:flex-row justify-between items-center text-xs text-[#64748B]">
          <p>&copy; {new Date().getFullYear()} AttendX. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Enterprise Campus Attendance & Identity Verification</p>
        </div>
      </ScrollReveal>
    </footer>
  );
};
