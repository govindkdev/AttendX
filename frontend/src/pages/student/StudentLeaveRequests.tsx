import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LeaveRequest } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormInput } from '@/components/ui/FormInput';
import { FileCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const StudentLeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await api.getLeaveRequests();
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.submitLeaveRequest({
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      setSuccessMsg('Leave request submitted successfully for faculty review.');
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadRequests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Leave Requests</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Apply for academic or medical leave and track faculty approval status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="bg-[#111D30] rounded-3xl p-6 sm:p-7 border border-[#23334A] shadow-xl space-y-4">
          <h3 className="text-base font-bold text-[#F8FAFC] flex items-center">
            <FileCheck className="w-4 h-4 mr-2 text-[#3B82F6]" /> Submit Leave Application
          </h3>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />

            <FormInput
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-1.5">
                Reason for Leave
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State your reason (e.g. Medical illness, family emergency...)"
                className="w-full bg-[#0D1525] border border-[#23334A] text-[#F8FAFC] placeholder-[#64748B] text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:border-[#3B82F6]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
            >
              <span>{submitting ? 'Submitting...' : 'Submit Leave Request'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Existing Requests List */}
        <div className="lg:col-span-2 bg-[#111D30] rounded-3xl p-6 sm:p-7 border border-[#23334A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#23334A] pb-3.5">
            <h3 className="text-base font-bold text-[#F8FAFC]">Application History</h3>
            <span className="text-xs text-[#A1AEC2]">{requests.length} records</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#A1AEC2]">Loading leave applications...</div>
          ) : requests.length > 0 ? (
            <div className="divide-y divide-[#23334A]/50 max-h-[420px] overflow-y-auto pr-1">
              {requests.map((r) => (
                <div key={r.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#F8FAFC]">
                        {r.start_date} – {r.end_date}
                      </span>
                      <p className="text-xs text-[#A1AEC2] mt-0.5">{r.reason}</p>
                    </div>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                  {r.reviewed_by_name && (
                    <p className="text-[11px] text-[#64748B]">
                      Reviewed by {r.reviewed_by_name} {r.review_remarks ? `(${r.review_remarks})` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No leave requests submitted"
              description="Your submitted leave applications and approval status will appear here."
              icon={FileCheck}
            />
          )}
        </div>
      </div>
    </div>
  );
};
