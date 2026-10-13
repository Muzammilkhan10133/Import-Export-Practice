-- ==============================================================================
-- TransLogix Import/Export Logistics ERP - Comprehensive Seed Data
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Insert Countries
INSERT INTO public.countries (id, country_name, country_code, iso_code)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Pakistan', 'PAK', 'PK'),
    ('c2222222-2222-2222-2222-222222222222', 'United States', 'USA', 'US'),
    ('c3333333-3333-3333-3333-333333333333', 'China', 'CHN', 'CN'),
    ('c4444444-4444-4444-4444-444444444444', 'United Arab Emirates', 'ARE', 'AE'),
    ('c5555555-5555-5555-5555-555555555555', 'Germany', 'DEU', 'DE'),
    ('c6666666-6666-6666-6666-666666666666', 'United Kingdom', 'GBR', 'GB')
ON CONFLICT (country_code) DO NOTHING;

-- 2. Insert Ports
INSERT INTO public.ports (id, port_name, port_code, city, country_id, port_type)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'Port Muhammad Bin Qasim', 'PKBQM', 'Karachi', 'c1111111-1111-1111-1111-111111111111', 'seaport'),
    ('p2222222-2222-2222-2222-222222222222', 'Karachi Port (KPT)', 'PKKHI', 'Karachi', 'c1111111-1111-1111-1111-111111111111', 'seaport'),
    ('p3333333-3333-3333-3333-333333333333', 'Port of Los Angeles', 'USLAX', 'Los Angeles', 'c2222222-2222-2222-2222-222222222222', 'seaport'),
    ('p4444444-4444-4444-4444-444444444444', 'Port of Shanghai', 'CNSHA', 'Shanghai', 'c3333333-3333-3333-3333-333333333333', 'seaport'),
    ('p5555555-5555-5555-5555-555555555555', 'Jebel Ali Port', 'AEJEA', 'Dubai', 'c4444444-4444-4444-4444-444444444444', 'seaport'),
    ('p6666666-6666-6666-6666-666666666666', 'Port of Hamburg', 'DEHAM', 'Hamburg', 'c5555555-5555-5555-5555-555555555555', 'seaport')
ON CONFLICT (port_code) DO NOTHING;

-- 3. Insert Airports
INSERT INTO public.airports (id, airport_name, airport_code, city, country_id)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Jinnah International Airport', 'KHI', 'Karachi', 'c1111111-1111-1111-1111-111111111111'),
    ('a2222222-2222-2222-2222-222222222222', 'Allama Iqbal International Airport', 'LHE', 'Lahore', 'c1111111-1111-1111-1111-111111111111'),
    ('a3333333-3333-3333-3333-333333333333', 'Los Angeles International Airport', 'LAX', 'Los Angeles', 'c2222222-2222-2222-2222-222222222222'),
    ('a4444444-4444-4444-4444-444444444444', 'Dubai International Airport', 'DXB', 'Dubai', 'c4444444-4444-4444-4444-444444444444'),
    ('a5555555-5555-5555-5555-555555555555', 'Frankfurt International Airport', 'FRA', 'Frankfurt', 'c5555555-5555-5555-5555-555555555555')
ON CONFLICT (airport_code) DO NOTHING;

-- 4. Insert Companies
INSERT INTO public.companies (id, company_name, registration_number, ntn, address, city, country_id, contact_person, phone, email)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'TransLogix Global Shipping Corp', 'REG-TLX-001', 'NTN-8829104-1', 'West Wharf Industrial Area', 'Karachi', 'c1111111-1111-1111-1111-111111111111', 'Tariq Mehmood', '+92 21 3582 9900', 'operations@translogix.com'),
    ('b2222222-2222-2222-2222-222222222222', 'Apex Textile Mills Ltd', 'REG-APX-774', 'NTN-3301928-4', 'SITE Industrial Area, Manghopir', 'Karachi', 'c1111111-1111-1111-1111-111111111111', 'Hamza Qureshi', '+92 300 8271625', 'exports@apextextile.com'),
    ('b3333333-3333-3333-3333-333333333333', 'Pacific Gateway Imports Inc', 'US-DEL-99210', 'EIN-84920199', '1400 Harbor Blvd, San Pedro', 'Los Angeles', 'c2222222-2222-2222-2222-222222222222', 'David Miller', '+1 310 555 0192', 'logistics@pacificgateway.com'),
    ('b4444444-4444-4444-4444-444444444444', 'Emirates General Trading LLC', 'UAE-DED-40291', 'TRN-1002938475', 'Al Quoz Industrial 3', 'Dubai', 'c4444444-4444-4444-4444-444444444444', 'Rashid Al Maktoum', '+971 4 338 1290', 'procurement@emiratesgt.ae'),
    ('b5555555-5555-5555-5555-555555555555', 'EuroMachinery Engineering GmbH', 'HRB-88392-HAM', 'DE-VAT-9928172', 'Kanalstraße 42', 'Hamburg', 'c5555555-5555-5555-5555-555555555555', 'Klaus Weber', '+49 40 762 991', 'orders@euromachinery.de')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Products Catalog
INSERT INTO public.products (id, product_name, hs_code, description, category, default_unit)
VALUES
    ('prod1111-1111-1111-1111-111111111111', '100% Combed Cotton Ring-Spun Yarn', '5205.23.00', 'High tensile strength raw cotton yarn Ne 30/1 single', 'Textiles', 'KG'),
    ('prod2222-2222-2222-2222-222222222222', 'Premium Extra Long Grain Basmati Rice', '1006.30.10', 'Aged 2 years, steamed, optical sorted 8.2mm average grain length', 'Agricultural Produce', 'MT'),
    ('prod3333-3333-3333-3333-333333333333', 'Medical Grade Surgical Instruments Set', '9018.90.00', 'Surgical stainless steel AISI 420 forceps, scissors, scalpels', 'Medical Devices', 'PCS'),
    ('prod4444-4444-4444-4444-444444444444', 'Industrial CNC Precision Ball Bearings', '8482.10.20', 'Deep groove ball bearings double shielded ISO class 5', 'Machinery & Equipment', 'PCS'),
    ('prod5555-5555-5555-5555-555555555555', 'Himalayan Pink Rock Salt Food Grade', '2501.00.10', 'Coarse edible crystal salt 2-5mm grain size', 'Minerals & Chemicals', 'MT')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Historical Exchange Rates
INSERT INTO public.exchange_rates (id, from_currency, to_currency, exchange_rate, effective_date)
VALUES
    (gen_random_uuid(), 'USD', 'PKR', 278.450000, CURRENT_DATE),
    (gen_random_uuid(), 'EUR', 'PKR', 302.800000, CURRENT_DATE),
    (gen_random_uuid(), 'USD', 'AED', 3.672500, CURRENT_DATE),
    (gen_random_uuid(), 'USD', 'EUR', 0.919500, CURRENT_DATE),
    (gen_random_uuid(), 'CNY', 'PKR', 38.650000, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 7. Insert Shipments
INSERT INTO public.shipments (
    id, tracking_number, shipment_type, reference_number,
    exporter_id, importer_id,
    origin_country_id, origin_city, origin_port_id,
    destination_country_id, destination_city, destination_port_id,
    transport_mode, shipment_date, expected_delivery_date,
    current_status, total_value, currency, freight_cost, customs_cost, other_cost
) VALUES
(
    's1111111-1111-1111-1111-111111111111',
    'PK-EXP-2026-001001',
    'export',
    'PO-US-2026-8841',
    'b2222222-2222-2222-2222-222222222222', -- Apex Textile
    'b3333333-3333-3333-3333-333333333333', -- Pacific Gateway
    'c1111111-1111-1111-1111-111111111111', 'Karachi', 'p1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222', 'Los Angeles', 'p3333333-3333-3333-3333-333333333333',
    'sea', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '16 days',
    'In Transit', 148500.00, 'USD', 4200.00, 1850.00, 450.00
),
(
    's2222222-2222-2222-2222-222222222222',
    'PK-IMP-2026-001002',
    'import',
    'LC-HAM-9921',
    'b5555555-5555-5555-5555-555555555555', -- EuroMachinery
    'b2222222-2222-2222-2222-222222222222', -- Apex Textile
    'c5555555-5555-5555-5555-555555555555', 'Hamburg', 'p6666666-6666-6666-6666-666666666666',
    'c1111111-1111-1111-1111-111111111111', 'Karachi', 'p2222222-2222-2222-2222-222222222222',
    'sea', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '2 days',
    'Customs Inspection', 89200.00, 'EUR', 3150.00, 4200.00, 600.00
),
(
    's3333333-3333-3333-3333-333333333333',
    'PK-EXP-2026-001003',
    'export',
    'DXB-RICE-4011',
    'b2222222-2222-2222-2222-222222222222', -- Apex Textile
    'b4444444-4444-4444-4444-444444444444', -- Emirates GT
    'c1111111-1111-1111-1111-111111111111', 'Karachi', 'p1111111-1111-1111-1111-111111111111',
    'c4444444-4444-4444-4444-444444444444', 'Dubai', 'p5555555-5555-5555-5555-555555555555',
    'sea', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '4 days',
    'Loaded on Vessel', 64500.00, 'USD', 1800.00, 750.00, 200.00
)
ON CONFLICT (tracking_number) DO NOTHING;

-- 8. Insert Shipment Items
INSERT INTO public.shipment_items (
    id, shipment_id, product_id, product_name, hs_code, description,
    quantity, unit, weight, volume, unit_price, total_value, country_of_origin
) VALUES
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'prod1111-1111-1111-1111-111111111111', '100% Combed Cotton Ring-Spun Yarn', '5205.23.00',
    'Single yarn packed in export corrugated cartons with moisture barrier',
    35000, 'KG', 36200, 68.5, 3.60, 126000.00, 'Pakistan'
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'prod5555-5555-5555-5555-555555555555', 'Himalayan Pink Rock Salt Food Grade', '2501.00.10',
    'Fine ground pink salt in 1kg retail pouches packed in master shipper boxes',
    25, 'MT', 25500, 32.0, 900.00, 22500.00, 'Pakistan'
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'prod4444-4444-4444-4444-444444444444', 'Industrial CNC Precision Ball Bearings', '8482.10.20',
    'Heavy-duty sealed bearings for automated textile looms',
    1200, 'PCS', 4800, 8.4, 74.33, 89200.00, 'Germany'
),
(
    gen_random_uuid(), 's3333333-3333-3333-3333-333333333333',
    'prod2222-2222-2222-2222-222222222222', 'Premium Extra Long Grain Basmati Rice', '1006.30.10',
    'Non-GMO 2-year matured Basmati in 40kg PP bags with inner liner',
    50, 'MT', 50400, 75.0, 1290.00, 64500.00, 'Pakistan'
)
ON CONFLICT DO NOTHING;

-- 9. Insert Containers
INSERT INTO public.containers (
    id, shipment_id, container_number, container_type, seal_number, gross_weight, net_weight, status
) VALUES
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'MSCU9482014', '40HC', 'SL-994821', 28500, 24800, 'In Transit'
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'MSCU4829103', '40HC', 'SL-994822', 29100, 25200, 'In Transit'
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'HLCU8839201', '20GP', 'DE-CUSTOMS-4412', 4800, 4200, 'Held for Inspection'
),
(
    gen_random_uuid(), 's3333333-3333-3333-3333-333333333333',
    'CMAU7718290', '40HC', 'SL-DXB-1092', 25200, 24800, 'Loaded on Vessel'
),
(
    gen_random_uuid(), 's3333333-3333-3333-3333-333333333333',
    'CMAU7718291', '40HC', 'SL-DXB-1093', 25200, 24800, 'Loaded on Vessel'
)
ON CONFLICT DO NOTHING;

-- 10. Insert Tracking Events
INSERT INTO public.tracking_events (
    id, shipment_id, status, location_name, city, port_id, latitude, longitude, remarks, event_date
) VALUES
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Order Booked', 'Apex Central Warehouse', 'Karachi', NULL,
    24.9056, 67.0011, 'Shipping order generated & space booked with MSC Lines',
    CURRENT_DATE - INTERVAL '12 days'
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Cargo Received at CFS', 'Port Qasim Container Freight Station', 'Karachi', 'p1111111-1111-1111-1111-111111111111',
    24.7833, 67.3333, 'Cargo received and container stuffing completed under customs supervision',
    CURRENT_DATE - INTERVAL '10 days'
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Export Customs Cleared', 'Port Qasim Customs House', 'Karachi', 'p1111111-1111-1111-1111-111111111111',
    24.7833, 67.3333, 'Goods Declaration (GD) processed under Green Channel. Out of Charge issued.',
    CURRENT_DATE - INTERVAL '8 days'
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Vessel Departed', 'Port Qasim Berth 4', 'Karachi', 'p1111111-1111-1111-1111-111111111111',
    24.7833, 67.3333, 'Vessel MSC IRIS V.2604 departed on schedule towards transshipment hub',
    CURRENT_DATE - INTERVAL '6 days'
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'In Transit - Indian Ocean', 'At Sea', 'Indian Ocean', NULL,
    7.8731, 80.7718, 'Vessel navigating on course towards transshipment port. Weather clear.',
    CURRENT_DATE - INTERVAL '1 day'
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'Vessel Arrived at Port', 'Karachi Port South Wharf', 'Karachi', 'p2222222-2222-2222-2222-222222222222',
    24.8387, 66.9744, 'Vessel berthed. Container discharged to terminal yard.',
    CURRENT_DATE - INTERVAL '3 days'
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'Customs Inspection Initiated', 'Karachi Customs Examination Yard', 'Karachi', 'p2222222-2222-2222-2222-222222222222',
    24.8387, 66.9744, 'Selected for 100% physical examination under Yellow Channel procedure',
    CURRENT_DATE - INTERVAL '1 day'
)
ON CONFLICT DO NOTHING;

-- 11. Insert Documents
INSERT INTO public.documents (
    id, shipment_id, document_type, file_name, storage_path, file_size
) VALUES
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Commercial Invoice', 'Commercial_Invoice_CI-2026-8841.pdf',
    'shipments/s1111111-1111-1111-1111-111111111111/Commercial_Invoice_CI-2026-8841.pdf', 382400
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Bill of Lading', 'Bill_of_Lading_MSCU-PK-29481.pdf',
    'shipments/s1111111-1111-1111-1111-111111111111/Bill_of_Lading_MSCU-PK-29481.pdf', 524100
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Packing List', 'Detailed_Packing_List_PK-8841.xlsx',
    'shipments/s1111111-1111-1111-1111-111111111111/Detailed_Packing_List_PK-8841.xlsx', 194200
),
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'Certificate of Origin', 'Certificate_of_Origin_FPCCI_2026.pdf',
    'shipments/s1111111-1111-1111-1111-111111111111/Certificate_of_Origin_FPCCI_2026.pdf', 412000
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'Customs Declaration', 'WeBOC_Goods_Declaration_GD-IMP-8912.pdf',
    'shipments/s2222222-2222-2222-2222-222222222222/WeBOC_Goods_Declaration_GD-IMP-8912.pdf', 684000
)
ON CONFLICT DO NOTHING;

-- 12. Insert Invoices
INSERT INTO public.invoices (
    id, shipment_id, invoice_number, invoice_date,
    subtotal, freight, customs, other_charges, total, currency
) VALUES
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'INV-TLX-2026-0041', CURRENT_DATE - INTERVAL '10 days',
    148500.00, 4200.00, 1850.00, 450.00, 155000.00, 'USD'
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'INV-TLX-2026-0042', CURRENT_DATE - INTERVAL '2 days',
    89200.00, 3150.00, 4200.00, 600.00, 97150.00, 'EUR'
),
(
    gen_random_uuid(), 's3333333-3333-3333-3333-333333333333',
    'INV-TLX-2026-0043', CURRENT_DATE - INTERVAL '4 days',
    64500.00, 1800.00, 750.00, 200.00, 67250.00, 'USD'
)
ON CONFLICT (invoice_number) DO NOTHING;

-- 13. Insert Customs Clearances
INSERT INTO public.customs (
    id, shipment_id, declaration_number, customs_office, declaration_date,
    status, duty, tax, other_charges, clearance_date, remarks
) VALUES
(
    gen_random_uuid(), 's1111111-1111-1111-1111-111111111111',
    'GD-EXP-2026-KHI-49120', 'Collectorate of Customs Export, Port Qasim', CURRENT_DATE - INTERVAL '9 days',
    'Cleared', 0.00, 0.00, 350.00, CURRENT_DATE - INTERVAL '8 days',
    'Export rebate verified under SRO-1120. Green Channel clearance issued.'
),
(
    gen_random_uuid(), 's2222222-2222-2222-2222-222222222222',
    'GD-IMP-2026-KHI-89104', 'Collectorate of Customs Appraisement (East), KPT', CURRENT_DATE - INTERVAL '2 days',
    'Inspection', 2680.00, 1520.00, 480.00, NULL,
    'Physical sampling requested for HS Code 8482.10 verification.'
),
(
    gen_random_uuid(), 's3333333-3333-3333-3333-333333333333',
    'GD-EXP-2026-KHI-50219', 'Collectorate of Customs Export, Port Qasim', CURRENT_DATE - INTERVAL '5 days',
    'Cleared', 0.00, 0.00, 250.00, CURRENT_DATE - INTERVAL '4 days',
    'Phytosanitary certificate endorsed. Out of Charge granted.'
)
ON CONFLICT (declaration_number) DO NOTHING;

-- 14. Insert Audit Logs
INSERT INTO public.audit_logs (
    id, action, entity_type, entity_id, description
) VALUES
(
    gen_random_uuid(), 'SHIPMENT_CREATED', 'shipments', 's1111111-1111-1111-1111-111111111111',
    'Export Shipment PK-EXP-2026-001001 created for Apex Textile Mills Ltd'
),
(
    gen_random_uuid(), 'CONTAINERS_SEALED', 'containers', 'MSCU9482014',
    'Container 40HC MSCU9482014 sealed with high-security seal SL-994821'
),
(
    gen_random_uuid(), 'CUSTOMS_STATUS_UPDATE', 'customs', 'GD-EXP-2026-KHI-49120',
    'Customs status updated to Cleared at Port Qasim Collectorate'
),
(
    gen_random_uuid(), 'TRACKING_EVENT_LOGGED', 'tracking_events', 's1111111-1111-1111-1111-111111111111',
    'Status changed to In Transit - Indian Ocean. Estimated arrival to Port of LA on schedule.'
)
ON CONFLICT DO NOTHING;
