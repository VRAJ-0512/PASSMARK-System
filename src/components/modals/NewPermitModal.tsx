import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { VisitorPermit, ParkingSlot } from '../../types';
import { InfoField } from '../common/InfoField';

interface NewPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ParkingSlot[];
  onCreatePermit: (formData: { name: string; vehicle: string; flat: string; slotId: string }) => Promise<VisitorPermit | undefined>;
}

export function NewPermitModal({
  isOpen,
  onClose,
  slots,
  onCreatePermit
}: NewPermitModalProps) {
  const [newlyCreatedPermit, setNewlyCreatedPermit] = useState<VisitorPermit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const vehicle = formData.get('vehicle') as string;
    const flat = formData.get('flat') as string;
    const slotId = formData.get('slotId') as string;

    const permit = await onCreatePermit({ name, vehicle, flat, slotId });
    if (permit) {
      setNewlyCreatedPermit(permit);
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setNewlyCreatedPermit(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full max-w-md bg-[var(--color-bg-card)] border-l border-[var(--color-border-subtle)] shadow-2xl z-50 flex flex-col"
      >
        <div className="p-8 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Issue Permit</h2>
            <p className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] uppercase mt-1">Manual Gate Pass</p>
          </div>
          <button 
            onClick={handleClose} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {newlyCreatedPermit ? (
            <div className="space-y-8">
              <div className="p-8 bg-[var(--color-status-success-dim)] border border-[var(--color-status-success)] rounded-3xl flex flex-col items-center text-center gap-6 shadow-lg shadow-[var(--color-status-success)]/10">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <QRCodeSVG value={newlyCreatedPermit.qrCode} size={180} />
                </div>
                <p className="text-sm font-bold tracking-widest uppercase text-[var(--color-status-success)]">
                  {newlyCreatedPermit.status === 'pending' ? 'Pass Generated' : 'Access Granted'}
                </p>
              </div>
              
              <div className="space-y-6 bg-[var(--color-bg-raised)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
                <InfoField label="VISITOR" value={newlyCreatedPermit.visitorName} />
                <InfoField label="PERMIT ID" value={newlyCreatedPermit.id} mono />
                <InfoField label="SLOT" value={slots.find(s => s.id === newlyCreatedPermit.slotId)?.label || 'N/A'} mono />
              </div>

              <button 
                onClick={handleClose}
                className="w-full bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] py-4 rounded-xl font-bold uppercase tracking-[0.08em] hover:bg-[var(--color-border-focus)] transition-colors border border-[var(--color-border-subtle)]"
              >
                CLOSE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] uppercase">Visitor Name</label>
                  <input name="name" required type="text" placeholder="e.g. Deepa Krishnan" className="input-minimal text-base" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] uppercase">Vehicle Plate</label>
                  <input name="vehicle" required type="text" placeholder="e.g. MH 02 EF 9012" className="input-minimal text-base font-mono" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] uppercase">Host Flat</label>
                  <input name="flat" required type="text" placeholder="e.g. C-304" className="input-minimal text-base" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] uppercase">Assign Slot</label>
                  <select name="slotId" required className="input-minimal text-base font-mono bg-transparent appearance-none">
                    <option value="" className="bg-[var(--color-bg-card)]">Select Available Slot</option>
                    {slots.filter(s => !s.isOccupied).map(slot => (
                      <option key={slot.id} value={slot.id} className="bg-[var(--color-bg-card)]">{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--color-accent)] text-[var(--color-bg-page)] py-5 rounded-xl font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-all shadow-lg shadow-[var(--color-accent)]/20 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSubmitting ? 'GENERATING...' : 'GENERATE PERMIT'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
