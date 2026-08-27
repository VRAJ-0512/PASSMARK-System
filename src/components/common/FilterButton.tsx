import React from 'react';

interface FilterButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function FilterButton({ label, active = false, onClick }: FilterButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 text-[11px] font-bold tracking-wider rounded-full transition-all ${
        active 
          ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' 
          : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}
