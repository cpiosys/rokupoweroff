import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';

interface TimePickerProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export function TimePickerComponent({ selectedTime, onTimeChange }: TimePickerProps) {
  const [hours, minutes] = selectedTime.split(':').map(Number);

  const adjustTime = (type: 'hour' | 'minute', direction: 'up' | 'down') => {
    let newHours = hours;
    let newMinutes = minutes;

    if (type === 'hour') {
      if (direction === 'up') {
        newHours = (hours + 1) % 24;
      } else {
        newHours = hours === 0 ? 23 : hours - 1;
      }
    } else {
      if (direction === 'up') {
        newMinutes = (minutes + 1) % 60;
      } else {
        newMinutes = minutes === 0 ? 59 : minutes - 1;
      }
    }

    const timeString = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    onTimeChange(timeString);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Clock size={16} color="#374151" />
        <Text style={styles.label}>Power Off Time</Text>
      </View>
      
      <View style={styles.timePicker}>
        <View style={styles.timeGroup}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => adjustTime('hour', 'up')}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{hours.toString().padStart(2, '0')}</Text>
          </View>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => adjustTime('hour', 'down')}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeGroup}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => adjustTime('minute', 'up')}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{minutes.toString().padStart(2, '0')}</Text>
          </View>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => adjustTime('minute', 'down')}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeGroup: {
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#F3F4F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  timeDisplay: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
});