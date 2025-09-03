import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { Settings, Power, Trash2, Info } from 'lucide-react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { storageService } from '@/services/storage';
import { schedulerService } from '@/services/scheduler';
import { rokuService } from '@/services/roku';
import { AppSettings } from '@/types';

export default function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings>({
    discoveryEnabled: true,
    schedulerEnabled: true,
    logRetentionDays: 7,
  });
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);

  useEffect(() => {
    loadSettings();
    setIsSchedulerRunning(schedulerService.isSchedulerRunning());
  }, []);

  const loadSettings = async () => {
    const storedSettings = await storageService.getSettings();
    setSettings(storedSettings);
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    await storageService.saveSettings(updatedSettings);
    
    storageService.addLog({
      type: 'info',
      message: `Settings updated: ${key} = ${value}`,
    });
  };

  const testAllDevices = async () => {
    Alert.alert(
      'Test All Devices',
      'This will send a power off command to all devices. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test All',
          style: 'default',
          onPress: async () => {
            const devices = await storageService.getDevices();
            
            storageService.addLog({
              type: 'info',
              message: `Testing power off for ${devices.length} devices...`,
            });

            for (const device of devices) {
              const result = await rokuService.sendPowerOff(device.ip);
              
              storageService.addLog({
                type: result.success ? 'success' : 'error',
                message: `Test command for ${device.name}: ${result.success ? 'Success' : `Failed - ${result.error}`}`,
                deviceName: device.name,
              });
            }
            
            Alert.alert('Test Complete', `Tested ${devices.length} devices. Check the logs for results.`);
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all devices, schedules, and logs. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                storageService.saveDevices([]),
                storageService.saveSchedules([]),
                storageService.clearLogs(),
              ]);
              
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const toggleScheduler = () => {
    if (isSchedulerRunning) {
      schedulerService.stop();
      setIsSchedulerRunning(false);
    } else {
      schedulerService.start();
      setIsSchedulerRunning(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduler</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Background Scheduler</Text>
              <Text style={styles.settingDescription}>
                Automatically check schedules every minute
              </Text>
            </View>
            <Switch
              value={isSchedulerRunning}
              onValueChange={toggleScheduler}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Device Discovery</Text>
              <Text style={styles.settingDescription}>
                Automatically discover Roku devices on network
              </Text>
            </View>
            <Switch
              value={settings.discoveryEnabled}
              onValueChange={(value) => updateSetting('discoveryEnabled', value)}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={testAllDevices}>
            <View style={styles.actionButtonContent}>
              <Power size={20} color="#3B82F6" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Test All Devices</Text>
                <Text style={styles.actionDescription}>
                  Send power off command to all devices
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={clearAllData}>
            <View style={styles.actionButtonContent}>
              <Trash2 size={20} color="#EF4444" />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: '#EF4444' }]}>
                  Clear All Data
                </Text>
                <Text style={styles.actionDescription}>
                  Remove all devices, schedules, and logs
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.infoCard}>
            <Info size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Roku Power Scheduler</Text>
              <Text style={styles.infoDescription}>
                Schedule automatic power off for your Roku devices. This app uses the Roku External Control Protocol (ECP) to send commands over your local network.
              </Text>
            </View>
          </View>

          <View style={styles.limitationsCard}>
            <AlertTriangle size={20} color="#F59E0B" />
            <View style={styles.infoContent}>
              <Text style={styles.warningTitle}>Platform Limitations</Text>
              <Text style={styles.warningDescription}>
                Network discovery and background scheduling may have limitations when running in a web browser. For full functionality, use the native mobile app.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  limitationsCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});