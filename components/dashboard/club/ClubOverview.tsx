import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardKPICard, DashboardSection, QuickAction, QuickActionGrid } from '../shared';
import { createLogger } from '@/lib/utils/logger';

interface ClubStats {
  totalMembers: number;
  activeEvents: number;
  monthlyRevenue: number;
  facilityUtilization: number;
  upcomingEvents: number;
  memberGrowth: number;
}

interface UpcomingEvent {
  id: string;
  name: string;
  type: 'regatta' | 'social' | 'training' | 'meeting';
  date: string;
  entries: number;
  capacity: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
}

interface FacilityStatus {
  name: string;
  status: 'operational' | 'maintenance' | 'closed';
  utilization: number;
  nextMaintenance?: string;
}

interface ClubOverviewProps {
  stats?: ClubStats;
  upcomingEvents?: UpcomingEvent[];
  facilities?: FacilityStatus[];
  onEventPress: (eventId: string) => void;
  onCreateEvent: () => void;
  onManageMembers: () => void;
  onViewReports: () => void;
  onCheckFacilities: () => void;
}

const logger = createLogger('ClubOverview');
export function ClubOverview({
  stats,
  upcomingEvents = [],
  facilities = [],
  onEventPress,
  onCreateEvent,
  onManageMembers,
  onViewReports,
  onCheckFacilities
}: ClubOverviewProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'create-event',
      title: 'Create Event',
      icon: 'add-circle',
      gradientColors: ['#667eea', '#764ba2'],
      onPress: onCreateEvent,
    },
    {
      id: 'manage-members',
      title: 'Manage Members',
      icon: 'people',
      gradientColors: ['#f093fb', '#f5576c'],
      onPress: onManageMembers,
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      icon: 'analytics',
      gradientColors: ['#4facfe', '#00f2fe'],
      onPress: onViewReports,
    },
  ];

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'regatta': return 'boat';
      case 'social': return 'people';
      case 'training': return 'school';
      case 'meeting': return 'chatbubbles';
      default: return 'calendar';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'regatta': return '#3B82F6';
      case 'social': return '#10B981';
      case 'training': return '#F59E0B';
      case 'meeting': return '#6366F1';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#10B981';
      case 'full': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#6B7280';
      case 'operational': return '#10B981';
      case 'maintenance': return '#F59E0B';
      case 'closed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getFacilityIcon = (name: string) => {
    if (name.toLowerCase().includes('marina')) return 'boat';
    if (name.toLowerCase().includes('clubhouse')) return 'home';
    if (name.toLowerCase().includes('dock')) return 'water';
    if (name.toLowerCase().includes('restaurant')) return 'restaurant';
    return 'business';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Club Performance Stats */}
      <DashboardSection title="🏛️ Club Performance" showBorder={false}>
        <View style={styles.statsGrid}>
          <DashboardKPICard
            title="Total Members"
            value={stats?.totalMembers ?? 0}
            icon="people-outline"
            iconColor="#3B82F6"
            trend={{ direction: 'up', value: `+${stats?.memberGrowth ?? 0}` }}
          />
          <DashboardKPICard
            title="Active Events"
            value={stats?.activeEvents ?? 0}
            icon="calendar-outline"
            iconColor="#10B981"
          />
          <DashboardKPICard
            title="Monthly Revenue"
            value={`$${Number(stats?.monthlyRevenue ?? 0).toLocaleString()}`}
            icon="cash-outline"
            iconColor="#F59E0B"
            trend={{ direction: 'up', value: '+12%' }}
          />
          <DashboardKPICard
            title="Facility Usage"
            value={`${stats?.facilityUtilization ?? 0}%`}
            icon="business-outline"
            iconColor="#6366F1"
          />
        </View>
      </DashboardSection>

      {/* Upcoming Events */}
      <DashboardSection
        title="📅 Upcoming Events"
        subtitle="Events scheduled for the next 30 days"
        headerAction={{
          label: 'View All',
          onPress: () => logger.debug('View all events'),
          icon: 'calendar-outline'
        }}
      >
        {upcomingEvents.slice(0, 4).map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => onEventPress(event.id)}
          >
            <View style={styles.eventHeader}>
              <View style={styles.eventInfo}>
                <View style={styles.eventTitleRow}>
                  <Ionicons
                    name={getEventTypeIcon(event.type) as any}
                    size={16}
                    color={getEventTypeColor(event.type)}
                  />
                  <Text style={styles.eventName}>{event.name}</Text>
                </View>
                <Text style={styles.eventDate}>{event.date}</Text>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventEntries}>
                    {event.entries}/{event.capacity} entries
                  </Text>
                  <View style={styles.capacityBar}>
                    <View style={[
                      styles.capacityFill,
                      {
                        width: `${(event.entries / event.capacity) * 100}%`,
                        backgroundColor: event.entries >= event.capacity ? '#F59E0B' : '#10B981'
                      }
                    ]} />
                  </View>
                </View>
              </View>
              <View style={[
                styles.eventStatus,
                { backgroundColor: getStatusColor(event.status) }
              ]}>
                <Text style={styles.eventStatusText}>{event.status}</Text>
              </View>
            </View>

            {event.status === 'full' && (
              <View style={styles.fullAlert}>
                <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.fullAlertText}>Event is at capacity - consider waitlist</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {upcomingEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Upcoming Events</Text>
            <Text style={styles.emptyText}>Create events to start engaging your members</Text>
            <TouchableOpacity style={styles.createEventButton} onPress={onCreateEvent}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.createEventButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </DashboardSection>

      {/* Facility Status */}
      <DashboardSection
        title="🏢 Facility Status"
        subtitle="Current status of club facilities"
        headerAction={{
          label: 'Manage',
          onPress: onCheckFacilities,
          icon: 'settings-outline'
        }}
      >
        <View style={styles.facilitiesGrid}>
          {facilities.map((facility, index) => (
            <View key={index} style={styles.facilityCard}>
              <View style={styles.facilityHeader}>
                <View style={styles.facilityIcon}>
                  <Ionicons
                    name={getFacilityIcon(facility.name) as any}
                    size={20}
                    color={getStatusColor(facility.status)}
                  />
                </View>
                <Text style={styles.facilityName}>{facility.name}</Text>
              </View>
              <View style={styles.facilityStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(facility.status) }
                ]}>
                  <Text style={styles.statusText}>{facility.status}</Text>
                </View>
                <Text style={styles.utilizationText}>{facility.utilization}% utilized</Text>
              </View>
              {facility.nextMaintenance && (
                <Text style={styles.maintenanceText}>
                  Next maintenance: {facility.nextMaintenance}
                </Text>
              )}
            </View>
          ))}
        </View>
      </DashboardSection>

      {/* Member Engagement */}
      <DashboardSection title="👥 Member Engagement">
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.engagementCard}
        >
          <View style={styles.engagementContent}>
            <View style={styles.engagementHeader}>
              <Ionicons name="trending-up" size={24} color="#FFFFFF" />
              <Text style={styles.engagementTitle}>Growing Community</Text>
            </View>
            <View style={styles.engagementStats}>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{stats.memberGrowth}</Text>
                <Text style={styles.engagementLabel}>New Members</Text>
                <Text style={styles.engagementPeriod}>This Month</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{stats.upcomingEvents}</Text>
                <Text style={styles.engagementLabel}>Events Planned</Text>
                <Text style={styles.engagementPeriod}>Next 30 Days</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{Math.round(stats.facilityUtilization)}%</Text>
                <Text style={styles.engagementLabel}>Facility Usage</Text>
                <Text style={styles.engagementPeriod}>This Week</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.engagementButton} onPress={onManageMembers}>
              <Ionicons name="people" size={16} color="#667eea" />
              <Text style={styles.engagementButtonText}>Manage Members</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="⚡ Quick Actions" showBorder={false}>
        <QuickActionGrid actions={quickActions} />
      </DashboardSection>

      {/* Recent Activity */}
      <DashboardSection title="📋 Recent Activity">
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Ionicons name="person-add" size={16} color="#10B981" />
            <Text style={styles.activityText}>
              3 new members joined this week
            </Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="calendar" size={16} color="#3B82F6" />
            <Text style={styles.activityText}>
              Summer Regatta registration opened
            </Text>
            <Text style={styles.activityTime}>1 day ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
            <Text style={styles.activityText}>
              Marina dock maintenance completed
            </Text>
            <Text style={styles.activityTime}>3 days ago</Text>
          </View>
        </View>
      </DashboardSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: -4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  eventDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  eventMeta: {
    gap: 4,
  },
  eventEntries: {
    fontSize: 14,
    color: '#64748B',
  },
  capacityBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2,
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  fullAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  fullAlertText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  facilityCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  facilityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  facilityStatus: {
    gap: 4,
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  utilizationText: {
    fontSize: 12,
    color: '#64748B',
  },
  maintenanceText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  engagementCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  engagementContent: {
    padding: 20,
  },
  engagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  engagementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  engagementStat: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  engagementLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  engagementPeriod: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  engagementButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});