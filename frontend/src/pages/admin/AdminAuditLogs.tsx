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
  FileCode,
  Shield,
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
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CORRECTION') || action.includes('UPDATE') || action.includes('OVERRIDE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('SUCCESS') || action.includes('ENROLLMENT') || action.includes('CREATE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Security & System Audit Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable, chronological record of administrative actions, biometric registrations, status overrides, and security events.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Audit Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action name, user, details or IP..."
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="w-48">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading security audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit log entries found"
            description="No actions match the selected filter criteria. System actions such as logins and administrative configurations will appear here automatically."
            icon={Shield}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action Event</th>
                  <th className="px-5 py-3">Actor Role & ID</th>
                  <th className="px-5 py-3">Target Resource</th>
                  <th className="px-5 py-3">Audit Details & Context</th>
                  <th className="px-5 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">
                        Actor #{log.actor_id || 'System'}
                      </div>
                      <div className="text-[11px] uppercase font-bold text-slate-400">{log.actor_role}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                      <span className="font-medium text-slate-700">{log.resource_type || 'GLOBAL'}</span>
                      {log.resource_id && (
                        <span className="text-slate-400 font-mono text-[11px]"> #{log.resource_id}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-md">
                      <div className="truncate font-sans" title={log.details || ''}>
                        {log.details || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-400 whitespace-nowrap">
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
