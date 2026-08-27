import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { VisitorPermit, ParkingSlot, AdminTab } from '../../types';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import { formatTime } from '../../utils/dateUtils';

interface DashboardViewProps {
  permits: VisitorPermit[];
  slots: ParkingSlot[];
  stats: {
    active: number;
    available: number;
    avgStay: string;
    alerts: number;
  };
  onNavigateTab: (tab: AdminTab) => void;
}

const CHART_DATA = [
  { name: 'MON', count: 12 },
  { name: 'TUE', count: 18 },
  { name: 'WED', count: 15 },
  { name: 'THU', count: 22 },
  { name: 'FRI', count: 30 },
  { name: 'SAT', count: 45 },
  { name: 'SUN', count: 38 },
];

export function DashboardView({
  permits,
  slots,
  stats,
  onNavigateTab
}: DashboardViewProps) {
  const [dashboardZone, setDashboardZone] = useState<'A' | 'B' | 'C'>('A');

  const zoneSlots = slots.filter(s => s.zone === dashboardZone);
  const occupiedCount = zoneSlots.filter(s => s.isOccupied).length;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="ACTIVE PERMITS" value={stats.active} trend="+2 TODAY" />
        <StatCard label="AVAILABLE SLOTS" value={stats.available} trend={`${slots.filter(s => s.isOccupied).length} OCCUPIED`} />
        <StatCard label="AVG STAY TIME" value={stats.avgStay} trend="-12% VS LAST WEEK" />
        <StatCard label="SECURITY ALERTS" value={stats.alerts} trend={stats.alerts > 0 ? "OVERSTAY DETECTED" : "ALL CLEAR"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-label">TRAFFIC ANALYSIS</h2>
            <div className="flex gap-2 bg-[var(--color-bg-raised)] p-1 rounded-full border border-[var(--color-border-subtle)]">
              <button className="px-4 py-1.5 text-[10px] font-bold tracking-wider rounded-full bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]">WEEKLY</button>
              <button className="px-4 py-1.5 text-[10px] font-bold tracking-wider rounded-full text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]">MONTHLY</button>
            </div>
          </div>
          <div className="h-[340px] w-full glass-panel p-8 relative min-h-[340px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-text-ghost)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-text-ghost)' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-bg-raised)' }}
                  contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                  {CHART_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? 'var(--color-accent)' : 'var(--color-border-subtle)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-label">ZONES PREVIEW</h2>
            <div className="flex gap-1 bg-[var(--color-bg-raised)] p-1 rounded-full border border-[var(--color-border-subtle)]">
              {(['A', 'B', 'C'] as const).map(zone => (
                <button 
                  key={zone}
                  onClick={() => setDashboardZone(zone)}
                  className={`w-8 h-8 flex items-center justify-center text-[11px] font-bold rounded-full transition-all ${
                    dashboardZone === zone 
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-sm' 
                      : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-6 glass-panel space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-sm font-bold text-[var(--color-text-ghost)]">ZONE</span>
                  <p className="text-3xl font-display font-bold">{dashboardZone}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] text-[var(--color-text-ghost)] uppercase tracking-widest">Occupied</span>
                  <p className="text-xl font-mono font-bold">{occupiedCount}<span className="text-[var(--color-text-ghost)]">/{zoneSlots.length}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {zoneSlots.map(slot => {
                  const isOverstay = slot.permitId && permits.find(p => p.id === slot.permitId)?.status === 'overstay';
                  return (
                    <div key={slot.id} className={`aspect-square border flex flex-col items-center justify-center rounded-xl gap-2 transition-colors ${isOverstay ? 'bg-[var(--color-status-error-dim)] border-[#FF0000]' : slot.isOccupied ? 'bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)]' : 'bg-[var(--color-bg-card)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-focus)]'}`}>
                      <span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{slot.id}</span>
                      <div className={`w-2 h-2 rounded-full ${isOverstay ? 'bg-[#FF0000] animate-pulse' : slot.isOccupied ? 'bg-[var(--color-text-muted)]' : 'bg-[var(--color-status-success)]'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-label">RECENT PERMITS</h2>
          <button 
            onClick={() => onNavigateTab('permits')} 
            className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            VIEW ALL <ChevronRight size={14} />
          </button>
        </div>
        <div className="glass-panel overflow-hidden">
          <div className="grid grid-cols-[3fr_4.5fr_auto] lg:grid-cols-6 gap-3 lg:gap-4 px-4 lg:px-6 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)]/50">
            <span className="hidden lg:block text-label">ID</span>
            <span className="text-label lg:col-span-2">VISITOR</span>
            <span className="text-label">VEHICLE</span>
            <span className="hidden lg:block text-label">FLAT</span>
            <span className="text-label text-right lg:text-center">STATUS</span>
          </div>
          <div className="flex flex-col divide-y divide-[var(--color-border-subtle)]">
            {permits.slice(0, 5).map(permit => (
              <div key={permit.id} className="grid grid-cols-[3fr_4.5fr_auto] lg:grid-cols-6 gap-3 lg:gap-4 px-4 lg:px-6 py-4 hover:bg-[var(--color-bg-raised)] transition-colors duration-200 items-center">
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
                
                <div className="flex justify-end lg:justify-center w-full">
                  <StatusBadge status={permit.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
