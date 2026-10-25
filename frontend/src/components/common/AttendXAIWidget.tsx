import React, { useState } from 'react';
import { api } from '@/services/api';
import type { AIQueryResponse } from '@/types';
import { Bot, X, Send, Sparkles, MessageSquare, Database, ArrowRight } from 'lucide-react';

interface AttendXAIWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendXAIWidget: React.FC<AttendXAIWidgetProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; evidence?: any[]; followUps?: string[] }>>([
    {
      role: 'assistant',
      text: "Hello! I am AttendX AI. You can ask me real-time attendance questions like: 'What is my attendance this month?', 'Which subjects have attendance below 75%?', or 'How many students were absent today?'.",
      followUps: [
        'What is my attendance this month?',
        'Which subjects have attendance below 75%?',
        'How many students were absent today?',
        'Show QR and face attendance breakdown'
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);

    try {
      const res: AIQueryResponse = await api.queryAI(q);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          evidence: res.evidence,
          followUps: res.follow_up_questions,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error querying intelligence service: ${err.message || 'Please try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AttendX AI Assistant</h3>
            <span className="text-[11px] text-blue-300 font-medium flex items-center">
              <Database className="w-3 h-3 mr-1" /> Verified Database Intelligence
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
              }`}
            >
              <p className="whitespace-pre-line">{m.text}</p>

              {/* Evidence cards */}
              {m.evidence && m.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" /> Grounded Database Evidence:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {m.evidence.map((ev, eIdx) => (
                      <div key={eIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-[11px]">
                        {Object.entries(ev).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-400">{k}:</span>
                            <span className="text-slate-800 font-semibold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up suggestions */}
            {m.followUps && m.followUps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                {m.followUps.map((f, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => handleSubmit(f)}
                    className="text-xs bg-white text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors flex items-center text-left"
                  >
                    <span>{f}</span>
                    <ArrowRight className="w-3 h-3 ml-1 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs italic p-2 bg-white rounded-xl border border-slate-200 w-fit">
            <Bot className="w-4 h-4 animate-spin text-blue-600" />
            <span>Consulting database records & analytics...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about attendance or classes..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
