import React from 'react';
import {
  LayoutDashboard,
  Package,
  FileCheck2,
  FolderOpen,
  Receipt,
  BookOpen,
  History,
  Database,
  Lock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../lib/database-service';

export type NavigationTab =
  | 'dashboard'
  | 'shipments'
  | 'customs'
  | 'documents'
  | 'invoices'
  | 'master-data'
  | 'audit-logs'
  | 'database-console';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const isAdmin = db.isAdmin();
  const currentProfile = db.getCurrentProfile();

  const navItems: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    badge?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Overview & Analytics',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'shipments',
      label: 'Shipment Operations',
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: 'customs',
      label: 'Customs Clearance',
      icon: <FileCheck2 className="h-4 w-4" />,
    },
    {
      id: 'documents',
      label: 'Document Storage',
      icon: <FolderOpen className="h-4 w-4" />,
      badge: 'Storage',
    },
    {
      id: 'invoices',
      label: 'Invoices & Freight',
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      id: 'master-data',
      label: 'Ports & Products',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: 'audit-logs',
      label: 'Audit Security Log',
      icon: <History className="h-4 w-4" />,
      adminOnly: true,
    },
    {
      id: 'database-console',
      label: 'Supabase Database',
      icon: <Database className="h-4 w-4" />,
      badge: 'SQL',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between py-4">
      <div className="space-y-6 px-3">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Logistics Core
          </div>
          {navItems.map((item) => {
            const isLocked = item.adminOnly && !isAdmin;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                disabled={isLocked}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isLocked
                    ? 'text-slate-400 opacity-60 cursor-not-allowed hover:bg-transparent'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {isLocked ? (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400" title="RLS Restricted: Admin only">
                    <Lock className="h-3 w-3" />
                  </span>
                ) : item.badge ? (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Live System Info Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Security Architecture</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded">RLS Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data isolation enforced via PostgreSQL Row Level Security.
          </p>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Session Role:</span>
            <span className="font-mono font-bold capitalize">{currentProfile.role}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 text-[11px] text-slate-400 space-y-1">
        <div className="font-mono">TransLogix ERP v2.4</div>
        <div>Supabase PostgreSQL 16 · Realtime</div>
      </div>
    </aside>
  );
};
