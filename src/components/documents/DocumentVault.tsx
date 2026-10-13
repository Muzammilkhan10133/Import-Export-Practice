import React, { useState } from 'react';
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Database,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { db } from '../../lib/database-service';

interface DocumentVaultProps {
  onSelectShipment?: (shipmentId: string) => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ onSelectShipment }) => {
  const isAdmin = db.isAdmin();
  const documents = db.getDocuments();
  const shipments = db.getShipments();

  const [bucket, setBucket] = useState<'shipment-documents' | 'company-assets'>('shipment-documents');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadShipmentId, setUploadShipmentId] = useState(shipments[0]?.id || '');
  const [uploadDocType, setUploadDocType] = useState('Bill of Lading');
  const [uploadFileName, setUploadFileName] = useState('');

  const filteredDocs = documents.filter((doc) => {
    if (docTypeFilter !== 'all' && doc.document_type !== docTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.file_name.toLowerCase().includes(q) ||
        doc.document_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;

    await db.uploadDocument({
      shipment_id: uploadShipmentId,
      document_type: uploadDocType,
      file_name: uploadFileName.endsWith('.pdf') ? uploadFileName : `${uploadFileName}.pdf`,
      file_size: Math.floor(200000 + Math.random() * 500000),
    });

    setShowUploadModal(false);
    setUploadFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Document Storage Vault</h1>
            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Supabase Storage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Decoupled file storage in PostgreSQL-governed cloud buckets with Row Level Security
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Upload className="h-4 w-4 text-emerald-400" />
            <span>Upload to Storage</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Upload Restricted to Logistics Admins</span>
          </div>
        )}
      </div>

      {/* Bucket Selector & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {/* Bucket Segments */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setBucket('shipment-documents')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              bucket === 'shipment-documents'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            bucket: shipment-documents ({documents.length})
          </button>
          <button
            onClick={() => setBucket('company-assets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              bucket === 'company-assets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            bucket: company-assets (Logos & Seals)
          </button>
        </div>

        {/* Filter by Type & Search */}
        <div className="flex items-center gap-2">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Document Types</option>
            <option value="Bill of Lading">Bill of Lading</option>
            <option value="Commercial Invoice">Commercial Invoice</option>
            <option value="Packing List">Packing List</option>
            <option value="Certificate of Origin">Certificate of Origin</option>
            <option value="Customs Declaration">Customs Declaration</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-48 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {bucket === 'company-assets' ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">Company Assets Bucket (Public)</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Contains organization branding assets, logos, and authorized digital customs stamps.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs font-mono text-slate-600">
            <span className="p-2 border border-slate-100 rounded bg-slate-50">apex_mills_logo.svg</span>
            <span className="p-2 border border-slate-100 rounded bg-slate-50">translogix_stamp.png</span>
            <span className="p-2 border border-slate-100 rounded bg-slate-50">pacific_gateway_seal.svg</span>
          </div>
        </div>
      ) : (
        /* Shipment Documents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const linkedShipment = shipments.find((s) => s.id === doc.shipment_id);
            return (
              <div
                key={doc.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="font-bold text-xs text-slate-900 line-clamp-1" title={doc.file_name}>
                      {doc.file_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {doc.document_type}
                    </div>
                  </div>

                  {/* Linked Shipment */}
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">Shipment:</span>
                    {linkedShipment ? (
                      <button
                        onClick={() => onSelectShipment && onSelectShipment(linkedShipment.id)}
                        className="font-mono text-emerald-700 font-semibold hover:underline"
                      >
                        {linkedShipment.tracking_number}
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono">Consignment</span>
                    )}
                  </div>
                </div>

                {/* Storage Path & Download */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[170px]" title={doc.storage_path}>
                    {doc.storage_path}
                  </span>
                  <button
                    onClick={() => alert(`Simulated Supabase Storage download for: ${doc.storage_path}`)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
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

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Linked Shipment</label>
                <select
                  value={uploadShipmentId}
                  onChange={(e) => setUploadShipmentId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tracking_number} ({s.origin_city} → {s.destination_city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  <option value="Bill of Lading">Bill of Lading (B/L)</option>
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Packing List">Packing List</option>
                  <option value="Certificate of Origin">Certificate of Origin</option>
                  <option value="Customs Declaration">Customs Declaration (GD)</option>
                  <option value="Insurance Policy">Insurance Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bill_of_Lading_PK_4021.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
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
                  Upload & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
