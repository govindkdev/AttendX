import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { AttendXAIWidget } from '@/components/common/AttendXAIWidget';
import { PortalSelectionModal } from '@/components/common/PortalSelectionModal';
import { Bot } from 'lucide-react';

export interface PublicOutletContext {
  onOpenPortalModal: () => void;
}

export const PublicLayout: React.FC = () => {
  const [aiOpen, setAiOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);

  const handleOpenPortalModal = () => {
    setPortalModalOpen(true);
  };

  useEffect(() => {
    const handleCustomOpen = () => setPortalModalOpen(true);
    window.addEventListener('attendx:open-portal-modal', handleCustomOpen);
    return () => window.removeEventListener('attendx:open-portal-modal', handleCustomOpen);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080D19] text-[#F8FAFC]">
      <Navbar onOpenPortalModal={handleOpenPortalModal} />
      <main className="flex-1">
        <Outlet context={{ onOpenPortalModal: handleOpenPortalModal } satisfies PublicOutletContext} />
      </main>
      <Footer />

      {/* Centered Portal Selection Modal */}
      <PortalSelectionModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
      />

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white shadow-xl shadow-blue-600/25 hover:opacity-95 hover:scale-105 transition-all flex items-center space-x-2 border border-white/20"
        title="Open AttendX AI"
        aria-label="Open AttendX AI Assistant"
      >
        <Bot className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline font-semibold text-xs tracking-wide">AttendX AI</span>
      </button>

      <AttendXAIWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};
