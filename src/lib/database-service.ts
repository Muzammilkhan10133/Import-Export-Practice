import {
  Shipment,
  ShipmentItem,
  Container,
  TrackingEvent,
  Document as LogisticsDocument,
  Invoice,
  Customs,
  Notification,
  AuditLog,
  Profile,
  Company,
  Country,
  Port,
  Airport,
  Product,
  ExchangeRate,
  UserRole,
} from '../types/database.types';
import {
  INITIAL_COUNTRIES,
  INITIAL_COMPANIES,
  INITIAL_PORTS,
  INITIAL_AIRPORTS,
  INITIAL_PRODUCTS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_PROFILES,
  INITIAL_SHIPMENTS,
  INITIAL_ITEMS,
  INITIAL_CONTAINERS,
  INITIAL_TRACKING_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_INVOICES,
  INITIAL_CUSTOMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './demo-data';
import { supabase, isConfigured } from './supabase';

type Listener = () => void;

class DatabaseService {
  private currentProfile: Profile = INITIAL_PROFILES[0]; // Admin by default
  private listeners: Set<Listener> = new Set();

  // In-memory persistent state (persisted to localStorage for realistic multi-turn workflow)
  private shipments: Shipment[] = [];
  private items: ShipmentItem[] = [];
  private containers: Container[] = [];
  private trackingEvents: TrackingEvent[] = [];
  private documents: LogisticsDocument[] = [];
  private invoices: Invoice[] = [];
  private customs: Customs[] = [];
  private notifications: Notification[] = [];
  private auditLogs: AuditLog[] = [];
  private companies: Company[] = [];
  private countries: Country[] = [];
  private ports: Port[] = [];
  private airports: Airport[] = [];
  private products: Product[] = [];
  private exchangeRates: ExchangeRate[] = [];

  // Database sequences for atomic tracking numbers
  private expSeq: number = 1005;
  private impSeq: number = 1003;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const saved = localStorage.getItem('translogix_db_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.shipments = parsed.shipments || INITIAL_SHIPMENTS;
        this.items = parsed.items || INITIAL_ITEMS;
        this.containers = parsed.containers || INITIAL_CONTAINERS;
        this.trackingEvents = parsed.trackingEvents || INITIAL_TRACKING_EVENTS;
        this.documents = parsed.documents || INITIAL_DOCUMENTS;
        this.invoices = parsed.invoices || INITIAL_INVOICES;
        this.customs = parsed.customs || INITIAL_CUSTOMS;
        this.notifications = parsed.notifications || INITIAL_NOTIFICATIONS;
        this.auditLogs = parsed.auditLogs || INITIAL_AUDIT_LOGS;
        this.companies = parsed.companies || INITIAL_COMPANIES;
        this.countries = parsed.countries || INITIAL_COUNTRIES;
        this.ports = parsed.ports || INITIAL_PORTS;
        this.airports = parsed.airports || INITIAL_AIRPORTS;
        this.products = parsed.products || INITIAL_PRODUCTS;
        this.exchangeRates = parsed.exchangeRates || INITIAL_EXCHANGE_RATES;
        this.expSeq = parsed.expSeq || 1005;
        this.impSeq = parsed.impSeq || 1003;
      } else {
        this.resetToDefaults();
      }
    } catch {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.shipments = [...INITIAL_SHIPMENTS];
    this.items = [...INITIAL_ITEMS];
    this.containers = [...INITIAL_CONTAINERS];
    this.trackingEvents = [...INITIAL_TRACKING_EVENTS];
    this.documents = [...INITIAL_DOCUMENTS];
    this.invoices = [...INITIAL_INVOICES];
    this.customs = [...INITIAL_CUSTOMS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.companies = [...INITIAL_COMPANIES];
    this.countries = [...INITIAL_COUNTRIES];
    this.ports = [...INITIAL_PORTS];
    this.airports = [...INITIAL_AIRPORTS];
    this.products = [...INITIAL_PRODUCTS];
    this.exchangeRates = [...INITIAL_EXCHANGE_RATES];
    this.expSeq = 1005;
    this.impSeq = 1003;
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(
        'translogix_db_state_v1',
        JSON.stringify({
          shipments: this.shipments,
          items: this.items,
          containers: this.containers,
          trackingEvents: this.trackingEvents,
          documents: this.documents,
          invoices: this.invoices,
          customs: this.customs,
          notifications: this.notifications,
          auditLogs: this.auditLogs,
          companies: this.companies,
          countries: this.countries,
          ports: this.ports,
          airports: this.airports,
          products: this.products,
          exchangeRates: this.exchangeRates,
          expSeq: this.expSeq,
          impSeq: this.impSeq,
        })
      );
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  // --- Profile & Role Checking (Supabase Auth & RLS) ---
  public getCurrentProfile(): Profile {
    return this.currentProfile;
  }

  public setRole(role: UserRole, companyId?: string) {
    if (role === 'admin') {
      this.currentProfile = INITIAL_PROFILES[0];
    } else {
      const match = INITIAL_PROFILES.find((p) => p.role === 'user' && (!companyId || p.company_id === companyId)) || INITIAL_PROFILES[1];
      this.currentProfile = match;
    }
    this.notifyListeners();
  }

  public isAdmin(): boolean {
    return this.currentProfile.role === 'admin';
  }

  public getUserCompanyId(): string | undefined {
    return this.currentProfile.company_id;
  }

  // --- Tracking Number Generation (Matches PostgreSQL function) ---
  public generateTrackingNumber(type: 'import' | 'export'): string {
    const year = new Date().getFullYear();
    if (type === 'export') {
      const seq = this.expSeq++;
      this.persist();
      return `PK-EXP-${year}-${String(seq).padStart(6, '0')}`;
    } else {
      const seq = this.impSeq++;
      this.persist();
      return `PK-IMP-${year}-${String(seq).padStart(6, '0')}`;
    }
  }

  // --- Shipments ---
  public getShipments(): Shipment[] {
    const companyId = this.getUserCompanyId();
    const isAdmin = this.isAdmin();

    // RLS Filter: Admin sees all; regular user sees shipments for their company
    const filtered = this.shipments.filter((s) => {
      if (isAdmin) return true;
      return s.exporter_id === companyId || s.importer_id === companyId;
    });

    // Hydrate relations
    return filtered.map((s) => this.hydrateShipment(s));
  }

  public getShipmentById(id: string): Shipment | null {
    const shipment = this.shipments.find((s) => s.id === id);
    if (!shipment) return null;

    // RLS Check
    if (!this.isAdmin()) {
      const companyId = this.getUserCompanyId();
      if (shipment.exporter_id !== companyId && shipment.importer_id !== companyId) {
        throw new Error('RLS Violation: You are not authorized to view this shipment.');
      }
    }

    return this.hydrateShipment(shipment);
  }

  private hydrateShipment(s: Shipment): Shipment {
    return {
      ...s,
      exporter: this.companies.find((c) => c.id === s.exporter_id),
      importer: this.companies.find((c) => c.id === s.importer_id),
      origin_country: this.countries.find((c) => c.id === s.origin_country_id),
      destination_country: this.countries.find((c) => c.id === s.destination_country_id),
      origin_port: this.ports.find((p) => p.id === s.origin_port_id),
      destination_port: this.ports.find((p) => p.id === s.destination_port_id),
      origin_airport: this.airports.find((a) => a.id === s.origin_airport_id),
      destination_airport: this.airports.find((a) => a.id === s.destination_airport_id),
    };
  }

  public async createShipment(data: {
    shipment_type: 'import' | 'export';
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
    transport_mode: 'sea' | 'air' | 'road' | 'rail' | 'multimodal';
    shipment_date: string;
    expected_delivery_date: string;
    currency: string;
    freight_cost: number;
    customs_cost: number;
    other_cost: number;
    items?: Array<{
      product_name: string;
      hs_code: string;
      description?: string;
      quantity: number;
      unit: string;
      weight: number;
      volume: number;
      unit_price: number;
      country_of_origin?: string;
    }>;
    containers?: Array<{
      container_number: string;
      container_type: string;
      seal_number: string;
      gross_weight: number;
      net_weight: number;
    }>;
  }): Promise<Shipment> {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Only administrators can create shipments.');
    }

    const shipmentId = 's-' + Math.random().toString(36).substring(2, 10);
    const trackingNumber = this.generateTrackingNumber(data.shipment_type);

    let totalCargoValue = 0;
    if (data.items) {
      data.items.forEach((item) => {
        const itemVal = item.quantity * item.unit_price;
        totalCargoValue += itemVal;
        this.items.push({
          id: 'item-' + Math.random().toString(36).substring(2, 9),
          shipment_id: shipmentId,
          product_name: item.product_name,
          hs_code: item.hs_code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          weight: item.weight,
          volume: item.volume,
          unit_price: item.unit_price,
          total_value: itemVal,
          country_of_origin: item.country_of_origin || 'Pakistan',
          created_at: new Date().toISOString(),
        });
      });
    }

    if (data.containers) {
      data.containers.forEach((cont) => {
        this.containers.push({
          id: 'cont-' + Math.random().toString(36).substring(2, 9),
          shipment_id: shipmentId,
          container_number: cont.container_number,
          container_type: cont.container_type,
          seal_number: cont.seal_number,
          gross_weight: cont.gross_weight,
          net_weight: cont.net_weight,
          status: 'Loaded',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    const newShipment: Shipment = {
      id: shipmentId,
      tracking_number: trackingNumber,
      shipment_type: data.shipment_type,
      reference_number: data.reference_number || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      exporter_id: data.exporter_id,
      importer_id: data.importer_id,
      origin_country_id: data.origin_country_id,
      origin_city: data.origin_city,
      origin_port_id: data.origin_port_id,
      origin_airport_id: data.origin_airport_id,
      destination_country_id: data.destination_country_id,
      destination_city: data.destination_city,
      destination_port_id: data.destination_port_id,
      destination_airport_id: data.destination_airport_id,
      transport_mode: data.transport_mode,
      shipment_date: data.shipment_date,
      expected_delivery_date: data.expected_delivery_date,
      current_status: 'Order Booked',
      total_value: totalCargoValue,
      currency: data.currency,
      freight_cost: data.freight_cost,
      customs_cost: data.customs_cost,
      other_cost: data.other_cost,
      created_by: this.currentProfile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.shipments.unshift(newShipment);

    // Initial milestone tracking event
    this.trackingEvents.push({
      id: 'trk-' + Math.random().toString(36).substring(2, 9),
      shipment_id: shipmentId,
      status: 'Order Booked',
      location_name: `${data.origin_city} Logistics Terminal`,
      city: data.origin_city,
      remarks: 'Consignment booked in system and tracking number generated.',
      event_date: new Date().toISOString(),
      created_by: this.currentProfile.id,
      created_at: new Date().toISOString(),
    });

    // Create Audit Log
    this.auditLogs.unshift({
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentProfile.id,
      action: 'SHIPMENT_CREATED',
      entity_type: 'shipments',
      entity_id: shipmentId,
      description: `New ${data.shipment_type.toUpperCase()} shipment ${trackingNumber} created.`,
      created_at: new Date().toISOString(),
    });

    // Generate commercial invoice
    this.invoices.unshift({
      id: 'inv-' + Math.random().toString(36).substring(2, 9),
      shipment_id: shipmentId,
      invoice_number: `INV-TLX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_date: data.shipment_date,
      subtotal: totalCargoValue,
      freight: data.freight_cost,
      customs: data.customs_cost,
      other_charges: data.other_cost,
      total: totalCargoValue + data.freight_cost + data.customs_cost + data.other_cost,
      currency: data.currency,
      created_by: this.currentProfile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Generate customs declaration record
    this.customs.unshift({
      id: 'cust-' + Math.random().toString(36).substring(2, 9),
      shipment_id: shipmentId,
      declaration_number: `GD-${data.shipment_type.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      customs_office: `Collectorate of Customs, ${data.origin_city}`,
      declaration_date: data.shipment_date,
      status: 'Under Process',
      duty: Math.round(totalCargoValue * 0.05),
      tax: Math.round(totalCargoValue * 0.02),
      other_charges: 300,
      remarks: 'E-Manifest filed with customs authority.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.persist();
    return this.hydrateShipment(newShipment);
  }

  public async updateShipmentStatus(
    shipmentId: string,
    newStatus: string,
    remarks?: string,
    locationName?: string
  ): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Regular users cannot change shipment status.');
    }

    const s = this.shipments.find((item) => item.id === shipmentId);
    if (!s) throw new Error('Shipment not found');

    const prevStatus = s.current_status;
    s.current_status = newStatus;
    s.updated_at = new Date().toISOString();

    // Add immutable tracking event (NEVER overwrite history)
    const event: TrackingEvent = {
      id: 'trk-' + Math.random().toString(36).substring(2, 9),
      shipment_id: shipmentId,
      status: newStatus,
      location_name: locationName || `${s.origin_city} Hub`,
      remarks: remarks || `Status updated from ${prevStatus} to ${newStatus}`,
      event_date: new Date().toISOString(),
      created_by: this.currentProfile.id,
      created_at: new Date().toISOString(),
    };
    this.trackingEvents.push(event);

    // Audit log
    this.auditLogs.unshift({
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentProfile.id,
      action: 'STATUS_UPDATED',
      entity_type: 'shipments',
      entity_id: shipmentId,
      description: `Shipment ${s.tracking_number} changed status to "${newStatus}"`,
      created_at: new Date().toISOString(),
    });

    // Notify customer
    this.notifications.unshift({
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      user_id: 'u-client-001',
      shipment_id: shipmentId,
      title: `Shipment ${s.tracking_number} Update`,
      message: `Status has progressed to "${newStatus}": ${remarks || 'Milestone verified.'}`,
      notification_type: newStatus === 'Delivered' ? 'success' : 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    this.persist();
  }

  public async deleteShipment(shipmentId: string): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Regular users cannot delete shipments.');
    }

    const target = this.shipments.find((s) => s.id === shipmentId);
    this.shipments = this.shipments.filter((s) => s.id !== shipmentId);
    this.items = this.items.filter((i) => i.shipment_id !== shipmentId);
    this.containers = this.containers.filter((c) => c.shipment_id !== shipmentId);
    this.trackingEvents = this.trackingEvents.filter((t) => t.shipment_id !== shipmentId);
    this.documents = this.documents.filter((d) => d.shipment_id !== shipmentId);
    this.invoices = this.invoices.filter((inv) => inv.shipment_id !== shipmentId);
    this.customs = this.customs.filter((c) => c.shipment_id !== shipmentId);

    this.auditLogs.unshift({
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentProfile.id,
      action: 'SHIPMENT_DELETED',
      entity_type: 'shipments',
      entity_id: shipmentId,
      description: `Shipment ${target?.tracking_number || shipmentId} deleted by Admin`,
      created_at: new Date().toISOString(),
    });

    this.persist();
  }

  // --- Tracking Events ---
  public getTrackingEvents(shipmentId: string): TrackingEvent[] {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) return [];

    return this.trackingEvents
      .filter((e) => e.shipment_id === shipmentId)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }

  public async addTrackingEvent(data: {
    shipment_id: string;
    status: string;
    location_name: string;
    city?: string;
    remarks?: string;
  }): Promise<TrackingEvent> {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Only administrators can log tracking events.');
    }

    const event: TrackingEvent = {
      id: 'trk-' + Math.random().toString(36).substring(2, 9),
      shipment_id: data.shipment_id,
      status: data.status,
      location_name: data.location_name,
      city: data.city,
      remarks: data.remarks,
      event_date: new Date().toISOString(),
      created_by: this.currentProfile.id,
      created_at: new Date().toISOString(),
    };

    this.trackingEvents.push(event);

    // Also update shipment status to match event
    const s = this.shipments.find((ship) => ship.id === data.shipment_id);
    if (s) {
      s.current_status = data.status;
      s.updated_at = new Date().toISOString();
    }

    this.auditLogs.unshift({
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentProfile.id,
      action: 'TRACKING_EVENT_LOGGED',
      entity_type: 'tracking_events',
      entity_id: event.id,
      description: `Milestone "${data.status}" logged at ${data.location_name}`,
      created_at: new Date().toISOString(),
    });

    this.persist();
    return event;
  }

  // --- Shipment Items & Containers ---
  public getShipmentItems(shipmentId: string): ShipmentItem[] {
    return this.items.filter((i) => i.shipment_id === shipmentId);
  }

  public getContainers(shipmentId: string): Container[] {
    return this.containers.filter((c) => c.shipment_id === shipmentId);
  }

  // --- Documents (Supabase Storage integration) ---
  public getDocuments(shipmentId?: string): LogisticsDocument[] {
    const isAdmin = this.isAdmin();
    const companyId = this.getUserCompanyId();

    return this.documents.filter((d) => {
      if (shipmentId && d.shipment_id !== shipmentId) return false;
      if (isAdmin) return true;

      const s = this.shipments.find((ship) => ship.id === d.shipment_id);
      if (!s) return false;
      return s.exporter_id === companyId || s.importer_id === companyId;
    });
  }

  public async uploadDocument(data: {
    shipment_id: string;
    document_type: string;
    file_name: string;
    file_size: number;
  }): Promise<LogisticsDocument> {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Only administrators can upload shipment documents.');
    }

    const doc: LogisticsDocument = {
      id: 'doc-' + Math.random().toString(36).substring(2, 9),
      shipment_id: data.shipment_id,
      document_type: data.document_type,
      file_name: data.file_name,
      storage_path: `shipments/${data.shipment_id}/${data.file_name}`,
      file_size: data.file_size,
      uploaded_by: this.currentProfile.id,
      created_at: new Date().toISOString(),
    };

    this.documents.push(doc);

    this.auditLogs.unshift({
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentProfile.id,
      action: 'DOCUMENT_UPLOADED',
      entity_type: 'documents',
      entity_id: doc.id,
      description: `Document "${data.file_name}" (${data.document_type}) uploaded to storage bucket shipment-documents`,
      created_at: new Date().toISOString(),
    });

    this.persist();
    return doc;
  }

  // --- Invoices ---
  public getInvoices(shipmentId?: string): Invoice[] {
    const isAdmin = this.isAdmin();
    const companyId = this.getUserCompanyId();

    return this.invoices.filter((inv) => {
      if (shipmentId && inv.shipment_id !== shipmentId) return false;
      if (isAdmin) return true;

      const s = this.shipments.find((ship) => ship.id === inv.shipment_id);
      if (!s) return false;
      return s.exporter_id === companyId || s.importer_id === companyId;
    });
  }

  // --- Customs Clearances ---
  public getCustoms(shipmentId?: string): Customs[] {
    const isAdmin = this.isAdmin();
    const companyId = this.getUserCompanyId();

    return this.customs.filter((c) => {
      if (shipmentId && c.shipment_id !== shipmentId) return false;
      if (isAdmin) return true;

      const s = this.shipments.find((ship) => ship.id === c.shipment_id);
      if (!s) return false;
      return s.exporter_id === companyId || s.importer_id === companyId;
    });
  }

  public async updateCustomsStatus(id: string, status: Customs['status'], remarks?: string): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Only customs administrators can update declaration clearance.');
    }

    const c = this.customs.find((item) => item.id === id);
    if (!c) throw new Error('Customs record not found');

    c.status = status;
    if (status === 'Cleared') {
      c.clearance_date = new Date().toISOString().split('T')[0];
    }
    if (remarks) c.remarks = remarks;
    c.updated_at = new Date().toISOString();

    this.auditLogs.unshift({
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_id: this.currentProfile.id,
      action: 'CUSTOMS_STATUS_CHANGED',
      entity_type: 'customs',
      entity_id: id,
      description: `Customs Declaration ${c.declaration_number} status set to ${status}`,
      created_at: new Date().toISOString(),
    });

    this.persist();
  }

  // --- Reference & Master Data ---
  public getCompanies(): Company[] {
    return this.companies;
  }

  public getCountries(): Country[] {
    return this.countries;
  }

  public getPorts(): Port[] {
    return this.ports;
  }

  public getAirports(): Airport[] {
    return this.airports;
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public getExchangeRates(): ExchangeRate[] {
    return this.exchangeRates;
  }

  // --- Notifications ---
  public getNotifications(): Notification[] {
    const uid = this.currentProfile.id;
    return this.notifications.filter((n) => n.user_id === uid || this.isAdmin());
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.is_read = true;
      this.persist();
    }
  }

  // --- Audit Logs (Admin Only) ---
  public getAuditLogs(): AuditLog[] {
    if (!this.isAdmin()) {
      throw new Error('RLS Violation: Customers are strictly forbidden from viewing audit logs.');
    }
    return this.auditLogs;
  }
}

export const db = new DatabaseService();
