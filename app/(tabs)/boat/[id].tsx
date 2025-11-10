/**
 * Boat Detail Screen - Equipment Management & Optimization
 * Physical boat tracking with equipment inventory, maintenance logs, and tuning
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Import components individually to avoid victory-native dependency
import { BoatDetail } from '@/components/boats/BoatDetail';
import { BoatCrewList } from '@/components/boats/BoatCrewList';
import { SailInventory } from '@/components/boats/SailInventory';
import { RiggingConfig } from '@/components/boats/RiggingConfig';
import { MaintenanceSchedule } from '@/components/boats/MaintenanceSchedule';
import { Boat3DViewer } from '@/components/boats/Boat3DViewer';
import { RigTuningControls } from '@/components/boats/RigTuningControls';
import { TuningGuideList } from '@/components/boats/TuningGuideList';
import { createLogger } from '@/lib/utils/logger';
import { supabase } from '@/services/supabase';
import { useBoatPerformanceStats } from '@/hooks/useBoatPerformanceStats';
// PerformanceAnalysis - Not imported to avoid victory-native dependency on web

interface BoatDetails {
  id: string;
  sailorId: string;
  classId: string;
  name: string;
  className: string;
  sailNumber?: string;
  manufacturer?: string;
  yearBuilt?: number;
  hullMaterial?: string;
  isPrimary: boolean;
  homeClub?: string;
  storageLocation?: string;
  ownership?: string;
}

interface RigTuning {
  shrouds: number;
  backstay: number;
  forestay: number;
  mastButtPosition: number;
}

type TabType = 'overview' | 'crew' | 'sails' | 'rigging' | 'equipment' | 'maintenance' | 'performance' | 'tuning3d' | 'guides';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Array<{
  key: TabType;
  label: string;
  icon: IoniconName;
  description: string;
  badge?: 'crew' | 'sails' | 'maintenance' | 'performance';
}> = [
  { key: 'overview', label: 'Overview', icon: 'information-circle', description: 'Fleet snapshot' },
  { key: 'crew', label: 'Crew', icon: 'people', description: 'Assignments & availability', badge: 'crew' },
  { key: 'sails', label: 'Sails', icon: 'flag', description: 'Inventory & tags', badge: 'sails' },
  { key: 'rigging', label: 'Rigging', icon: 'git-network', description: 'Tune presets' },
  { key: 'equipment', label: 'Equipment', icon: 'construct', description: 'Hardware log' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build', description: 'Tasks & service', badge: 'maintenance' },
  { key: 'performance', label: 'Performance', icon: 'stats-chart', description: 'Race analytics', badge: 'performance' },
  { key: 'tuning3d', label: '3D Tuning', icon: 'cube', description: 'Visual tuning' },
  { key: 'guides', label: 'Tuning Guides', icon: 'book', description: 'Class playbook' },
];

export default function BoatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [boat, setBoat] = useState<BoatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [rigTuning, setRigTuning] = useState<RigTuning>({
    shrouds: 28,
    backstay: 32,
    forestay: 10800,
    mastButtPosition: 50,
  });
  const [tabCounts, setTabCounts] = useState<{
    crew: number | null;
    sails: number | null;
    maintenance: number | null;
  }>({
    crew: null,
    sails: null,
    maintenance: null,
  });
  const [tabCountsLoading, setTabCountsLoading] = useState(false);

  useEffect(() => {
    loadBoatDetails();
  }, [id]);

  useEffect(() => {
    if (!boat?.id) {
      setTabCountsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      setTabCountsLoading(true);
      try {
        const [
          crewResponse,
          sailsResponse,
          maintenanceResponse,
        ] = await Promise.all([
          supabase
            .from('boat_crew_members')
            .select('*', { count: 'exact', head: true })
            .eq('boat_id', boat.id),
          supabase
            .from('boat_equipment')
            .select('*', { count: 'exact', head: true })
            .eq('boat_id', boat.id)
            .eq('category', 'sail'),
          supabase
            .from('maintenance_records')
            .select('*', { count: 'exact', head: true })
            .eq('boat_id', boat.id),
        ]);

        if (cancelled) return;

        setTabCounts({
          crew: crewResponse.count ?? 0,
          sails: sailsResponse.count ?? 0,
          maintenance: maintenanceResponse.count ?? 0,
        });
      } catch (err) {
        if (!cancelled) {
          logger.error('[BoatDetailScreen] Failed to load tab counts', err);
        }
      } finally {
        if (!cancelled) {
          setTabCountsLoading(false);
        }
      }
    };

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [boat?.id]);

  const loadBoatDetails = async () => {
    try {

      setLoading(true);

      // Fetch boat details from Supabase using SailorBoatService
      const { sailorBoatService } = await import('@/services/SailorBoatService');
      const boatData = await sailorBoatService.getBoat(id || '');

      if (!boatData) {

        setBoat(null);
        return;
      }

      // Map Supabase data to component interface
      // Note: sailor_boats table has no 'name' field, so we'll generate one from class + sail number
      const boatName = boatData.sail_number
        ? `${boatData.boat_class?.name || 'Boat'} #${boatData.sail_number}`
        : boatData.boat_class?.name || 'Unnamed Boat';

      setBoat({
        id: boatData.id,
        sailorId: boatData.sailor_id,
        classId: boatData.class_id,
        name: boatName,
        className: boatData.boat_class?.name || 'Unknown',
        sailNumber: boatData.sail_number || undefined,
        manufacturer: boatData.manufacturer,
        yearBuilt: boatData.year_built,
        hullMaterial: boatData.hull_material,
        isPrimary: boatData.is_primary || false,
        homeClub: undefined, // No home_club in sailor_boats table
        storageLocation: boatData.storage_location,
        ownership: boatData.ownership_type,
      });

    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const formatOwnership = (ownership?: string) => {
    if (!ownership) return 'Not set';
    return ownership.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const { stats: performanceStats, loading: performanceLoading } = useBoatPerformanceStats({
    sailorId: boat?.sailorId,
    sailNumber: boat?.sailNumber,
    className: boat?.className,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading boat details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!boat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Boat not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const summaryCounts = {
    crew: tabCounts.crew ?? undefined,
    sails: tabCounts.sails ?? undefined,
    maintenance: tabCounts.maintenance ?? undefined,
  };

  const heroQuickFacts: Array<{
    label: string;
    value: string;
    icon: IoniconName;
    highlight?: boolean;
  }> = [
    {
      label: 'Class',
      value: boat.className || 'Unclassified',
      icon: 'boat-outline',
    },
    {
      label: 'Sail Number',
      value: boat.sailNumber || 'Not set',
      icon: 'flag-outline',
    },
    {
      label: 'Ownership',
      value: formatOwnership(boat.ownership),
      icon: 'person-outline',
    },
    {
      label: 'Status',
      value: boat.isPrimary ? 'Primary campaign boat' : 'Fleet boat',
      icon: boat.isPrimary ? 'ribbon-outline' : 'boat-outline',
      highlight: boat.isPrimary,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1D4ED8', '#2563EB', '#0EA5E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroIconButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroIconButton}
            onPress={() => router.push(`/(tabs)/boat/edit/${id}`)}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroTitleBlock}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, boat.isPrimary ? styles.heroBadgePrimary : styles.heroBadgeMuted]}>
                <Ionicons
                  name={boat.isPrimary ? 'ribbon' : 'boat-outline'}
                  size={12}
                  color={boat.isPrimary ? '#1D4ED8' : '#334155'}
                />
                <Text style={[styles.heroBadgeText, boat.isPrimary ? styles.heroBadgeTextPrimary : styles.heroBadgeTextMuted]}>
                  {boat.isPrimary ? 'Primary Boat' : 'Fleet Boat'}
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{boat.name}</Text>
            <Text style={styles.heroSubtitle}>
              {boat.className} {boat.sailNumber ? `• Sail #${boat.sailNumber}` : ''}
            </Text>
          </View>

          <View style={styles.heroMetricsRow}>
            {heroQuickFacts.map((fact) => (
              <View
                key={fact.label}
                style={[
                  styles.heroMetricCard,
                  fact.highlight ? styles.heroMetricCardHighlight : undefined,
                ]}
              >
                <View style={styles.heroMetricIcon}>
                  <Ionicons
                    name={fact.icon}
                    size={16}
                    color={fact.highlight ? '#F97316' : '#1D4ED8'}
                  />
                </View>
                <Text style={[styles.heroMetricValue, fact.highlight ? styles.heroMetricValueHighlight : undefined]}>
                  {fact.value}
                </Text>
                <Text style={styles.heroMetricLabel}>{fact.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key;
            const badgeValue = (() => {
              switch (tab.badge) {
                case 'crew':
                  return tabCounts.crew;
                case 'sails':
                  return tabCounts.sails;
                case 'maintenance':
                  return tabCounts.maintenance;
                case 'performance':
                  if (performanceLoading) return null;
                  if (!performanceStats) return undefined;
                  return performanceStats.totalRaces;
                default:
                  return undefined;
              }
            })();
            const showBadge = badgeValue !== undefined && badgeValue !== null;
            const showSpinner =
              tab.badge &&
              tab.badge !== 'performance' &&
              tabCountsLoading &&
              !showBadge;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={styles.tabChipIcon}>
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? '#1D4ED8' : '#64748B'}
                  />
                </View>
                <View style={styles.tabChipTextBlock}>
                  <Text style={[styles.tabChipLabel, isActive && styles.tabChipLabelActive]}>
                    {tab.label}
                  </Text>
                  <Text style={[styles.tabChipDescription, isActive && styles.tabChipDescriptionActive]}>
                    {tab.description}
                  </Text>
                </View>
                {showBadge && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {badgeValue}
                    </Text>
                  </View>
                )}
                {!showBadge && showSpinner && (
                  <View style={styles.tabBadgeSpinner}>
                    <ActivityIndicator size="small" color={isActive ? '#1D4ED8' : '#94A3B8'} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <BoatDetail
            boat={boat}
            performanceStats={performanceStats}
            performanceLoading={performanceLoading}
            summaryCounts={summaryCounts}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'crew' && (
          <BoatCrewList
            boatId={boat.id}
            sailorId={boat.sailorId}
            classId={boat.classId}
          />
        )}
        {activeTab === 'sails' && <SailInventory boatId={boat.id} />}
        {activeTab === 'rigging' && <RiggingConfig boatId={boat.id} />}
        {activeTab === 'equipment' && (
          <View style={styles.placeholderContainer}>
            <Ionicons name="construct-outline" size={64} color="#CBD5E1" />
            <Text style={styles.placeholderText}>Equipment coming soon</Text>
          </View>
        )}
        {activeTab === 'maintenance' && <MaintenanceSchedule boatId={boat.id} />}
        {activeTab === 'performance' && (
          <View style={styles.placeholderContainer}>
            <Ionicons name="stats-chart-outline" size={64} color="#CBD5E1" />
            <Text style={styles.placeholderText}>Performance analytics coming soon</Text>
            <Text style={{fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center'}}>
              Chart-based performance analysis will be available in the mobile app
            </Text>
          </View>
        )}
        {activeTab === 'tuning3d' && (
          <ScrollView style={{flex: 1}}>
            {/* 3D Boat Viewer */}
            <View style={{backgroundColor: '#ffffff', padding: 16, marginBottom: 8}}>
              <Text style={{fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 12}}>
                3D Boat Visualization
              </Text>
              <Boat3DViewer
                boatClass={boat.className}
                tuning={rigTuning}
                width={375}
                height={400}
              />
            </View>

            {/* Rig Tuning Controls */}
            <View style={{flex: 1}}>
              <RigTuningControls
                tuning={rigTuning}
                onTuningChange={setRigTuning}
                boatClass={boat.className}
              />
            </View>
          </ScrollView>
        )}
        {activeTab === 'guides' && (
          <TuningGuideList
            boatClass={boat.className}
            classId={boat.classId}
            sailorId={boat.sailorId}
          />
        )}
      </View>

      {/* Universal FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // TODO: Add context-aware FAB actions
          logger.debug('FAB pressed for tab:', activeTab);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const logger = createLogger('[id]');
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarContent: {
    paddingRight: 8,
    gap: 12,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 180,
  },
  tabChipActive: {
    borderColor: '#BFDBFE',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 14px rgba(29, 78, 216, 0.18)',
      },
      default: {
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  tabChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabChipTextBlock: {
    flex: 1,
  },
  tabChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  tabChipLabelActive: {
    color: '#1D4ED8',
  },
  tabChipDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  tabChipDescriptionActive: {
    color: '#2563EB',
  },
  tabBadge: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  tabBadgeActive: {
    backgroundColor: '#1D4ED8',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tabBadgeSpinner: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(29, 78, 216, 0.22)',
      },
      default: {
        shadowColor: '#1D4ED8',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 18,
        elevation: 6,
      },
    }),
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroContent: {
    marginTop: 16,
    gap: 18,
  },
  heroTitleBlock: {
    gap: 8,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  heroBadgePrimary: {
    backgroundColor: '#FDE68A',
  },
  heroBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroBadgeTextPrimary: {
    color: '#92400E',
  },
  heroBadgeTextMuted: {
    color: '#1E293B',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(241,245,249,0.9)',
    letterSpacing: 0.4,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroMetricCard: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  heroMetricCardHighlight: {
    backgroundColor: '#FFF7ED',
  },
  heroMetricIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroMetricValueHighlight: {
    color: '#C2410C',
  },
  heroMetricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
