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
import { MOCK_BOATS } from '@/src/constants/mockData';
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
  const [filterBy, setFilterBy] = useState<'all' | 'primary'>('all');

  useEffect(() => {
    if (user) {
      loadBoats();
    }
  }, [user]);

  const loadBoats = async () => {
    if (!user) {
      console.log('⚠️ [BoatListScreen] No user, skipping boat load');
      return;
    }

    try {
      console.log('🚀 [BoatListScreen] Starting to load boats for user:', user.id);
      console.log('📧 [BoatListScreen] User email:', user.email);
      setLoading(true);
      const boatList = await sailorBoatService.listBoatsForSailor(user.id);
      console.log(`🎯 [BoatListScreen] Received ${boatList.length} boats from service`);
      setBoats(boatList);
    } catch (error) {
      console.error('❌ [BoatListScreen] Error loading boats:', error);
      console.error('❌ [BoatListScreen] Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
      console.log('✅ [BoatListScreen] Finished loading boats');
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

  const filteredBoats = boats.filter(boat => {
    if (filterBy === 'primary') return boat.is_primary;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Boats</Text>
          <Text style={styles.headerSubtitle}>{boats.length} {boats.length === 1 ? 'boat' : 'boats'}</Text>
        </View>
        <TouchableOpacity onPress={handleAddBoat} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {boats.length === 0 ? (
          <>
            {/* Demo Message */}
            <View style={styles.demoMessage}>
              <Text style={styles.demoText}>
                📋 Demo boats to get you started - tap "+" to add your first boat!
              </Text>
            </View>

            {/* Show Mock Boats */}
            <View style={styles.boatList}>
              {MOCK_BOATS.map((boat) => (
                <View
                  key={boat.id}
                  style={[styles.boatCard, styles.mockBoatCard]}
                >
                  <View style={styles.boatCardHeader}>
                    <View style={styles.boatIcon}>
                      <Ionicons name="boat" size={24} color="#94A3B8" />
                    </View>
                    <View style={styles.boatInfo}>
                      <View style={styles.boatTitleRow}>
                        <Text style={styles.boatName}>{boat.name}</Text>
                        {boat.isPrimary && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>Primary</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.boatClass}>
                        {boat.class}
                        {boat.sailNumber && ` • Sail #${boat.sailNumber}`}
                      </Text>
                    </View>
                  </View>
                  {(boat.hullMaker || boat.sailMaker) && (
                    <View style={styles.boatDetails}>
                      {boat.hullMaker && (
                        <Text style={styles.detailText}>Hull: {boat.hullMaker}</Text>
                      )}
                      {boat.sailMaker && (
                        <Text style={styles.detailText}>Sails: {boat.sailMaker}</Text>
                      )}
                    </View>
                  )}
                  <View style={styles.mockBadge}>
                    <Text style={styles.mockBadgeText}>Demo</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Filter Tabs */}
            {boats.length > 1 && (
              <View style={styles.filterTabs}>
                <TouchableOpacity
                  style={[styles.filterTab, filterBy === 'all' && styles.filterTabActive]}
                  onPress={() => setFilterBy('all')}
                >
                  <Text style={[styles.filterTabText, filterBy === 'all' && styles.filterTabTextActive]}>
                    All Boats ({boats.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterTab, filterBy === 'primary' && styles.filterTabActive]}
                  onPress={() => setFilterBy('primary')}
                >
                  <Text style={[styles.filterTabText, filterBy === 'primary' && styles.filterTabTextActive]}>
                    Primary
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.boatList}>
              {filteredBoats.map((boat) => {
                // Generate boat display name - use actual boat name if available
                const displayName = boat.name ||
                  (boat.sail_number
                    ? `${boat.boat_class?.name || 'Boat'} #${boat.sail_number}`
                    : boat.boat_class?.name || 'Unnamed Boat');

                return (
                  <TouchableOpacity
                    key={boat.id}
                    style={styles.boatCard}
                    onPress={() => handleBoatPress(boat.id)}
                    activeOpacity={0.7}
                  >
                    {/* Header with boat icon and main info */}
                    <View style={styles.boatCardHeader}>
                      <View style={[styles.boatIcon, boat.is_primary && styles.boatIconPrimary]}>
                        <Ionicons
                          name={boat.is_primary ? "boat" : "boat-outline"}
                          size={28}
                          color={boat.is_primary ? "#3B82F6" : "#64748B"}
                        />
                      </View>
                      <View style={styles.boatInfo}>
                        <View style={styles.boatTitleRow}>
                          <Text style={styles.boatName}>{displayName}</Text>
                          {boat.is_primary && (
                            <View style={styles.primaryBadge}>
                              <Ionicons name="star" size={10} color="#1D4ED8" />
                              <Text style={styles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.boatClass}>
                          {boat.boat_class?.class_association || boat.boat_class?.name}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={22} color="#CBD5E1" />
                    </View>

                    {/* Boat Details Row */}
                    {(boat.manufacturer || boat.year_built || boat.hull_material) && (
                      <View style={styles.detailsRow}>
                        {boat.manufacturer && (
                          <View style={styles.detailChip}>
                            <Ionicons name="business-outline" size={14} color="#64748B" />
                            <Text style={styles.detailChipText}>{boat.manufacturer}</Text>
                          </View>
                        )}
                        {boat.year_built && (
                          <View style={styles.detailChip}>
                            <Ionicons name="calendar-outline" size={14} color="#64748B" />
                            <Text style={styles.detailChipText}>{boat.year_built}</Text>
                          </View>
                        )}
                        {boat.hull_material && (
                          <View style={styles.detailChip}>
                            <Ionicons name="layers-outline" size={14} color="#64748B" />
                            <Text style={styles.detailChipText}>{boat.hull_material}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(tabs)/boat/${boat.id}?tab=sails`);
                        }}
                      >
                        <Ionicons name="fish-outline" size={18} color="#3B82F6" />
                        <Text style={styles.quickActionText}>Sails</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(tabs)/boat/${boat.id}?tab=tuning3d`);
                        }}
                      >
                        <Ionicons name="settings-outline" size={18} color="#3B82F6" />
                        <Text style={styles.quickActionText}>Tuning</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(tabs)/boat/${boat.id}?tab=performance`);
                        }}
                      >
                        <Ionicons name="stats-chart-outline" size={18} color="#3B82F6" />
                        <Text style={styles.quickActionText}>Stats</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(tabs)/boat/${boat.id}?tab=maintenance`);
                        }}
                      >
                        <Ionicons name="build-outline" size={18} color="#3B82F6" />
                        <Text style={styles.quickActionText}>Service</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
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
    borderRadius: 16,
    padding: 18,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  boatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boatIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#F1F5F9',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boatIconPrimary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#DBEAFE',
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
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  boatClass: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
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
  demoMessage: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: '#0369A1',
    textAlign: 'center',
  },
  mockBoatCard: {
    opacity: 0.85,
    borderColor: '#E2E8F0',
  },
  mockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
