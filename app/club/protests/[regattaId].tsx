/**
 * Protest Management Dashboard
 * Central hub for viewing, scheduling, and managing protests
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  AlertTriangle,
  ChevronLeft,
  Plus,
  Clock,
  Calendar,
  Users,
  FileText,
  Check,
  X,
  Flag,
  Gavel,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react-native';
import { 
  protestService,
  Protest,
  Hearing,
  ProtestStatus,
} from '@/services/ProtestService';

type TabType = 'protests' | 'hearings' | 'schedule' | 'committee';

const STATUS_COLORS: Record<ProtestStatus, string> = {
  filed: '#F59E0B',
  accepted: '#3B82F6',
  rejected: '#EF4444',
  withdrawn: '#6B7280',
  heard: '#8B5CF6',
  decided: '#10B981',
  appealed: '#DC2626',
};

const STATUS_LABELS: Record<ProtestStatus, string> = {
  filed: 'Filed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  heard: 'Heard',
  decided: 'Decided',
  appealed: 'Appealed',
};

export default function ProtestManagement() {
  const { regattaId } = useLocalSearchParams<{ regattaId: string }>();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('protests');
  const [protests, setProtests] = useState<Protest[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProtestStatus | 'all'>('all');

  // Load data
  useEffect(() => {
    if (regattaId) {
      loadData();
    }
  }, [regattaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [protestsData, hearingsData, statsData] = await Promise.all([
        protestService.getRegattaProtests(regattaId!),
        protestService.getRegattaHearings(regattaId!),
        protestService.getRegattaProtestStats(regattaId!),
      ]);

      setProtests(protestsData);
      setHearings(hearingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading protests:', error);
      Alert.alert('Error', 'Failed to load protest data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter protests
  const filteredProtests = statusFilter === 'all' 
    ? protests 
    : protests.filter(p => p.status === statusFilter);

  // Group hearings by date
  const hearingsByDate = hearings.reduce((acc, h) => {
    const date = new Date(h.scheduled_time).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(h);
    return acc;
  }, {} as Record<string, Hearing[]>);

  // Render stats card
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.total || 0}</Text>
        <Text style={styles.statLabel}>Total Protests</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#F59E0B' }]}>
          {stats?.pendingHearings || 0}
        </Text>
        <Text style={styles.statLabel}>Pending Hearings</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#10B981' }]}>
          {stats?.completedHearings || 0}
        </Text>
        <Text style={styles.statLabel}>Decided</Text>
      </View>
    </View>
  );

  // Render protests tab
  const renderProtestsTab = () => (
    <View style={styles.tabContent}>
      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[
            styles.filterChipText,
            statusFilter === 'all' && styles.filterChipTextActive,
          ]}>
            All ({protests.length})
          </Text>
        </TouchableOpacity>
        {(['filed', 'accepted', 'heard', 'decided'] as ProtestStatus[]).map(status => {
          const count = protests.filter(p => p.status === status).length;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
              <Text style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}>
                {STATUS_LABELS[status]} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Protests list */}
      {filteredProtests.length > 0 ? (
        filteredProtests.map(protest => (
          <TouchableOpacity
            key={protest.id}
            style={styles.protestCard}
            onPress={() => router.push(`/club/protests/detail/${protest.id}`)}
          >
            <View style={styles.protestHeader}>
              <View style={styles.protestNumber}>
                <Text style={styles.protestNumberText}>{protest.protest_number}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[protest.status] }]}>
                <Text style={styles.statusBadgeText}>{STATUS_LABELS[protest.status]}</Text>
              </View>
            </View>
            
            <View style={styles.protestInfo}>
              <Text style={styles.protestType}>
                {protest.protest_type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.protestRace}>Race {protest.race_number}</Text>
            </View>

            <View style={styles.protestParties}>
              <View style={styles.party}>
                <Text style={styles.partyLabel}>Protestor</Text>
                <Text style={styles.partyValue}>
                  {protest.protestor_entry?.sail_number || 'Race Committee'}
                </Text>
              </View>
              {protest.protestee_entry_ids && protest.protestee_entry_ids.length > 0 && (
                <View style={styles.party}>
                  <Text style={styles.partyLabel}>Protestee</Text>
                  <Text style={styles.partyValue}>
                    {protest.protestee_entry_ids.length} boat(s)
                  </Text>
                </View>
              )}
            </View>

            {protest.rule_infringed && (
              <View style={styles.ruleTag}>
                <Text style={styles.ruleText}>Rule: {protest.rule_infringed}</Text>
              </View>
            )}

            <View style={styles.protestFooter}>
              <Text style={styles.protestTime}>
                Filed: {new Date(protest.filed_at).toLocaleString()}
              </Text>
              {protest.hearing_time && (
                <Text style={styles.hearingTime}>
                  <Clock size={12} color="#6B7280" /> Hearing: {new Date(protest.hearing_time).toLocaleString()}
                </Text>
              )}
            </View>
            
            <ChevronRight size={20} color="#9CA3AF" style={styles.chevron} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <AlertTriangle size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Protests</Text>
          <Text style={styles.emptyText}>
            {statusFilter === 'all' 
              ? 'No protests have been filed yet'
              : `No protests with status "${STATUS_LABELS[statusFilter as ProtestStatus]}"`}
          </Text>
        </View>
      )}
    </View>
  );

  // Render hearings tab
  const renderHearingsTab = () => (
    <View style={styles.tabContent}>
      {Object.keys(hearingsByDate).length > 0 ? (
        Object.entries(hearingsByDate).map(([date, dayHearings]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dayHearings.map(hearing => (
              <TouchableOpacity
                key={hearing.id}
                style={styles.hearingCard}
                onPress={() => router.push(`/club/protests/hearing/${hearing.id}`)}
              >
                <View style={styles.hearingTime}>
                  <Clock size={16} color="#0EA5E9" />
                  <Text style={styles.hearingTimeText}>
                    {new Date(hearing.scheduled_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                
                <View style={styles.hearingInfo}>
                  <Text style={styles.hearingProtest}>
                    {(hearing as any).protest?.protest_number || 'Unknown Protest'}
                  </Text>
                  <Text style={styles.hearingLocation}>
                    {hearing.room_name || 'Room TBD'}
                  </Text>
                </View>

                <View style={[
                  styles.hearingStatus,
                  { backgroundColor: hearing.status === 'completed' ? '#D1FAE5' : '#FEF3C7' }
                ]}>
                  <Text style={[
                    styles.hearingStatusText,
                    { color: hearing.status === 'completed' ? '#059669' : '#D97706' }
                  ]}>
                    {hearing.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Hearings Scheduled</Text>
          <Text style={styles.emptyText}>
            Schedule hearings from the protest detail page
          </Text>
        </View>
      )}
    </View>
  );

  // Render schedule tab (timeline view)
  const renderScheduleTab = () => {
    const todayHearings = hearings.filter(h => {
      const today = new Date();
      const hearingDate = new Date(h.scheduled_time);
      return hearingDate.toDateString() === today.toDateString();
    }).sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        
        {todayHearings.length > 0 ? (
          <View style={styles.timeline}>
            {todayHearings.map((hearing, index) => (
              <View key={hearing.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>
                    {new Date(hearing.scheduled_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  {index < todayHearings.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.timelineCard,
                    hearing.status === 'in_progress' && styles.timelineCardActive,
                  ]}
                  onPress={() => router.push(`/club/protests/hearing/${hearing.id}`)}
                >
                  <View style={styles.timelineCardHeader}>
                    <Gavel size={16} color={hearing.status === 'in_progress' ? '#0EA5E9' : '#6B7280'} />
                    <Text style={styles.timelineProtest}>
                      {(hearing as any).protest?.protest_number || 'Unknown'}
                    </Text>
                  </View>
                  <Text style={styles.timelineRoom}>{hearing.room_name || 'Room TBD'}</Text>
                  {hearing.status === 'in_progress' && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>IN PROGRESS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noSchedule}>
            <Text style={styles.noScheduleText}>No hearings scheduled for today</Text>
          </View>
        )}
      </View>
    );
  };

  // Render committee tab
  const renderCommitteeTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/club/protests/committee/${regattaId}`)}
      >
        <Users size={20} color="#0EA5E9" />
        <Text style={styles.addButtonText}>Manage Protest Committee</Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/club/protests/rooms/${regattaId}`)}
      >
        <FileText size={20} color="#0EA5E9" />
        <Text style={styles.addButtonText}>Manage Hearing Rooms</Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Gavel size={48} color="#0EA5E9" />
        <Text style={styles.loadingText}>Loading Protests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Protest Hearings</Text>
          <Text style={styles.headerSubtitle}>
            {protests.length} protest{protests.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addProtestButton}
          onPress={() => router.push(`/club/protests/file/${regattaId}`)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'protests', label: 'Protests', icon: Flag },
          { key: 'hearings', label: 'Hearings', icon: Gavel },
          { key: 'schedule', label: 'Schedule', icon: Calendar },
          { key: 'committee', label: 'Setup', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Icon size={18} color={isActive ? '#0EA5E9' : '#6B7280'} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'protests' && renderProtestsTab()}
        {activeTab === 'hearings' && renderHearingsTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'committee' && renderCommitteeTab()}
      </ScrollView>
    </View>
  );
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
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FCA5A5',
    marginTop: 2,
  },
  addProtestButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  tabLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  filterBar: {
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0EA5E9',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  protestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  protestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protestNumber: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  protestNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  protestInfo: {
    marginBottom: 12,
  },
  protestType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  protestRace: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  protestParties: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  party: {},
  partyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  partyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  ruleTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
  },
  protestFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  protestTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  hearingTime: {
    fontSize: 12,
    color: '#0EA5E9',
    marginTop: 4,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
  },
  hearingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  hearingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
  },
  hearingTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  hearingInfo: {
    flex: 1,
  },
  hearingProtest: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  hearingLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  hearingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hearingStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    right: 6,
    width: 2,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  timelineCardActive: {
    borderLeftColor: '#0EA5E9',
    backgroundColor: '#EFF6FF',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timelineProtest: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineRoom: {
    fontSize: 13,
    color: '#6B7280',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  noSchedule: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noScheduleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  addButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
});

