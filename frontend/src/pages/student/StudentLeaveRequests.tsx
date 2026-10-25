import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { LeaveRequest } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FileCheck, Send, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

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
      setRequests(data);
    } catch {
      // Ignored
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

  const getStatusBadge = (s: string) => {
    if (s === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Approved
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Review
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Requests</h2>
        <p className="text-xs text-slate-500 mt-1">
          Apply for academic leave of absence and track department approvals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">New Leave Application</h3>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason & Justification *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State medical, personal, or institutional reasons..."
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Leave Application Status</h3>

          {requests.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {r.start_date} &rarr; {r.end_date}
                    </span>
                    {getStatusBadge(r.status)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.reason}</p>
                  {r.reviewed_by_name && (
                    <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-500">
                      Reviewed by: <strong>{r.reviewed_by_name}</strong>
                      {r.review_remarks && <span className="ml-2 italic">&ldquo;{r.review_remarks}&rdquo;</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileCheck}
              title="No leave requests available"
              description="You have not submitted any leave applications yet."
            />
          )}
        </div>
      </div>
    </div>
  );
};
