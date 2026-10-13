import React from 'react';
import { History, ShieldAlert, ShieldCheck, Lock, Terminal } from 'lucide-react';
import { db } from '../../lib/database-service';

export const AuditLogsView: React.FC = () => {
  const isAdmin = db.isAdmin();

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center max-w-lg mx-auto my-12">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-600" />
        <h2 className="mt-3 text-base font-bold text-rose-900">
          Supabase RLS Violation: Access Denied
        </h2>
        <p className="mt-2 text-xs text-rose-700 leading-relaxed">
          Row Level Security policy <code className="font-mono font-bold">audit_logs_admin_only</code> enforces that regular customer accounts cannot view system audit logs or administrative security records.
        </p>
        <div className="mt-4 text-[11px] text-rose-600 font-mono">
          403 Forbidden · auth.uid() is not in public.is_admin()
        </div>
      </div>
    );
  }

  const logs = db.getAuditLogs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">System Audit Security Trail</h1>
            <span className="font-mono text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">
              Admin Only RLS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable PostgreSQL ledger of state transitions, container seals, document uploads, and customs actions
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
          {logs.length} Immutable Log Entries
        </div>
      </div>

      {/* Log Feed */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>PostgreSQL public.audit_logs Stream</span>
          </div>
          <span className="text-slate-400">SELECT * FROM public.audit_logs ORDER BY created_at DESC</span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    entity: {log.entity_type} · id: {log.entity_id}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-700 leading-relaxed">
                {log.description}
              </div>

              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>user_id: {log.user_id || 'system_service'}</span>
                <span>·</span>
                <span>status: recorded_to_db</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
