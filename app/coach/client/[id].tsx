/**
 * Client Detail Screen
 * Shows detailed information about a coaching client including:
 * - Session history
 * - Progress metrics and charts
 * - Notes and feedback
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/AuthProvider';
import {
  coachingService,
  ClientDetails,
  CoachingSession,
  ClientProgressMetric
} from '@/services/CoachingService';
import { format, formatDistanceToNow } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedTab, setSelectedTab] = useState<'sessions' | 'progress' | 'notes'>('sessions');

  useEffect(() => {
    if (user && id) {
      loadClientDetails();
    }
  }, [user, id]);

  const loadClientDetails = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      const details = await coachingService.getClientDetails(id);
      setClientDetails(details);
      setNotes(details?.coach_notes || '');
    } catch (error) {
      console.error('Error loading client details:', error);
      Alert.alert('Error', 'Failed to load client details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClientDetails();
  };

  const handleSaveNotes = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      await coachingService.updateClient(id, { coach_notes: notes });
      setEditingNotes(false);
      Alert.alert('Success', 'Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const handleSessionPress = (sessionId: string) => {
    router.push(`/coach/session/${sessionId}`);
  };

  const renderSessionCard = (session: CoachingSession) => {
    const isCompleted = session.status === 'completed';
    const isUpcoming = session.status === 'scheduled';

    return (
      <TouchableOpacity
        key={session.id}
        style={styles.sessionCard}
        onPress={() => handleSessionPress(session.id)}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTypeContainer}>
            <Ionicons
              name={getSessionIcon(session.session_type)}
              size={24}
              color={isCompleted ? '#10B981' : isUpcoming ? '#007AFF' : '#94A3B8'}
            />
            <View style={styles.sessionInfo}>
              <ThemedText style={styles.sessionType}>
                {formatSessionType(session.session_type)}
              </ThemedText>
              <ThemedText style={styles.sessionDate}>
                {session.completed_at
                  ? format(new Date(session.completed_at), 'MMM d, yyyy')
                  : session.scheduled_at
                  ? format(new Date(session.scheduled_at), 'MMM d, yyyy')
                  : 'Not scheduled'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.sessionStatus}>
            <ThemedText style={[styles.statusBadge, getStatusStyle(session.status)]}>
              {session.status}
            </ThemedText>
          </View>
        </View>

        {session.goals && (
          <ThemedText style={styles.sessionGoals} numberOfLines={2}>
            {session.goals}
          </ThemedText>
        )}

        <View style={styles.sessionMeta}>
          <ThemedText style={styles.sessionMetaText}>
            {session.duration_minutes} min
          </ThemedText>
          {session.venue?.name && (
            <ThemedText style={styles.sessionMetaText}>
              📍 {session.venue.name}
            </ThemedText>
          )}
          {session.feedback && (
            <ThemedText style={styles.sessionMetaText}>
              ⭐ {session.feedback.rating}/5
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderProgressChart = () => {
    if (!clientDetails?.progressMetrics || clientDetails.progressMetrics.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color="#CBD5E1" />
          <ThemedText style={styles.emptyText}>No progress data yet</ThemedText>
        </View>
      );
    }

    // Group metrics by type
    const metricsByType = clientDetails.progressMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = [];
      }
      acc[metric.metric_type].push(metric);
      return acc;
    }, {} as Record<string, ClientProgressMetric[]>);

    return (
      <View>
        {Object.entries(metricsByType).map(([type, metrics]) => {
          const data = {
            labels: metrics.slice(-6).map((m, i) => `S${i + 1}`),
            datasets: [
              {
                data: metrics.slice(-6).map(m => m.score)
              }
            ]
          };

          return (
            <View key={type} style={styles.chartContainer}>
              <ThemedText style={styles.chartTitle}>
                {formatMetricType(type)}
              </ThemedText>
              <LineChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#007AFF'
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const renderNotes = () => {
    return (
      <View style={styles.notesContainer}>
        <View style={styles.notesHeader}>
          <ThemedText style={styles.notesTitle}>Private Coach Notes</ThemedText>
          {!editingNotes ? (
            <TouchableOpacity onPress={() => setEditingNotes(true)}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.notesActions}>
              <TouchableOpacity onPress={() => setEditingNotes(false)} style={styles.notesButton}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNotes} style={styles.saveButton}>
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TextInput
          style={[styles.notesInput, !editingNotes && styles.notesInputReadonly]}
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={editingNotes}
          placeholder="Add private notes about this client..."
          placeholderTextColor="#94A3B8"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  if (!clientDetails) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <ThemedText style={styles.errorText}>Client not found</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const client = clientDetails;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Client Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Client Details</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Client Info Card */}
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            {client.sailor?.avatar_url ? (
              <Image
                source={{ uri: client.sailor.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#94A3B8" />
              </View>
            )}
            <View style={styles.clientInfo}>
              <ThemedText style={styles.clientName}>
                {client.sailor?.full_name || client.sailor?.email || 'Unknown Client'}
              </ThemedText>
              <ThemedText style={styles.clientMeta}>
                {client.primary_boat_class || 'No boat class'} • {client.skill_level || 'Unknown level'}
              </ThemedText>
              {client.goals && (
                <ThemedText style={styles.clientGoals} numberOfLines={2}>
                  🎯 {client.goals}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{client.stats.totalSessions}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Sessions</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{client.stats.completedSessions}</ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{client.stats.upcomingSessions}</ThemedText>
            <ThemedText style={styles.statLabel}>Upcoming</ThemedText>
          </View>
          {client.stats.averageRating && (
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{client.stats.averageRating.toFixed(1)} ⭐</ThemedText>
              <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'sessions' && styles.tabActive]}
            onPress={() => setSelectedTab('sessions')}
          >
            <ThemedText style={[styles.tabText, selectedTab === 'sessions' && styles.tabTextActive]}>
              Sessions
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'progress' && styles.tabActive]}
            onPress={() => setSelectedTab('progress')}
          >
            <ThemedText style={[styles.tabText, selectedTab === 'progress' && styles.tabTextActive]}>
              Progress
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'notes' && styles.tabActive]}
            onPress={() => setSelectedTab('notes')}
          >
            <ThemedText style={[styles.tabText, selectedTab === 'notes' && styles.tabTextActive]}>
              Notes
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {selectedTab === 'sessions' && (
            <View>
              {client.sessions.length > 0 ? (
                client.sessions.map(renderSessionCard)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
                  <ThemedText style={styles.emptyText}>No sessions yet</ThemedText>
                </View>
              )}
            </View>
          )}

          {selectedTab === 'progress' && renderProgressChart()}

          {selectedTab === 'notes' && renderNotes()}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

// Helper functions
function getSessionIcon(type: string): any {
  const icons: Record<string, any> = {
    on_water: 'boat',
    video_review: 'videocam',
    strategy: 'map',
    boat_setup: 'construct',
    fitness: 'fitness',
    mental_coaching: 'head'
  };
  return icons[type] || 'calendar';
}

function formatSessionType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatMetricType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusStyle(status: string) {
  const styles: Record<string, any> = {
    completed: { backgroundColor: '#D1FAE5', color: '#065F46' },
    scheduled: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    in_progress: { backgroundColor: '#FEF3C7', color: '#92400E' },
    cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    no_show: { backgroundColor: '#F3F4F6', color: '#374151' }
  };
  return styles[status] || {};
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backIcon: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  clientMeta: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  clientGoals: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionDate: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  sessionStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  sessionGoals: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionMetaText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  notesActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notesButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  notesInputReadonly: {
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
