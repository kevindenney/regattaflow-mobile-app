/**
 * Maintenance Timeline Component
 * Historical maintenance logs and upcoming service reminders
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface MaintenanceLog {
  id: string;
  equipmentName: string;
  maintenanceDate: string;
  maintenanceType: 'installation' | 'repair' | 'service' | 'replacement' | 'inspection' | 'modification';
  description: string;
  performedBy?: string;
  cost?: number;
  conditionBefore?: string;
  conditionAfter?: string;
  nextServiceDueDate?: string;
}

interface MaintenanceTimelineProps {
  boatId: string;
}

export function MaintenanceTimeline({ boatId }: MaintenanceTimelineProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceLogs();
  }, [boatId]);

  const loadMaintenanceLogs = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from Supabase
      setLogs([
        {
          id: '1',
          equipmentName: 'Bottom Paint - Micron Extra',
          maintenanceDate: '2023-08-15',
          maintenanceType: 'installation',
          description: 'Applied Akzo Nobel Micron Extra bottom paint - 3 coats',
          performedBy: 'Hong Kong Marine Services',
          cost: 1850.00,
          conditionAfter: 'excellent',
          nextServiceDueDate: '2025-08-15',
        },
        {
          id: '2',
          equipmentName: 'Main #1 - All Purpose',
          maintenanceDate: '2024-03-15',
          maintenanceType: 'installation',
          description: 'New North Sails 3Di mainsail delivery and installation',
          performedBy: 'North Sails Hong Kong',
          cost: 8500.00,
          conditionAfter: 'excellent',
        },
        {
          id: '3',
          equipmentName: 'Mast - Original',
          maintenanceDate: '2024-05-10',
          maintenanceType: 'inspection',
          description: 'Annual mast inspection - checked for cracks, corrosion, and rigging wear',
          performedBy: 'Self',
          conditionBefore: 'good',
          conditionAfter: 'good',
          nextServiceDueDate: '2025-05-10',
        },
        {
          id: '4',
          equipmentName: 'Jib #2 - Heavy Air',
          maintenanceDate: '2024-07-22',
          maintenanceType: 'repair',
          description: 'Repaired small tear at clew - reinforced stitching',
          performedBy: 'Quantum Sails',
          cost: 250.00,
          conditionBefore: 'fair',
          conditionAfter: 'good',
        },
      ]);
    } catch (error) {
      console.error('Error loading maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'installation': return 'add-circle';
      case 'repair': return 'build';
      case 'service': return 'construct';
      case 'replacement': return 'swap-horizontal';
      case 'inspection': return 'eye';
      case 'modification': return 'settings';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'installation': return '#10B981';
      case 'repair': return '#F59E0B';
      case 'service': return '#3B82F6';
      case 'replacement': return '#8B5CF6';
      case 'inspection': return '#06B6D4';
      case 'modification': return '#EC4899';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading maintenance history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maintenance History</Text>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Maintenance Records</Text>
          <Text style={styles.emptyText}>
            Tap the blue + button to log your first maintenance event
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {logs.map((log, index) => {
            const typeColor = getTypeColor(log.maintenanceType);
            const isLast = index === logs.length - 1;

            return (
              <View key={log.id} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View style={[styles.timelineDot, { backgroundColor: typeColor }]}>
                    <Ionicons name={getTypeIcon(log.maintenanceType)} size={16} color="#FFFFFF" />
                  </View>
                  {!isLast && <View style={styles.timelineConnector} />}
                </View>

                <TouchableOpacity style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.logTitleContainer}>
                      <Text style={styles.logEquipment}>{log.equipmentName}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                        <Text style={[styles.typeText, { color: typeColor }]}>
                          {log.maintenanceType}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.logDate}>
                      {new Date(log.maintenanceDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <Text style={styles.logDescription}>{log.description}</Text>

                  <View style={styles.logDetails}>
                    {log.performedBy && (
                      <View style={styles.detail}>
                        <Ionicons name="person-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>{log.performedBy}</Text>
                      </View>
                    )}
                    {log.cost && (
                      <View style={styles.detail}>
                        <Ionicons name="cash-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>${log.cost.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>

                  {log.nextServiceDueDate && (
                    <View style={styles.nextService}>
                      <Ionicons name="calendar-outline" size={14} color="#F59E0B" />
                      <Text style={styles.nextServiceText}>
                        Next service due: {new Date(log.nextServiceDueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLine: {
    alignItems: 'center',
    paddingTop: 4,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  logCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  logHeader: {
    marginBottom: 12,
  },
  logTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  logEquipment: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  logDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  logDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
  },
  nextService: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nextServiceText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
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
  },
});