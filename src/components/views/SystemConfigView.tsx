import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Check, X } from 'lucide-react';
import { UserProfile } from '../../types';

interface SystemConfigViewProps {
  useSupabase: boolean;
  userProfile: UserProfile | null;
  onResetToNineSlots: () => Promise<{ text: string; type: 'success' | 'error' }>;
  onResetData: () => Promise<{ text: string; type: 'success' | 'error' }>;
}

export function SystemConfigView({
  useSupabase,
  userProfile,
  onResetToNineSlots,
  onResetData
}: SystemConfigViewProps) {
  const [showNineSlotsConfirm, setShowNineSlotsConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (useSupabase && userProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldAlert size={64} className="text-[var(--color-status-error)] mb-6 opacity-80" />
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Access Denied</h2>
        <p className="text-[var(--color-text-ghost)] max-w-md">
          You do not have permission to view the system configuration. This area is restricted to administrators.
        </p>
      </div>
    );
  }

  const handleSyncSlots = async () => {
    setIsProcessing(true);
    const result = await onResetToNineSlots();
    setConfigMessage(result);
    setShowNineSlotsConfirm(false);
    setIsProcessing(false);
  };

  const handleFactoryReset = async () => {
    setIsProcessing(true);
    const result = await onResetData();
    setConfigMessage(result);
    setShowResetConfirm(false);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">System Configuration</h2>
        <p className="text-[var(--color-text-ghost)] mt-1">Manage application settings and database synchronization.</p>
      </div>
      
      <div className="glass-panel p-8 flex flex-col items-start gap-8">
        {configMessage && (
          <div className={`p-4 w-full rounded-xl border font-medium flex items-center gap-3 ${
            configMessage.type === 'success' 
              ? 'bg-[var(--color-status-success-dim)] border-[var(--color-status-success)] text-[var(--color-status-success)]' 
              : 'bg-[var(--color-status-error-dim)] border-[var(--color-status-error)] text-[var(--color-status-error)]'
          }`}>
            {configMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {configMessage.text}
          </div>
        )}

        <div className="space-y-4 w-full border-b border-[var(--color-border-subtle)] pb-8">
          <div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Database Sync</h3>
            <p className="text-sm text-[var(--color-text-ghost)] mt-1">Update your database to match the new 9-slot layout (3 per zone).</p>
          </div>
          
          {!showNineSlotsConfirm ? (
            <button 
              onClick={() => setShowNineSlotsConfirm(true)} 
              disabled={isProcessing}
              className="bg-[var(--color-text-primary)] text-[var(--color-bg-page)] px-6 py-3 rounded-xl font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-all shadow-lg hover:-translate-y-0.5 w-full sm:w-auto disabled:opacity-50"
            >
              Sync Database to 9 Slots
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[var(--color-bg-raised)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-sm text-[var(--color-status-warning)] font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>This will recreate all current slots to 9 slots. Continue?</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleSyncSlots} 
                  disabled={isProcessing}
                  className="bg-[var(--color-status-warning)] text-[var(--color-bg-page)] px-4 py-2 rounded-lg font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-all flex-1 sm:flex-none disabled:opacity-50"
                >
                  {isProcessing ? 'Syncing...' : 'Confirm'}
                </button>
                <button 
                  onClick={() => setShowNineSlotsConfirm(false)} 
                  disabled={isProcessing}
                  className="text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] px-4 py-2 rounded-lg uppercase font-bold tracking-[0.08em] transition-colors flex-1 sm:flex-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 w-full">
          <div>
            <h3 className="text-lg font-medium text-[var(--color-status-error)]">Danger Zone</h3>
            <p className="text-sm text-[var(--color-text-ghost)] mt-1">Reset all permits and slots to their initial factory default state.</p>
          </div>
          
          {!showResetConfirm ? (
            <button 
              onClick={() => setShowResetConfirm(true)} 
              disabled={isProcessing}
              className="border border-[var(--color-status-error)] text-[var(--color-status-error)] px-6 py-3 rounded-xl font-bold uppercase tracking-[0.08em] hover:bg-[var(--color-status-error-dim)] transition-colors w-full sm:w-auto disabled:opacity-50"
            >
              Factory Reset
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[var(--color-status-error-dim)] p-4 rounded-xl border border-[var(--color-status-error)]">
              <span className="text-sm text-[var(--color-status-error)] font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Delete all current data and restore initial presets?</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleFactoryReset} 
                  disabled={isProcessing}
                  className="bg-[var(--color-status-error)] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-all flex-1 sm:flex-none disabled:opacity-50"
                >
                  {isProcessing ? 'Resetting...' : 'Confirm Reset'}
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)} 
                  disabled={isProcessing}
                  className="text-[var(--color-status-error)] hover:text-white px-4 py-2 rounded-lg uppercase font-bold tracking-[0.08em] transition-colors flex-1 sm:flex-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
