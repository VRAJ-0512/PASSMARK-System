import { SystemLog } from '../types';

export function exportLogsToCSV(logs: SystemLog[]): void {
  const headers = ['Timestamp', 'Type', 'Details', 'Reference ID', 'Status'];
  const rows = logs.map(l => [
    new Date(l.created_at).toLocaleString(),
    l.type,
    `"${(l.details || '').replace(/"/g, '""')}"`,
    l.ref_id || 'N/A',
    l.status
  ]);
  
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `passmark-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
