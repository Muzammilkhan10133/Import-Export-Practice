/**
 * TransLogix Supabase Database Types
 * Directly maps to PostgreSQL tables created in 001_initial_schema.sql
 */

export type UserRole = 'admin' | 'user';
export type ShipmentType = 'import' | 'export';
export type TransportMode = 'sea' | 'air' | 'road' | 'rail' | 'multimodal';
export type CustomsStatus = 'Under Process' | 'Inspection' | 'Duty Paid' | 'Cleared' | 'Rejected';

export interface Profile {
  id: string; // uuid references auth.users
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  company_id?: string;
  country_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  registration_number?: string;
  ntn?: string;
  address: string;
  city: string;
  country_id?: string;
  contact_person: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  country_name: string;
  country_code: string;
  iso_code: string;
  created_at: string;
}

export interface Port {
  id: string;
  port_name: string;
  port_code: string;
  city: string;
  country_id: string;
  port_type: string;
  created_at: string;
  updated_at: string;
}

export interface Airport {
  id: string;
  airport_name: string;
  airport_code: string;
  city: string;
  country_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_name: string;
  hs_code: string;
  description?: string;
  category: string;
  default_unit: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  shipment_type: ShipmentType;
  reference_number?: string;
  exporter_id: string;
  importer_id: string;
  origin_country_id: string;
  origin_city: string;
  origin_port_id?: string;
  origin_airport_id?: string;
  destination_country_id: string;
  destination_city: string;
  destination_port_id?: string;
  destination_airport_id?: string;
  transport_mode: TransportMode;
  shipment_date: string;
  expected_delivery_date: string;
  current_status: string;
  total_value: number;
  currency: string;
  freight_cost: number;
  customs_cost: number;
  other_cost: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined relation fields for UI convenience
  exporter?: Company;
  importer?: Company;
  origin_country?: Country;
  destination_country?: Country;
  origin_port?: Port;
  destination_port?: Port;
  origin_airport?: Airport;
  destination_airport?: Airport;
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  product_id?: string;
  product_name: string;
  hs_code: string;
  description?: string;
  quantity: number;
  unit: string;
  weight: number; // in kg
  volume: number; // in cbm
  unit_price: number;
  total_value: number;
  country_of_origin?: string;
  created_at: string;
}

export interface Container {
  id: string;
  shipment_id: string;
  container_number: string;
  container_type: string;
  seal_number: string;
  gross_weight: number;
  net_weight: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: string;
  shipment_id: string;
  status: string;
  location_name: string;
  country_id?: string;
  city?: string;
  port_id?: string;
  latitude?: number;
  longitude?: number;
  remarks?: string;
  event_date: string;
  created_by?: string;
  created_at: string;
}

export interface Document {
  id: string;
  shipment_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  uploaded_by?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  shipment_id: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  freight: number;
  customs: number;
  other_charges: number;
  total: number;
  currency: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Customs {
  id: string;
  shipment_id: string;
  declaration_number: string;
  customs_office: string;
  declaration_date: string;
  status: CustomsStatus;
  duty: number;
  tax: number;
  other_charges: number;
  clearance_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  shipment_id?: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  effective_date: string;
  created_at: string;
}
