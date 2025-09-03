import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Tv, WifiOff } from 'lucide-react-native';
import { RokuDevice } from '@/types';

interface DevicePickerProps {
  devices: RokuDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
}

export function DevicePicker({ devices, selectedDeviceId, onSelectDevice }: DevicePickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Tv size={16} color="#374151" />
        <Text style={styles.label}>Select Device</Text>
      </View>
      
      <ScrollView 
        style={styles.deviceList}
        showsVerticalScrollIndicator={false}
      >
        {devices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={[
              styles.deviceOption,
              selectedDeviceId === device.id && styles.deviceOptionSelected,
            ]}
            onPress={() => onSelectDevice(device.id)}
          >
            <View style={styles.deviceInfo}>
              <Text
                style={[
                  styles.deviceName,
                  selectedDeviceId === device.id && styles.deviceNameSelected,
                ]}
              >
                {device.name}
              </Text>
              <Text
                style={[
                  styles.deviceIP,
                  selectedDeviceId === device.id && styles.deviceIPSelected,
                ]}
              >
                {device.ip}
              </Text>
            </View>
            
            <View style={styles.deviceStatus}>
              {device.isOnline ? (
                <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              ) : (
                <WifiOff size={16} color="#EF4444" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {devices.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No devices available. Add a device first.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deviceList: {
    maxHeight: 200,
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  deviceOptionSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  deviceNameSelected: {
    color: '#6D28D9',
  },
  deviceIP: {
    fontSize: 14,
    color: '#6B7280',
  },
  deviceIPSelected: {
    color: '#7C3AED',
  },
  deviceStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});