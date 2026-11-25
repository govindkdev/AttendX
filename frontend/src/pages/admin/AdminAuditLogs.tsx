import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { AuditLogItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Terminal,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Shield,
  Layers
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        action: actionFilter || undefined,
        resource_type: resourceFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, resourceFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.actor_role && log.actor_role.toLowerCase().includes(term)) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(term))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('FAIL') || action.includes('RESET') || action.includes('DELETE')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('CORRECTION') || action.includes('UPDATE') || action.includes('OVERRIDE')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    if (action.includes('SUCCESS') || action.includes('CREATE') || action.includes('ENROLL')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111D30] border border-[#23334A] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] block mb-1">
            Tamper-Evident Trail
          </span>
          <h1 className="text-2xl font-bold font-heading text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />
            Security & Compliance Audit Logs
          </h1>
          <p className="text-xs text-[#A1AEC2] mt-1">
            Immutable system logs recording credential actions, biometric template events, attendance corrections, and governance changes.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#23334A] text-[#F8FAFC] bg-[#0D1525] hover:border-[#3B82F6] text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6]" />
          Refresh Audit Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111D30] p-4 rounded-xl border border-[#23334A] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action name, user, details or IP..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-[#23334A] rounded-xl bg-[#0D1525] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        <div className="w-48">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-xs border border-[#23334A] rounded-xl px-3 py-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
            <option value="FACE_ENROLLMENT_SUCCESS">FACE_ENROLLMENT_SUCCESS</option>
            <option value="FACE_ENROLLMENT_RESET">FACE_ENROLLMENT_RESET</option>
            <option value="ATTENDANCE_CORRECTION">ATTENDANCE_CORRECTION</option>
            <option value="BROADCAST_NOTIFICATION">BROADCAST_NOTIFICATION</option>
            <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
          </select>
        </div>

        <div className="w-40">
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="w-full text-xs border border-[#23334A] rounded-xl px-3 py-2 bg-[#0D1525] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="">All Resources</option>
            <option value="USER">USER</option>
            <option value="STUDENT">STUDENT</option>
            <option value="TEACHER">TEACHER</option>
            <option value="ATTENDANCE">ATTENDANCE</option>
            <option value="SETTINGS">SETTINGS</option>
          </select>
        </div>

        {(search || actionFilter || resourceFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setActionFilter('');
              setResourceFilter('');
            }}
            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#111D30] border border-[#23334A] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#A1AEC2] text-xs">Loading security audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit log entries found"
            description="No actions match the selected filter criteria. System actions such as logins and administrative configurations will appear here automatically."
            icon={Shield}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A1AEC2]">
              <thead className="bg-[#0D1525] text-[#A1AEC2] uppercase font-semibold border-b border-[#23334A]">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Event</th>
                  <th className="px-5 py-3.5">Actor Role & ID</th>
                  <th className="px-5 py-3.5">Target Resource</th>
                  <th className="px-5 py-3.5">Audit Details & Context</th>
                  <th className="px-5 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23334A]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#16243A]/60 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-[#A1AEC2] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-[#F8FAFC] text-xs">
                        Actor #{log.actor_id || 'System'}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-[#3B82F6]">{log.actor_role}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                      <span className="font-medium text-[#F8FAFC]">{log.resource_type || 'GLOBAL'}</span>
                      {log.resource_id && (
                        <span className="text-[#64748B] font-mono text-[11px]"> #{log.resource_id}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#A1AEC2] max-w-md">
                      <div className="truncate font-sans" title={log.details || ''}>
                        {log.details || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-[#64748B] whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
