import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between gap-4">
      <div className="flex justify-between items-start">
        <span className="text-label">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl sm:text-4xl font-display font-bold tracking-tight">{value}</span>
        {trend && (
          <span className="font-mono text-[11px] text-[var(--color-text-ghost)] uppercase tracking-wider">{trend}</span>
        )}
      </div>
    </div>
  );
}
