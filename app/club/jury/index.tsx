/**
 * Jury Dashboard
 * Central hub for protest committee operations
 * Matches SAILTI's Jury Web functionality
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';
import { protestService, Protest, Hearing, ProtestStatus } from '@/services/ProtestService';
import { timeLimitService } from '@/services/TimeLimitService';

interface JuryStats {
  total: number;
  byStatus: Record<ProtestStatus, number>;
  pendingHearings: number;
  completedHearings: number;
}

interface ActiveTimeLimit {
  raceNumber: number;
  deadline: Date;
  minutesRemaining: number;
  isExpired: boolean;
}

export default function JuryDashboardScreen() {
  const router = useRouter();
  const { regattaId } = useLocalSearchParams<{ regattaId: string }>();
  const { clubId, loading: clubLoading } = useClubWorkspace();

  const [protests, setProtests] = useState<Protest[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [stats, setStats] = useState<JuryStats | null>(null);
  const [activeTimeLimits, setActiveTimeLimits] = useState<ActiveTimeLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (regattaId) {
      loadDashboardData();
    }
  }, [regattaId]);

  const loadDashboardData = async () => {
    if (!regattaId) return;
    
    try {
      setLoading(true);
      const [protestsData, statsData, hearingsData] = await Promise.all([
        protestService.getRegattaProtests(regattaId),
        protestService.getRegattaProtestStats(regattaId),
        protestService.getRegattaHearings(regattaId, new Date()),
      ]);

      setProtests(protestsData);
      setStats(statsData);
      setHearings(hearingsData);

      // Load active protest time limits
      await loadActiveTimeLimits();
    } catch (error) {
      console.error('Error loading jury dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTimeLimits = async () => {
    if (!regattaId) return;
    
    try {
      const timeLimits = await timeLimitService.getActiveTimeLimits(regattaId);
      const active: ActiveTimeLimit[] = [];

      for (const tl of timeLimits) {
        const deadlineInfo = await protestService.getProtestDeadline(regattaId, tl.race_number);
        if (deadlineInfo.deadline && !deadlineInfo.isExpired) {
          active.push({
            raceNumber: tl.race_number,
            deadline: deadlineInfo.deadline,
            minutesRemaining: deadlineInfo.minutesRemaining || 0,
            isExpired: deadlineInfo.isExpired,
          });
        }
      }

      setActiveTimeLimits(active);
    } catch (error) {
      console.error('Error loading time limits:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [regattaId]);

  const getStatusColor = (status: ProtestStatus): string => {
    switch (status) {
      case 'filed': return '#F59E0B';
      case 'accepted': return '#3B82F6';
      case 'heard': return '#8B5CF6';
      case 'decided': return '#10B981';
      case 'withdrawn': return '#6B7280';
      case 'rejected': return '#EF4444';
      case 'appealed': return '#EC4899';
      default: return '#94A3B8';
    }
  };

  const getStatusIcon = (status: ProtestStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'filed': return 'document-text';
      case 'accepted': return 'checkmark-circle';
      case 'heard': return 'people';
      case 'decided': return 'gavel';
      case 'withdrawn': return 'close-circle';
      case 'rejected': return 'ban';
      case 'appealed': return 'arrow-up-circle';
      default: return 'help-circle';
    }
  };

  if (clubLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <ThemedText style={styles.loadingText}>Loading Jury Dashboard...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!clubId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <ThemedText style={styles.errorText}>Club workspace required</ThemedText>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/club-onboarding-chat')}
          >
            <ThemedText style={styles.primaryButtonText}>Setup Club</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Jury Dashboard</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Protest Committee</ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => router.push(`/club/jury/protests/new?regattaId=${regattaId}`)}
        >
          <Ionicons name="add-circle" size={28} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active Protest Time Limits - Critical Info */}
        {activeTimeLimits.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertHeader}>
              <Ionicons name="timer" size={20} color="#DC2626" />
              <ThemedText style={styles.alertTitle}>Active Protest Time Limits</ThemedText>
            </View>
            {activeTimeLimits.map((tl) => (
              <View 
                key={tl.raceNumber} 
                style={[
                  styles.timeLimitCard,
                  tl.minutesRemaining <= 10 && styles.timeLimitUrgent,
                ]}
              >
                <View style={styles.timeLimitInfo}>
                  <ThemedText style={styles.timeLimitRace}>Race {tl.raceNumber}</ThemedText>
                  <ThemedText style={styles.timeLimitDeadline}>
                    Deadline: {format(tl.deadline, 'HH:mm')}
                  </ThemedText>
                </View>
                <View style={styles.timeLimitCountdown}>
                  <ThemedText style={[
                    styles.timeLimitMinutes,
                    tl.minutesRemaining <= 10 && styles.timeLimitMinutesUrgent,
                  ]}>
                    {tl.minutesRemaining}
                  </ThemedText>
                  <ThemedText style={styles.timeLimitLabel}>min left</ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats?.total || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Protests</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats?.byStatus.filed || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#3B82F6' }]}>
              {stats?.pendingHearings || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Hearings Today</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#10B981' }]}>
              {stats?.byStatus.decided || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Decided</ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push(`/club/jury/protests?regattaId=${regattaId}`)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={24} color="#F59E0B" />
              </View>
              <ThemedText style={styles.actionLabel}>View Protests</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push(`/club/jury/hearings?regattaId=${regattaId}`)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
              </View>
              <ThemedText style={styles.actionLabel}>Schedule</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push(`/club/jury/rule42?regattaId=${regattaId}`)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flag" size={24} color="#EF4444" />
              </View>
              <ThemedText style={styles.actionLabel}>Rule 42</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push(`/club/jury/time-limits?regattaId=${regattaId}`)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="timer" size={24} color="#6366F1" />
              </View>
              <ThemedText style={styles.actionLabel}>Time Limits</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Hearings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Today's Hearings</ThemedText>
            <TouchableOpacity onPress={() => router.push(`/club/jury/hearings?regattaId=${regattaId}`)}>
              <ThemedText style={styles.seeAllLink}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {hearings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color="#94A3B8" />
              <ThemedText style={styles.emptyText}>No hearings scheduled today</ThemedText>
            </View>
          ) : (
            hearings.slice(0, 5).map((hearing) => (
              <TouchableOpacity 
                key={hearing.id}
                style={styles.hearingCard}
                onPress={() => router.push(`/club/jury/hearings/${hearing.id}?regattaId=${regattaId}`)}
              >
                <View style={styles.hearingTime}>
                  <ThemedText style={styles.hearingTimeText}>
                    {format(new Date(hearing.scheduled_time), 'HH:mm')}
                  </ThemedText>
                </View>
                <View style={styles.hearingInfo}>
                  <ThemedText style={styles.hearingTitle}>
                    Hearing #{hearing.hearing_number}
                  </ThemedText>
                  <ThemedText style={styles.hearingSubtitle}>
                    {hearing.room_name || 'Room TBD'} • Protest #{hearing.protest?.protest_number}
                  </ThemedText>
                </View>
                <View style={[
                  styles.hearingStatus,
                  { backgroundColor: hearing.status === 'in_progress' ? '#DCFCE7' : '#F1F5F9' }
                ]}>
                  <ThemedText style={[
                    styles.hearingStatusText,
                    { color: hearing.status === 'in_progress' ? '#16A34A' : '#64748B' }
                  ]}>
                    {hearing.status === 'in_progress' ? 'In Progress' : 
                     hearing.status === 'completed' ? 'Done' : 'Scheduled'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Protests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Protests</ThemedText>
            <TouchableOpacity onPress={() => router.push(`/club/jury/protests?regattaId=${regattaId}`)}>
              <ThemedText style={styles.seeAllLink}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {protests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              <ThemedText style={styles.emptyText}>No protests filed</ThemedText>
            </View>
          ) : (
            protests.slice(0, 5).map((protest) => (
              <TouchableOpacity 
                key={protest.id}
                style={styles.protestCard}
                onPress={() => router.push(`/club/jury/protests/${protest.id}?regattaId=${regattaId}`)}
              >
                <View style={[
                  styles.protestStatus,
                  { backgroundColor: getStatusColor(protest.status) }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(protest.status)} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.protestInfo}>
                  <ThemedText style={styles.protestNumber}>
                    #{protest.protest_number}
                  </ThemedText>
                  <ThemedText style={styles.protestDetails}>
                    Race {protest.race_number} • {protest.protest_type.replace('_', ' ')}
                  </ThemedText>
                  <ThemedText style={styles.protestMeta}>
                    {protest.protestor_entry?.sail_number || 'RC'} → {protest.protestee_entry_ids?.length || 0} boat(s)
                  </ThemedText>
                </View>
                <View style={styles.protestTime}>
                  <ThemedText style={styles.protestTimeText}>
                    {formatDistanceToNow(new Date(protest.filed_at), { addSuffix: true })}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push(`/club/jury/protests/new?regattaId=${regattaId}`)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  headerAction: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  alertSection: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  timeLimitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  timeLimitUrgent: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  timeLimitInfo: {
    flex: 1,
  },
  timeLimitRace: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  timeLimitDeadline: {
    fontSize: 13,
    color: '#64748B',
  },
  timeLimitCountdown: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeLimitMinutes: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeLimitMinutesUrgent: {
    color: '#DC2626',
  },
  timeLimitLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  hearingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hearingTime: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  hearingTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  hearingInfo: {
    flex: 1,
  },
  hearingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  hearingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  hearingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hearingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  protestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  protestStatus: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  protestInfo: {
    flex: 1,
  },
  protestNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  protestDetails: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  protestMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  protestTime: {
    paddingLeft: 8,
  },
  protestTimeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

