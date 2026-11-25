import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { TopHeader } from '@/components/common/TopHeader';
import { AttendXAIWidget } from '@/components/common/AttendXAIWidget';
import { Bot } from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <div className="min-h-screen bg-[#080D19] text-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        } ml-0`}
      >
        <TopHeader
          title={getPageTitle()}
          onOpenAI={() => setAiOpen(true)}
          onToggleMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Button in portal */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white shadow-xl shadow-blue-600/25 hover:opacity-95 hover:scale-105 transition-all flex items-center space-x-2 border border-white/20"
        title="Open AttendX AI"
        aria-label="Open AttendX AI Assistant"
      >
        <Bot className="w-5 h-5 animate-pulse text-[#22D3EE]" />
        <span className="hidden sm:inline font-semibold text-xs tracking-wide">AttendX AI</span>
      </button>

      <AttendXAIWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};
