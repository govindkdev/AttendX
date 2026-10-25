import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { TopHeader } from '@/components/common/TopHeader';
import { AttendXAIWidget } from '@/components/common/AttendXAIWidget';
import { Bot } from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const location = useLocation();

  // Determine title from pathname
  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      const sub = parts[1].replace(/-/g, ' ');
      return sub.charAt(0).toUpperCase() + sub.slice(1);
    }
    return 'Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <TopHeader title={getPageTitle()} onOpenAI={() => setAiOpen(true)} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Button in portal */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:scale-105 transition-all flex items-center space-x-2 border-2 border-white/20"
        title="Open AttendX AI"
      >
        <Bot className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline font-semibold text-xs tracking-wide">AttendX AI</span>
      </button>

      <AttendXAIWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};
