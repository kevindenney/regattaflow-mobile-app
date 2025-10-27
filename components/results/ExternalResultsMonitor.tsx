/**
 * External Results Monitor Component
 * Displays real-time status of external results polling system
 * Allows manual triggering and configuration of polling sources
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';

interface PollingSource {
  id: string;
  name: string;
  supportedRegions: string[];
  pollInterval: number;
  active: boolean;
}

interface PollingStatus {
  sourceId: string;
  lastPollTime: Date;
  lastSuccessTime: Date;
  errorCount: number;
  isActive: boolean;
  nextPollTime: Date;
}

interface ExternalResultsMonitorProps {
  style?: any;
}

export const ExternalResultsMonitor: React.FC<ExternalResultsMonitorProps> = ({ style }) => {
  const { user } = useAuth();
  const [sources, setSources] = useState<PollingSource[]>([]);
  const [statuses, setStatuses] = useState<PollingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    loadPollingData();

    // Set up periodic refresh
    const interval = setInterval(loadPollingData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPollingData = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/results/poll?action=status', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
        setStatuses(data.status || []);
      }
    } catch (error) {
      console.error('Error loading polling data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPollingData();
  };

  const triggerManualPoll = async (sourceId?: string) => {
    if (!user) return;

    setTriggering(sourceId || 'all');
    try {
      const response = await fetch('/api/results/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          action: 'trigger_poll',
          sourceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', data.message);
        await loadPollingData(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to trigger polling');
      }
    } catch (error) {
      console.error('Error triggering poll:', error);
      Alert.alert('Error', 'Failed to trigger polling');
    } finally {
      setTriggering(null);
    }
  };

  const getSourceStatus = (sourceId: string): PollingStatus | undefined => {
    return statuses.find(s => s.sourceId === sourceId);
  };

  const formatLastPoll = (date: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: PollingStatus | undefined): string => {
    if (!status) return '#666666';
    if (!status.isActive) return '#FF3B30';
    if (status.errorCount > 0) return '#FF9500';
    return '#00AA33';
  };

  const getStatusIcon = (status: PollingStatus | undefined): string => {
    if (!status) return 'help-circle';
    if (!status.isActive) return 'close-circle';
    if (status.errorCount > 0) return 'warning';
    return 'checkmark-circle';
  };

  const renderSourceCard = (source: PollingSource) => {
    const status = getSourceStatus(source.id);
    const statusColor = getStatusColor(status);
    const statusIcon = getStatusIcon(status);
    const isTriggering = triggering === source.id;

    return (
      <View key={source.id} style={styles.sourceCard}>
        <View style={styles.sourceHeader}>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceName}>{source.name}</Text>
            <Text style={styles.sourceRegions}>
              {source.supportedRegions.join(', ')}
            </Text>
          </View>

          <View style={styles.sourceStatus}>
            <Ionicons
              name={statusIcon as any}
              size={24}
              color={statusColor}
            />
          </View>
        </View>

        <View style={styles.sourceDetails}>
          <View style={styles.sourceDetailRow}>
            <Text style={styles.sourceDetailLabel}>Poll Interval:</Text>
            <Text style={styles.sourceDetailValue}>{source.pollInterval}m</Text>
          </View>

          {status && (
            <>
              <View style={styles.sourceDetailRow}>
                <Text style={styles.sourceDetailLabel}>Last Poll:</Text>
                <Text style={styles.sourceDetailValue}>
                  {formatLastPoll(new Date(status.lastPollTime))}
                </Text>
              </View>

              <View style={styles.sourceDetailRow}>
                <Text style={styles.sourceDetailLabel}>Errors:</Text>
                <Text style={[
                  styles.sourceDetailValue,
                  { color: status.errorCount > 0 ? '#FF3B30' : '#00AA33' }
                ]}>
                  {status.errorCount}
                </Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.triggerButton,
            isTriggering && styles.triggerButtonDisabled
          ]}
          onPress={() => triggerManualPoll(source.id)}
          disabled={isTriggering}
        >
          {isTriggering ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.triggerButtonText}>Poll Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderOverallStats = () => {
    const activeSources = sources.filter(s => s.active).length;
    const healthySources = statuses.filter(s => s.isActive && s.errorCount === 0).length;
    const errorSources = statuses.filter(s => s.errorCount > 0).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeSources}</Text>
          <Text style={styles.statLabel}>Active Sources</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#00AA33' }]}>{healthySources}</Text>
          <Text style={styles.statLabel}>Healthy</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>{errorSources}</Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading polling status...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Results Polling</Text>
        <Text style={styles.subtitle}>
          Monitor external sailing results integration
        </Text>
      </View>

      {renderOverallStats()}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.triggerAllButton,
            triggering === 'all' && styles.triggerButtonDisabled
          ]}
          onPress={() => triggerManualPoll()}
          disabled={triggering === 'all'}
        >
          {triggering === 'all' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh-circle" size={20} color="#FFFFFF" />
              <Text style={styles.triggerAllButtonText}>Poll All Sources</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sourcesContainer}>
        <Text style={styles.sourcesTitle}>Data Sources</Text>
        {sources.map(renderSourceCard)}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color="#0066CC" />
          <Text style={styles.infoTitle}>About Results Polling</Text>
        </View>
        <Text style={styles.infoText}>
          RegattaFlow automatically polls major sailing organizations for race results.
          This ensures your performance data stays up-to-date across all venues and competitions.
        </Text>
        <Text style={styles.infoText}>
          Supported sources include Sailwave, Regatta Network, World Sailing,
          Yacht Scoring, RaceQs, and Manage2Sail.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  triggerAllButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  triggerAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  triggerButtonDisabled: {
    opacity: 0.6,
  },
  sourcesContainer: {
    marginBottom: 24,
  },
  sourcesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sourceRegions: {
    fontSize: 12,
    color: '#666',
  },
  sourceStatus: {
    marginLeft: 12,
  },
  sourceDetails: {
    marginBottom: 16,
  },
  sourceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sourceDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  sourceDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  triggerButton: {
    backgroundColor: '#00AA33',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  triggerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default ExternalResultsMonitor;