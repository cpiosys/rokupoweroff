import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { FileText, Trash2, RefreshCw, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Info, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { storageService } from '@/services/storage';
import { LogEntry } from '@/types';

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const storedLogs = await storageService.getLogs();
      setLogs(storedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearLogs();
            setLogs([]);
          },
        },
      ]
    );
  };

  const getLogIcon = (type: LogEntry['type']) => {
    const props = { size: 16 };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...props} color="#10B981" />;
      case 'error':
        return <AlertCircle {...props} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle {...props} color="#F59E0B" />;
      case 'info':
      default:
        return <Info {...props} color="#3B82F6" />;
    }
  };

  const getLogColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const renderLogEntry = ({ item }: { item: LogEntry }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logTypeContainer}>
          {getLogIcon(item.type)}
          <Text style={[styles.logType, { color: getLogColor(item.type) }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.logTimestamp}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      
      <Text style={styles.logMessage}>{item.message}</Text>
      
      {item.deviceName && (
        <View style={styles.logDevice}>
          <Text style={styles.logDeviceText}>Device: {item.deviceName}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Logs</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={loadLogs}
            disabled={isLoading}
          >
            <RefreshCw 
              size={24} 
              color="#FFFFFF" 
              style={isLoading ? { opacity: 0.5 } : {}} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={clearLogs}
          >
            <Trash2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{logs.length}</Text>
          <Text style={styles.statsLabel}>Total Entries</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {logs.filter(l => l.type === 'success').length}
          </Text>
          <Text style={styles.statsLabel}>Successful</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {logs.filter(l => l.type === 'error').length}
          </Text>
          <Text style={styles.statsLabel}>Errors</Text>
        </View>
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.logsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadLogs}
            tintColor="#8B5CF6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Activity Logs</Text>
            <Text style={styles.emptyDescription}>
              App activity will appear here
            </Text>
          </View>
        }
      />
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  logsList: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logType: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  logMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  logDevice: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logDeviceText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
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