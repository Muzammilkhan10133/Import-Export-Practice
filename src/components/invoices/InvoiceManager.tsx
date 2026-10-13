import React, { useState } from 'react';
import { Receipt, DollarSign, Printer, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/database-service';
import { Invoice } from '../../types/database.types';

interface InvoiceManagerProps {
  onSelectShipment?: (shipmentId: string) => void;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({ onSelectShipment }) => {
  const invoices = db.getInvoices();
  const shipments = db.getShipments();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalInvoicedUSD = invoices.reduce((acc, inv) => {
    // Basic approx normalization for display
    const rate = inv.currency === 'EUR' ? 1.08 : inv.currency === 'PKR' ? 1 / 278 : 1;
    return acc + Number(inv.total) * rate;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Commercial Invoices & Freight Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated billing calculations including ocean/air freight, customs tariffs, and terminal handling charges
          </p>
        </div>

        <div className="rounded-lg bg-slate-900 px-4 py-2 text-white shadow-xs">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Total Billed Volume
          </div>
          <div className="font-mono text-base font-bold text-emerald-400">
            ${totalInvoicedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-3">Linked Consignment</th>
                <th className="py-3 px-3">Billing Date</th>
                <th className="py-3 px-3">Cargo Subtotal</th>
                <th className="py-3 px-3">Freight & Customs</th>
                <th className="py-3 px-3">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const s = shipments.find((ship) => ship.id === inv.shipment_id);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
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
                        <span className="text-slate-400 font-mono">Shipment</span>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {s?.origin_city} → {s?.destination_city}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {inv.invoice_date}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-800">
                      {inv.currency} {inv.subtotal.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      Freight: +${inv.freight} · Customs: +${inv.customs + inv.other_charges}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                      {inv.currency} {inv.total.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <FileText className="h-3 w-3" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  TransLogix Commercial Invoice
                </div>
                <div className="font-mono text-lg font-extrabold text-slate-900">
                  {selectedInvoice.invoice_number}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="font-medium text-slate-400 text-[11px]">Issue Date:</span>
                  <div className="font-mono font-semibold text-slate-800">{selectedInvoice.invoice_date}</div>
                </div>
                <div>
                  <span className="font-medium text-slate-400 text-[11px]">Payment Terms:</span>
                  <div className="font-semibold text-slate-800">Letter of Credit (L/C at Sight) / Wire</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Amount ({selectedInvoice.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-2 px-3">Declared Cargo Value Subtotal</td>
                      <td className="py-2 px-3 text-right">{selectedInvoice.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Ocean / Air Carrier Freight Charges</td>
                      <td className="py-2 px-3 text-right">{selectedInvoice.freight.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Customs Examination & Duty Surcharges</td>
                      <td className="py-2 px-3 text-right">{selectedInvoice.customs.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Port Terminal & Wharfage Fees</td>
                      <td className="py-2 px-3 text-right">{selectedInvoice.other_charges.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-900 text-sm">
                      <td className="py-2.5 px-3">Total Payable</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">
                        {selectedInvoice.currency} {selectedInvoice.total.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
