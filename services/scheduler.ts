import { storageService } from './storage';
import { rokuService } from './roku';
import { Schedule } from '@/types';

class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    storageService.addLog({
      type: 'info',
      message: 'Scheduler started - checking every minute',
    });

    // Check immediately, then every minute
    this.checkSchedules();
    this.intervalId = setInterval(() => {
      this.checkSchedules();
    }, 60000); // 1 minute
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    
    storageService.addLog({
      type: 'info',
      message: 'Scheduler stopped',
    });
  }

  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  private async checkSchedules(): Promise<void> {
    try {
      const schedules = await storageService.getSchedules();
      const devices = await storageService.getDevices();
      const now = new Date();
      
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();

      for (const schedule of schedules) {
        if (!schedule.isEnabled) continue;

        // Check if current time matches schedule time
        if (schedule.time === currentTime) {
          // Check if today is included in schedule days (empty array means every day)
          if (schedule.days.length === 0 || schedule.days.includes(currentDay)) {
            const device = devices.find(d => d.id === schedule.deviceId);
            
            if (device) {
              await this.executeSchedule(schedule, device);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking schedules:', error);
      storageService.addLog({
        type: 'error',
        message: `Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async executeSchedule(schedule: Schedule, device: any): Promise<void> {
    storageService.addLog({
      type: 'info',
      message: `Executing schedule for ${device.name} (${device.ip})`,
      deviceName: device.name,
    });

    const result = await rokuService.sendPowerOff(device.ip);

    if (result.success) {
      storageService.addLog({
        type: 'success',
        message: `Power off command sent successfully to ${device.name}`,
        deviceName: device.name,
      });
    } else {
      storageService.addLog({
        type: 'error',
        message: `Failed to send power off command to ${device.name}: ${result.error || 'Unknown error'}`,
        deviceName: device.name,
      });
    }
  }
}

export const schedulerService = new SchedulerService();