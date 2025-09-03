import AsyncStorage from '@react-native-async-storage/async-storage';
import { RokuDevice, Schedule, LogEntry, AppSettings } from '@/types';

const STORAGE_KEYS = {
  DEVICES: 'roku_devices',
  SCHEDULES: 'roku_schedules', 
  LOGS: 'roku_logs',
  SETTINGS: 'app_settings',
} as const;

class StorageService {
  // Device storage
  async getDevices(): Promise<RokuDevice[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading devices:', error);
      return [];
    }
  }

  async saveDevices(devices: RokuDevice[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
    } catch (error) {
      console.error('Error saving devices:', error);
    }
  }

  // Schedule storage
  async getSchedules(): Promise<Schedule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (data) {
        const schedules = JSON.parse(data);
        return schedules.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading schedules:', error);
      return [];
    }
  }

  async saveSchedules(schedules: Schedule[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  }

  // Log storage
  async getLogs(): Promise<LogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
      if (data) {
        const logs = JSON.parse(data);
        return logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading logs:', error);
      return [];
    }
  }

  async addLog(logEntry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logs = await this.getLogs();
      const newLog: LogEntry = {
        ...logEntry,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      
      logs.unshift(newLog);
      
      // Keep only last 1000 logs
      const trimmedLogs = logs.slice(0, 1000);
      
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LOGS);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  // Settings storage
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        discoveryEnabled: true,
        schedulerEnabled: true,
        logRetentionDays: 7,
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        discoveryEnabled: true,
        schedulerEnabled: true,
        logRetentionDays: 7,
      };
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}

export const storageService = new StorageService();