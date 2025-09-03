import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface DaySelectorProps {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
}

export function DaySelector({ selectedDays, onDaysChange }: DaySelectorProps) {
  const days = [
    { id: 0, name: 'Sun', fullName: 'Sunday' },
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' },
  ];

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      onDaysChange(selectedDays.filter(d => d !== dayId));
    } else {
      onDaysChange([...selectedDays, dayId].sort());
    }
  };

  const selectAllDays = () => {
    onDaysChange([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearDays = () => {
    onDaysChange([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Calendar size={16} color="#374151" />
        <Text style={styles.label}>Days of the Week</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={selectAllDays}>
          <Text style={styles.quickButtonText}>All Days</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={clearDays}>
          <Text style={styles.quickButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.daysContainer}>
        {days.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.dayButton,
              selectedDays.includes(day.id) && styles.dayButtonSelected,
            ]}
            onPress={() => toggleDay(day.id)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDays.includes(day.id) && styles.dayTextSelected,
              ]}
            >
              {day.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.helpText}>
        {selectedDays.length === 0 
          ? 'No days selected (schedule will run every day)' 
          : `Selected: ${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''}`
        }
      </Text>
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
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 45,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});