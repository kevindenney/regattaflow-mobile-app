import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/AuthProvider';
import { coachingService, CoachingClient, ClientStats } from '@/services/CoachingService';
import { formatDistanceToNow } from 'date-fns';

export default function ClientsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<CoachingClient[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    activeClients: 0,
    totalSessions: 0,
    sessionsThisMonth: 0,
    upcomingSessions: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [clientsData, statsData] = await Promise.all([
        coachingService.getClients(user.id, 'active'),
        coachingService.getCoachStats(user.id)
      ]);

      setClients(clientsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClientPress = (clientId: string) => {
    router.push(`/coach/client/${clientId}`);
  };

  const formatLastSession = (date?: string) => {
    if (!date) return 'No sessions yet';
    return `Last session: ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>My Clients</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.activeClients}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Clients</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.sessionsThisMonth}</ThemedText>
            <ThemedText style={styles.statLabel}>Sessions This Month</ThemedText>
          </View>
        </View>

        {stats.upcomingSessions > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{stats.upcomingSessions}</ThemedText>
              <ThemedText style={styles.statLabel}>Upcoming Sessions</ThemedText>
            </View>
            {stats.averageRating && (
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.averageRating.toFixed(1)} ⭐</ThemedText>
                <ThemedText style={styles.statLabel}>Average Rating</ThemedText>
              </View>
            )}
          </View>
        )}

        {clients.length > 0 ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Active Clients</ThemedText>

            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.clientCard}
                onPress={() => handleClientPress(client.id)}
              >
                <View style={styles.clientAvatar}>
                  {client.sailor?.avatar_url ? (
                    <Image
                      source={{ uri: client.sailor.avatar_url }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                  ) : (
                    <Ionicons name="person-circle" size={50} color="#CBD5E1" />
                  )}
                </View>
                <View style={styles.clientInfo}>
                  <ThemedText style={styles.clientName}>
                    {client.sailor?.full_name || client.sailor?.email || 'Unknown Client'}
                  </ThemedText>
                  <ThemedText style={styles.clientDetail}>
                    {client.primary_boat_class || 'No boat class'} • {client.skill_level || 'Unknown level'}
                  </ThemedText>
                  <ThemedText style={styles.clientDetail}>
                    {formatLastSession(client.last_session_date)}
                  </ThemedText>
                  <ThemedText style={styles.clientDetail}>
                    {client.total_sessions} session{client.total_sessions !== 1 ? 's' : ''} completed
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <ThemedText style={styles.emptyText}>
              Start building your client base
            </ThemedText>
            <TouchableOpacity style={styles.ctaButton}>
              <ThemedText style={styles.ctaButtonText}>Find Sailors</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  clientAvatar: {
    marginRight: 15,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});