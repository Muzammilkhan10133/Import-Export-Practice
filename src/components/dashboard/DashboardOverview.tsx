import React from 'react';
import {
  Ship,
  Plane,
  Truck,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Compass,
  AlertCircle,
  Plus,
  Boxes,
  Database,
  Anchor,
  Radio,
} from 'lucide-react';
import { db } from '../../lib/database-service';

interface DashboardOverviewProps {
  onSelectShipment: (id: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenNewShipment: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectShipment,
  onNavigateTab,
  onOpenNewShipment,
}) => {
  const isAdmin = db.isAdmin();
  const currentProfile = db.getCurrentProfile();
  const shipments = db.getShipments();
  const customs = db.getCustoms();
  const notifications = db.getNotifications();

  const totalValue = shipments.reduce((acc, s) => acc + Number(s.total_value), 0);
  const activeSea = shipments.filter((s) => s.transport_mode === 'sea' && !s.current_status.toLowerCase().includes('delivered')).length;
  const activeAir = shipments.filter((s) => s.transport_mode === 'air' && !s.current_status.toLowerCase().includes('delivered')).length;
  const customsPending = customs.filter((c) => c.status !== 'Cleared' && c.status !== 'Rejected').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                PostgreSQL Realtime
              </span>
              <span className="text-xs text-slate-400">
                {isAdmin ? 'Administrator Portal' : `${currentProfile.full_name} (${db.getCurrentProfile().role})`}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight">
              Global Cargo Logistics Operations Center
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
              Real-time import/export freight orchestration powered exclusively by Supabase PostgreSQL, Storage, and Row Level Security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={onOpenNewShipment}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-emerald-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Book Shipment</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('database-console')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Database Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Consignments</span>
            <Boxes className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{shipments.length}</span>
            <span className="text-xs text-slate-400 font-mono">Total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {shipments.filter((s) => s.shipment_type === 'export').length} Export · {shipments.filter((s) => s.shipment_type === 'import').length} Import
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Maritime Vessels</span>
            <Ship className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{activeSea}</span>
            <span className="text-xs text-slate-400 font-mono">FCL / LCL</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Voyages in international waters</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Customs Declarations</span>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{customsPending}</span>
            <span className="text-xs text-slate-400 font-mono">Appraisal</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Collectorate examination</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Cargo Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ${(totalValue / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-400 font-mono">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">Commercial insured volume</div>
        </div>
      </div>

      {/* Two Column Grid: Active Corridors Map & Recent Consignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Corridors Visualizer (2 Cols) */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Global Trade Corridors</h3>
              <p className="text-xs text-slate-500">Direct container routes currently tracked in PostgreSQL</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Live Updates</span>
            </span>
          </div>

          <div className="space-y-3">
            {shipments.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectShipment(s.id)}
                className="cursor-pointer rounded-lg border border-slate-200/90 bg-slate-50/60 p-4 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {s.tracking_number}
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 uppercase">
                      {s.shipment_type}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800">{s.current_status}</span>
                  </div>
                </div>

                {/* Route visualization */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-700 bg-white p-3 rounded-md border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-bold text-slate-900">{s.origin_city}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.origin_port?.port_code || 'ORIGIN'}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 mx-4 flex flex-col items-center">
                    <div className="text-[10px] text-slate-400 font-mono">
                      {s.transport_mode.toUpperCase()} FREIGHT
                    </div>
                    <div className="w-full flex items-center my-1">
                      <div className="h-0.5 flex-1 bg-slate-200" />
                      <div className="h-2 w-2 rounded-full bg-slate-900 mx-1" />
                      <div className="h-0.5 flex-1 bg-slate-200" />
                    </div>
                    <div className="text-[10px] text-slate-400">ETA: {s.expected_delivery_date}</div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="font-bold text-slate-900">{s.destination_city}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.destination_port?.port_code || 'DEST'}
                      </div>
                    </div>
                    <Anchor className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-xs">{s.exporter?.company_name} → {s.importer?.company_name}</span>
                  <span className="font-mono font-bold text-slate-900">${Number(s.total_value).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realtime Event Stream & Quick Links (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Milestones</h3>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="rounded-md bg-slate-50 p-2.5 border border-slate-100 text-xs">
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Navigation</h3>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => onNavigateTab('shipments')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700"
              >
                <span>Shipments Registry</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigateTab('customs')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700"
              >
                <span>Customs Declarations</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigateTab('documents')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700"
              >
                <span>Supabase Storage Vault</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigateTab('invoices')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700"
              >
                <span>Commercial Invoices</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
