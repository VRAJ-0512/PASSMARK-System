import React from 'react';
import { VisitorPermit } from '../../types';

interface StatusBadgeProps {
  status: VisitorPermit['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    active: 'bg-[var(--color-status-success-dim)] text-[var(--color-status-success)] border-[var(--color-status-success)]',
    pending: 'bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)]',
    expired: 'bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] border-[var(--color-border-subtle)]',
    overstay: 'bg-[var(--color-status-error-dim)] text-[var(--color-status-error)] border-[var(--color-status-error)] animate-pulse'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
}
