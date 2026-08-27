import React, { useState, useMemo } from 'react';
import { QrCode, Search } from 'lucide-react';
import { VisitorPermit } from '../../types';
import { FilterButton } from '../common/FilterButton';
import { StatusBadge } from '../common/StatusBadge';
import { formatTime } from '../../utils/dateUtils';

interface PermitsViewProps {
  permits: VisitorPermit[];
  onOpenQR: (permit: VisitorPermit) => void;
  onCheckOut: (permitId: string) => void;
}

export function PermitsView({
  permits,
  onOpenQR,
  onCheckOut
}: PermitsViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'overstay' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      const matchesSearch = p.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.flatNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [permits, searchQuery, filterStatus]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Permit Registry</h2>
          <p className="text-[var(--color-text-ghost)] mt-1">Manage active, pending and historical gate passes.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-ghost)]" />
            <input 
              type="text"
              placeholder="Search visitor, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-[var(--color-bg-raised)] p-1 rounded-2xl lg:rounded-full border border-[var(--color-border-subtle)]">
            <FilterButton label="ALL" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
            <FilterButton label="ACTIVE" active={filterStatus === 'active'} onClick={() => setFilterStatus('active')} />
            <FilterButton label="PENDING" active={filterStatus === 'pending'} onClick={() => setFilterStatus('pending')} />
            <FilterButton label="EXPIRED" active={filterStatus === 'expired'} onClick={() => setFilterStatus('expired')} />
            <FilterButton label="OVERSTAY" active={filterStatus === 'overstay'} onClick={() => setFilterStatus('overstay')} />
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="grid grid-cols-[3fr_4.5fr_auto] lg:grid-cols-7 gap-3 lg:gap-4 px-4 lg:px-8 py-4 lg:py-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)]/50">
          <span className="hidden lg:block text-label">ID</span>
          <span className="text-label lg:col-span-2">VISITOR</span>
          <span className="text-label">VEHICLE</span>
          <span className="hidden lg:block text-label">FLAT</span>
          <span className="hidden lg:block text-label text-center">QR</span>
          <span className="text-label text-right lg:text-center">STATUS</span>
        </div>
        
        <div className="flex flex-col divide-y divide-[var(--color-border-subtle)]">
          {filteredPermits.map(permit => (
            <div key={permit.id} className="grid grid-cols-[3fr_4.5fr_auto] lg:grid-cols-7 gap-3 lg:gap-4 px-4 lg:px-8 py-4 lg:py-5 hover:bg-[var(--color-bg-raised)] transition-colors duration-200 items-center group">
              <span className="hidden lg:block font-mono text-[13px] text-[var(--color-text-ghost)]">{permit.id}</span>
              
              <div className="flex flex-col lg:col-span-2 overflow-hidden">
                <span className="text-sm font-bold truncate">{permit.visitorName}</span>
                <span className="text-[11px] lg:hidden text-[var(--color-text-ghost)] mt-1 truncate">Flat: {permit.flatNumber}</span>
                <span className="hidden lg:block font-mono text-[11px] text-[var(--color-text-ghost)] mt-1">
                  {formatTime(permit.entryTime)}
                </span>
              </div>
              
              <div className="flex flex-col items-start overflow-hidden">
                <span className="font-mono text-[11px] lg:text-[13px] bg-[var(--color-bg-raised)] px-2 py-1 rounded lg:rounded-md w-fit border border-[var(--color-border-subtle)] whitespace-nowrap">{permit.vehicleNumber}</span>
                <span className="lg:hidden font-mono text-[10px] text-[var(--color-text-ghost)] mt-1.5">
                  {formatTime(permit.entryTime)}
                </span>
              </div>
              
              <span className="hidden lg:block text-sm font-medium text-[var(--color-text-ghost)]">{permit.flatNumber}</span>
              
              <div className="hidden lg:flex items-center justify-center">
                <button 
                  onClick={() => onOpenQR(permit)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-all"
                  title="View QR Code"
                >
                  <QrCode size={18} />
                </button>
              </div>
              
              <div className="flex flex-col items-end lg:flex-row lg:items-center justify-between gap-2 lg:gap-0 w-full">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpenQR(permit)}
                    className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] shrink-0 transition-colors"
                  >
                    <QrCode size={14} />
                  </button>
                  <StatusBadge status={permit.status} />
                </div>
                <div className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  {(permit.status === 'active' || permit.status === 'overstay') && permit.entryStatus === 'in' && (
                    <button 
                      onClick={() => onCheckOut(permit.id)}
                      className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-status-warning)] hover:text-[var(--color-text-primary)] transition-colors mt-2 lg:mt-0"
                    >
                      CHECK OUT
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredPermits.length === 0 && (
            <div className="p-12 text-center text-[var(--color-text-ghost)] text-sm">
              No permits found matching criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
