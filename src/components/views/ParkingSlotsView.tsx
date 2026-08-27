import React, { useState } from 'react';
import { ParkingSlot, VisitorPermit } from '../../types';

interface ParkingSlotsViewProps {
  slots: ParkingSlot[];
  permits: VisitorPermit[];
  onForceRelease: (permitId: string) => void;
}

export function ParkingSlotsView({
  slots,
  permits,
  onForceRelease
}: ParkingSlotsViewProps) {
  const [activeZone, setActiveZone] = useState<'A' | 'B' | 'C'>('A');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Parking Inventory</h2>
          <p className="text-[var(--color-text-ghost)] mt-1">Real-time slot allocation and occupancy status.</p>
        </div>
        <div className="flex gap-2">
          {(['A', 'B', 'C'] as const).map(zone => (
            <button 
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] rounded-full transition-colors ${
                activeZone === zone 
                  ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]' 
                  : 'bg-transparent text-[var(--color-text-ghost)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-focus)]'
              }`}
            >
              ZONE {zone}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {slots.filter(s => s.zone === activeZone).map(slot => {
          const permit = slot.permitId ? permits.find(p => p.id === slot.permitId) : undefined;
          const isOverstay = permit?.status === 'overstay';
          
          return (
            <div 
              key={slot.id}
              className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-6 ${
                isOverstay
                  ? 'bg-[var(--color-status-error-dim)] border-[#FF0000] shadow-lg shadow-red-500/5'
                  : slot.isOccupied 
                    ? 'bg-[var(--color-bg-card)] border-[var(--color-border-subtle)] shadow-sm' 
                    : 'bg-[var(--color-status-success-dim)] border-[var(--color-status-success)]/30 hover:border-[var(--color-status-success)]'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-base font-bold">{slot.id}</span>
                <div className="flex items-center gap-2">
                  {isOverstay && <span className="text-[10px] font-bold text-[#FF0000] animate-pulse">OVERSTAY</span>}
                  <div className={`w-2.5 h-2.5 rounded-full ${isOverstay ? 'bg-[#FF0000] animate-pulse' : slot.isOccupied ? 'bg-[var(--color-status-error)]' : 'bg-[var(--color-status-success)]'}`} />
                </div>
              </div>

              <div>
                {slot.isOccupied ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-base font-bold text-[var(--color-text-primary)]">{slot.currentVehicle || 'Vehicle In Slot'}</span>
                    <span className="font-mono text-xs text-[var(--color-text-ghost)]">Permit: {slot.permitId || 'N/A'}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-status-success)]">AVAILABLE</span>
                )}
              </div>

              {slot.isOccupied && (
                <button 
                  onClick={() => slot.permitId && onForceRelease(slot.permitId)}
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-status-warning)] hover:text-[var(--color-text-primary)] transition-colors text-left pt-2 border-t border-[var(--color-border-subtle)]"
                >
                  FORCE RELEASE
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
