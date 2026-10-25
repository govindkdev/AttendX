import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Mail, Phone } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
      <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2 text-white">
              <img
                src="/assets/attendx-logo.png"
                alt="AttendX"
                className="w-8 h-8 object-contain rounded-lg"
              />
              <span className="text-xl font-bold tracking-tight">AttendX</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              AI-Powered Smart Attendance & Institutional Governance Platform. Engineered for precision, privacy, and zero-compromise security.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="hover:text-white transition-colors">Face Verification</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Signed QR Attendance</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">GPS Geofencing</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">AttendX AI Intelligence</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">Workflow & Architecture</Link></li>
            </ul>
          </div>

          {/* Institutional Compliance */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Security & Ethics</h4>
            <ul className="space-y-2">
              <li><Link to="/security" className="hover:text-white transition-colors">Biometric Template Protection</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Argon2id & JWT Authentication</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Immutable Audit Logs</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">No Demo Data Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Support & Contact</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-blue-500" /> support@attendx.com</li>
              <li className="flex items-center"><Phone className="w-4 h-4 mr-2 text-blue-500" /> +91 522 1234567</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} AttendX. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with React, Python FastAPI, PostgreSQL & Computer Vision.</p>
        </div>
      </ScrollReveal>
    </footer>
  );
};
