/**
 * Club Dashboard Screen
 * Marine-grade yacht club management dashboard
 * OnX Maps + WatchDuty inspired professional interface for race officers and sailing managers
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useClub } from '@/lib/contexts/ClubContext';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';

export default function ClubDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    userClubs,
    selectedClub,
    dashboardStats,
    raceEvents,
    activeEvent,
    loading,
    hasAdminAccess,
    selectClub,
    refreshClubData,
    refreshClubEvents,
  } = useClub();

  const { user } = useAuth();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshClubData(),
        refreshClubEvents(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Get upcoming races (next 7 days)
  const upcomingRaces = raceEvents.filter(event => {
    const eventDate = new Date(event.start_date);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return eventDate > new Date() && eventDate <= nextWeek;
  });

  // Get recent races (last 30 days)
  const recentRaces = raceEvents.filter(event => {
    const eventDate = new Date(event.start_date);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return eventDate >= monthAgo && eventDate <= new Date();
  });

  if (!user) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="person" size={48} color="#64748b" />
          <ThemedText style={styles.emptyText}>Please sign in to access club management</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!selectedClub && userClubs.length === 0 && !loading) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="boat" size={48} color="#64748b" />
          <ThemedText style={styles.emptyText}>No clubs found</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Contact your sailing club administrator to get added to RegattaFlow
          </ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppHeader title="Club Dashboard" />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0ea5e9"
            colors={['#0ea5e9']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="boat" size={32} color="#0ea5e9" />
            <View style={styles.titleText}>
              <ThemedText style={styles.title}>Club Management</ThemedText>
              <ThemedText style={styles.subtitle}>
                {selectedClub ? selectedClub.name : 'Select a club'}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(app)/club/settings')}
          >
            <Ionicons name="settings" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* Club Selector */}
        {userClubs.length > 1 && (
          <View style={styles.clubSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubSelectorContent}
            >
              {userClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={[
                    styles.clubCard,
                    selectedClub?.id === club.id && styles.selectedClubCard,
                  ]}
                  onPress={() => selectClub(club)}
                >
                  <ThemedText style={[
                    styles.clubCardTitle,
                    selectedClub?.id === club.id && styles.selectedClubCardTitle,
                  ]}>
                    {club.short_name || club.name}
                  </ThemedText>
                  <ThemedText style={[
                    styles.clubCardSubtitle,
                    selectedClub?.id === club.id && styles.selectedClubCardSubtitle,
                  ]}>
                    {club.location.city}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedClub && (
          <>
            {/* Dashboard Stats */}
            {dashboardStats && (
              <View style={styles.statsSection}>
                <View style={styles.statsGrid}>
                  <StatCard
                    icon="people"
                    label="Members"
                    value={dashboardStats.total_members.toString()}
                    color="#22c55e"
                  />
                  <StatCard
                    icon="calendar"
                    label="Active Events"
                    value={dashboardStats.active_events.toString()}
                    color="#0ea5e9"
                  />
                  <StatCard
                    icon="trophy"
                    label="Upcoming Races"
                    value={dashboardStats.upcoming_races.toString()}
                    color="#f59e0b"
                  />
                  <StatCard
                    icon="person-add"
                    label="Registrations"
                    value={dashboardStats.total_registrations.toString()}
                    color="#8b5cf6"
                  />
                </View>
              </View>
            )}

            {/* Active Race Event */}
            {activeEvent && (
              <View style={styles.activeRaceSection}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Active Race</ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/club/race/${activeEvent.id}`)}
                  >
                    <ThemedText style={styles.sectionAction}>View Details</ThemedText>
                  </TouchableOpacity>
                </View>

                <ActiveRaceCard race={activeEvent} />
              </View>
            )}

            {/* Quick Actions */}
            {hasAdminAccess && (
              <View style={styles.actionsSection}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
                </View>

                <View style={styles.actionsGrid}>
                  <ActionCard
                    icon="add-circle"
                    title="Create Race"
                    subtitle="Set up a new racing event"
                    color="#22c55e"
                    onPress={() => router.push('/(app)/club/race/create')}
                  />
                  <ActionCard
                    icon="boat"
                    title="Race Builder"
                    subtitle="Visual course designer"
                    color="#0ea5e9"
                    onPress={() => router.push('/(app)/club/race-builder')}
                  />
                  <ActionCard
                    icon="people"
                    title="Members"
                    subtitle="Manage club members"
                    color="#8b5cf6"
                    onPress={() => router.push('/(app)/club/members')}
                  />
                  <ActionCard
                    icon="analytics"
                    title="Analytics"
                    subtitle="Club performance insights"
                    color="#f59e0b"
                    onPress={() => router.push('/(app)/club/analytics')}
                  />
                </View>
              </View>
            )}

            {/* Upcoming Races */}
            {upcomingRaces.length > 0 && (
              <View style={styles.upcomingSection}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Upcoming Races</ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push('/(app)/club/races')}
                  >
                    <ThemedText style={styles.sectionAction}>View All</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.racesList}>
                  {upcomingRaces.slice(0, 3).map((race) => (
                    <RaceCard
                      key={race.id}
                      race={race}
                      onPress={() => router.push(`/(app)/club/race/${race.id}`)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Recent Activity */}
            {recentRaces.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
                </View>

                <View style={styles.activityList}>
                  {recentRaces.slice(0, 5).map((race) => (
                    <ActivityItem
                      key={race.id}
                      icon="checkmark-circle"
                      title={`${race.name} completed`}
                      subtitle={`${race.sailing_class} • ${new Date(race.start_date).toLocaleDateString()}`}
                      color="#22c55e"
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

// Action Card Component
interface ActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function ActionCard({ icon, title, subtitle, color, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <ThemedText style={styles.actionTitle}>{title}</ThemedText>
      <ThemedText style={styles.actionSubtitle}>{subtitle}</ThemedText>
    </TouchableOpacity>
  );
}

// Active Race Card Component
interface ActiveRaceCardProps {
  race: any;
}

function ActiveRaceCard({ race }: ActiveRaceCardProps) {
  const timeUntilStart = new Date(race.start_date).getTime() - Date.now();
  const daysUntil = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.activeRaceCard}>
      <View style={styles.activeRaceHeader}>
        <ThemedText style={styles.activeRaceTitle}>{race.name}</ThemedText>
        <View style={styles.activeRaceStatus}>
          <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
          <ThemedText style={styles.statusText}>{race.status.replace('_', ' ').toUpperCase()}</ThemedText>
        </View>
      </View>

      <View style={styles.activeRaceDetails}>
        <View style={styles.raceDetailItem}>
          <Ionicons name="calendar" size={16} color="#94a3b8" />
          <ThemedText style={styles.raceDetailText}>
            {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
          </ThemedText>
        </View>
        <View style={styles.raceDetailItem}>
          <Ionicons name="boat" size={16} color="#94a3b8" />
          <ThemedText style={styles.raceDetailText}>{race.sailing_class}</ThemedText>
        </View>
        <View style={styles.raceDetailItem}>
          <Ionicons name="location" size={16} color="#94a3b8" />
          <ThemedText style={styles.raceDetailText}>{race.race_course.type.replace('_', ' ')}</ThemedText>
        </View>
      </View>
    </View>
  );
}

// Race Card Component
interface RaceCardProps {
  race: any;
  onPress: () => void;
}

function RaceCard({ race, onPress }: RaceCardProps) {
  return (
    <TouchableOpacity style={styles.raceCard} onPress={onPress}>
      <View style={styles.raceCardHeader}>
        <ThemedText style={styles.raceCardTitle}>{race.name}</ThemedText>
        <ThemedText style={styles.raceCardDate}>
          {new Date(race.start_date).toLocaleDateString()}
        </ThemedText>
      </View>
      <ThemedText style={styles.raceCardClass}>{race.sailing_class}</ThemedText>
    </TouchableOpacity>
  );
}

// Activity Item Component
interface ActivityItemProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

function ActivityItem({ icon, title, subtitle, color }: ActivityItemProps) {
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <View style={styles.activityContent}>
        <ThemedText style={styles.activityTitle}>{title}</ThemedText>
        <ThemedText style={styles.activitySubtitle}>{subtitle}</ThemedText>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },

  // Club Selector
  clubSelector: {
    marginBottom: 24,
  },
  clubSelectorContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  clubCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
  },
  selectedClubCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0ea5e9',
  },
  clubCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  selectedClubCardTitle: {
    color: '#0ea5e9',
  },
  clubCardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  selectedClubCardSubtitle: {
    color: '#0ea5e9',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: (width - 60) / 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  sectionAction: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },

  // Active Race Section
  activeRaceSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activeRaceCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 12,
    padding: 20,
  },
  activeRaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeRaceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  activeRaceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  activeRaceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  raceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raceDetailText: {
    fontSize: 12,
    color: '#cbd5e1',
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: (width - 60) / 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Upcoming Section
  upcomingSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  racesList: {
    gap: 12,
  },
  raceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  raceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  raceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  raceCardDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  raceCardClass: {
    fontSize: 14,
    color: '#cbd5e1',
  },

  // Recent Section
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
});