import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Plus, Clock, Trash2, Calendar, CreditCard as Edit } from 'lucide-react-native';
import { storageService } from '@/services/storage';
import { schedulerService } from '@/services/scheduler';
import { RokuDevice, Schedule } from '@/types';
import { TimePickerComponent } from '@/components/TimePicker';
import { DaySelector } from '@/components/DaySelector';
import { DevicePicker } from '@/components/DevicePicker';

export default function SchedulesTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<RokuDevice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  
  // Form state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('20:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    loadData();
    setIsSchedulerRunning(schedulerService.isSchedulerRunning());
  }, []);

  const loadData = async () => {
    const [storedSchedules, storedDevices] = await Promise.all([
      storageService.getSchedules(),
      storageService.getDevices(),
    ]);
    setSchedules(storedSchedules);
    setDevices(storedDevices);
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

  const openAddModal = () => {
    setEditingSchedule(null);
    setSelectedDeviceId('');
    setSelectedTime('20:00');
    setSelectedDays([]);
    setShowAddModal(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedDeviceId(schedule.deviceId);
    setSelectedTime(schedule.time);
    setSelectedDays(schedule.days);
    setShowAddModal(true);
  };

  const saveSchedule = async () => {
    if (!selectedDeviceId) {
      Alert.alert('Error', 'Please select a device');
      return;
    }

    const device = devices.find(d => d.id === selectedDeviceId);
    if (!device) {
      Alert.alert('Error', 'Selected device not found');
      return;
    }

    try {
      const existingSchedules = await storageService.getSchedules();
      
      if (editingSchedule) {
        // Update existing schedule
        const updatedSchedules = existingSchedules.map(s =>
          s.id === editingSchedule.id
            ? {
                ...s,
                deviceId: selectedDeviceId,
                deviceName: device.name,
                time: selectedTime,
                days: selectedDays,
              }
            : s
        );
        
        await storageService.saveSchedules(updatedSchedules);
        setSchedules(updatedSchedules);
        
        storageService.addLog({
          type: 'info',
          message: `Updated schedule for ${device.name} at ${selectedTime}`,
        });
      } else {
        // Create new schedule
        const newSchedule: Schedule = {
          id: Date.now().toString(),
          deviceId: selectedDeviceId,
          deviceName: device.name,
          time: selectedTime,
          days: selectedDays,
          isEnabled: true,
          createdAt: new Date(),
        };

        const updatedSchedules = [...existingSchedules, newSchedule];
        await storageService.saveSchedules(updatedSchedules);
        setSchedules(updatedSchedules);
        
        storageService.addLog({
          type: 'success',
          message: `Created schedule for ${device.name} at ${selectedTime}`,
        });
      }

      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule');
      console.error('Error saving schedule:', error);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete the schedule for ${schedule.deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
            await storageService.saveSchedules(updatedSchedules);
            setSchedules(updatedSchedules);
            
            storageService.addLog({
              type: 'info',
              message: `Deleted schedule for ${schedule.deviceName}`,
            });
          },
        },
      ]
    );
  };

  const toggleScheduleEnabled = async (scheduleId: string) => {
    const updatedSchedules = schedules.map(s =>
      s.id === scheduleId ? { ...s, isEnabled: !s.isEnabled } : s
    );
    
    await storageService.saveSchedules(updatedSchedules);
    setSchedules(updatedSchedules);
    
    const schedule = updatedSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      storageService.addLog({
        type: 'info',
        message: `Schedule for ${schedule.deviceName} ${schedule.isEnabled ? 'enabled' : 'disabled'}`,
      });
    }
  };

  const getDaysText = (days: number[]): string => {
    if (days.length === 0) return 'Every day';
    if (days.length === 7) return 'Every day';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const renderSchedule = ({ item }: { item: Schedule }) => (
    <View style={[styles.scheduleCard, !item.isEnabled && styles.disabledCard]}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleInfo}>
          <Text style={[styles.scheduleTime, !item.isEnabled && styles.disabledText]}>
            {item.time}
          </Text>
          <Text style={[styles.scheduleDevice, !item.isEnabled && styles.disabledText]}>
            {item.deviceName}
          </Text>
          <Text style={[styles.scheduleDays, !item.isEnabled && styles.disabledText]}>
            <Calendar size={12} color={item.isEnabled ? "#6B7280" : "#9CA3AF"} />
            {' '}{getDaysText(item.days)}
          </Text>
        </View>
        
        <View style={styles.scheduleActions}>
          <Switch
            value={item.isEnabled}
            onValueChange={() => toggleScheduleEnabled(item.id)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
      
      <View style={styles.scheduleButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Edit size={16} color="#3B82F6" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteSchedule(item.id)}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedules</Text>
          <View style={styles.schedulerStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isSchedulerRunning ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.schedulerStatusText}>
              Scheduler {isSchedulerRunning ? 'Running' : 'Stopped'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openAddModal}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, isSchedulerRunning && styles.activeButton]}
            onPress={toggleScheduler}
          >
            <Clock size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={schedules}
        renderItem={renderSchedule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.schedulesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Clock size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Schedules</Text>
            <Text style={styles.emptyDescription}>
              Tap the + button to create your first schedule
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </Text>
              
              <DevicePicker
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={setSelectedDeviceId}
              />
              
              <TimePickerComponent
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
              />
              
              <DaySelector
                selectedDays={selectedDays}
                onDaysChange={setSelectedDays}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveSchedule}
                >
                  <Text style={styles.saveButtonText}>
                    {editingSchedule ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  schedulerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  schedulerStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
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
  activeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  schedulesList: {
    padding: 16,
    paddingBottom: 100,
  },
  scheduleCard: {
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
  disabledCard: {
    opacity: 0.6,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  scheduleDevice: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleDays: {
    fontSize: 14,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  scheduleActions: {
    justifyContent: 'center',
  },
  scheduleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});