import React, { useState } from 'react';
import {
  ArrowLeft,
  Ship,
  Plane,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Boxes,
  ShieldCheck,
  Receipt,
  Clock,
  Plus,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Anchor,
  Compass,
} from 'lucide-react';
import { db } from '../../lib/database-service';
import { Shipment, TrackingEvent, Document as LogisticsDocument } from '../../types/database.types';

interface ShipmentDetailProps {
  shipmentId: string;
  onBack: () => void;
}

export const ShipmentDetail: React.FC<ShipmentDetailProps> = ({ shipmentId, onBack }) => {
  const isAdmin = db.isAdmin();
  const shipment = db.getShipmentById(shipmentId);

  const [activeTab, setActiveTab] = useState<'timeline' | 'items' | 'containers' | 'documents' | 'customs' | 'invoice'>('timeline');

  // Modal / form states for Admin status update
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('In Transit');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Upload document modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('Bill of Lading');
  const [docFileName, setDocFileName] = useState('');

  if (!shipment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900">Shipment Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">
          The requested shipment could not be found or you do not have permission to view it under Row Level Security.
        </p>
        <button
          onClick={onBack}
          className="mt-4 rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white"
        >
          Back to Shipments
        </button>
      </div>
    );
  }

  const events = db.getTrackingEvents(shipmentId);
  const items = db.getShipmentItems(shipmentId);
  const containers = db.getContainers(shipmentId);
  const documents = db.getDocuments(shipmentId);
  const invoices = db.getInvoices(shipmentId);
  const customsList = db.getCustoms(shipmentId);
  const customs = customsList[0];
  const invoice = invoices[0];

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    await db.updateShipmentStatus(
      shipmentId,
      newStatus,
      statusRemarks || `Updated to ${newStatus}`,
      statusLocation || `${shipment.origin_city} Port Yard`
    );

    setShowStatusModal(false);
    setStatusLocation('');
    setStatusRemarks('');
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName) return;

    await db.uploadDocument({
      shipment_id: shipmentId,
      document_type: docType,
      file_name: docFileName.endsWith('.pdf') ? docFileName : `${docFileName}.pdf`,
      file_size: Math.floor(150000 + Math.random() * 400000),
    });

    setShowUploadModal(false);
    setDocFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shipments</span>
        </button>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Update Status Milestone</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              Real-time updates enabled via Supabase
            </span>
          )}
        </div>
      </div>

      {/* Primary Shipment Header Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-extrabold text-slate-900">
                {shipment.tracking_number}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {shipment.shipment_type}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ref: {shipment.reference_number || 'N/A'}
              </span>
            </div>

            {/* Clean unboxed route text with typographic separators */}
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{shipment.origin_city}</span>
              <span>({shipment.origin_country?.country_name})</span>
              <span aria-hidden="true" className="text-slate-300">→</span>
              <span className="font-semibold text-slate-900">{shipment.destination_city}</span>
              <span>({shipment.destination_country?.country_name})</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="capitalize">{shipment.transport_mode} Freight</span>
            </div>
          </div>

          {/* Current Status Banner */}
          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200/80">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Milestone
              </div>
              <div className="text-sm font-bold text-slate-900">{shipment.current_status}</div>
            </div>
            <div className="h-8 w-1 bg-emerald-500 rounded-full" />
          </div>
        </div>

        {/* Header Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Exporter</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">{shipment.exporter?.company_name}</div>
            <div className="text-[11px] text-slate-500">{shipment.exporter?.contact_person}</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400">Importer / Consignee</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">{shipment.importer?.company_name}</div>
            <div className="text-[11px] text-slate-500">{shipment.importer?.contact_person}</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400">Est. Delivery Date</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">{shipment.expected_delivery_date}</div>
            <div className="text-[11px] text-slate-500">Shipped: {shipment.shipment_date}</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400">Total Declared Value</div>
            <div className="font-mono font-bold text-slate-900 mt-0.5">
              {shipment.currency} {Number(shipment.total_value).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Freight: +${shipment.freight_cost}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Functional Buttons) */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Tracking Timeline ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'items'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Cargo Items ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('containers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'containers'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Anchor className="h-4 w-4" />
          <span>Containers ({containers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Documents Vault ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customs')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'customs'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Customs Clearance</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'invoice'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Commercial Invoice</span>
        </button>
      </div>

      {/* Tab 1: Live Tracking Milestones Stepper & History */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Immutable Milestone Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every status change appends a permanent tracking record in Supabase PostgreSQL
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {events.length} Historical Events
              </span>
            </div>

            <div className="mt-6 relative pl-6 border-l-2 border-slate-200 space-y-8">
              {events.map((event, idx) => {
                const isLatest = idx === events.length - 1;
                return (
                  <div key={event.id} className="relative group">
                    {/* Stepper Dot */}
                    <div
                      className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                        isLatest
                          ? 'border-emerald-500 ring-4 ring-emerald-50'
                          : 'border-slate-400'
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          isLatest ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{event.status}</span>
                          {isLatest && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {new Date(event.event_date).toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{event.location_name}</span>
                        {event.city && <span className="text-slate-400">({event.city})</span>}
                      </div>

                      {event.remarks && (
                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100 leading-relaxed">
                          {event.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cargo Items & HS Codes */}
      {activeTab === 'items' && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Manifest Cargo Items ({items.length})
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Total Weight: {items.reduce((s, i) => s + Number(i.weight), 0).toLocaleString()} KG
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-3">HS Tariff Code</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Gross Weight</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total Cargo Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.product_name}</div>
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Origin: {item.country_of_origin}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">
                      {item.hs_code}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {item.weight.toLocaleString()} kg · {item.volume} CBM
                    </td>
                    <td className="py-3 px-3 font-mono">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Containers */}
      {activeTab === 'containers' && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Allocated Shipping Containers ({containers.length})
            </h3>
            <span className="text-xs font-mono text-slate-500">
              FCL Freight Manifest
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Container Number</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Security Seal</th>
                  <th className="py-2.5 px-3">Gross / Net Weight</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No dedicated shipping containers assigned (e.g. LCL / Air Cargo consignment).
                    </td>
                  </tr>
                ) : (
                  containers.map((cont) => (
                    <tr key={cont.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {cont.container_number}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {cont.container_type}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {cont.seal_number}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {cont.gross_weight.toLocaleString()} kg / {cont.net_weight.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{cont.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Documents (Supabase Storage) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Supabase Storage Vault</h3>
              <p className="text-xs text-slate-500">
                Files stored in bucket <code className="font-mono text-slate-800">shipment-documents</code>
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Document</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{doc.file_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{doc.document_type}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`#download-${doc.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Simulated Supabase Storage Download: Fetching ${doc.storage_path}`);
                  }}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Download from Storage"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Customs Clearance */}
      {activeTab === 'customs' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900">
                  {customs?.declaration_number || 'Pending Customs Filing'}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 uppercase">
                  {customs?.status || 'Draft'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {customs?.customs_office || 'Collectorate of Customs'}
              </div>
            </div>

            {isAdmin && customs && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => db.updateCustomsStatus(customs.id, 'Cleared', 'Approved by customs collector')}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Mark Cleared
                </button>
                <button
                  onClick={() => db.updateCustomsStatus(customs.id, 'Inspection', 'Physical examination required')}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Mark Inspection
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-medium text-slate-400">Declaration Date</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">{customs?.declaration_date || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Clearance Date</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">{customs?.clearance_date || 'Awaiting Out of Charge'}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Assessed Duty</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">${customs?.duty.toLocaleString() || '0.00'}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Import/Export Tax</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">${customs?.tax.toLocaleString() || '0.00'}</div>
            </div>
          </div>

          {customs?.remarks && (
            <div className="rounded-md bg-slate-50 p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Customs Officer Remarks: </span>
              {customs.remarks}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Commercial Invoice & Charges */}
      {activeTab === 'invoice' && invoice && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="font-mono text-base font-bold text-slate-900">{invoice.invoice_number}</div>
              <div className="text-xs text-slate-500 mt-0.5">Commercial Shipping Billing</div>
            </div>
            <button
              onClick={() => window.print()}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Print Invoice
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-medium text-slate-400">Cargo Subtotal</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">
                {invoice.currency} {invoice.subtotal.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Ocean/Air Freight</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">
                {invoice.currency} {invoice.freight.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Customs & Handling</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">
                {invoice.currency} {(invoice.customs + invoice.other_charges).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Total Invoice Amount</div>
              <div className="font-mono font-bold text-emerald-600 mt-0.5 text-sm">
                {invoice.currency} {invoice.total.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal (Admin Only) */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Update Tracking Milestone</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Appends a new event and updates the live shipment status in PostgreSQL
            </p>

            <form onSubmit={handleUpdateStatusSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Milestone Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  <option value="Order Booked">Order Booked</option>
                  <option value="Cargo Received at CFS">Cargo Received at CFS</option>
                  <option value="Export Customs Cleared">Export Customs Cleared</option>
                  <option value="Loaded on Vessel">Loaded on Vessel</option>
                  <option value="Vessel Departed">Vessel Departed</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Vessel Arrived at Destination">Vessel Arrived at Destination</option>
                  <option value="Customs Inspection">Customs Inspection</option>
                  <option value="Customs Cleared">Customs Cleared</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jebel Ali Port Berth 3 / Los Angeles CFS"
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Log Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Details of vessel voyage, customs stamp, or transshipment..."
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Record Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Upload to Supabase Storage</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bucket: <code className="font-mono text-slate-800">shipment-documents</code>
            </p>

            <form onSubmit={handleUploadDocumentSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  <option value="Bill of Lading">Bill of Lading (B/L)</option>
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Packing List">Packing List</option>
                  <option value="Certificate of Origin">Certificate of Origin (COO)</option>
                  <option value="Customs Declaration">Customs Declaration (GD)</option>
                  <option value="Insurance Certificate">Insurance Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bill_of_Lading_MSCU_99214.pdf"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Upload & Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
