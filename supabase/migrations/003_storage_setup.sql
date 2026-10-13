-- ==============================================================================
-- TransLogix Import/Export Logistics ERP - Supabase Storage Setup
-- Migration: 003_storage_setup.sql
-- Database: Supabase Storage Configuration
-- ==============================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'shipment-documents', 
        'shipment-documents', 
        false, 
        52428800, -- 50 MB limit
        ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/csv']
    ),
    (
        'company-assets', 
        'company-assets', 
        true, 
        5242880,  -- 5 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'shipment-documents'
-- Authenticated users can view documents belonging to their company shipments; Admins have full access.
DROP POLICY IF EXISTS "shipment_documents_read" ON storage.objects;
CREATE POLICY "shipment_documents_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'shipment-documents' AND (
            public.is_admin() OR
            -- Path format: {shipment_id}/{filename}
            EXISTS (
                SELECT 1 FROM public.shipments s
                WHERE s.id::text = (storage.foldername(name))[1]
                AND (s.exporter_id = public.get_user_company_id() OR s.importer_id = public.get_user_company_id())
            )
        )
    );

DROP POLICY IF EXISTS "shipment_documents_admin_insert" ON storage.objects;
CREATE POLICY "shipment_documents_admin_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'shipment-documents' AND public.is_admin()
    );

DROP POLICY IF EXISTS "shipment_documents_admin_delete" ON storage.objects;
CREATE POLICY "shipment_documents_admin_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'shipment-documents' AND public.is_admin()
    );

-- 3. Storage Policies for 'company-assets'
DROP POLICY IF EXISTS "company_assets_public_read" ON storage.objects;
CREATE POLICY "company_assets_public_read" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'company-assets');

DROP POLICY IF EXISTS "company_assets_admin_insert" ON storage.objects;
CREATE POLICY "company_assets_admin_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'company-assets' AND public.is_admin()
    );

DROP POLICY IF EXISTS "company_assets_admin_delete" ON storage.objects;
CREATE POLICY "company_assets_admin_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'company-assets' AND public.is_admin()
    );
