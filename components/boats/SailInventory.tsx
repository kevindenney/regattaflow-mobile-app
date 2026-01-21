/**
 * SailInventory Component
 *
 * Displays sail inventory for a boat with:
 * - Real data from boat_equipment + sail_equipment_details
 * - Health indicators from sail_inspections
 * - Inspection launch capability
 * - Add sail functionality
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, AlertTriangle, CheckCircle2, Clock, Plus, Search } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { SailInspectionService, type SailWithHealth } from '@/services/SailInspectionService';
import { SailInspectionWizard } from '@/components/sail-inspection';
import { IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// Types
// =============================================================================

type SailType = 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero' | 'storm_jib' | 'trysail';

interface SailInventoryProps {
  boatId: string;
}

interface AddSailFormData {
  name: string;
  sailmaker: string;
  sailNumber: string;
  sailType: SailType;
  purchaseDate: string;
  material: string;
}

// =============================================================================
// Constants
// =============================================================================

const SAIL_TYPES: Array<{ key: SailType | 'all'; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'mainsail', label: 'Mains', icon: 'flag' },
  { key: 'jib', label: 'Jibs', icon: 'flag-outline' },
  { key: 'genoa', label: 'Genoas', icon: 'flag-outline' },
  { key: 'spinnaker', label: 'Spinnakers', icon: 'cellular-outline' },
];

const SAIL_TYPE_OPTIONS: Array<{ key: SailType; label: string }> = [
  { key: 'mainsail', label: 'Mainsail' },
  { key: 'jib', label: 'Jib' },
  { key: 'genoa', label: 'Genoa' },
  { key: 'spinnaker', label: 'Spinnaker' },
  { key: 'code_zero', label: 'Code Zero' },
  { key: 'storm_jib', label: 'Storm Jib' },
  { key: 'trysail', label: 'Trysail' },
];

// =============================================================================
// Helper Functions
// =============================================================================

const getHealthColor = (score: number | null): string => {
  if (score === null) return IOS_COLORS.gray3;
  if (score >= 85) return IOS_COLORS.green;
  if (score >= 70) return IOS_COLORS.yellow;
  if (score >= 50) return IOS_COLORS.orange;
  return IOS_COLORS.red;
};

const getHealthLabel = (score: number | null): string => {
  if (score === null) return 'Not inspected';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs attention';
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// =============================================================================
// Sail Card Component
// =============================================================================

interface SailCardProps {
  sail: SailWithHealth;
  onInspect: () => void;
  onPress: () => void;
}

function SailCard({ sail, onInspect, onPress }: SailCardProps) {
  const healthColor = getHealthColor(sail.condition_score);
  const healthLabel = getHealthLabel(sail.condition_score);
  const needsInspection = sail.needs_inspection || sail.condition_score === null;

  return (
    <TouchableOpacity style={styles.sailCard} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.sailCardHeader}>
        <View style={styles.sailCardInfo}>
          <Text style={styles.sailName} numberOfLines={1}>
            {sail.name || `${sail.sail_type || 'Sail'} #${sail.sail_number || '?'}`}
          </Text>
          <Text style={styles.sailMeta}>
            {sail.sailmaker || 'Unknown maker'}
            {sail.sail_number ? ` • #${sail.sail_number}` : ''}
          </Text>
        </View>

        {/* Health Badge */}
        <View style={[styles.healthBadge, { backgroundColor: `${healthColor}20` }]}>
          {sail.condition_score !== null ? (
            <>
              <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
              <Text style={[styles.healthText, { color: healthColor }]}>
                {sail.condition_score}%
              </Text>
            </>
          ) : (
            <>
              <Clock size={12} color={IOS_COLORS.gray2} />
              <Text style={styles.healthTextMuted}>New</Text>
            </>
          )}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Condition</Text>
          <Text style={[styles.statValue, { color: healthColor }]}>{healthLabel}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Inspected</Text>
          <Text style={styles.statValue}>{formatDate(sail.last_inspection_date)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Usage</Text>
          <Text style={styles.statValue}>{sail.total_usage_hours || 0}h</Text>
        </View>
      </View>

      {/* Alert Banner */}
      {needsInspection && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={14} color={IOS_COLORS.orange} />
          <Text style={styles.alertText}>
            {sail.condition_score === null
              ? 'No inspection recorded'
              : 'Inspection recommended'}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.inspectButton]}
          onPress={(e) => {
            e.stopPropagation();
            onInspect();
          }}
        >
          <Camera size={16} color="#fff" />
          <Text style={styles.inspectButtonText}>Inspect</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonSecondary}>
          <Ionicons name="stats-chart-outline" size={16} color={IOS_COLORS.blue} />
          <Text style={styles.actionButtonSecondaryText}>History</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// Add Sail Modal Component
// =============================================================================

interface AddSailModalProps {
  visible: boolean;
  boatId: string;
  onClose: () => void;
  onSailAdded: () => void;
}

function AddSailModal({ visible, boatId, onClose, onSailAdded }: AddSailModalProps) {
  const [formData, setFormData] = useState<AddSailFormData>({
    name: '',
    sailmaker: '',
    sailNumber: '',
    sailType: 'mainsail',
    purchaseDate: '',
    material: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim() && !formData.sailNumber.trim()) {
      Alert.alert('Required', 'Please enter a sail name or number');
      return;
    }

    setSaving(true);
    try {
      // Create boat_equipment entry
      const { data: equipment, error: equipError } = await supabase
        .from('boat_equipment')
        .insert({
          boat_id: boatId,
          category: 'sail',
          name: formData.name || `${formData.sailType} ${formData.sailNumber}`.trim(),
          condition: 'good',
          specifications: {
            sail_type: formData.sailType,
            material: formData.material,
          },
        })
        .select()
        .single();

      if (equipError) throw equipError;

      // Create sail_equipment_details entry
      const { error: detailError } = await supabase
        .from('sail_equipment_details')
        .insert({
          equipment_id: equipment.id,
          sail_number: formData.sailNumber || null,
          sailmaker: formData.sailmaker || null,
          material: formData.material || null,
          purchase_date: formData.purchaseDate || null,
        });

      if (detailError) {
        console.warn('Failed to create sail details:', detailError);
      }

      onSailAdded();
      onClose();
      setFormData({
        name: '',
        sailmaker: '',
        sailNumber: '',
        sailType: 'mainsail',
        purchaseDate: '',
        material: '',
      });
    } catch (error) {
      console.error('Failed to add sail:', error);
      Alert.alert('Error', 'Failed to add sail. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={IOS_COLORS.gray} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Sail</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.modalSaveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={IOS_COLORS.blue} />
            ) : (
              <Text style={styles.modalSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Sail Type Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sail Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typePickerScroll}
            >
              {SAIL_TYPE_OPTIONS.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typePill,
                    formData.sailType === type.key && styles.typePillActive,
                  ]}
                  onPress={() => setFormData((prev) => ({ ...prev, sailType: type.key }))}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      formData.sailType === type.key && styles.typePillTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sail Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., Main #1 - Light Air"
              placeholderTextColor={IOS_COLORS.gray3}
              value={formData.name}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            />
          </View>

          {/* Sailmaker */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sailmaker</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., North Sails, Quantum"
              placeholderTextColor={IOS_COLORS.gray3}
              value={formData.sailmaker}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, sailmaker: text }))}
            />
          </View>

          {/* Sail Number */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sail Number</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., HK1234"
              placeholderTextColor={IOS_COLORS.gray3}
              value={formData.sailNumber}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, sailNumber: text }))}
              autoCapitalize="characters"
            />
          </View>

          {/* Material */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Material (optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., Dacron, Laminate, Kevlar"
              placeholderTextColor={IOS_COLORS.gray3}
              value={formData.material}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, material: text }))}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SailInventory({ boatId }: SailInventoryProps) {
  const [sails, setSails] = useState<SailWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<SailType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectingSail, setInspectingSail] = useState<SailWithHealth | null>(null);

  // Load sails
  const loadSails = useCallback(async () => {
    try {
      const data = await SailInspectionService.getSailInventory(boatId);
      setSails(data);
    } catch (error) {
      console.error('Failed to load sails:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [boatId]);

  useEffect(() => {
    loadSails();
  }, [loadSails]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSails();
  }, [loadSails]);

  // Filter sails
  const filteredSails = useMemo(() => {
    let result = sails;

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((sail) => {
        const sailType = sail.sail_type?.toLowerCase() || '';
        return sailType.includes(selectedType.toLowerCase());
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (sail) =>
          sail.name?.toLowerCase().includes(query) ||
          sail.sailmaker?.toLowerCase().includes(query) ||
          sail.sail_number?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [sails, selectedType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = sails.length;
    const needsAttention = sails.filter(
      (s) => s.needs_inspection || s.condition_score === null || (s.condition_score ?? 100) < 70
    ).length;
    const excellent = sails.filter((s) => (s.condition_score ?? 0) >= 85).length;
    return { total, needsAttention, excellent };
  }, [sails]);

  const handleInspect = useCallback((sail: SailWithHealth) => {
    setInspectingSail(sail);
  }, []);

  const handleInspectionComplete = useCallback(() => {
    setInspectingSail(null);
    loadSails(); // Refresh to show updated condition
  }, [loadSails]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.blue} />
        <Text style={styles.loadingText}>Loading sails...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.total}</Text>
          <Text style={styles.statCardLabel}>Total Sails</Text>
        </View>
        <View style={[styles.statCard, stats.needsAttention > 0 && styles.statCardWarning]}>
          <Text
            style={[
              styles.statCardValue,
              stats.needsAttention > 0 && styles.statCardValueWarning,
            ]}
          >
            {stats.needsAttention}
          </Text>
          <Text style={styles.statCardLabel}>Need Attention</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statCardValue, { color: IOS_COLORS.green }]}>
            {stats.excellent}
          </Text>
          <Text style={styles.statCardLabel}>Excellent</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={IOS_COLORS.gray3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sails..."
            placeholderTextColor={IOS_COLORS.gray3}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {SAIL_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.filterChip, selectedType === type.key && styles.filterChipActive]}
              onPress={() => setSelectedType(type.key)}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={selectedType === type.key ? '#fff' : IOS_COLORS.gray}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === type.key && styles.filterChipTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sail List */}
      <ScrollView
        style={styles.sailList}
        contentContainerStyle={styles.sailListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredSails.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={48} color={IOS_COLORS.gray3} />
            <Text style={styles.emptyTitle}>
              {sails.length === 0 ? 'No sails added yet' : 'No sails match your filter'}
            </Text>
            <Text style={styles.emptyText}>
              {sails.length === 0
                ? 'Add your first sail to start tracking condition and inspections.'
                : 'Try adjusting your search or filter.'}
            </Text>
            {sails.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Add Sail</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSails.map((sail) => (
            <SailCard
              key={sail.equipment_id}
              sail={sail}
              onInspect={() => handleInspect(sail)}
              onPress={() => {
                // TODO: Navigate to sail detail
              }}
            />
          ))
        )}
      </ScrollView>

      {/* FAB - Add Sail */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Sail Modal */}
      <AddSailModal
        visible={showAddModal}
        boatId={boatId}
        onClose={() => setShowAddModal(false)}
        onSailAdded={loadSails}
      />

      {/* Inspection Wizard Modal */}
      {inspectingSail && (
        <Modal
          visible={!!inspectingSail}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setInspectingSail(null)}
        >
          <SailInspectionWizard
            equipmentId={inspectingSail.equipment_id}
            boatId={boatId}
            sailName={inspectingSail.name || `Sail #${inspectingSail.sail_number}`}
            onComplete={handleInspectionComplete}
            onCancel={() => setInspectingSail(null)}
          />
        </Modal>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

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
    color: IOS_COLORS.gray,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  statCardWarning: {
    backgroundColor: '#FEF3C7',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statCardValueWarning: {
    color: IOS_COLORS.orange,
  },
  statCardLabel: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // Filter
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  filterScroll: {
    marginHorizontal: -16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: IOS_COLORS.blue,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Sail List
  sailList: {
    flex: 1,
  },
  sailListContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Sail Card
  sailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sailCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sailCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  sailName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  sailMeta: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  healthTextMuted: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inspectButton: {
    backgroundColor: IOS_COLORS.blue,
    flex: 1,
    justifyContent: 'center',
  },
  inspectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: IOS_COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: IOS_COLORS.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Form
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  typePickerScroll: {
    marginHorizontal: -4,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  typePillActive: {
    backgroundColor: IOS_COLORS.blue,
  },
  typePillText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  typePillTextActive: {
    color: '#fff',
  },
});

export default SailInventory;
