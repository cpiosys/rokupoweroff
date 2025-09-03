export interface RokuDevice {
  id: string;
  name: string;
  ip: string;
  isManual: boolean;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Schedule {
  id: string;
  deviceId: string;
  deviceName: string;
  time: string; // HH:MM format
  days: number[]; // 0=Sunday, 1=Monday, etc.
  isEnabled: boolean;
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  deviceName?: string;
}

export interface AppSettings {
  discoveryEnabled: boolean;
  schedulerEnabled: boolean;
  logRetentionDays: number;
}