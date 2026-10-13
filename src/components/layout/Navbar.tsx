import React, { useState } from 'react';
import {
  Ship,
  Bell,
  Search,
  ShieldCheck,
  User,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
} from 'lucide-react';
import { db } from '../../lib/database-service';
import { isConfigured, SUPABASE_URL } from '../../lib/supabase';
import { Notification } from '../../types/database.types';

interface NavbarProps {
  onSearchSelect?: (shipmentId: string) => void;
  onOpenConsole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchSelect, onOpenConsole }) => {
  const currentProfile = db.getCurrentProfile();
  const isAdmin = db.isAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const notifications = db.getNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const allShipments = db.getShipments();
  const searchResults = searchQuery.trim()
    ? allShipments.filter(
        (s) =>
          s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.origin_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.destination_city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectShipment = (id: string) => {
    setSearchQuery('');
    if (onSearchSelect) onSearchSelect(id);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-xs">
      {/* Brand & Connection Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Ship className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">TransLogix</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
                ERP
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Radio className={`h-3 w-3 ${isConfigured ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
              <button
                onClick={onOpenConsole}
                className="hover:text-slate-900 hover:underline transition-colors flex items-center gap-1"
                title="Click to view Supabase Database Console & Deployment Guide"
              >
                <span>{isConfigured ? 'Supabase Connected' : 'Supabase (Demo Active)'}</span>
                <span className="text-[10px] text-slate-400">· PostgreSQL</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="relative hidden md:block max-w-md w-full mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking # (e.g. PK-EXP-2026-001001), port, city..."
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-hidden transition-all"
          />
        </div>

        {/* Live Search Autocomplete Popup */}
        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg z-50">
            {searchResults.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No matching shipments found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Matching Shipments ({searchResults.length})
                </div>
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectShipment(s.id)}
                    className="w-full flex items-center justify-between rounded p-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-900">{s.tracking_number}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.origin_city} → {s.destination_city} · {s.shipment_type.toUpperCase()} · {s.current_status}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      ${s.total_value.toLocaleString()} <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Database Console button, Notifications & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Supabase Console Button */}
        <button
          onClick={onOpenConsole}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Open Supabase Setup, SQL Migrations & RLS Checker"
        >
          <Database className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Database Center</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Shipment Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications ({notifications.length})</span>
                <span className="text-[11px] text-slate-400">Realtime events</span>
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => db.markNotificationAsRead(n.id)}
                      className={`cursor-pointer rounded p-2 text-xs transition-colors ${
                        n.is_read ? 'bg-white opacity-70' : 'bg-slate-50 border-l-2 border-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <div className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role & User Switcher (Interactive RLS Simulator) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white text-[11px] font-bold">
              {isAdmin ? 'AD' : 'CL'}
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-slate-900 leading-tight">
                {currentProfile.full_name}
              </div>
              <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                {isAdmin ? (
                  <span className="text-purple-700 font-semibold">Admin (Full RLS)</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Client (Company RLS)</span>
                )}
              </div>
            </div>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">Switch Session & RLS Mode</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Test Supabase Row Level Security boundaries
                </div>
              </div>

              <div className="mt-2 space-y-1">
                {/* Admin Mode */}
                <button
                  onClick={() => {
                    db.setRole('admin');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between rounded p-2 text-left text-xs transition-colors ${
                    isAdmin ? 'bg-purple-50 text-purple-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <div>
                      <div>Administrator</div>
                      <div className="text-[10px] text-slate-500">TransLogix Shipping HQ (All Access)</div>
                    </div>
                  </div>
                  {isAdmin && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
                </button>

                {/* Client Mode 1: Apex Textile */}
                <button
                  onClick={() => {
                    db.setRole('user', 'b2222222-2222-2222-2222-222222222222');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between rounded p-2 text-left text-xs transition-colors ${
                    !isAdmin && currentProfile.company_id === 'b2222222-2222-2222-2222-222222222222'
                      ? 'bg-emerald-50 text-emerald-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div>Hamza Qureshi</div>
                      <div className="text-[10px] text-slate-500">Apex Textile Mills Ltd (Restricted)</div>
                    </div>
                  </div>
                  {!isAdmin && currentProfile.company_id === 'b2222222-2222-2222-2222-222222222222' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </button>

                {/* Client Mode 2: Pacific Gateway */}
                <button
                  onClick={() => {
                    db.setRole('user', 'b3333333-3333-3333-3333-333333333333');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between rounded p-2 text-left text-xs transition-colors ${
                    !isAdmin && currentProfile.company_id === 'b3333333-3333-3333-3333-333333333333'
                      ? 'bg-emerald-50 text-emerald-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div>David Miller</div>
                      <div className="text-[10px] text-slate-500">Pacific Gateway Imports (Restricted)</div>
                    </div>
                  </div>
                  {!isAdmin && currentProfile.company_id === 'b3333333-3333-3333-3333-333333333333' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                Enforces PostgreSQL Row Level Security: regular users cannot edit statuses, delete shipments, or view other companies' cargo.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
