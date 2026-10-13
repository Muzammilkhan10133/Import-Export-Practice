import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Key,
  Terminal,
  FileCode,
  FolderOpen,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { testSupabaseConnection, isConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase';

// Pre-read migration script contents for quick 1-click clipboard copying
const MIGRATION_001 = `-- ==============================================================================
-- TransLogix Import/Export Logistics ERP - Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- Database: Supabase PostgreSQL
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE shipment_type_enum AS ENUM ('import', 'export');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transport_mode_enum AS ENUM ('sea', 'air', 'road', 'rail', 'multimodal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Countries
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name VARCHAR(150) NOT NULL UNIQUE,
    country_code VARCHAR(3) NOT NULL UNIQUE,
    iso_code VARCHAR(2) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Companies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    ntn VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    contact_person VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    role user_role_enum NOT NULL DEFAULT 'user',
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Ports
CREATE TABLE IF NOT EXISTS public.ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_name VARCHAR(150) NOT NULL,
    port_code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    port_type VARCHAR(50) NOT NULL DEFAULT 'seaport',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Airports
CREATE TABLE IF NOT EXISTS public.airports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_name VARCHAR(150) NOT NULL,
    airport_code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Products Catalog
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    hs_code VARCHAR(20) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Sequences & Automatic Tracking Number Function
CREATE SEQUENCE IF NOT EXISTS tracking_number_exp_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS tracking_number_imp_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_tracking_number(p_shipment_type shipment_type_enum)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_seq_val BIGINT;
    v_prefix TEXT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    IF p_shipment_type = 'export' THEN
        v_prefix := 'PK-EXP-' || v_year || '-';
        v_seq_val := nextval('tracking_number_exp_seq');
    ELSE
        v_prefix := 'PK-IMP-' || v_year || '-';
        v_seq_val := nextval('tracking_number_imp_seq');
    END IF;
    RETURN v_prefix || LPAD(v_seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(50) NOT NULL UNIQUE,
    shipment_type shipment_type_enum NOT NULL,
    reference_number VARCHAR(100),
    exporter_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    importer_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    origin_country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    origin_city VARCHAR(100) NOT NULL,
    origin_port_id UUID REFERENCES public.ports(id) ON DELETE SET NULL,
    origin_airport_id UUID REFERENCES public.airports(id) ON DELETE SET NULL,
    destination_country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    destination_city VARCHAR(100) NOT NULL,
    destination_port_id UUID REFERENCES public.ports(id) ON DELETE SET NULL,
    destination_airport_id UUID REFERENCES public.airports(id) ON DELETE SET NULL,
    transport_mode transport_mode_enum NOT NULL DEFAULT 'sea',
    shipment_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    current_status VARCHAR(100) NOT NULL DEFAULT 'Draft',
    total_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    freight_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    customs_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    other_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Shipment Items
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    hs_code VARCHAR(20) NOT NULL,
    description TEXT,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
    volume NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    country_of_origin VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Containers Table
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    container_number VARCHAR(20) NOT NULL,
    container_type VARCHAR(20) NOT NULL DEFAULT '40HC',
    seal_number VARCHAR(50) NOT NULL,
    gross_weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
    net_weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Loaded',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Tracking Events
CREATE TABLE IF NOT EXISTS public.tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    city VARCHAR(100),
    port_id UUID REFERENCES public.ports(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    remarks TEXT,
    event_date TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    freight NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    customs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. Customs
CREATE TABLE IF NOT EXISTS public.customs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    declaration_number VARCHAR(100) NOT NULL UNIQUE,
    customs_office VARCHAR(150) NOT NULL,
    declaration_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Under Process',
    duty NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    clearance_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    exchange_rate NUMERIC(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);`;

export const SupabaseConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deployment' | 'migrations' | 'connection' | 'rls'>('deployment');

  // Connection form state
  const [urlInput, setUrlInput] = useState(SUPABASE_URL || '');
  const [keyInput, setKeyInput] = useState(SUPABASE_ANON_KEY || '');
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
  }>({
    tested: false,
    success: false,
    message: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const res = await testSupabaseConnection(urlInput, keyInput);
    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.connected,
      message: res.message,
      latencyMs: res.latencyMs,
    });
  };

  const handleSaveConnection = () => {
    localStorage.setItem('translogix_supabase_url', urlInput);
    localStorage.setItem('translogix_supabase_key', keyInput);
    alert('Supabase credentials stored in browser localStorage. Reloading client...');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Supabase Backend Architecture & Deployment
            </h1>
            <span className="font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              PostgreSQL 16
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Supabase exclusivity: PostgreSQL, Auth, Storage, RLS, and Realtime integration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'deployment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          12-Step Deployment Guide
        </button>

        <button
          onClick={() => setActiveTab('migrations')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'migrations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          SQL Migrations (Copy & Run)
        </button>

        <button
          onClick={() => setActiveTab('connection')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'connection' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Live Connection Config
        </button>

        <button
          onClick={() => setActiveTab('rls')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'rls' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          RLS Policy Matrix
        </button>
      </div>

      {/* TAB 1: 12-Step Deployment Guide */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Complete 12-Step Production Deployment Workflow
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Follow these exact instructions to spin up the full Supabase cloud stack (PostgreSQL, Storage, RLS, and Realtime) and connect this ERP.
            </p>

            <div className="space-y-4 pt-2">
              {/* Step 1 */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    1
                  </span>
                  <span>Create Supabase Project</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-7">
                  Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-medium">supabase.com</a>, create an organization, click <strong>"New Project"</strong>, set database password and region (e.g. Frankfurt or Singapore).
                </p>
              </div>

              {/* Step 2 & 3 */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    2
                  </span>
                  <span>Execute Database Migrations in SQL Editor</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-7">
                  In your Supabase project dashboard, navigate to <strong>SQL Editor</strong>, open a new query, and execute the migration files sequentially from the <em>SQL Migrations</em> tab:
                </p>
                <div className="mt-2 pl-7 flex flex-wrap gap-2 text-xs font-mono">
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded">1. 001_initial_schema.sql</span>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded">2. 002_row_level_security.sql</span>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded">3. 003_storage_setup.sql</span>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded">4. seed.sql</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    3
                  </span>
                  <span>Verify Supabase Storage Buckets</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-7">
                  Navigate to <strong>Storage</strong> in Supabase dashboard. Ensure two buckets are listed: <code className="font-mono bg-white px-1 border rounded">shipment-documents</code> (Private, 50MB) and <code className="font-mono bg-white px-1 border rounded">company-assets</code> (Public, 5MB).
                </p>
              </div>

              {/* Step 5 */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    4
                  </span>
                  <span>Verify Row Level Security (RLS)</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-7">
                  Go to <strong>Database → Tables</strong>. Confirm that all 16 tables show the green <strong>"RLS Enabled"</strong> shield badge.
                </p>
              </div>

              {/* Step 6 & 7 */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    5
                  </span>
                  <span>Obtain API Keys & Configure Environment</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-7">
                  Under <strong>Project Settings → API</strong>, copy the <em>Project URL</em> and <em>anon public key</em>. Add them to your local <code className="font-mono bg-white px-1 border rounded">.env</code> or configure them in the <em>Live Connection Config</em> tab.
                </p>
              </div>

              {/* Step 8 & 9 */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    6
                  </span>
                  <span>Version Control with GitHub</span>
                </div>
                <div className="mt-2 pl-7">
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-[11px] font-mono overflow-x-auto">
{`git init
git add .
git commit -m "feat: TransLogix Logistics ERP with Supabase backend"
git remote add origin https://github.com/YOUR_USERNAME/translogix-erp.git
git push -u origin main`}
                  </pre>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Reminder: GitHub is used strictly for source code and migrations; all live data resides in Supabase PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SQL Migrations */}
      {activeTab === 'migrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                001_initial_schema.sql (16 Tables, Enums & Sequences)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Copy and run this in your Supabase SQL Editor
              </p>
            </div>
            <button
              onClick={() => handleCopy(MIGRATION_001, '001')}
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {copiedKey === '001' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy SQL Query</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-900 p-4 text-slate-100 font-mono text-xs max-h-96 overflow-y-auto">
            <pre>{MIGRATION_001}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: Live Connection Config */}
      {activeTab === 'connection' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Connect to Your Live Supabase Cloud Project</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste your credentials from Supabase Dashboard &gt; Project Settings &gt; API
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyzabcdefg.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 p-2 text-xs font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Supabase Anon Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 p-2 text-xs font-mono focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                <span>Test Live Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConnection}
                className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Save & Connect
              </button>
            </div>

            {testResult.tested && (
              <div
                className={`p-3 rounded-md text-xs border ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  <span>{testResult.message}</span>
                </div>
                {testResult.latencyMs && (
                  <div className="text-[11px] mt-1 font-mono text-emerald-700">
                    Query Latency: {testResult.latencyMs} ms · PostgreSQL status OK
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RLS Matrix */}
      {activeTab === 'rls' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">PostgreSQL Row Level Security Enforcement Matrix</h3>
          <p className="text-xs text-slate-500">
            Enforced at the database engine level so no client-side spoofing can bypass permissions
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs text-slate-700 border border-slate-200 rounded">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                <tr>
                  <th className="p-3">Table Name</th>
                  <th className="p-3">Admin Permissions</th>
                  <th className="p-3">Customer User Permissions</th>
                  <th className="p-3">RLS Policy Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="p-3 font-bold text-slate-900">shipments</td>
                  <td className="p-3 text-emerald-700 font-semibold">SELECT, INSERT, UPDATE, DELETE</td>
                  <td className="p-3 text-slate-700">SELECT Only</td>
                  <td className="p-3 text-slate-500">exporter_id = user.company_id OR importer_id = user.company_id</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">tracking_events</td>
                  <td className="p-3 text-emerald-700 font-semibold">SELECT, INSERT</td>
                  <td className="p-3 text-slate-700">SELECT Only</td>
                  <td className="p-3 text-slate-500">Linked to authorized shipment</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">documents</td>
                  <td className="p-3 text-emerald-700 font-semibold">Full CRUD</td>
                  <td className="p-3 text-slate-700">SELECT authorized only</td>
                  <td className="p-3 text-slate-500">storage.objects folder matches shipment company</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">customs</td>
                  <td className="p-3 text-emerald-700 font-semibold">Full CRUD</td>
                  <td className="p-3 text-slate-700">SELECT declaration only</td>
                  <td className="p-3 text-slate-500">Cannot alter duties or clearance state</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">audit_logs</td>
                  <td className="p-3 text-purple-700 font-semibold">SELECT ALL</td>
                  <td className="p-3 text-rose-600 font-semibold">DENIED (0 rows)</td>
                  <td className="p-3 text-slate-500">is_admin() MUST return true</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
