import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { db } from '../../lib/database-service';
import { CustomsStatus } from '../../types/database.types';

interface CustomsManagementProps {
  onSelectShipment?: (shipmentId: string) => void;
}

export const CustomsManagement: React.FC<CustomsManagementProps> = ({ onSelectShipment }) => {
  const isAdmin = db.isAdmin();
  const customsRecords = db.getCustoms();
  const shipments = db.getShipments();

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRecords = customsRecords.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const totalAssessedDuty = customsRecords.reduce((sum, c) => sum + Number(c.duty) + Number(c.tax), 0);
  const clearedCount = customsRecords.filter((c) => c.status === 'Cleared').length;
  const pendingCount = customsRecords.filter((c) => c.status !== 'Cleared' && c.status !== 'Rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Customs Clearance & Tariff Assessment</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Goods Declaration (GD) management, HS tariff classification, and customs collectorate status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            {clearedCount} Cleared
          </span>
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            {pendingCount} Pending Assessment
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Customs Duty & Tax Assessed</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ${totalAssessedDuty.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Calculated across active declarations</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Inspection & Appraisal Queue</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {customsRecords.filter((c) => c.status === 'Inspection').length}
            </span>
            <span className="text-xs text-slate-400 font-mono">GDs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Physical yard & laboratory sampling</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Customs Clearance Rate</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              {customsRecords.length ? Math.round((clearedCount / customsRecords.length) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Out of Charge</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Green Channel compliance standard</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Declarations ({customsRecords.length})
        </button>
        <button
          onClick={() => setStatusFilter('Under Process')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            statusFilter === 'Under Process' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Under Process
        </button>
        <button
          onClick={() => setStatusFilter('Inspection')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            statusFilter === 'Inspection' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Inspection
        </button>
        <button
          onClick={() => setStatusFilter('Cleared')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            statusFilter === 'Cleared' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cleared
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Declaration # (GD)</th>
                <th className="py-3 px-3">Linked Shipment</th>
                <th className="py-3 px-3">Customs Collectorate</th>
                <th className="py-3 px-3">Filing Date</th>
                <th className="py-3 px-3">Assessed Duty / Tax</th>
                <th className="py-3 px-3">Clearance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((c) => {
                const s = shipments.find((ship) => ship.id === c.shipment_id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {c.declaration_number}
                    </td>
                    <td className="py-3 px-3">
                      {s ? (
                        <button
                          onClick={() => onSelectShipment && onSelectShipment(s.id)}
                          className="font-mono text-emerald-700 hover:underline font-semibold"
                        >
                          {s.tracking_number}
                        </button>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {s?.origin_city} → {s?.destination_city}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{c.customs_office}</div>
                      {c.remarks && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{c.remarks}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{c.declaration_date}</td>
                    <td className="py-3 px-3 font-mono">
                      <div className="font-semibold text-slate-900">
                        Duty: ${c.duty.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Tax: ${c.tax.toLocaleString()} · Other: ${c.other_charges}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            c.status === 'Cleared'
                              ? 'bg-emerald-500'
                              : c.status === 'Inspection'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-900">{c.status}</span>
                      </div>
                      {c.clearance_date && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Out of charge: {c.clearance_date}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== 'Cleared' && (
                            <button
                              onClick={() => db.updateCustomsStatus(c.id, 'Cleared', 'Approved')}
                              className="rounded bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                            >
                              Clear
                            </button>
                          )}
                          {c.status !== 'Inspection' && (
                            <button
                              onClick={() => db.updateCustomsStatus(c.id, 'Inspection', 'Lab sample required')}
                              className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Read-Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
