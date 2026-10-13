-- ==============================================================================
-- TransLogix Import/Export Logistics ERP - Row Level Security (RLS)
-- Migration: 002_row_level_security.sql
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Helper Security Functions
-- Security definer functions avoid recursive RLS issues and provide high-speed role checks.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Enable RLS on ALL Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. PROFILES POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid() OR public.is_admin()
    )
    WITH CHECK (
        -- Regular users cannot promote themselves to admin
        (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 4. REFERENCE DATA (Countries, Ports, Airports, Products, Exchange Rates)
-- Read-only for authenticated users, full CRUD for Admins
-- ==============================================================================

-- Countries
DROP POLICY IF EXISTS "countries_read" ON public.countries;
CREATE POLICY "countries_read" ON public.countries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "countries_admin_manage" ON public.countries;
CREATE POLICY "countries_admin_manage" ON public.countries FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Ports
DROP POLICY IF EXISTS "ports_read" ON public.ports;
CREATE POLICY "ports_read" ON public.ports FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ports_admin_manage" ON public.ports;
CREATE POLICY "ports_admin_manage" ON public.ports FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Airports
DROP POLICY IF EXISTS "airports_read" ON public.airports;
CREATE POLICY "airports_read" ON public.airports FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "airports_admin_manage" ON public.airports;
CREATE POLICY "airports_admin_manage" ON public.airports FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Products Catalog
DROP POLICY IF EXISTS "products_read" ON public.products;
CREATE POLICY "products_read" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "products_admin_manage" ON public.products;
CREATE POLICY "products_admin_manage" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Exchange Rates (Historical reference)
DROP POLICY IF EXISTS "exchange_rates_read" ON public.exchange_rates;
CREATE POLICY "exchange_rates_read" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "exchange_rates_admin_manage" ON public.exchange_rates;
CREATE POLICY "exchange_rates_admin_manage" ON public.exchange_rates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Companies
DROP POLICY IF EXISTS "companies_read_policy" ON public.companies;
CREATE POLICY "companies_read_policy" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id = public.get_user_company_id() OR public.is_admin()
    );

DROP POLICY IF EXISTS "companies_admin_manage" ON public.companies;
CREATE POLICY "companies_admin_manage" ON public.companies
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. SHIPMENTS POLICIES
-- Admin: full access
-- Customer: SELECT only for their company as exporter or importer
-- ==============================================================================
DROP POLICY IF EXISTS "shipments_select_policy" ON public.shipments;
CREATE POLICY "shipments_select_policy" ON public.shipments
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        exporter_id = public.get_user_company_id() OR
        importer_id = public.get_user_company_id()
    );

DROP POLICY IF EXISTS "shipments_admin_insert" ON public.shipments;
CREATE POLICY "shipments_admin_insert" ON public.shipments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "shipments_admin_update" ON public.shipments;
CREATE POLICY "shipments_admin_update" ON public.shipments
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "shipments_admin_delete" ON public.shipments;
CREATE POLICY "shipments_admin_delete" ON public.shipments
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 6. SHIPMENT ITEMS & CONTAINERS POLICIES
-- Linked to shipment permissions
-- ==============================================================================
DROP POLICY IF EXISTS "shipment_items_select" ON public.shipment_items;
CREATE POLICY "shipment_items_select" ON public.shipment_items
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = shipment_items.shipment_id
            AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
        )
    );

DROP POLICY IF EXISTS "shipment_items_admin_manage" ON public.shipment_items;
CREATE POLICY "shipment_items_admin_manage" ON public.shipment_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "containers_select" ON public.containers;
CREATE POLICY "containers_select" ON public.containers
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = containers.shipment_id
            AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
        )
    );

DROP POLICY IF EXISTS "containers_admin_manage" ON public.containers;
CREATE POLICY "containers_admin_manage" ON public.containers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. TRACKING EVENTS POLICIES
-- Customers can only read events for their shipments.
-- Only Admins can insert tracking events. Never modify or overwrite historical records.
-- ==============================================================================
DROP POLICY IF EXISTS "tracking_events_select" ON public.tracking_events;
CREATE POLICY "tracking_events_select" ON public.tracking_events
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = tracking_events.shipment_id
            AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
        )
    );

DROP POLICY IF EXISTS "tracking_events_admin_insert" ON public.tracking_events;
CREATE POLICY "tracking_events_admin_insert" ON public.tracking_events
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- Tracking history is immutable: no updates or deletes permitted even by default
DROP POLICY IF EXISTS "tracking_events_admin_delete" ON public.tracking_events;
CREATE POLICY "tracking_events_admin_delete" ON public.tracking_events
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 8. DOCUMENTS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = documents.shipment_id
            AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
        )
    );

DROP POLICY IF EXISTS "documents_admin_manage" ON public.documents;
CREATE POLICY "documents_admin_manage" ON public.documents
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 9. INVOICES & CUSTOMS POLICIES
-- Customers can view their invoices and customs clearances.
-- Admin can perform all management actions.
-- ==============================================================================
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = invoices.shipment_id
            AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
        )
    );

DROP POLICY IF EXISTS "invoices_admin_manage" ON public.invoices;
CREATE POLICY "invoices_admin_manage" ON public.invoices
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customs_select" ON public.customs;
CREATE POLICY "customs_select" ON public.customs
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = customs.shipment_id
            AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
        )
    );

DROP POLICY IF EXISTS "customs_admin_manage" ON public.customs;
CREATE POLICY "customs_admin_manage" ON public.customs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 10. NOTIFICATIONS POLICIES
-- Users only see their own notifications.
-- ==============================================================================
DROP POLICY IF EXISTS "notifications_user_own" ON public.notifications;
CREATE POLICY "notifications_user_own" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_user_update" ON public.notifications;
CREATE POLICY "notifications_user_update" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_admin_manage" ON public.notifications;
CREATE POLICY "notifications_admin_manage" ON public.notifications
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 11. AUDIT LOGS POLICIES
-- Admin only! Customers CANNOT see audit logs.
-- ==============================================================================
DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
