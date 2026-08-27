export function formatDate(isoString: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? isoString : date.toLocaleDateString();
}

export function formatTime(isoString: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? isoString : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? isoString : date.toLocaleString();
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getExpiryFromHours(hours: number): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
}
