import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { VisitorPermit } from '../../types';
import { InfoField } from '../common/InfoField';
import { formatDateTime } from '../../utils/dateUtils';

interface QRCodeModalProps {
  permit: VisitorPermit | null;
  onClose: () => void;
}

export function QRCodeModal({ permit, onClose }: QRCodeModalProps) {
  if (!permit) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
        exit={{ scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
        className="fixed top-1/2 left-1/2 w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl shadow-2xl z-50 p-8 flex flex-col items-center text-center gap-6"
      >
        <div className="w-full flex justify-between items-start">
          <div className="text-left">
            <h2 className="text-2xl font-display font-bold tracking-tight">Digital Gate Pass</h2>
            <p className="text-[11px] font-bold tracking-widest text-[var(--color-text-ghost)] uppercase mt-1">
              {permit.visitorName}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <QRCodeSVG value={permit.qrCode} size={200} />
        </div>

        <div className="grid grid-cols-2 gap-4 w-full text-left bg-[var(--color-bg-raised)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
          <InfoField label="VEHICLE" value={permit.vehicleNumber} mono />
          <InfoField label="PASS ID" value={permit.id} mono />
          <div className="col-span-2">
            <InfoField label="VALID UNTIL" value={formatDateTime(permit.expiryTime)} />
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[var(--color-border-focus)] transition-colors"
          >
            <Printer size={14} /> Print Pass
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg-page)] rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
