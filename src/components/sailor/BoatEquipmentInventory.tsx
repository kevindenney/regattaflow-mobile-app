/**
 * Boat Equipment Inventory Component
 * Displays and manages equipment inventory for a specific boat
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Equipment {
  id: string;
  customName: string;
  category: string;
  subcategory?: string;
  status: 'active' | 'backup' | 'retired' | 'repair' | 'lost';
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_replacement';
  totalUsageHours: number;
  totalRacesUsed: number;
  lastUsedDate?: string;
  purchaseDate?: string;
  notes?: string;
}

interface BoatEquipmentInventoryProps {
  boatId: string;
  classId: string;
}

export function BoatEquipmentInventory({ boatId, classId }: BoatEquipmentInventoryProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadEquipment();
  }, [boatId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      // TODO: Fetch equipment from Supabase
      // Mock data for now
      setEquipment([
        {
          id: '1',
          customName: 'Main #1 - All Purpose',
          category: 'mainsail',
          subcategory: 'all_purpose',
          status: 'active',
          condition: 'excellent',
          totalUsageHours: 45.5,
          totalRacesUsed: 28,
          lastUsedDate: '2025-09-25',
          purchaseDate: '2024-03-15',
          notes: 'North Sails 3Di - Excellent light to medium air performance',
        },
        {
          id: '2',
          customName: 'Jib #2 - Heavy Air',
          category: 'jib',
          subcategory: 'heavy_air',
          status: 'active',
          condition: 'good',
          totalUsageHours: 32.0,
          totalRacesUsed: 19,
          lastUsedDate: '2025-09-20',
          purchaseDate: '2024-01-10',
        },
        {
          id: '3',
          customName: 'Spinnaker - Code 0',
          category: 'spinnaker',
          status: 'active',
          condition: 'excellent',
          totalUsageHours: 18.0,
          totalRacesUsed: 12,
          lastUsedDate: '2025-09-15',
          purchaseDate: '2024-06-01',
        },
        {
          id: '4',
          customName: 'Mast - Original',
          category: 'mast',
          status: 'active',
          condition: 'good',
          totalUsageHours: 156.0,
          totalRacesUsed: 89,
          purchaseDate: '2020-05-01',
          notes: 'Seldén aluminum - needs tuning check',
        },
        {
          id: '5',
          customName: 'Bottom Paint - Micron Extra',
          category: 'bottom_paint',
          status: 'active',
          condition: 'fair',
          totalUsageHours: 0,
          totalRacesUsed: 0,
          purchaseDate: '2023-08-15',
          notes: 'Applied August 2023 - Due for recoating',
        },
      ]);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mainsail':
      case 'jib':
      case 'spinnaker':
        return 'sail';
      case 'mast':
      case 'boom':
        return 'git-network-outline';
      case 'bottom_paint':
        return 'water';
      case 'rigging':
        return 'link';
      default:
        return 'construct';
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#3B82F6';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      case 'needs_replacement':
        return '#DC2626';
      default:
        return '#94A3B8';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'backup':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'retired':
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
      case 'repair':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'lost':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const categories = ['all', 'mainsail', 'jib', 'spinnaker', 'mast', 'rigging', 'bottom_paint', 'hardware'];

  const filteredEquipment = filter === 'all'
    ? equipment
    : equipment.filter(e => e.category === filter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading equipment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                filter === cat && styles.filterChipActive,
              ]}
              onPress={() => setFilter(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === cat && styles.filterChipTextActive,
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Equipment List */}
      <View style={styles.equipmentList}>
        {filteredEquipment.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Equipment</Text>
            <Text style={styles.emptyText}>
              Tap the blue + button to add your first piece of equipment
            </Text>
          </View>
        ) : (
          filteredEquipment.map((item) => {
            const statusStyle = getStatusBadgeStyle(item.status);
            const conditionColor = getConditionColor(item.condition);

            return (
              <TouchableOpacity key={item.id} style={styles.equipmentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getCategoryIcon(item.category)}
                      size={24}
                      color="#3B82F6"
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.equipmentName}>{item.customName}</Text>
                    <Text style={styles.equipmentCategory}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' ')}
                      {item.subcategory && ` • ${item.subcategory.replace('_', ' ')}`}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#64748B" />
                    <Text style={styles.statText}>{item.totalUsageHours.toFixed(1)}h</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="trophy-outline" size={16} color="#64748B" />
                    <Text style={styles.statText}>{item.totalRacesUsed} races</Text>
                  </View>
                  {item.condition && (
                    <View style={styles.stat}>
                      <View style={[styles.conditionDot, { backgroundColor: conditionColor }]} />
                      <Text style={styles.statText}>{item.condition}</Text>
                    </View>
                  )}
                </View>

                {item.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="information-circle-outline" size={14} color="#64748B" />
                    <Text style={styles.notesText} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  </View>
                )}

                {item.lastUsedDate && (
                  <Text style={styles.lastUsed}>
                    Last used: {new Date(item.lastUsedDate).toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  equipmentList: {
    gap: 12,
  },
  equipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  equipmentCategory: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#64748B',
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  lastUsed: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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