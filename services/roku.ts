import { Platform } from 'react-native';
import { RokuDevice } from '@/types';

class RokuService {
  private discoveredDevices: Map<string, RokuDevice> = new Map();

  // Discover Roku devices on the network
  async discoverDevices(): Promise<RokuDevice[]> {
    if (Platform.OS === 'web') {
      // Web platform has limitations for network discovery
      // Return mock data for demonstration
      return this.getMockDevices();
    }

    try {
      // On native platforms, we would use SSDP discovery
      // For now, return mock data
      return this.getMockDevices();
    } catch (error) {
      console.error('Error discovering devices:', error);
      return [];
    }
  }

  private getMockDevices(): RokuDevice[] {
    return [
      {
        id: 'roku-1',
        name: 'Living Room TV',
        ip: '192.168.1.100',
        isManual: false,
        isOnline: true,
        lastSeen: new Date(),
      },
      {
        id: 'roku-2',
        name: 'Bedroom TV',
        ip: '192.168.1.101',
        isManual: false,
        isOnline: true,
        lastSeen: new Date(),
      },
    ];
  }

  // Validate if IP address hosts a Roku device
  async validateRokuDevice(ip: string): Promise<{ isValid: boolean; name?: string }> {
    try {
      // Roku devices respond to /query/device-info
      const response = await fetch(`http://${ip}:8060/query/device-info`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        const xml = await response.text();
        // Parse XML to get device name
        const nameMatch = xml.match(/<friendly-device-name>(.*?)<\/friendly-device-name>/);
        const name = nameMatch ? nameMatch[1] : `Roku at ${ip}`;
        
        return { isValid: true, name };
      }

      return { isValid: false };
    } catch (error) {
      console.error('Error validating Roku device:', error);
      return { isValid: false };
    }
  }

  // Send power off command to Roku device
  async sendPowerOff(ip: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Roku ECP power off command
      const response = await fetch(`http://${ip}:8060/keypress/Power`, {
        method: 'POST',
        timeout: 3000,
      });

      return { success: response.ok };
    } catch (error) {
      console.error('Error sending power off command:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if device is online
  async pingDevice(ip: string): Promise<boolean> {
    try {
      const response = await fetch(`http://${ip}:8060/query/device-info`, {
        method: 'GET',
        timeout: 3000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Create manual device entry
  createManualDevice(ip: string, name?: string): RokuDevice {
    return {
      id: `manual-${ip.replace(/\./g, '-')}`,
      name: name || `Roku at ${ip}`,
      ip,
      isManual: true,
      isOnline: false,
      lastSeen: new Date(),
    };
  }
}

export const rokuService = new RokuService();