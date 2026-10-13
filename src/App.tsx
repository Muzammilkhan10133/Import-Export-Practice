/**
 * TransLogix - Enterprise Import/Export Logistics ERP
 * Exclusively powered by Supabase PostgreSQL, Storage, Row Level Security, and Realtime.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ShipmentList } from './components/shipments/ShipmentList';
import { ShipmentDetail } from './components/shipments/ShipmentDetail';
import { NewShipmentModal } from './components/shipments/NewShipmentModal';
import { CustomsManagement } from './components/customs/CustomsManagement';
import { DocumentVault } from './components/documents/DocumentVault';
import { InvoiceManager } from './components/invoices/InvoiceManager';
import { MasterDataView } from './components/master-data/MasterDataView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SupabaseConsole } from './components/database-center/SupabaseConsole';
import { db } from './lib/database-service';

export default function App() {
  const [, setTick] = useState(0);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);

  // Subscribe to database changes (emulating Supabase Realtime subscriptions)
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
  };

  const handleBackToShipments = () => {
    setSelectedShipmentId(null);
  };

  const handleNewShipmentCreated = (newId: string) => {
    setIsNewShipmentModalOpen(false);
    setSelectedShipmentId(newId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        onSearchSelect={(id) => {
          setSelectedShipmentId(id);
          setCurrentTab('shipments');
        }}
        onOpenConsole={() => {
          setSelectedShipmentId(null);
          setCurrentTab('database-console');
        }}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setSelectedShipmentId(null);
            setCurrentTab(tab);
          }}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {selectedShipmentId ? (
              <ShipmentDetail
                shipmentId={selectedShipmentId}
                onBack={handleBackToShipments}
              />
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardOverview
                    onSelectShipment={handleSelectShipment}
                    onNavigateTab={setCurrentTab}
                    onOpenNewShipment={() => setIsNewShipmentModalOpen(true)}
                  />
                )}

                {currentTab === 'shipments' && (
                  <ShipmentList
                    onSelectShipment={handleSelectShipment}
                    onOpenNewShipmentModal={() => setIsNewShipmentModalOpen(true)}
                  />
                )}

                {currentTab === 'customs' && (
                  <CustomsManagement onSelectShipment={handleSelectShipment} />
                )}

                {currentTab === 'documents' && (
                  <DocumentVault onSelectShipment={handleSelectShipment} />
                )}

                {currentTab === 'invoices' && (
                  <InvoiceManager onSelectShipment={handleSelectShipment} />
                )}

                {currentTab === 'master-data' && <MasterDataView />}

                {currentTab === 'audit-logs' && <AuditLogsView />}

                {currentTab === 'database-console' && <SupabaseConsole />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal for Booking New Shipment */}
      <NewShipmentModal
        isOpen={isNewShipmentModalOpen}
        onClose={() => setIsNewShipmentModalOpen(false)}
        onSuccess={handleNewShipmentCreated}
      />
    </div>
  );
}
