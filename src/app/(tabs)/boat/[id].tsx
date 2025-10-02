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
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BoatEquipmentInventory,
  MaintenanceTimeline,
  TuningSettings,
  EquipmentAlerts,
  BoatActionMenu,
  AddEquipmentForm,
  LogMaintenanceForm,
  CreateTuningSetupForm,
  UploadDocumentForm,
  AlertSubscriptionModal,
  type EquipmentFormData,
  type MaintenanceFormData,
  type TuningSetupFormData,
  type DocumentFormData,
  type AlertSubscriptionData,
} from '@/src/components/sailor';

interface BoatDetails {
  id: string;
  name: string;
  className: string;
  sailNumber?: string;
  isPrimary: boolean;
}

export default function BoatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [boat, setBoat] = useState<BoatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance' | 'tuning' | 'alerts'>('equipment');

  // Modal states
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAddEquipmentForm, setShowAddEquipmentForm] = useState(false);
  const [showLogMaintenanceForm, setShowLogMaintenanceForm] = useState(false);
  const [showCreateTuningForm, setShowCreateTuningForm] = useState(false);
  const [showUploadDocumentForm, setShowUploadDocumentForm] = useState(false);
  const [showAlertSubscription, setShowAlertSubscription] = useState(false);

  useEffect(() => {
    loadBoatDetails();
  }, [id]);

  const loadBoatDetails = async () => {
    try {
      setLoading(true);
      // TODO: Fetch boat details from Supabase
      // For now, using mock data
      setBoat({
        id: id || '',
        name: 'Dragonfly',
        className: 'Dragon',
        sailNumber: '1234',
        isPrimary: true,
      });
    } catch (error) {
      console.error('Error loading boat details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Form submission handlers
  const handleAddEquipment = (data: EquipmentFormData) => {
    console.log('Adding equipment:', data);
    // TODO: Save to Supabase
    setShowAddEquipmentForm(false);
  };

  const handleLogMaintenance = (data: MaintenanceFormData) => {
    console.log('Logging maintenance:', data);
    // TODO: Save to Supabase
    setShowLogMaintenanceForm(false);
  };

  const handleCreateTuningSetup = (data: TuningSetupFormData) => {
    console.log('Creating tuning setup:', data);
    // TODO: Save to Supabase
    setShowCreateTuningForm(false);
  };

  const handleUploadDocument = (data: DocumentFormData) => {
    console.log('Uploading document:', data);
    // TODO: Save to Supabase
    setShowUploadDocumentForm(false);
  };

  const handleSaveAlertSubscription = (data: AlertSubscriptionData) => {
    console.log('Saving alert subscription:', data);
    // TODO: Save to Supabase
    setShowAlertSubscription(false);
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
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="settings-outline" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.tabActive]}
          onPress={() => setActiveTab('equipment')}
        >
          <Ionicons
            name="construct"
            size={20}
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
            size={20}
            color={activeTab === 'maintenance' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'maintenance' && styles.tabTextActive]}>
            Maintenance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tuning' && styles.tabActive]}
          onPress={() => setActiveTab('tuning')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'tuning' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'tuning' && styles.tabTextActive]}>
            Tuning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
          onPress={() => setActiveTab('alerts')}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={activeTab === 'alerts' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
            Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'equipment' && (
          <BoatEquipmentInventory boatId={boat.id} classId={boat.id} />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceTimeline boatId={boat.id} />
        )}
        {activeTab === 'tuning' && (
          <TuningSettings boatId={boat.id} classId={boat.id} />
        )}
        {activeTab === 'alerts' && (
          <EquipmentAlerts boatId={boat.id} />
        )}
      </ScrollView>

      {/* Universal FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowActionMenu(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Action Menu */}
      <BoatActionMenu
        visible={showActionMenu}
        activeTab={activeTab}
        onClose={() => setShowActionMenu(false)}
        onAddEquipment={() => setShowAddEquipmentForm(true)}
        onLogMaintenance={() => setShowLogMaintenanceForm(true)}
        onCreateTuningSetup={() => setShowCreateTuningForm(true)}
        onUploadDocument={() => setShowUploadDocumentForm(true)}
        onManageAlertSubscription={() => setShowAlertSubscription(true)}
      />

      {/* Forms and Modals */}
      <AddEquipmentForm
        visible={showAddEquipmentForm}
        boatId={boat.id}
        classId={boat.id}
        onClose={() => setShowAddEquipmentForm(false)}
        onSubmit={handleAddEquipment}
      />

      <LogMaintenanceForm
        visible={showLogMaintenanceForm}
        boatId={boat.id}
        equipmentList={[
          { id: '1', name: 'Main #1 - All Purpose' },
          { id: '2', name: 'Jib #2 - Heavy Air' },
          { id: '3', name: 'Spinnaker - Code 0' },
        ]}
        onClose={() => setShowLogMaintenanceForm(false)}
        onSubmit={handleLogMaintenance}
      />

      <CreateTuningSetupForm
        visible={showCreateTuningForm}
        boatId={boat.id}
        classId={boat.id}
        onClose={() => setShowCreateTuningForm(false)}
        onSubmit={handleCreateTuningSetup}
      />

      <UploadDocumentForm
        visible={showUploadDocumentForm}
        boatId={boat.id}
        onClose={() => setShowUploadDocumentForm(false)}
        onSubmit={handleUploadDocument}
      />

      <AlertSubscriptionModal
        visible={showAlertSubscription}
        boatId={boat.id}
        onClose={() => setShowAlertSubscription(false)}
        onSave={handleSaveAlertSubscription}
      />
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
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
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
