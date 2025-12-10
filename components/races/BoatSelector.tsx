/**
 * Boat Selector Component
 * Allows users to select which boat to use for a race,
 * showing equipment health status for each option
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, type SailorBoat } from '@/services/SailorBoatService';
import { equipmentService, type EquipmentHealthScore } from '@/services/EquipmentService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BoatSelector');

interface BoatSelectorProps {
  classId?: string;
  selectedBoatId?: string | null;
  onBoatSelect: (boat: SailorBoat | null) => void;
  compact?: boolean;
}

interface BoatWithHealth extends SailorBoat {
  healthScore?: EquipmentHealthScore;
}

export function BoatSelector({
  classId,
  selectedBoatId,
  onBoatSelect,
  compact = false,
}: BoatSelectorProps) {
  const { user } = useAuth();
  const [boats, setBoats] = useState<BoatWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<BoatWithHealth | null>(null);

  const loadBoats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let boatList: SailorBoat[];

      if (classId) {
        boatList = await sailorBoatService.listBoatsForSailorClass(user.id, classId);
      } else {
        boatList = await sailorBoatService.listBoatsForSailor(user.id);
      }

      // Load health scores for each boat
      const boatsWithHealth: BoatWithHealth[] = await Promise.all(
        boatList.map(async (boat) => {
          try {
            const health = await equipmentService.getBoatEquipmentHealth(boat.id);
            return { ...boat, healthScore: health };
          } catch (error) {
            logger.error('Error loading health for boat', { boatId: boat.id, error });
            return boat;
          }
        })
      );

      setBoats(boatsWithHealth);

      // Set selected boat
      if (selectedBoatId) {
        const selected = boatsWithHealth.find(b => b.id === selectedBoatId);
        setSelectedBoat(selected || null);
      } else {
        // Auto-select primary boat
        const primary = boatsWithHealth.find(b => b.is_primary);
        if (primary) {
          setSelectedBoat(primary);
          onBoatSelect(primary);
        }
      }
    } catch (error) {
      logger.error('Error loading boats', { error });
    } finally {
      setLoading(false);
    }
  }, [user, classId, selectedBoatId, onBoatSelect]);

  useEffect(() => {
    loadBoats();
  }, [loadBoats]);

  const handleBoatSelect = (boat: BoatWithHealth) => {
    setSelectedBoat(boat);
    onBoatSelect(boat);
    setModalVisible(false);
  };

  const getHealthColor = (score?: number) => {
    if (score === undefined) return '#94A3B8';
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getHealthLabel = (health?: EquipmentHealthScore) => {
    if (!health) return 'No equipment';
    if (health.race_ready) return 'Race Ready';
    if (health.critical_items > 0) return 'Critical Issues';
    if (health.overdue_maintenance > 0) return 'Maintenance Overdue';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (boats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No boats available</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactSelector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.compactContent}>
          <Ionicons name="boat-outline" size={18} color="#3B82F6" />
          <View style={styles.compactInfo}>
            <Text style={styles.compactLabel}>Racing with</Text>
            <Text style={styles.compactBoatName}>
              {selectedBoat?.name || selectedBoat?.boat_class?.name || 'Select boat'}
            </Text>
          </View>
        </View>
        {selectedBoat?.healthScore && (
          <View style={[
            styles.compactHealth,
            { backgroundColor: `${getHealthColor(selectedBoat.healthScore.health_score)}15` }
          ]}>
            <View style={[
              styles.healthDot,
              { backgroundColor: getHealthColor(selectedBoat.healthScore.health_score) }
            ]} />
            <Text style={[
              styles.compactHealthText,
              { color: getHealthColor(selectedBoat.healthScore.health_score) }
            ]}>
              {selectedBoat.healthScore.health_score}%
            </Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Boat</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        {selectedBoat ? (
          <View style={styles.selectedBoat}>
            <View style={styles.boatIcon}>
              <Ionicons name="boat" size={24} color="#3B82F6" />
            </View>
            <View style={styles.boatInfo}>
              <Text style={styles.boatName}>{selectedBoat.name}</Text>
              <Text style={styles.boatMeta}>
                {selectedBoat.boat_class?.name}
                {selectedBoat.sail_number && ` • ${selectedBoat.sail_number}`}
              </Text>
            </View>
            {selectedBoat.healthScore && (
              <View style={[
                styles.healthBadge,
                { backgroundColor: `${getHealthColor(selectedBoat.healthScore.health_score)}15` }
              ]}>
                <Ionicons
                  name={selectedBoat.healthScore.race_ready ? 'checkmark-circle' : 'warning'}
                  size={14}
                  color={getHealthColor(selectedBoat.healthScore.health_score)}
                />
                <Text style={[
                  styles.healthText,
                  { color: getHealthColor(selectedBoat.healthScore.health_score) }
                ]}>
                  {getHealthLabel(selectedBoat.healthScore)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="boat-outline" size={24} color="#94A3B8" />
            <Text style={styles.placeholderText}>Select a boat</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={20} color="#64748B" />
      </TouchableOpacity>

      {/* Boat Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Boat</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView style={styles.modalContent}>
            {boats.map((boat) => {
              const isSelected = selectedBoat?.id === boat.id;
              const healthColor = getHealthColor(boat.healthScore?.health_score);

              return (
                <TouchableOpacity
                  key={boat.id}
                  style={[styles.boatOption, isSelected && styles.boatOptionSelected]}
                  onPress={() => handleBoatSelect(boat)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                      <Ionicons
                        name={isSelected ? 'boat' : 'boat-outline'}
                        size={24}
                        color={isSelected ? '#3B82F6' : '#64748B'}
                      />
                    </View>
                    <View style={styles.optionInfo}>
                      <View style={styles.optionNameRow}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {boat.name || `${boat.boat_class?.name} ${boat.sail_number || ''}`}
                        </Text>
                        {boat.is_primary && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>Primary</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionMeta}>
                        {boat.boat_class?.name}
                        {boat.sail_number && ` • Sail #${boat.sail_number}`}
                      </Text>

                      {/* Health Summary */}
                      {boat.healthScore && (
                        <View style={styles.healthSummary}>
                          <View style={[
                            styles.healthIndicator,
                            { backgroundColor: `${healthColor}15` }
                          ]}>
                            <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
                            <Text style={[styles.healthScore, { color: healthColor }]}>
                              {boat.healthScore.health_score}%
                            </Text>
                          </View>
                          <Text style={[styles.healthLabel, { color: healthColor }]}>
                            {getHealthLabel(boat.healthScore)}
                          </Text>
                          {boat.healthScore.total_equipment > 0 && (
                            <Text style={styles.equipmentCount}>
                              {boat.healthScore.total_equipment} items
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Alerts */}
                      {boat.healthScore && !boat.healthScore.race_ready && (
                        <View style={styles.alertRow}>
                          {boat.healthScore.overdue_maintenance > 0 && (
                            <View style={styles.alertBadge}>
                              <Ionicons name="time" size={12} color="#DC2626" />
                              <Text style={styles.alertText}>
                                {boat.healthScore.overdue_maintenance} overdue
                              </Text>
                            </View>
                          )}
                          {boat.healthScore.critical_items > 0 && (
                            <View style={styles.alertBadge}>
                              <Ionicons name="alert-circle" size={12} color="#DC2626" />
                              <Text style={styles.alertText}>
                                {boat.healthScore.critical_items} critical
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  selectedBoat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boatInfo: {
    flex: 1,
  },
  boatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  boatMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compactInfo: {
    gap: 1,
  },
  compactLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  compactBoatName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  compactHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactHealthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  boatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boatOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconSelected: {
    backgroundColor: '#DBEAFE',
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  optionNameSelected: {
    color: '#3B82F6',
  },
  primaryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  optionMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  healthSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthScore: {
    fontSize: 12,
    fontWeight: '700',
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  equipmentCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  alertRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default BoatSelector;
