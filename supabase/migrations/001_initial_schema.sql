-- ==============================================================================
-- TransLogix Import/Export Logistics ERP - Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean Existing Types if re-running
DO $$ BEGIN
    CREATE TYPE shipment_type_enum AS ENUM ('import', 'export');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transport_mode_enum AS ENUM ('sea', 'air', 'road', 'rail', 'multimodal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Countries Table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name VARCHAR(150) NOT NULL UNIQUE,
    country_code VARCHAR(3) NOT NULL UNIQUE, -- e.g. PAK, USA, CHN, DEU
    iso_code VARCHAR(2) NOT NULL UNIQUE,    -- e.g. PK, US, CN, DE
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    ntn VARCHAR(100), -- National Tax Number
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    contact_person VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Profiles Table (Extends auth.users)
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

-- 6. Ports (Sea / Dry Ports) Table
CREATE TABLE IF NOT EXISTS public.ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_name VARCHAR(150) NOT NULL,
    port_code VARCHAR(10) NOT NULL UNIQUE, -- e.g. PKBQM, USLAX, SGSIN
    city VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    port_type VARCHAR(50) NOT NULL DEFAULT 'seaport', -- seaport, dry_port, inland
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Airports Table
CREATE TABLE IF NOT EXISTS public.airports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_name VARCHAR(150) NOT NULL,
    airport_code VARCHAR(10) NOT NULL UNIQUE, -- e.g. KHI, LHE, JFK, DXB
    city VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Products Catalog
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    hs_code VARCHAR(20) NOT NULL, -- Harmonized System Tariff Code
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_unit VARCHAR(20) NOT NULL DEFAULT 'PCS', -- PCS, KG, MT, CBM, BOX
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Sequences for Database-Authoritative Tracking Numbers
CREATE SEQUENCE IF NOT EXISTS tracking_number_exp_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS tracking_number_imp_seq START WITH 1001;

-- PostgreSQL Function for Generating Atomic Unique Tracking Numbers
-- Format: PK-EXP-YYYY-000001 or PK-IMP-YYYY-000001
CREATE OR REPLACE FUNCTION generate_tracking_number(p_shipment_type shipment_type_enum)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_seq_val BIGINT;
    v_prefix TEXT;
    v_tracking_no TEXT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    IF p_shipment_type = 'export' THEN
        v_prefix := 'PK-EXP-' || v_year || '-';
        v_seq_val := nextval('tracking_number_exp_seq');
    ELSE
        v_prefix := 'PK-IMP-' || v_year || '-';
        v_seq_val := nextval('tracking_number_imp_seq');
    END IF;
    
    v_tracking_no := v_prefix || LPAD(v_seq_val::TEXT, 6, '0');
    RETURN v_tracking_no;
END;
$$ LANGUAGE plpgsql;

-- 10. Shipments Table
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

-- Trigger to auto-assign tracking number if omitted
CREATE OR REPLACE FUNCTION set_shipment_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
        NEW.tracking_number := generate_tracking_number(NEW.shipment_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_shipment_tracking_number ON public.shipments;
CREATE TRIGGER trigger_set_shipment_tracking_number
    BEFORE INSERT ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION set_shipment_tracking_number();

-- 11. Shipment Items (Cargo Manifest)
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    hs_code VARCHAR(20) NOT NULL,
    description TEXT,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    weight NUMERIC(12, 3) NOT NULL DEFAULT 0, -- Weight in kg
    volume NUMERIC(12, 3) NOT NULL DEFAULT 0, -- Volume in CBM
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    country_of_origin VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Containers Table
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    container_number VARCHAR(20) NOT NULL, -- e.g. MSCU1234567
    container_type VARCHAR(20) NOT NULL DEFAULT '40HC', -- 20GP, 40GP, 40HC, 45HC, 20RF
    seal_number VARCHAR(50) NOT NULL,
    gross_weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
    net_weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Loaded',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Tracking Events (Complete Immutable Audit of Milestones)
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

-- 14. Documents Table (Pointers to Supabase Storage)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- Commercial Invoice, Packing List, Bill of Lading, AWB, Certificate of Origin, Customs Declaration
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. Invoices Table
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

-- 16. Customs Table
CREATE TABLE IF NOT EXISTS public.customs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    declaration_number VARCHAR(100) NOT NULL UNIQUE, -- GD (Goods Declaration) Number
    customs_office VARCHAR(150) NOT NULL,
    declaration_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Under Process', -- Under Process, Inspection, Duty Paid, Cleared, Rejected
    duty NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    clearance_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, alert
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. Audit Logs Table (Immutable system auditing)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 19. Exchange Rates Table (Historical Currency Valuation)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    exchange_rate NUMERIC(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_exporter ON public.shipments(exporter_id);
CREATE INDEX IF NOT EXISTS idx_shipments_importer ON public.shipments(importer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(current_status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON public.tracking_events(shipment_id, event_date);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON public.shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_shipment ON public.documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_customs_shipment ON public.customs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shipment ON public.invoices(shipment_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates(from_currency, to_currency, effective_date);

-- Realtime publication configuration for Supabase Realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
