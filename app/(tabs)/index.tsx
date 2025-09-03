import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Wifi, Plus, RefreshCw, Tv, WifiOff } from 'lucide-react-native';
import { storageService } from '@/services/storage';
import { rokuService } from '@/services/roku';
import { RokuDevice } from '@/types';

export default function DevicesTab() {
  const [devices, setDevices] = useState<RokuDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualIP, setManualIP] = useState('');
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const storedDevices = await storageService.getDevices();
    setDevices(sortDevices(storedDevices));
  };

  const sortDevices = (deviceList: RokuDevice[]) => {
    return deviceList.sort((a, b) => {
      // Manual devices first
      if (a.isManual && !b.isManual) return -1;
      if (!a.isManual && b.isManual) return 1;
      // Otherwise, keep original order
      return 0;
    });
  };

  const refreshDevices = async () => {
    setIsLoading(true);
    
    try {
      storageService.addLog({
        type: 'info',
        message: 'Starting device discovery...',
      });

      const discoveredDevices = await rokuService.discoverDevices();
      
      // Merge with existing manual devices
      const existingDevices = await storageService.getDevices();
      const manualDevices = existingDevices.filter(d => d.isManual);
      
      // Update online status for manual devices
      for (const device of manualDevices) {
        device.isOnline = await rokuService.pingDevice(device.ip);
        if (device.isOnline) {
          device.lastSeen = new Date();
        }
      }
      
      const allDevices = [...discoveredDevices, ...manualDevices];
      
      await storageService.saveDevices(allDevices);
      setDevices(sortDevices(allDevices));
      
      storageService.addLog({
        type: 'success',
        message: `Discovery complete. Found ${discoveredDevices.length} devices, ${manualDevices.length} manual entries`,
      });
    } catch (error) {
      storageService.addLog({
        type: 'error',
        message: `Device discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addManualDevice = async () => {
    if (!manualIP.trim()) {
      Alert.alert('Error', 'Please enter an IP address');
      return;
    }

    setIsLoading(true);
    
    try {
      storageService.addLog({
        type: 'info',
        message: `Validating device at ${manualIP}...`,
      });

      const validation = await rokuService.validateRokuDevice(manualIP);
      
      const newDevice = rokuService.createManualDevice(
        manualIP, 
        manualName.trim() || validation.name
      );
      
      newDevice.isOnline = validation.isValid;
      
      const existingDevices = await storageService.getDevices();
      const deviceExists = existingDevices.some(d => d.ip === manualIP);
      
      if (deviceExists) {
        Alert.alert('Error', 'Device with this IP already exists');
        return;
      }
      
      const updatedDevices = [...existingDevices, newDevice];
      await storageService.saveDevices(updatedDevices);
      setDevices(updatedDevices);
      
      setShowAddModal(false);
      setManualIP('');
      setManualName('');
      
      storageService.addLog({
        type: validation.isValid ? 'success' : 'warning',
        message: validation.isValid 
          ? `Added device: ${newDevice.name} (${manualIP})`
          : `Added device: ${newDevice.name} (${manualIP}) - Could not verify Roku connection`,
      });
    } catch (error) {
      storageService.addLog({
        type: 'error',
        message: `Failed to add device: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove ${device.name}?${device.isManual ? '' : ' (Auto-discovered)'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedDevices = devices.filter(d => d.id !== deviceId);
            await storageService.saveDevices(updatedDevices);
            setDevices(sortDevices(updatedDevices)); // keep manual devices on top
            
            storageService.addLog({
              type: 'info',
              message: `Removed device: ${device.name}${device.isManual ? '' : ' (Auto-discovered)'}`,
            });
          },
        },
      ]
    );
  };

  const testPowerOff = async (device: RokuDevice) => {
    try {
      storageService.addLog({
        type: 'info',
        message: `Testing power off for ${device.name}...`,
        deviceName: device.name,
      });

      const result = await rokuService.sendPowerOff(device.ip);
      
      if (result.success) {
        Alert.alert('Success', `Power off command sent to ${device.name}`);
        storageService.addLog({
          type: 'success',
          message: `Test power off successful for ${device.name}`,
          deviceName: device.name,
        });
      } else {
        Alert.alert('Error', `Failed to send command: ${result.error}`);
        storageService.addLog({
          type: 'error',
          message: `Test power off failed for ${device.name}: ${result.error}`,
          deviceName: device.name,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send power off command');
      storageService.addLog({
        type: 'error',
        message: `Test power off error for ${device.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        deviceName: device.name,
      });
    }
  };

  const renderDevice = ({ item }: { item: RokuDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceTitleRow}>
            <Tv size={20} color="#374151" />
            <Text style={styles.deviceName}>{item.name}</Text>
          </View>
          <Text style={styles.deviceIP}>{item.ip}</Text>
          <View style={styles.deviceStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: item.isOnline ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.statusText}>
              {item.isOnline ? 'Online' : 'Offline'}
            </Text>
            {item.isManual && (
              <Text style={styles.manualTag}>Manual</Text>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.deviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.testButton]}
          onPress={() => testPowerOff(item)}
        >
          <Text style={styles.testButtonText}>Test Power Off</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removeDevice(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Roku Devices</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={refreshDevices}
            disabled={isLoading}
          >
            <RefreshCw 
              size={24} 
              color="#FFFFFF" 
              style={isLoading ? { opacity: 0.5 } : {}} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortDevices(devices)}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.devicesList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshDevices}
            tintColor="#8B5CF6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <WifiOff size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Devices Found</Text>
            <Text style={styles.emptyDescription}>
              Pull down to refresh or add a device manually
            </Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Manual Device</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IP Address *</Text>
              <TextInput
                style={styles.textInput}
                value={manualIP}
                onChangeText={setManualIP}
                placeholder="192.168.1.100"
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Device Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={manualName}
                onChangeText={setManualName}
                placeholder="Living Room TV"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addManualDevice}
                disabled={isLoading}
              >
                <Text style={styles.addButtonText}>
                  {isLoading ? 'Adding...' : 'Add Device'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  devicesList: {
    padding: 16,
    paddingBottom: 100,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  deviceIP: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  manualTag: {
    fontSize: 10,
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
  },
  testButton: {
    backgroundColor: '#3B82F6',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    flex: 0.5,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});