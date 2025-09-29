/**
 * Club Management Dashboard - Race Committee & Event Management
 * For sailing clubs, yacht clubs, and regatta organizers
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/lib/contexts/AuthContext';

interface ClubStats {
  total_events: number;
  active_regattas: number;
  total_members: number;
  upcoming_races: number;
  completed_events: number;
  average_participation: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  status: 'planning' | 'registration' | 'racing' | 'completed';
  participants: number;
  classes: string[];
  venue: string;
}

export default function ClubDashboard() {
  console.log('🏛️ Club Dashboard: Loading Club Management System');

  const { user, signedIn, ready, loading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Debug auth state
  console.log('🏛️ [CLUB] ===== CLUB DASHBOARD RENDER =====');
  console.log('🏛️ [CLUB] Current URL:', window.location.href);
  console.log('🏛️ [CLUB] Auth state:', {
    hasUser: !!user,
    signedIn,
    ready,
    authLoading,
    userEmail: user?.email || 'null'
  });

  // Auth Guard: Redirect if not authenticated
  useEffect(() => {
    if (ready && !signedIn && !authLoading) {
      console.log('🚨 [CLUB] Auth guard triggered - redirecting to landing');
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    }
  }, [ready, signedIn, authLoading]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [selectedSection, setSelectedSection] = useState<'overview' | 'events' | 'members' | 'results' | 'settings'>('overview');

  useEffect(() => {
    loadClubData();
  }, []);

  const loadClubData = async () => {
    try {
      console.log('🔄 Loading club management data...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setStats({
        total_events: 18,
        active_regattas: 3,
        total_members: 247,
        upcoming_races: 12,
        completed_events: 15,
        average_participation: 68
      });

      setUpcomingEvents([
        {
          id: '1',
          title: 'Spring Dragon Championship',
          date: '2024-10-20',
          status: 'registration',
          participants: 32,
          classes: ['Dragon'],
          venue: 'Main Course'
        },
        {
          id: '2',
          title: 'Junior Development Series',
          date: '2024-10-25',
          status: 'planning',
          participants: 0,
          classes: ['Optimist', 'Laser'],
          venue: 'Training Area'
        },
        {
          id: '3',
          title: 'Club Championship Finals',
          date: '2024-11-05',
          status: 'planning',
          participants: 0,
          classes: ['All Classes'],
          venue: 'Championship Course'
        }
      ]);

      console.log('✅ Club data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load club data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>🏛️ Loading Club Management...</Text>
        <Text style={styles.loadingSubtext}>Initializing race committee tools</Text>
      </View>
    );
  }

  const renderOverviewSection = () => (
    <ScrollView style={styles.overviewContent} showsVerticalScrollIndicator={false}>
      {/* Club Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={24} color="#0066CC" />
          <Text style={styles.statNumber}>{stats?.total_events || 0}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats?.total_members || 0}</Text>
          <Text style={styles.statLabel}>Club Members</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats?.active_regattas || 0}</Text>
          <Text style={styles.statLabel}>Active Regattas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="analytics-outline" size={24} color="#9C27B0" />
          <Text style={styles.statNumber}>{stats?.average_participation || 0}%</Text>
          <Text style={styles.statLabel}>Avg Participation</Text>
        </View>
      </View>

      {/* Quick Actions for Race Committee */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏁 Race Committee Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.primaryActionCard]}
            onPress={() => console.log('Creating new regatta...')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionGradient}
            >
              <Ionicons name="add-circle" size={28} color="white" />
              <Text style={styles.actionText}>Create Regatta</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryActionCard]}
            onPress={() => setSelectedSection('results')}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.actionGradient}
            >
              <Ionicons name="podium" size={28} color="white" />
              <Text style={styles.actionText}>Enter Results</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryActionCard]}
            onPress={() => setSelectedSection('members')}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.actionGradient}
            >
              <Ionicons name="people" size={28} color="white" />
              <Text style={styles.actionText}>Manage Members</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
        {upcomingEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventVenue}>{event.venue} • {event.classes.join(', ')}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
              {event.participants > 0 && (
                <Text style={styles.eventParticipants}>
                  👥 {event.participants} registered
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor:
                event.status === 'registration' ? '#10B981' :
                event.status === 'planning' ? '#F59E0B' :
                event.status === 'racing' ? '#EF4444' : '#6B7280'
            }]}>
              <Text style={styles.statusText}>{event.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderEventsSection = () => (
    <View style={styles.comingSoonContainer}>
      <Ionicons name="calendar" size={64} color="#DDD" />
      <Text style={styles.comingSoonTitle}>Event Management</Text>
      <Text style={styles.comingSoonText}>
        Create and manage regattas, handle registrations, and coordinate race schedules.
      </Text>
    </View>
  );

  const renderMembersSection = () => (
    <View style={styles.comingSoonContainer}>
      <Ionicons name="people" size={64} color="#DDD" />
      <Text style={styles.comingSoonTitle}>Member Management</Text>
      <Text style={styles.comingSoonText}>
        Manage club membership, fees, and sailor registrations.
      </Text>
    </View>
  );

  const renderResultsSection = () => (
    <View style={styles.comingSoonContainer}>
      <Ionicons name="podium" size={64} color="#DDD" />
      <Text style={styles.comingSoonTitle}>Results Management</Text>
      <Text style={styles.comingSoonText}>
        Enter race results, manage scoring, and publish standings.
      </Text>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.comingSoonContainer}>
      <Ionicons name="settings" size={64} color="#DDD" />
      <Text style={styles.comingSoonTitle}>Club Settings</Text>
      <Text style={styles.comingSoonText}>
        Configure club preferences, courses, and administrative settings.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Club Management 🏛️</Text>
          <Text style={styles.subtitle}>Race Committee Dashboard</Text>
        </View>
      </View>

      {/* Section Navigation */}
      <View style={styles.sectionNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: '🏠 Overview', icon: 'home' },
            { key: 'events', label: '📅 Events', icon: 'calendar' },
            { key: 'members', label: '👥 Members', icon: 'people' },
            { key: 'results', label: '🏆 Results', icon: 'podium' },
            { key: 'settings', label: '⚙️ Settings', icon: 'settings' }
          ].map(section => (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.sectionButton,
                selectedSection === section.key && styles.sectionButtonActive
              ]}
              onPress={() => setSelectedSection(section.key as any)}
            >
              <Text style={[
                styles.sectionButtonText,
                selectedSection === section.key && styles.sectionButtonTextActive
              ]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dynamic Content */}
      <View style={styles.content}>
        {selectedSection === 'overview' && (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderOverviewSection()}
          </ScrollView>
        )}

        {selectedSection === 'events' && renderEventsSection()}
        {selectedSection === 'members' && renderMembersSection()}
        {selectedSection === 'results' && renderResultsSection()}
        {selectedSection === 'settings' && renderSettingsSection()}
      </View>
    </SafeAreaView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  sectionNav: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  sectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  sectionButtonActive: {
    backgroundColor: '#1E40AF',
  },
  sectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sectionButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryActionCard: {
    backgroundColor: 'transparent',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  eventParticipants: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
});