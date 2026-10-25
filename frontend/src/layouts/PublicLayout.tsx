import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { AttendXAIWidget } from '@/components/common/AttendXAIWidget';
import { Bot } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Floating AI Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:scale-105 transition-all flex items-center space-x-2 border-2 border-white/20"
        title="Open AttendX AI"
      >
        <Bot className="w-6 h-6 animate-pulse" />
        <span className="hidden sm:inline font-semibold text-xs tracking-wide">AttendX AI</span>
      </button>

      <AttendXAIWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};
