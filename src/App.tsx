/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AdminTab, AppTab, ViewMode, VisitorPermit } from './types';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { usePassmarkData } from './hooks/usePassmarkData';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AuthView } from './components/views/AuthView';
import { DashboardView } from './components/views/DashboardView';
import { PermitsView } from './components/views/PermitsView';
import { GateTerminalView } from './components/views/GateTerminalView';
import { ParkingSlotsView } from './components/views/ParkingSlotsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SystemConfigView } from './components/views/SystemConfigView';
import { ResidentPortalView } from './components/views/ResidentPortalView';
import { NewPermitModal } from './components/modals/NewPermitModal';
import { QRCodeModal } from './components/modals/QRCodeModal';
import { LogoIcon } from './components/common/Brand';

const originalVideoPlay = HTMLVideoElement.prototype.play;
HTMLVideoElement.prototype.play = function() {
  const promise = originalVideoPlay.apply(this, arguments as any);
  if (promise !== undefined) {
    promise.catch(error => {
      if (error.name === 'AbortError' || error.message.includes('interrupted')) {
        return;
      }
      throw error;
    });
  }
  return promise;
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewPermitModalOpen, setIsNewPermitModalOpen] = useState(false);
  const [selectedPermitForQR, setSelectedPermitForQR] = useState<VisitorPermit | null>(null);

  const {
    session,
    userProfile,
    setUserProfile,
    isAuthLoading,
    handleLogout,
    isSupabaseConfigured
  } = useAuth(true);

  const {
    permits,
    slots,
    logs,
    stats,
    isLoading,
    useSupabase,
    handleCreatePermit,
    handlePreRegisterGuest,
    handleCheckIn,
    handleCheckOut,
    handleCancelPass,
    handleFastTrack,
    handleRegisterVehicle,
    resetToNineSlots,
    resetData
  } = usePassmarkData(session, setUserProfile);

  
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'user') {
        setViewMode('user');
        setActiveTab('resident');
      } else {
        setViewMode('admin');
        setActiveTab('dashboard');
      }
    }
  }, [userProfile]);

  
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-[var(--color-text-primary)] text-[var(--color-bg-page)] rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <LogoIcon className="w-10 h-10" />
        </div>
        <p className="text-label text-[var(--color-text-ghost)]">AUTHENTICATING...</p>
      </div>
    );
  }

  
  if (useSupabase && isSupabaseConfigured && !session) {
    return (
      <>
        <Toaster position="top-center" richColors theme={theme} />
        <AuthView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] flex font-sans antialiased selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-fg)]">
      <Toaster position="top-center" richColors theme={theme} />

      
      {viewMode === 'admin' && !isLoading && (
        <Sidebar
          activeTab={activeTab as AdminTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          useSupabase={useSupabase}
          userProfile={userProfile}
        />
      )}

      
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          userProfile={userProfile}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenNewPermit={() => setIsNewPermitModalOpen(true)}
          onLogout={handleLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onSwitchToResident={() => {
            setViewMode('user');
            setActiveTab('resident');
          }}
          onSwitchToAdmin={() => {
            setViewMode('admin');
            setActiveTab('dashboard');
          }}
        />

        <main className="flex-1 p-4 lg:p-10 max-w-[1600px] w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
              <p className="text-label text-[var(--color-text-ghost)]">CONNECTING TO DATABASE...</p>
            </div>
          ) : viewMode === 'user' || activeTab === 'resident' ? (
            <ResidentPortalView
              session={session}
              permits={permits}
              onFastTrack={handleFastTrack}
              onPreRegisterGuest={handlePreRegisterGuest}
              onCancelPass={handleCancelPass}
              onRegisterVehicle={handleRegisterVehicle}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  permits={permits}
                  slots={slots}
                  stats={stats}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'permits' && (
                <PermitsView
                  permits={permits}
                  onOpenQR={(permit) => setSelectedPermitForQR(permit)}
                  onCheckOut={handleCheckOut}
                />
              )}

              {activeTab === 'gate' && (
                <GateTerminalView
                  permits={permits}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'slots' && (
                <ParkingSlotsView
                  slots={slots}
                  permits={permits}
                  onForceRelease={handleCheckOut}
                />
              )}

              {activeTab === 'logs' && (
                <AuditLogsView logs={logs} />
              )}

              {activeTab === 'config' && (
                <SystemConfigView
                  useSupabase={useSupabase}
                  userProfile={userProfile}
                  onResetToNineSlots={resetToNineSlots}
                  onResetData={resetData}
                />
              )}
            </>
          )}
        </main>
      </div>

      
      <NewPermitModal
        isOpen={isNewPermitModalOpen}
        onClose={() => setIsNewPermitModalOpen(false)}
        slots={slots}
        onCreatePermit={handleCreatePermit}
      />

      <QRCodeModal
        permit={selectedPermitForQR}
        onClose={() => setSelectedPermitForQR(null)}
      />
    </div>
  );
}
