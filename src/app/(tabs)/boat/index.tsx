/**
 * Boat List Screen - Overview of individual boats (vessels)
 *
 * KEY DISTINCTION:
 * - This screen shows INDIVIDUAL BOATS (e.g., "Dragonfly" - a specific Dragon)
 * - NOT boat classes (e.g., Dragon, Etchells)
 * - NOT fleets (e.g., "Hong Kong Dragon Fleet")
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { sailorBoatService, type SailorBoat } from '@/src/services/SailorBoatService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function BoatListScreen() {
  const { user } = useAuth();
  const [boats, setBoats] = useState<SailorBoat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBoats();
    }
  }, [user]);

  const loadBoats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const boatList = await sailorBoatService.listBoatsForSailor(user.id);
      setBoats(boatList);
    } catch (error) {
      console.error('Error loading boats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoatPress = (boatId: string) => {
    router.push(`/(tabs)/boat/${boatId}`);
  };

  const handleAddBoat = () => {
    router.push('/(tabs)/boat/add');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading boats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Boats</Text>
        <TouchableOpacity onPress={handleAddBoat} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {boats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="boat-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No boats yet</Text>
            <Text style={styles.emptyText}>
              Add your first boat to start tracking equipment and maintenance.
              Boats are individual vessels (like "Dragonfly"), separate from fleets.
            </Text>
            <TouchableOpacity onPress={handleAddBoat} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Add Boat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.boatList}>
            {boats.map((boat) => (
              <TouchableOpacity
                key={boat.id}
                style={styles.boatCard}
                onPress={() => handleBoatPress(boat.id)}
              >
                <View style={styles.boatCardHeader}>
                  <View style={styles.boatIcon}>
                    <Ionicons name="boat" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.boatInfo}>
                    <View style={styles.boatTitleRow}>
                      <Text style={styles.boatName}>
                        {boat.name}
                      </Text>
                      {boat.is_primary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.boatClass}>
                      {boat.boat_class?.name || 'Unknown Class'}
                      {boat.sail_number && ` • Sail #${boat.sail_number}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="construct-outline" size={16} color="#64748B" />
                    <Text style={styles.statText}>Equipment</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="build-outline" size={16} color="#64748B" />
                    <Text style={styles.statText}>Maintenance</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="settings-outline" size={16} color="#64748B" />
                    <Text style={styles.statText}>Tuning</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB for adding boats */}
      {boats.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddBoat}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  boatList: {
    padding: 16,
    gap: 12,
  },
  boatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  boatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boatIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boatInfo: {
    flex: 1,
  },
  boatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  primaryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  boatClass: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px',
    elevation: 6,
  },
});
