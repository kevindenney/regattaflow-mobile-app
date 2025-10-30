/**
 * Boat List Screen - Overview of individual boats (vessels)
 *
 * KEY DISTINCTION:
 * - This screen shows INDIVIDUAL BOATS (e.g., "Dragonfly" - a specific Dragon)
 * - NOT boat classes (e.g., Dragon, Etchells)
 * - NOT fleets (e.g., "Hong Kong Dragon Fleet")
 */

import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, type SailorBoat } from '@/services/SailorBoatService';
import { MOCK_BOATS } from '@/constants/mockData';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STATUS_THEMES: Record<SailorBoat['status'], { background: string; border: string; color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  active: {
    background: '#DCFCE7',
    border: '#86EFAC',
    color: '#15803D',
    label: 'Active racing',
    icon: 'boat-outline',
  },
  stored: {
    background: '#E0F2FE',
    border: '#BAE6FD',
    color: '#0275D8',
    label: 'Stored / layup',
    icon: 'archive-outline',
  },
  sold: {
    background: '#FEE2E2',
    border: '#FECACA',
    color: '#B91C1C',
    label: 'Sold',
    icon: 'cash-outline',
  },
  retired: {
    background: '#E2E8F0',
    border: '#CBD5F5',
    color: '#475569',
    label: 'Retired',
    icon: 'flag-outline',
  },
};

const getStatusTheme = (status?: SailorBoat['status']) => {
  if (!status) {
    return STATUS_THEMES.active;
  }
  return STATUS_THEMES[status] || STATUS_THEMES.active;
};

export default function BoatListScreen() {
  const { user } = useAuth();
  const [boats, setBoats] = useState<SailorBoat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<'all' | 'primary'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {

    // Set a timeout to stop loading if it takes too long
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    if (user) {
      loadBoats().finally(() => clearTimeout(timeout));
    } else {

      // If no user after 2 seconds, stop loading
      setTimeout(() => setLoading(false), 2000);
    }

    return () => clearTimeout(timeout);
  }, [user]);

  const loadBoats = async () => {
    if (!user) {

      return;
    }

    try {
      setLoading(true);
      const boatList = await sailorBoatService.listBoatsForSailor(user.id);
      setBoats(boatList);
    } catch (error) {

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

  const handleSetDefault = async (boatId: string) => {
    logger.debug('[BoatListScreen] handleSetDefault clicked', { boatId });
    try {
      logger.debug('[BoatListScreen] Calling setPrimaryBoat service...');
      await sailorBoatService.setPrimaryBoat(boatId);
      logger.debug('[BoatListScreen] setPrimaryBoat successful, reloading boats...');
      // Reload boats to show updated default
      await loadBoats();
      logger.debug('[BoatListScreen] handleSetDefault complete');
    } catch (error) {
      console.error('[BoatListScreen] Error setting default boat:', error);
      alert('Failed to set default boat');
    }
  };

  const getBoatDisplayName = (boat: SailorBoat) => {
    if (!boat) {
      return 'Unnamed Boat';
    }
    const trimmedName = boat.name?.trim();
    if (trimmedName) {
      return trimmedName;
    }
    if (boat.sail_number) {
      return `${boat.boat_class?.name || 'Boat'} #${boat.sail_number}`;
    }
    return boat.boat_class?.name || 'Unnamed Boat';
  };

  const classFilters = useMemo(() => {
    const map = new Map<string, string>();
    boats.forEach((boat) => {
      if (boat.boat_class?.id) {
        map.set(
          boat.boat_class.id,
          boat.boat_class.name ||
            boat.boat_class.class_association ||
            'Class'
        );
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [boats]);

  const totalBoats = boats.length;
  const primaryBoat = boats.find((boat) => boat.is_primary);
  const activeBoats = useMemo(
    () => boats.filter((boat) => boat.status === 'active').length,
    [boats]
  );
  const inactiveBoats = useMemo(
    () => boats.filter((boat) => boat.status !== 'active').length,
    [boats]
  );
  const lastUpdatedLabel = useMemo(() => {
    if (!boats.length) return null;
    const latest = boats.reduce((latestDate, boat) => {
      const timestamp = new Date(boat.updated_at).getTime();
      return Math.max(latestDate, timestamp);
    }, 0);
    if (!latest) return null;
    return new Date(latest).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }, [boats]);

  const filteredBoats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return boats.filter((boat) => {
      if (filterBy === 'primary' && !boat.is_primary) {
        return false;
      }
      if (statusFilter === 'active' && boat.status !== 'active') {
        return false;
      }
      if (statusFilter === 'inactive' && boat.status === 'active') {
        return false;
      }
      if (selectedClassId !== 'all' && boat.boat_class?.id !== selectedClassId) {
        return false;
      }
      if (query) {
        const haystack = [
          boat.name,
          boat.sail_number,
          boat.hull_number,
          boat.boat_class?.name,
          boat.boat_class?.class_association,
          boat.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [boats, filterBy, searchQuery, selectedClassId, statusFilter]);

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
        <View>
          <Text style={styles.headerTitle}>My Boats</Text>
          <Text style={styles.headerSubtitle}>{boats.length} {boats.length === 1 ? 'boat' : 'boats'}</Text>
        </View>
        <TouchableOpacity onPress={handleAddBoat} style={styles.addButton}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add boat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {totalBoats > 0 ? (
          <>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="boat-outline" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.summaryValue}>{totalBoats}</Text>
                  <Text style={styles.summaryLabel}>Boats tracked</Text>
                </View>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, styles.summaryIconSuccess]}>
                  <Ionicons name="speedometer-outline" size={20} color="#047857" />
                </View>
                <View>
                  <Text style={styles.summaryValue}>{activeBoats}</Text>
                  <Text style={styles.summaryLabel}>
                    Active • {inactiveBoats} offline
                  </Text>
                </View>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, styles.summaryIconAccent]}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.summaryValue}>
                    {primaryBoat ? getBoatDisplayName(primaryBoat) : 'No default'}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    {lastUpdatedLabel ? `Updated ${lastUpdatedLabel}` : 'Awaiting updates'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.controlsContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search boats, sail numbers, or classes"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {boats.length > 1 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionLabel}>Show</Text>
                  <View style={styles.filterChipRow}>
                    <TouchableOpacity
                      style={[styles.filterChip, filterBy === 'all' && styles.filterChipActive]}
                      onPress={() => setFilterBy('all')}
                    >
                      <Text style={[styles.filterChipText, filterBy === 'all' && styles.filterChipTextActive]}>
                        All boats
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, filterBy === 'primary' && styles.filterChipActive]}
                      onPress={() => setFilterBy('primary')}
                    >
                      <Text style={[styles.filterChipText, filterBy === 'primary' && styles.filterChipTextActive]}>
                        Primary
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Status</Text>
                <View style={styles.filterChipRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setStatusFilter('all')}
                  >
                    <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                      All statuses
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, statusFilter === 'active' && styles.filterChipActive]}
                    onPress={() => setStatusFilter('active')}
                  >
                    <Text style={[styles.filterChipText, statusFilter === 'active' && styles.filterChipTextActive]}>
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, statusFilter === 'inactive' && styles.filterChipActive]}
                    onPress={() => setStatusFilter('inactive')}
                  >
                    <Text style={[styles.filterChipText, statusFilter === 'inactive' && styles.filterChipTextActive]}>
                      Offline
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {classFilters.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionLabel}>Class</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterChipScroll}
                    contentContainerStyle={styles.filterChipScrollContent}
                  >
                    <TouchableOpacity
                      style={[styles.filterChip, selectedClassId === 'all' && styles.filterChipActive]}
                      onPress={() => setSelectedClassId('all')}
                    >
                      <Text style={[styles.filterChipText, selectedClassId === 'all' && styles.filterChipTextActive]}>
                        All classes
                      </Text>
                    </TouchableOpacity>
                    {classFilters.map((boatClass) => (
                      <TouchableOpacity
                        key={boatClass.id}
                        style={[styles.filterChip, selectedClassId === boatClass.id && styles.filterChipActive]}
                        onPress={() => setSelectedClassId(boatClass.id)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedClassId === boatClass.id && styles.filterChipTextActive,
                          ]}
                        >
                          {boatClass.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.boatList}>
              {filteredBoats.length === 0 ? (
                <View style={styles.noResultsCard}>
                  <Ionicons name="search-outline" size={28} color="#94A3B8" />
                  <Text style={styles.noResultsTitle}>No boats match your filters</Text>
                  <Text style={styles.noResultsText}>
                    Try clearing the search or switching filters to see the rest of your fleet.
                  </Text>
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setFilterBy('all');
                      setSelectedClassId('all');
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#1E40AF" />
                    <Text style={styles.clearFiltersText}>Reset filters</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredBoats.map((boat) => {
                  const displayName = getBoatDisplayName(boat);
                  const statusTheme = getStatusTheme(boat.status);

                  return (
                    <TouchableOpacity
                      key={boat.id}
                      style={styles.boatCard}
                      onPress={() => handleBoatPress(boat.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.boatCardTopRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusTheme.background, borderColor: statusTheme.border }]}>
                          <Ionicons name={statusTheme.icon} size={14} color={statusTheme.color} />
                          <Text style={[styles.statusBadgeText, { color: statusTheme.color }]}>
                            {statusTheme.label}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.starButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            logger.debug('[BoatListScreen] Star button pressed!', { boatId: boat.id });
                            handleSetDefault(boat.id);
                          }}
                        >
                          <Ionicons
                            name={boat.is_primary ? 'star' : 'star-outline'}
                            size={22}
                            color={boat.is_primary ? '#F59E0B' : '#CBD5F5'}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.boatCardHeader}>
                        <View style={[styles.boatIcon, boat.is_primary && styles.boatIconPrimary]}>
                          <Ionicons
                            name={boat.is_primary ? 'boat' : 'boat-outline'}
                            size={28}
                            color={boat.is_primary ? '#2563EB' : '#64748B'}
                          />
                        </View>
                        <View style={styles.boatInfo}>
                          <View style={styles.boatTitleRow}>
                            <Text style={styles.boatName}>{displayName}</Text>
                            {boat.is_primary && (
                              <View style={styles.primaryBadge}>
                                <Ionicons name="ribbon" size={12} color="#1D4ED8" />
                                <Text style={styles.primaryBadgeText}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.boatClass}>
                            {boat.boat_class?.class_association || boat.boat_class?.name || 'Unclassified'}
                          </Text>
                          <View style={styles.metaRow}>
                            {boat.sail_number && (
                              <View style={styles.metaItem}>
                                <Ionicons name="flag-outline" size={14} color="#475569" />
                                <Text style={styles.metaText}>Sail #{boat.sail_number}</Text>
                              </View>
                            )}
                            {boat.hull_number && (
                              <View style={styles.metaItem}>
                                <Ionicons name="cube-outline" size={14} color="#475569" />
                                <Text style={styles.metaText}>Hull #{boat.hull_number}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#CBD5E1" />
                      </View>

                      {(boat.manufacturer || boat.year_built || boat.hull_material || boat.storage_location) && (
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
                          {boat.storage_location && (
                            <View style={styles.detailChip}>
                              <Ionicons name="location-outline" size={14} color="#64748B" />
                              <Text style={styles.detailChipText}>{boat.storage_location}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <View style={styles.quickActions}>
                        <TouchableOpacity
                          style={styles.quickActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(tabs)/boat/${boat.id}?tab=crew`);
                          }}
                        >
                          <Ionicons name="people-outline" size={18} color="#1D4ED8" />
                          <Text style={styles.quickActionText}>Crew</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(tabs)/boat/${boat.id}?tab=sails`);
                          }}
                        >
                          <Ionicons name="flag" size={18} color="#1D4ED8" />
                          <Text style={styles.quickActionText}>Sails</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(tabs)/boat/${boat.id}?tab=tuning3d`);
                          }}
                        >
                          <Ionicons name="settings-outline" size={18} color="#1D4ED8" />
                          <Text style={styles.quickActionText}>Tuning</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(tabs)/boat/${boat.id}?tab=maintenance`);
                          }}
                        >
                          <Ionicons name="construct-outline" size={18} color="#1D4ED8" />
                          <Text style={styles.quickActionText}>Service</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(tabs)/boat/${boat.id}?tab=performance`);
                          }}
                        >
                          <Ionicons name="stats-chart-outline" size={18} color="#1D4ED8" />
                          <Text style={styles.quickActionText}>Performance</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="boat-outline" size={48} color="#38BDF8" />
            </View>
            <Text style={styles.emptyTitle}>Build your fleet</Text>
            <Text style={styles.emptyText}>
              Add the boats you sail so we can track sails, maintenance, and race tuning for each campaign.
            </Text>

            <View style={styles.emptyChecklist}>
              <View style={styles.emptyChecklistItem}>
                <Ionicons name="add-circle-outline" size={18} color="#1D4ED8" />
                <Text style={styles.emptyChecklistText}>Create a profile with class, sail, and ownership details</Text>
              </View>
              <View style={styles.emptyChecklistItem}>
                <Ionicons name="people-outline" size={18} color="#1D4ED8" />
                <Text style={styles.emptyChecklistText}>Invite co-owners or shore team to collaborate</Text>
              </View>
              <View style={styles.emptyChecklistItem}>
                <Ionicons name="construct-outline" size={18} color="#1D4ED8" />
                <Text style={styles.emptyChecklistText}>Log maintenance, sails, and rig tuning presets</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.emptyButton} onPress={handleAddBoat}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add your first boat</Text>
            </TouchableOpacity>

            <View style={styles.demoSection}>
              <Text style={styles.demoHeading}>Preview fleet layout</Text>
              <Text style={styles.demoSubheading}>Here’s how boats look once added.</Text>
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
                    <View style={styles.mockBadge}>
                      <Text style={styles.mockBadgeText}>Demo</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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

const logger = createLogger('index');
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 160,
    boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.06)',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryIconSuccess: {
    backgroundColor: '#DCFCE7',
  },
  summaryIconAccent: {
    backgroundColor: '#FEF3C7',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  searchClear: {
    padding: 4,
  },
  filterSection: {
    gap: 8,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChipScroll: {
    marginHorizontal: -4,
  },
  filterChipScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E3A8A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  boatList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  noResultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 12,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  noResultsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E0E7FF',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  boatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 4px 16px rgba(15, 23, 42, 0.05)',
    gap: 16,
  },
  boatCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  boatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  boatIconPrimary: {
    backgroundColor: '#DBEAFE',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  boatClass: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
    paddingTop: 16,
  },
  quickActionButton: {
    flexGrow: 1,
    minWidth: '30%',
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  emptyState: {
    paddingHorizontal: 32,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 20,
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyChecklist: {
    width: '100%',
    gap: 12,
  },
  emptyChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#F8FAFF',
  },
  emptyChecklistText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  demoSection: {
    width: '100%',
    marginTop: 32,
    gap: 8,
  },
  demoHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  demoSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  mockBoatCard: {
    opacity: 0.88,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  mockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 18px rgba(37, 99, 235, 0.35)',
  },
});
