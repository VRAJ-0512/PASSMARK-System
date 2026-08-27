import React from 'react';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import { SystemLog } from '../../types';
import { exportLogsToCSV } from '../../utils/exportUtils';
import { formatDateTime } from '../../utils/dateUtils';

interface AuditLogsViewProps {
  logs: SystemLog[];
}

export function AuditLogsView({ logs }: AuditLogsViewProps) {
  const handleExport = () => {
    if (logs.length === 0) {
      toast.error('No logs available to export');
      return;
    }
    exportLogsToCSV(logs);
    toast.success('Audit logs exported successfully');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">System Logs</h2>
          <p className="text-[var(--color-text-ghost)] mt-1">Audit trail and security event history.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.08em] rounded-full flex items-center justify-center gap-2 hover:bg-[var(--color-border-subtle)] transition-all border border-[var(--color-border-subtle)] w-full sm:w-auto"
        >
          <History size={16} />
          EXPORT TO CSV
        </button>
      </div>
      
      <div className="glass-panel overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-6 gap-4 px-8 py-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-raised)]/50">
            <span className="text-label">TIMESTAMP</span>
            <span className="text-label">EVENT TYPE</span>
            <span className="text-label col-span-2">DETAILS</span>
            <span className="text-label">ID / REF</span>
            <span className="text-label text-center">STATUS</span>
          </div>
          
          {logs.length === 0 ? (
            <div className="p-12 text-center text-[var(--color-text-ghost)] text-sm">
              No system logs available.
            </div>
          ) : (\n            <div className=\"flex flex-col divide-y divide-[var(--color-border-subtle)]\">\n              {logs.map((log) => (\n                <div key={log.id} className=\"grid grid-cols-6 gap-4 px-8 py-4 hover:bg-[var(--color-bg-raised)] transition-colors duration-200 items-center\">\n                  <span className=\"font-mono text-[12px] text-[var(--color-text-ghost)]\">\n                    {formatDateTime(log.created_at)}\n                  </span>\n                  <span className={`text-[11px] font-bold tracking-wider ${\n                    log.type === 'ENTRY' ? 'text-[var(--color-status-success)]' : \n                    log.type === 'EXIT' ? 'text-[var(--color-status-warning)]' : \n                    'text-[var(--color-accent)]'\n                  }`}>\n                    {log.type}\n                  </span>\n                  <span className=\"text-sm col-span-2 truncate\">{log.details}</span>\n                  <span className=\"font-mono text-[12px] text-[var(--color-text-ghost)]\">{log.ref_id || '-'}</span>\n                  <div className=\"flex justify-center\">\n                    <span className={`text-[10px] font-bold uppercase tracking-wider ${\n                      log.status === 'SUCCESS' ? 'text-[var(--color-status-success)]' : \n                      log.status === 'ERROR' ? 'text-[var(--color-status-error)]' : \n                      'text-[var(--color-status-warning)]'\n                    }`}>\n                      {log.status}\n                    </span>\n                  </div>\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}\n