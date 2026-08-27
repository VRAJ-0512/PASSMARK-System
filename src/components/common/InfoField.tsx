import React from 'react';

interface InfoFieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function InfoField({ label, value, mono = false }: InfoFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label">{label}</span>
      <span className={`text-base font-bold truncate ${mono ? 'font-mono text-sm' : ''}`}>
        {value}
      </span>
    </div>
  );
}
