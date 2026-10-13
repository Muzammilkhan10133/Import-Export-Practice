import React, { useState } from 'react';
import {
  Package,
  Plus,
  Ship,
  Plane,
  Truck,
  Train,
  Layers,
  ArrowRight,
  Filter,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../lib/database-service';
import { Shipment, TransportMode, ShipmentType } from '../../types/database.types';

interface ShipmentListProps {
  onSelectShipment: (id: string) => void;
  onOpenNewShipmentModal: () => void;
}

export const ShipmentList: React.FC<ShipmentListProps> = ({
  onSelectShipment,
  onOpenNewShipmentModal,
}) => {
  const isAdmin = db.isAdmin();
  const shipments = db.getShipments();

  const [typeFilter, setTypeFilter] = useState<'all' | 'export' | 'import'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Metrics
  const totalValue = shipments.reduce((sum, s) => sum + Number(s.total_value), 0);
  const inTransitCount = shipments.filter((s) => s.current_status.toLowerCase().includes('transit') || s.current_status.toLowerCase().includes('vessel')).length;
  const customsCount = shipments.filter((s) => s.current_status.toLowerCase().includes('customs')).length;
  const deliveredCount = shipments.filter((s) => s.current_status.toLowerCase().includes('delivered')).length;

  // Filtering
  const filteredShipments = shipments.filter((s) => {
    if (typeFilter !== 'all' && s.shipment_type !== typeFilter) return false;
    if (modeFilter !== 'all' && s.transport_mode !== modeFilter) return false;
    if (statusFilter !== 'all' && s.current_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = s.tracking_number.toLowerCase().includes(q);
      const matchRef = s.reference_number?.toLowerCase().includes(q);
      const matchOrigin = s.origin_city.toLowerCase().includes(q);
      const matchDest = s.destination_city.toLowerCase().includes(q);
      const matchExporter = s.exporter?.company_name.toLowerCase().includes(q);
      const matchImporter = s.importer?.company_name.toLowerCase().includes(q);
      if (!matchTrack && !matchRef && !matchOrigin && !matchDest && !matchExporter && !matchImporter) {
        return false;
      }
    }
    return true;
  });

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'sea':
        return (
          <span title="Maritime Freight">
            <Ship className="h-4 w-4 text-blue-600" />
          </span>
        );
      case 'air':
        return (
          <span title="Air Cargo">
            <Plane className="h-4 w-4 text-sky-500" />
          </span>
        );
      case 'road':
        return (
          <span title="Road Freight">
            <Truck className="h-4 w-4 text-amber-600" />
          </span>
        );
      case 'rail':
        return (
          <span title="Rail Freight">
            <Train className="h-4 w-4 text-emerald-600" />
          </span>
        );
      default:
        return (
          <span title="Multimodal">
            <Layers className="h-4 w-4 text-purple-600" />
          </span>
        );
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string, trackNo: string) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert('RLS Policy Restriction: Only administrators can delete shipments.');
      return;
    }
    if (confirm(`Are you sure you want to delete shipment ${trackNo}? This will cascade delete its items, containers, and documents.`)) {
      db.deleteShipment(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Shipment Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Shipment Operations & Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking ledger powered by Supabase PostgreSQL sequence generator
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <button
              onClick={onOpenNewShipmentModal}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>New Shipment</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-md">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Customer View (Read-Only via RLS)</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Shipments</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{shipments.length}</span>
            <span className="text-xs text-slate-400 font-mono">Consignments</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {shipments.filter((s) => s.shipment_type === 'export').length} Exports · {shipments.filter((s) => s.shipment_type === 'import').length} Imports
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">In Transit & Sea</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{inTransitCount}</span>
            <span className="text-xs text-slate-400 font-mono">On Vessels / Flight</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">En route to destination</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Customs Clearance</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{customsCount}</span>
            <span className="text-xs text-slate-400 font-mono">Under Process</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">GD documentation / inspection</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Cargo Value</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ${(totalValue / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-400 font-mono">USD Approx</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">Insured export cargo</div>
        </div>
      </div>

      {/* Filter Toolbar (Segmented Controls) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {/* Type Segments */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Types ({shipments.length})
          </button>
          <button
            onClick={() => setTypeFilter('export')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'export' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Export (PK-EXP)
          </button>
          <button
            onClick={() => setTypeFilter('import')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'import' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import (PK-IMP)
          </button>
        </div>

        {/* Transport Mode & Search */}
        <div className="flex items-center gap-2">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Transport Modes</option>
            <option value="sea">Maritime (Sea)</option>
            <option value="air">Air Cargo</option>
            <option value="road">Road Freight</option>
            <option value="rail">Rail Transport</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by ref, company, port..."
            className="w-48 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Tracking Number</th>
                <th className="py-3 px-3">Type & Mode</th>
                <th className="py-3 px-3">Exporter / Importer</th>
                <th className="py-3 px-3">Origin → Destination</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-3">Cargo Value</th>
                <th className="py-3 px-3">Est. Delivery</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No shipments found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    onClick={() => onSelectShipment(shipment.id)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Tracking Number */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {shipment.tracking_number}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Ref: {shipment.reference_number || 'N/A'}
                      </div>
                    </td>

                    {/* Type & Mode */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {getTransportIcon(shipment.transport_mode)}
                        <span className="font-semibold uppercase tracking-wide text-[11px] text-slate-700">
                          {shipment.shipment_type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {shipment.transport_mode} Freight
                      </div>
                    </td>

                    {/* Exporter / Importer */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-medium text-slate-900 truncate" title={shipment.exporter?.company_name}>
                        {shipment.exporter?.company_name || 'Exporter N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate" title={shipment.importer?.company_name}>
                        ↳ {shipment.importer?.company_name || 'Importer N/A'}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                        <span>{shipment.origin_city}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span>{shipment.destination_city}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {shipment.origin_port?.port_code || shipment.origin_airport?.airport_code || 'Port'} →{' '}
                        {shipment.destination_port?.port_code || shipment.destination_airport?.airport_code || 'Port'}
                      </div>
                    </td>

                    {/* Current Status (Zero-Pill Discipline: unboxed clean text with status indicator dot) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            shipment.current_status.toLowerCase().includes('delivered')
                              ? 'bg-emerald-500'
                              : shipment.current_status.toLowerCase().includes('customs')
                              ? 'bg-amber-500'
                              : shipment.current_status.toLowerCase().includes('transit') || shipment.current_status.toLowerCase().includes('vessel')
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className="font-medium text-slate-800">{shipment.current_status}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Updated {new Date(shipment.updated_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Cargo Value */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-900">
                        {shipment.currency} {Number(shipment.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Freight: +${shipment.freight_cost}
                      </div>
                    </td>

                    {/* Est Delivery */}
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {shipment.expected_delivery_date}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShipment(shipment.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="View Live Tracking & Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDelete(e, shipment.id, shipment.tracking_number)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete Shipment (Admin RLS)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
