export interface UserProfile {
  id: string;
  role: 'admin' | 'guard' | 'user';
  email: string;
}

export interface VisitorPermit {
  id: string;
  visitorName: string;
  vehicleNumber: string;
  flatNumber: string;
  entryTime: string;
  expiryTime: string;
  status: 'active' | 'expired' | 'pending' | 'overstay';
  entryStatus: 'in' | 'out';
  qrCode: string;
  slotId?: string;
  checkOutTime?: string;
  user_id?: string;
}

export interface ParkingSlot {
  id: string;
  label: string;
  zone: 'A' | 'B' | 'C';
  isOccupied: boolean;
  currentVehicle?: string;
  permitId?: string;
}

export interface SystemLog {
  id: string;
  created_at: string;
  type: 'ENTRY' | 'EXIT' | 'SYSTEM' | 'ALERT';
  details: string;
  ref_id?: string;
  status: 'SUCCESS' | 'PENDING' | 'ERROR';
}

export interface FavoriteVisitor {
  id: string;
  name: string;
  vehicleNumber: string;
  userId: string;
}

export type AdminTab = 'dashboard' | 'permits' | 'gate' | 'slots' | 'logs' | 'config';
export type ResidentTab = 'guests' | 'vehicles' | 'support';
export type AppTab = AdminTab | 'resident';
export type ViewMode = 'admin' | 'user';
export type ThemeMode = 'dark' | 'light';
