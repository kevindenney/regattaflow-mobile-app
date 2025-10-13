/**
 * Boat Detail Screen - Equipment Management & Optimization
 * Physical boat tracking with equipment inventory, maintenance logs, and tuning
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
// Import components individually to avoid victory-native dependency
import { BoatDetail } from '@/src/components/boats/BoatDetail';
import { BoatCrewList } from '@/src/components/boats/BoatCrewList';
import { SailInventory } from '@/src/components/boats/SailInventory';
import { RiggingConfig } from '@/src/components/boats/RiggingConfig';
import { MaintenanceSchedule } from '@/src/components/boats/MaintenanceSchedule';
import { Boat3DViewer } from '@/src/components/boats/Boat3DViewer';
import { RigTuningControls } from '@/src/components/boats/RigTuningControls';
import { TuningGuideList } from '@/src/components/boats/TuningGuideList';
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

export default function BoatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [boat, setBoat] = useState<BoatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [rigTuning, setRigTuning] = useState<RigTuning>({
    shrouds: 28,
    backstay: 32,
    forestay: 10800,
    mastButtPosition: 50,
  });

  useEffect(() => {
    loadBoatDetails();
  }, [id]);

  const loadBoatDetails = async () => {
    try {
      console.log('🚀 [BoatDetailScreen] Loading boat details for ID:', id);
      console.log('👤 [BoatDetailScreen] Current user:', user?.id);

      setLoading(true);

      // Fetch boat details from Supabase using SailorBoatService
      const { sailorBoatService } = await import('@/src/services/SailorBoatService');
      const boatData = await sailorBoatService.getBoat(id || '');

      console.log('📊 [BoatDetailScreen] Raw boat data from service:', JSON.stringify(boatData, null, 2));

      if (!boatData) {
        console.error('❌ [BoatDetailScreen] No boat found for ID:', id);
        setBoat(null);
        return;
      }

      // Map Supabase data to component interface
      // Note: sailor_boats table has no 'name' field, so we'll generate one from class + sail number
      const boatName = boatData.sail_number
        ? `${boatData.boat_class?.name || 'Boat'} #${boatData.sail_number}`
        : boatData.boat_class?.name || 'Unnamed Boat';

      console.log('🏷️ [BoatDetailScreen] Generated boat name:', boatName);

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

      console.log('✅ [BoatDetailScreen] Successfully loaded boat:', boatName);
    } catch (error) {
      console.error('❌ [BoatDetailScreen] Error loading boat details:', error);
      console.error('❌ [BoatDetailScreen] Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.boatName}>{boat.name}</Text>
          <Text style={styles.boatClass}>{boat.className} {boat.sailNumber && `#${boat.sailNumber}`}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(tabs)/boat/edit/${id}`)}
        >
          <Ionicons name="create-outline" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="information-circle"
            size={18}
            color={activeTab === 'overview' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'crew' && styles.tabActive]}
          onPress={() => setActiveTab('crew')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'crew' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'crew' && styles.tabTextActive]}>
            Crew
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sails' && styles.tabActive]}
          onPress={() => setActiveTab('sails')}
        >
          <Ionicons
            name="fish"
            size={18}
            color={activeTab === 'sails' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'sails' && styles.tabTextActive]}>
            Sails
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'rigging' && styles.tabActive]}
          onPress={() => setActiveTab('rigging')}
        >
          <Ionicons
            name="git-network"
            size={18}
            color={activeTab === 'rigging' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'rigging' && styles.tabTextActive]}>
            Rigging
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.tabActive]}
          onPress={() => setActiveTab('equipment')}
        >
          <Ionicons
            name="construct"
            size={18}
            color={activeTab === 'equipment' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'equipment' && styles.tabTextActive]}>
            Equipment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'maintenance' && styles.tabActive]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Ionicons
            name="build"
            size={18}
            color={activeTab === 'maintenance' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'maintenance' && styles.tabTextActive]}>
            Maintenance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
          onPress={() => setActiveTab('performance')}
        >
          <Ionicons
            name="stats-chart"
            size={18}
            color={activeTab === 'performance' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>
            Performance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tuning3d' && styles.tabActive]}
          onPress={() => setActiveTab('tuning3d')}
        >
          <Ionicons
            name="cube"
            size={18}
            color={activeTab === 'tuning3d' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'tuning3d' && styles.tabTextActive]}>
            3D Tuning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'guides' && styles.tabActive]}
          onPress={() => setActiveTab('guides')}
        >
          <Ionicons
            name="book"
            size={18}
            color={activeTab === 'guides' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'guides' && styles.tabTextActive]}>
            Tuning Guides
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && <BoatDetail boat={boat} />}
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
          <TuningGuideList boatClass={boat.className} />
        )}
      </View>

      {/* Universal FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // TODO: Add context-aware FAB actions
          console.log('FAB pressed for tab:', activeTab);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  boatName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  boatClass: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    whiteSpace: 'nowrap',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
