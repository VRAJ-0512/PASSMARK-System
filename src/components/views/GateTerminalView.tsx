import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { VisitorPermit, AdminTab } from '../../types';
import { QRScanner } from '../scanner/QRScanner';
import { InfoField } from '../common/InfoField';

interface GateTerminalViewProps {
  permits: VisitorPermit[];
  onCheckIn: (permitId: string) => Promise<void>;
  onCheckOut: (permitId: string) => Promise<void>;
  onNavigateTab: (tab: AdminTab) => void;
}

export function GateTerminalView({
  permits,
  onCheckIn,
  onCheckOut,
  onNavigateTab
}: GateTerminalViewProps) {
  const [scanFlash, setScanFlash] = useState<'success' | 'error' | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; permit?: VisitorPermit } | null>(null);

  const handleScan = useCallback((code: string) => {
    const permit = permits.find(p => p.qrCode === code || p.id === code);
    if (permit) {
      if (permit.status === 'active' || permit.status === 'pending') {
        setScanResult({ success: true, message: 'VALID PERMIT', permit });
        setScanFlash('success');
      } else if (permit.status === 'overstay') {
        setScanResult({ success: true, message: 'OVERSTAY DETECTED', permit });
        setScanFlash('error');
      } else {
        setScanResult({ success: false, message: 'PERMIT EXPIRED', permit });
        setScanFlash('error');
      }
    } else {
      setScanResult({ success: false, message: 'INVALID QR CODE' });
      setScanFlash('error');
    }
    setTimeout(() => setScanFlash(null), 1500);
  }, [permits]);

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-page)] z-30 flex flex-col">
      <div className={`absolute inset-0 pointer-events-none z-50 ${scanFlash === 'success' ? 'animate-flash-success' : scanFlash === 'error' ? 'animate-flash-error' : ''}`} />
      
      <header className="h-20 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4 lg:px-10 bg-[var(--color-bg-card)]">
        <div className="flex items-center gap-4 lg:gap-6">
          <button 
            onClick={() => onNavigateTab('dashboard')} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-all shrink-0"
          >
            <X size={20} />
          </button>
          <h1 className="text-xl lg:text-2xl font-display font-bold tracking-tight">Gate Terminal</h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 bg-[var(--color-bg-raised)] px-3 lg:px-4 py-2 rounded-full border border-[var(--color-border-subtle)]">
          <div className="w-2 h-2 rounded-full bg-[var(--color-status-success)] animate-pulse" />
          <span className="text-[10px] lg:text-[11px] font-bold tracking-wider text-[var(--color-status-success)]">SCANNER ACTIVE</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-2xl my-auto">
          <div className={scanResult ? 'hidden' : 'flex flex-col gap-8'}>
            <div className="relative aspect-square glass-panel flex items-center justify-center overflow-hidden">
              <div className="absolute inset-10 border-2 border-[var(--color-border-focus)] animate-scan-pulse pointer-events-none z-10 rounded-3xl" />
              
              <AnimatePresence>
                {scanFlash === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-status-success-dim)] backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-24 h-24 rounded-full bg-[var(--color-status-success)] flex items-center justify-center text-white shadow-[0_0_40px_rgba(0,255,0,0.3)]"
                    >
                      <Check size={48} strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                )}
                {scanFlash === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-status-error-dim)] backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-24 h-24 rounded-full bg-[var(--color-status-error)] flex items-center justify-center text-white shadow-[0_0_40px_rgba(255,0,0,0.3)]"
                    >
                      <X size={48} strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full h-full opacity-60">
                <QRScanner onScan={handleScan} isActive={!scanResult} />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)]">POSITION QR CODE WITHIN FRAME</p>
              <p className="text-[10px] text-[var(--color-status-warning)]">If camera is blocked, allow camera permissions in browser settings.</p>
            </div>
          </div>

          <div className={!scanResult ? 'hidden' : 'flex flex-col justify-center'}>
            <AnimatePresence mode="wait">
              {scanResult && (
                <motion.div 
                  key={scanResult.message}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-10 rounded-3xl border flex flex-col gap-8 shadow-2xl ${
                    scanResult.permit?.status === 'overstay'
                      ? 'bg-[var(--color-status-error-dim)] border-[#FF0000] shadow-[#FF0000]/10'
                      : scanResult.success 
                        ? 'bg-[var(--color-status-success-dim)] border-[var(--color-status-success)] shadow-[var(--color-status-success)]/10' 
                        : 'bg-[var(--color-status-error-dim)] border-[var(--color-status-error)] animate-shake shadow-[var(--color-status-error)]/10'
                  }`}
                >
                  <div>
                    <h2 className={`text-4xl font-display font-bold tracking-tight ${scanResult.permit?.status === 'overstay' ? 'text-[#FF0000]' : scanResult.success ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}`}>
                      {scanResult.message}
                    </h2>
                    <p className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] mt-2">SYSTEM RESPONSE</p>
                  </div>

                  {scanResult.permit && (
                    <div className="space-y-8 border-t border-[var(--color-border-subtle)] pt-8">
                      <div className="grid grid-cols-2 gap-8">
                        <InfoField label="VISITOR" value={scanResult.permit.visitorName} />
                        <InfoField label="VEHICLE" value={scanResult.permit.vehicleNumber} mono />
                        <InfoField label="FLAT" value={scanResult.permit.flatNumber} />
                        <InfoField label="SLOT" value={scanResult.permit.slotId || 'UNASSIGNED'} mono />
                      </div>
                      
                      <div className="pt-4">
                        {scanResult.permit.entryStatus === 'out' ? (
                          <button 
                            onClick={async () => {
                              await onCheckIn(scanResult.permit!.id);
                              setScanResult(null);
                            }}
                            className="w-full bg-[var(--color-status-success)] text-[var(--color-bg-page)] py-5 rounded-xl font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-all shadow-lg shadow-[var(--color-status-success)]/20 hover:-translate-y-0.5"
                          >
                            CONFIRM ENTRY
                          </button>
                        ) : (
                          <button 
                            onClick={async () => {
                              await onCheckOut(scanResult.permit!.id);
                              setScanResult(null);
                            }}
                            className="w-full bg-[var(--color-status-warning)] text-[var(--color-bg-page)] py-5 rounded-xl font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-all shadow-lg shadow-[var(--color-status-warning)]/20 hover:-translate-y-0.5"
                          >
                            CONFIRM EXIT
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setScanResult(null)}
                    className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] transition-colors text-left"
                  >
                    RESET SCANNER
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
