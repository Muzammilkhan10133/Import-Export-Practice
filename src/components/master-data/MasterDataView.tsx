import React, { useState } from 'react';
import {
  Anchor,
  Plane,
  Package,
  DollarSign,
  Building2,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../lib/database-service';

export const MasterDataView: React.FC = () => {
  const [subTab, setSubTab] = useState<'ports' | 'airports' | 'products' | 'companies' | 'rates'>('ports');

  const ports = db.getPorts();
  const airports = db.getAirports();
  const products = db.getProducts();
  const companies = db.getCompanies();
  const exchangeRates = db.getExchangeRates();
  const countries = db.getCountries();

  const getCountryName = (countryId: string) => {
    return countries.find((c) => c.id === countryId)?.country_name || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Master Data & Reference Catalogs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Global port registries, IATA airport codes, HS tariff product classifications, and currency exchange rates
        </p>
      </div>

      {/* Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit overflow-x-auto">
        <button
          onClick={() => setSubTab('ports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            subTab === 'ports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Anchor className="h-3.5 w-3.5" />
          <span>Sea Ports ({ports.length})</span>
        </button>

        <button
          onClick={() => setSubTab('airports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            subTab === 'airports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plane className="h-3.5 w-3.5" />
          <span>Airports ({airports.length})</span>
        </button>

        <button
          onClick={() => setSubTab('products')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            subTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Commodities & HS ({products.length})</span>
        </button>

        <button
          onClick={() => setSubTab('companies')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            subTab === 'companies' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Trade Partners ({companies.length})</span>
        </button>

        <button
          onClick={() => setSubTab('rates')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            subTab === 'rates' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Exchange Rates ({exchangeRates.length})</span>
        </button>
      </div>

      {/* SubTab 1: Ports */}
      {subTab === 'ports' && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Port Code</th>
                <th className="py-3 px-3">Port Name</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Country</th>
                <th className="py-3 px-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ports.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.port_code}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{p.port_name}</td>
                  <td className="py-3 px-3">{p.city}</td>
                  <td className="py-3 px-3">{getCountryName(p.country_id)}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-500">
                    {p.port_type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SubTab 2: Airports */}
      {subTab === 'airports' && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">IATA Code</th>
                <th className="py-3 px-3">Airport Name</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-4">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {airports.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.airport_code}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{a.airport_name}</td>
                  <td className="py-3 px-3">{a.city}</td>
                  <td className="py-3 px-4">{getCountryName(a.country_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SubTab 3: Products & HS Codes */}
      {subTab === 'products' && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">HS Tariff Code</th>
                <th className="py-3 px-3">Commodity / Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Default Unit</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{prod.hs_code}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{prod.product_name}</td>
                  <td className="py-3 px-3 text-slate-600">{prod.category}</td>
                  <td className="py-3 px-3 font-mono">{prod.default_unit}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{prod.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SubTab 4: Companies */}
      {subTab === 'companies' && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-3">NTN / Tax ID</th>
                <th className="py-3 px-3">City & Address</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-4">Email & Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{comp.company_name}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{comp.ntn || comp.registration_number}</td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{comp.city}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{comp.address}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{comp.contact_person}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{comp.email}</div>
                    <div className="text-[10px] font-mono text-slate-400">{comp.phone}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SubTab 5: Exchange Rates */}
      {subTab === 'rates' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historical Forex Exchange Rates</h3>
              <p className="text-xs text-slate-500">
                Rule enforced: Historical currency valuation rates are strictly append-only and never overwritten
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Effective Date: {exchangeRates[0]?.effective_date || 'Current'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {exchangeRates.map((xr) => (
              <div
                key={xr.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    {xr.from_currency} / {xr.to_currency}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Effective {xr.effective_date}
                  </div>
                </div>
                <div className="font-mono text-sm font-extrabold text-emerald-700">
                  {xr.exchange_rate.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
