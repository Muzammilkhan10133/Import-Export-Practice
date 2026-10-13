import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Package,
  Ship,
  Plane,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../lib/database-service';
import { ShipmentType, TransportMode } from '../../types/database.types';

interface NewShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newShipmentId: string) => void;
}

export const NewShipmentModal: React.FC<NewShipmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const companies = db.getCompanies();
  const countries = db.getCountries();
  const ports = db.getPorts();
  const airports = db.getAirports();
  const products = db.getProducts();

  const [shipmentType, setShipmentType] = useState<ShipmentType>('export');
  const [transportMode, setTransportMode] = useState<TransportMode>('sea');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [exporterId, setExporterId] = useState(companies[1]?.id || '');
  const [importerId, setImporterId] = useState(companies[2]?.id || '');

  // Origin
  const [originCountryId, setOriginCountryId] = useState(countries[0]?.id || '');
  const [originCity, setOriginCity] = useState('Karachi');
  const [originPortId, setOriginPortId] = useState(ports[0]?.id || '');
  const [originAirportId, setOriginAirportId] = useState('');

  // Destination
  const [destCountryId, setDestCountryId] = useState(countries[1]?.id || '');
  const [destCity, setDestCity] = useState('Los Angeles');
  const [destPortId, setDestPortId] = useState(ports[2]?.id || '');
  const [destAirportId, setDestAirportId] = useState('');

  // Dates & Costs
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('USD');
  const [freightCost, setFreightCost] = useState(3800);
  const [customsCost, setCustomsCost] = useState(1200);
  const [otherCost, setOtherCost] = useState(400);

  // Cargo Items
  const [items, setItems] = useState([
    {
      product_name: products[0]?.product_name || 'Combed Cotton Yarn',
      hs_code: products[0]?.hs_code || '5205.23.00',
      description: 'Standard export packaging',
      quantity: 15000,
      unit: 'KG',
      weight: 15600,
      volume: 32.5,
      unit_price: 3.85,
    },
  ]);

  // Containers
  const [containers, setContainers] = useState([
    {
      container_number: `MSCU${Math.floor(1000000 + Math.random() * 9000000)}`,
      container_type: '40HC',
      seal_number: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
      gross_weight: 15600,
      net_weight: 15000,
    },
  ]);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const trackingNumberPreview = shipmentType === 'export' ? `PK-EXP-${currentYear}-XXXXXX` : `PK-IMP-${currentYear}-XXXXXX`;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_name: 'Selected Cargo Item',
        hs_code: '8400.00.00',
        description: 'Export item specification',
        quantity: 500,
        unit: 'PCS',
        weight: 1000,
        volume: 2.5,
        unit_price: 50,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleAddContainer = () => {
    setContainers([
      ...containers,
      {
        container_number: `TGHU${Math.floor(1000000 + Math.random() * 9000000)}`,
        container_type: '40HC',
        seal_number: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
        gross_weight: 12000,
        net_weight: 10000,
      },
    ]);
  };

  const handleRemoveContainer = (index: number) => {
    setContainers(containers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const created = await db.createShipment({
      shipment_type: shipmentType,
      reference_number: referenceNumber || undefined,
      exporter_id: exporterId,
      importer_id: importerId,
      origin_country_id: originCountryId,
      origin_city: originCity,
      origin_port_id: transportMode === 'sea' ? originPortId : undefined,
      origin_airport_id: transportMode === 'air' ? originAirportId : undefined,
      destination_country_id: destCountryId,
      destination_city: destCity,
      destination_port_id: transportMode === 'sea' ? destPortId : undefined,
      destination_airport_id: transportMode === 'air' ? destAirportId : undefined,
      transport_mode: transportMode,
      shipment_date: shipmentDate,
      expected_delivery_date: expectedDate,
      currency,
      freight_cost: Number(freightCost),
      customs_cost: Number(customsCost),
      other_cost: Number(otherCost),
      items,
      containers,
    });

    onSuccess(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Book New Consignment</h2>
              <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Preview: {trackingNumberPreview}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique tracking number will be atomically generated by PostgreSQL sequence
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Consignment Classification */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              1. Consignment Classification & Parties
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Shipment Type</label>
                <select
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value as ShipmentType)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  <option value="export">Export (PK-EXP)</option>
                  <option value="import">Import (PK-IMP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Transport Mode</label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  <option value="sea">Maritime (Sea Freight)</option>
                  <option value="air">Air Cargo</option>
                  <option value="road">Road Freight</option>
                  <option value="rail">Rail Transport</option>
                  <option value="multimodal">Multimodal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Customer Ref / LC / PO</label>
                <input
                  type="text"
                  placeholder="e.g. PO-USA-2026-9021"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div className="md:col-span-1.5">
                <label className="block text-xs font-semibold text-slate-700">Exporter Company</label>
                <select
                  value={exporterId}
                  onChange={(e) => setExporterId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1.5">
                <label className="block text-xs font-semibold text-slate-700">Importer / Consignee</label>
                <select
                  value={importerId}
                  onChange={(e) => setImporterId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Origin & Destination Routing */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              2. Routing & Logistics Corridor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
              {/* Origin */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Origin (Departure)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Origin Country</label>
                  <select
                    value={originCountryId}
                    onChange={(e) => setOriginCountryId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.country_name} ({c.country_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">City</label>
                    <input
                      type="text"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Port / Terminal</label>
                    <select
                      value={originPortId}
                      onChange={(e) => setOriginPortId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                    >
                      {ports.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.port_code} - {p.port_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Destination (Arrival)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Destination Country</label>
                  <select
                    value={destCountryId}
                    onChange={(e) => setDestCountryId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.country_name} ({c.country_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">City</label>
                    <input
                      type="text"
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Destination Port</label>
                    <select
                      value={destPortId}
                      onChange={(e) => setDestPortId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
                    >
                      {ports.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.port_code} - {p.port_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cargo Manifest & Items */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Cargo Manifest (HS Codes & Valuation)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-emerald-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs items-center"
                >
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-500 font-medium">Product Name</label>
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].product_name = e.target.value;
                        setItems(newItems);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">HS Tariff Code</label>
                    <input
                      type="text"
                      value={item.hs_code}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].hs_code = e.target.value;
                        setItems(newItems);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Qty & Unit</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].quantity = Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].unit = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-14 rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].unit_price = Number(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3">
                    <span className="font-mono font-bold text-slate-900">
                      ${(item.quantity * item.unit_price).toLocaleString()}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Shipping Containers */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Assigned Shipping Containers
              </h3>
              <button
                type="button"
                onClick={handleAddContainer}
                className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-emerald-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Container</span>
              </button>
            </div>

            <div className="space-y-2">
              {containers.map((cont, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs items-center"
                >
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Container #</label>
                    <input
                      type="text"
                      value={cont.container_number}
                      onChange={(e) => {
                        const newC = [...containers];
                        newC[idx].container_number = e.target.value;
                        setContainers(newC);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Type</label>
                    <select
                      value={cont.container_type}
                      onChange={(e) => {
                        const newC = [...containers];
                        newC[idx].container_type = e.target.value;
                        setContainers(newC);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs focus:outline-hidden"
                    >
                      <option value="20GP">20GP Standard</option>
                      <option value="40GP">40GP Standard</option>
                      <option value="40HC">40HC High Cube</option>
                      <option value="20RF">20RF Reefer</option>
                      <option value="45HC">45HC Super</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Seal Number</label>
                    <input
                      type="text"
                      value={cont.seal_number}
                      onChange={(e) => {
                        const newC = [...containers];
                        newC[idx].seal_number = e.target.value;
                        setContainers(newC);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Gross Weight (kg)</label>
                    <input
                      type="number"
                      value={cont.gross_weight}
                      onChange={(e) => {
                        const newC = [...containers];
                        newC[idx].gross_weight = Number(e.target.value);
                        setContainers(newC);
                      }}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveContainer(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Dates, Currency & Charges */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              5. Dates & Financial Charges
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Shipment Date</label>
                <input
                  type="date"
                  value={shipmentDate}
                  onChange={(e) => setShipmentDate(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white p-2 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Expected Arrival</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white p-2 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Freight Cost ($)</label>
                <input
                  type="number"
                  value={freightCost}
                  onChange={(e) => setFreightCost(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 bg-white p-2 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Customs Cost ($)</label>
                <input
                  type="number"
                  value={customsCost}
                  onChange={(e) => setCustomsCost(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 bg-white p-2 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white p-2 text-xs focus:outline-hidden font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="text-xs text-slate-500">
            Will automatically generate commercial invoice and initial customs declaration record.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              Confirm & Book Shipment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
