/**
 * Results Tab - Race results and regatta management
 */

import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { Tabs, router } from 'expo-router';

interface Regatta {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  location?: string;
  description?: string;
  races_count?: number;
  participants_count?: number;
  user_id: string;
}

export default function ResultsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regattas, setRegattas] = useState<Regatta[]>([]);

  useEffect(() => {
    if (user) {
      loadRegattas();
    }
  }, [user]);

  const loadRegattas = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error loading regattas:', error);
        return;
      }

      setRegattas(data || []);
    } catch (error) {
      console.error('Error loading regattas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRegattas();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'active': return '#3B82F6';
      case 'open': return '#F59E0B';
      case 'draft': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'active': return 'Active';
      case 'open': return 'Open';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const handleCreateRegatta = () => {
    Alert.alert('Create Regatta', 'This feature will be available soon!');
  };

  const handleViewRegatta = (regatta: Regatta) => {
    Alert.alert('View Regatta', `Opening ${regatta.name}...`);
  };

  const handleExportResults = (regatta: Regatta) => {
    Alert.alert('Export Results', `Exporting results for ${regatta.name}...`);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed" size={48} color="#999" />
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authText}>Please sign in to view your race results</Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalRegattas = regattas.length;
  const activeEvents = regattas.filter(r => r.status === 'active').length;
  const completed = regattas.filter(r => r.status === 'completed').length;
  const upcoming = regattas.filter(r =>
    r.status === 'open' && new Date(r.start_date) > new Date()
  ).length;

  return (
    <>
      <Tabs.Screen
        options={{
          title: 'Results',
          headerShown: Platform.OS === 'ios',
        }}
      />

      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Race Results</Text>
            <Text style={styles.subtitle}>
              Manage race results and view standings for your regattas
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateRegatta}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Regatta</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statCardInner}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statValue}>{totalRegattas}</Text>
                    <Ionicons name="trophy" size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.statLabel}>Total Regattas</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardInner}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statValue}>{activeEvents}</Text>
                    <Ionicons name="time" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.statLabel}>Active Events</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardInner}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statValue}>{completed}</Text>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardInner}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statValue}>{upcoming}</Text>
                    <Ionicons name="calendar" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Regattas List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Regattas</Text>
            <Text style={styles.sectionSubtitle}>
              Click on a regatta to manage races and enter results
            </Text>

            {regattas.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>No regattas yet</Text>
                <Text style={styles.emptyText}>
                  Create your first regatta to start managing race results
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreateRegatta}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Create Your First Regatta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.regattasList}>
                {regattas.map((regatta) => (
                  <TouchableOpacity
                    key={regatta.id}
                    style={styles.regattaCard}
                    onPress={() => handleViewRegatta(regatta)}
                  >
                    <View style={styles.regattaHeader}>
                      <View style={styles.regattaInfo}>
                        <Text style={styles.regattaName}>{regatta.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(regatta.status) }]}>
                          <Text style={styles.statusText}>{getStatusText(regatta.status)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.regattaDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {new Date(regatta.start_date).toLocaleDateString()}
                          {regatta.end_date !== regatta.start_date &&
                            ` - ${new Date(regatta.end_date).toLocaleDateString()}`
                          }
                        </Text>
                      </View>

                      {regatta.location && (
                        <View style={styles.detailRow}>
                          <Ionicons name="location" size={16} color="#666" />
                          <Text style={styles.detailText}>{regatta.location}</Text>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <Ionicons name="people" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {regatta.participants_count || 0} participants • {regatta.races_count || 0} races
                        </Text>
                      </View>
                    </View>

                    {regatta.description && (
                      <Text style={styles.regattaDescription} numberOfLines={2}>
                        {regatta.description}
                      </Text>
                    )}

                    <View style={styles.regattaActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewRegatta(regatta)}
                      >
                        <Ionicons name="eye" size={16} color="#007AFF" />
                        <Text style={styles.actionButtonText}>View Results</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleExportResults(regatta)}
                      >
                        <Ionicons name="download" size={16} color="#007AFF" />
                        <Text style={styles.actionButtonText}>Export</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  authText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCardInner: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  regattasList: {
    gap: 16,
  },
  regattaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  regattaHeader: {
    marginBottom: 12,
  },
  regattaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regattaName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  regattaDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  regattaDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  regattaActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});