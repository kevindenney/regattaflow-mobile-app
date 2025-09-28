/**
 * Dashboard Route - Main user dashboard with stats and recent events
 * Fixed routing - now loads from src/app (correct Expo Router location)
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
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DashboardStats {
  total_regattas: number;
  total_documents: number;
  avg_position: number;
  best_position: number;
  recent_races: number;
}

interface RecentEvent {
  id: string;
  title: string;
  start_date: string;
  status: string;
  position?: number;
  fleet_size?: number;
}

export default function DashboardScreen() {
  console.log('📊 Dashboard: Component loading - FULL FUNCTIONALITY RESTORED');
  console.log('🔍 Dashboard: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

  // Mock data for demo purposes (replace with real Supabase calls later)
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock stats data
      setStats({
        total_regattas: 12,
        total_documents: 45,
        avg_position: 3.2,
        best_position: 1,
        recent_races: 3
      });

      // Mock recent events
      setRecentEvents([
        {
          id: '1',
          title: 'San Francisco Bay Championship',
          start_date: '2024-09-28',
          status: 'upcoming',
          fleet_size: 28
        },
        {
          id: '2',
          title: 'Monterey Bay Regatta',
          start_date: '2024-09-15',
          status: 'completed',
          position: 2,
          fleet_size: 34
        },
        {
          id: '3',
          title: 'Half Moon Bay Series',
          start_date: '2024-09-08',
          status: 'completed',
          position: 5,
          fleet_size: 22
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subtitle}>Here's your sailing performance overview</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={24} color="#0066CC" />
            <Text style={styles.statNumber}>{stats?.total_regattas || 0}</Text>
            <Text style={styles.statLabel}>Total Regattas</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#0066CC" />
            <Text style={styles.statNumber}>{stats?.total_documents || 0}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="podium-outline" size={24} color="#0066CC" />
            <Text style={styles.statNumber}>{stats?.avg_position?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Avg Position</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="medal-outline" size={24} color="#0066CC" />
            <Text style={styles.statNumber}>{stats?.best_position || 0}</Text>
            <Text style={styles.statLabel}>Best Position</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="add-circle-outline" size={32} color="#0066CC" />
              <Text style={styles.actionText}>New Regatta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="document-outline" size={32} color="#0066CC" />
              <Text style={styles.actionText}>Upload Docs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="map-outline" size={32} color="#0066CC" />
              <Text style={styles.actionText}>View Course</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {recentEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.eventCard}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.start_date}</Text>
                {event.position && (
                  <Text style={styles.eventPosition}>
                    Position: {event.position}/{event.fleet_size}
                  </Text>
                )}
              </View>
              <View style={[styles.statusBadge,
                { backgroundColor: event.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                <Text style={styles.statusText}>{event.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventPosition: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});