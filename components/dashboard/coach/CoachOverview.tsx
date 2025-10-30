import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardKPICard, DashboardSection, QuickAction, QuickActionGrid } from '../shared';
import { createLogger } from '@/lib/utils/logger';

interface CoachStats {
  activeClients: number;
  totalSessions: number;
  monthlyEarnings: number;
  clientRetention: number;
  averageRating: number;
  marketplaceViews: number;
}

interface UpcomingSession {
  id: string;
  clientName: string;
  type: 'analysis' | 'live' | 'race_day';
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'needs_prep';
}

interface RecentLead {
  id: string;
  clientName: string;
  requestedService: string;
  budget: string;
  timeAgo: string;
  status: 'new' | 'contacted' | 'quoted';
}

interface CoachOverviewProps {
  stats: CoachStats;
  upcomingSessions: UpcomingSession[];
  recentLeads: RecentLead[];
  onSessionPress: (sessionId: string) => void;
  onLeadPress: (leadId: string) => void;
  onPlanSession: () => void;
  onReviewClient: () => void;
  onCheckEarnings: () => void;
  onManageAvailability: () => void;
}

const logger = createLogger('CoachOverview');
export function CoachOverview({
  stats,
  upcomingSessions = [],
  recentLeads = [],
  onSessionPress,
  onLeadPress,
  onPlanSession,
  onReviewClient,
  onCheckEarnings,
  onManageAvailability
}: CoachOverviewProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'plan-session',
      title: 'Plan Session',
      icon: 'calendar',
      gradientColors: ['#667eea', '#764ba2'],
      onPress: onPlanSession,
    },
    {
      id: 'review-client',
      title: 'Review Client',
      icon: 'person-circle',
      gradientColors: ['#f093fb', '#f5576c'],
      onPress: onReviewClient,
    },
    {
      id: 'check-earnings',
      title: 'Check Earnings',
      icon: 'cash',
      gradientColors: ['#4facfe', '#00f2fe'],
      onPress: onCheckEarnings,
    },
  ];

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return 'analytics';
      case 'live': return 'videocam';
      case 'race_day': return 'boat';
      default: return 'calendar';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'analysis': return '#3B82F6';
      case 'live': return '#10B981';
      case 'race_day': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'needs_prep': return '#EF4444';
      case 'new': return '#3B82F6';
      case 'contacted': return '#F59E0B';
      case 'quoted': return '#6366F1';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Coach Performance Stats */}
      <DashboardSection title="📊 Coaching Performance" showBorder={false}>
        <View style={styles.statsGrid}>
          <DashboardKPICard
            title="Active Clients"
            value={stats.activeClients}
            icon="people-outline"
            iconColor="#3B82F6"
            trend={{ direction: 'up', value: '+2 this month' }}
          />
          <DashboardKPICard
            title="This Month"
            value={stats.totalSessions}
            subtitle="sessions"
            icon="calendar-outline"
            iconColor="#10B981"
          />
          <DashboardKPICard
            title="Monthly Earnings"
            value={`$${stats.monthlyEarnings.toLocaleString()}`}
            icon="cash-outline"
            iconColor="#F59E0B"
            trend={{ direction: 'up', value: '+15%' }}
          />
          <DashboardKPICard
            title="Client Rating"
            value={stats.averageRating.toFixed(1)}
            subtitle="⭐ average"
            icon="star-outline"
            iconColor="#FFD700"
          />
        </View>
      </DashboardSection>

      {/* Upcoming Sessions */}
      <DashboardSection
        title="📅 Upcoming Sessions"
        subtitle="Your coaching schedule for the next few days"
        headerAction={{
          label: 'View All',
          onPress: () => logger.debug('View all sessions'),
          icon: 'calendar-outline'
        }}
      >
        {upcomingSessions.slice(0, 3).map((session) => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionCard}
            onPress={() => onSessionPress(session.id)}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionClient}>{session.clientName}</Text>
                <View style={styles.sessionMeta}>
                  <Ionicons
                    name={getSessionTypeIcon(session.type) as any}
                    size={14}
                    color={getSessionTypeColor(session.type)}
                  />
                  <Text style={styles.sessionType}>
                    {session.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
                <Text style={styles.sessionTime}>
                  {session.date} at {session.time} ({session.duration}min)
                </Text>
              </View>
              <View style={[
                styles.sessionStatus,
                { backgroundColor: getStatusColor(session.status) }
              ]}>
                <Text style={styles.sessionStatusText}>
                  {session.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {session.status === 'needs_prep' && (
              <View style={styles.prepAlert}>
                <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.prepAlertText}>
                  Session prep needed - review client data and prepare materials
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {upcomingSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Upcoming Sessions</Text>
            <Text style={styles.emptyText}>Your schedule is clear for the next few days</Text>
            <TouchableOpacity style={styles.manageButton} onPress={onManageAvailability}>
              <Ionicons name="settings" size={16} color="#3B82F6" />
              <Text style={styles.manageButtonText}>Manage Availability</Text>
            </TouchableOpacity>
          </View>
        )}
      </DashboardSection>

      {/* Recent Marketplace Leads */}
      <DashboardSection
        title="🎯 Recent Marketplace Leads"
        subtitle="New coaching opportunities from the marketplace"
        headerAction={{
          label: 'View All',
          onPress: () => logger.debug('View all leads'),
          icon: 'arrow-forward'
        }}
      >
        {recentLeads.slice(0, 3).map((lead) => (
          <TouchableOpacity
            key={lead.id}
            style={styles.leadCard}
            onPress={() => onLeadPress(lead.id)}
          >
            <View style={styles.leadHeader}>
              <View style={styles.leadInfo}>
                <Text style={styles.leadClient}>{lead.clientName}</Text>
                <Text style={styles.leadService}>{lead.requestedService}</Text>
                <Text style={styles.leadBudget}>{lead.budget} • {lead.timeAgo}</Text>
              </View>
              <View style={[
                styles.leadStatus,
                { backgroundColor: getStatusColor(lead.status) }
              ]}>
                <Text style={styles.leadStatusText}>{lead.status}</Text>
              </View>
            </View>

            {lead.status === 'new' && (
              <View style={styles.leadActions}>
                <TouchableOpacity style={styles.leadActionButton}>
                  <Ionicons name="chatbubble" size={14} color="#3B82F6" />
                  <Text style={styles.leadActionText}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leadActionButton}>
                  <Ionicons name="document-text" size={14} color="#10B981" />
                  <Text style={styles.leadActionText}>Send Quote</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {recentLeads.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Recent Leads</Text>
            <Text style={styles.emptyText}>
              Optimize your marketplace profile to attract more clients
            </Text>
          </View>
        )}
      </DashboardSection>

      {/* Marketplace Performance */}
      <DashboardSection title="🌟 Marketplace Performance">
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.marketplaceCard}
        >
          <View style={styles.marketplaceContent}>
            <View style={styles.marketplaceStats}>
              <View style={styles.marketplaceStat}>
                <Text style={styles.marketplaceValue}>{stats.marketplaceViews}</Text>
                <Text style={styles.marketplaceLabel}>Profile Views</Text>
              </View>
              <View style={styles.marketplaceStat}>
                <Text style={styles.marketplaceValue}>{stats.clientRetention}%</Text>
                <Text style={styles.marketplaceLabel}>Retention Rate</Text>
              </View>
              <View style={styles.marketplaceStat}>
                <Text style={styles.marketplaceValue}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.marketplaceLabel}>Avg Rating</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.optimizeButton}>
              <Ionicons name="trending-up" size={16} color="#667eea" />
              <Text style={styles.optimizeButtonText}>Optimize Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="⚡ Quick Actions" showBorder={false}>
        <QuickActionGrid actions={quickActions} />
      </DashboardSection>

      {/* Client Success Stories */}
      <DashboardSection title="🏆 Recent Client Success">
        <View style={styles.successCard}>
          <View style={styles.successHeader}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.successTitle}>Client Achievement</Text>
          </View>
          <Text style={styles.successText}>
            Sarah improved her average position by 2.3 places after 4 coaching sessions focusing on upwind tactics.
          </Text>
          <TouchableOpacity style={styles.successAction}>
            <Text style={styles.successActionText}>Share Success Story</Text>
            <Ionicons name="share-social" size={16} color="#3B82F6" />
          </TouchableOpacity>
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
  sessionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  sessionTime: {
    fontSize: 14,
    color: '#64748B',
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  prepAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  prepAlertText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leadInfo: {
    flex: 1,
  },
  leadClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  leadService: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4,
  },
  leadBudget: {
    fontSize: 14,
    color: '#64748B',
  },
  leadStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  leadActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  leadActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leadActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  marketplaceCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  marketplaceContent: {
    padding: 20,
    gap: 20,
  },
  marketplaceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  marketplaceStat: {
    alignItems: 'center',
  },
  marketplaceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  marketplaceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  optimizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  successCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  successText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  successAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  successActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
});