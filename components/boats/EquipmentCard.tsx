/**
 * Equipment Card
 * Displays a single piece of equipment with status indicators,
 * maintenance info, and quick actions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BoatEquipment } from '@/services/EquipmentService';

interface EquipmentCardProps {
  equipment: BoatEquipment;
  onPress?: () => void;
  onMaintenancePress?: () => void;
  compact?: boolean;
}

export function EquipmentCard({ equipment, onPress, onMaintenancePress, compact = false }: EquipmentCardProps) {
  const getConditionColor = (rating?: number) => {
    if (rating === undefined || rating === null) return '#94A3B8';
    if (rating >= 80) return '#10B981';
    if (rating >= 60) return '#F59E0B';
    if (rating >= 40) return '#EF4444';
    return '#DC2626';
  };

  const getConditionLabel = (rating?: number) => {
    if (rating === undefined || rating === null) return 'Unknown';
    if (rating >= 80) return 'Excellent';
    if (rating >= 60) return 'Good';
    if (rating >= 40) return 'Fair';
    return 'Poor';
  };

  const getMaintenanceStatus = () => {
    if (!equipment.next_maintenance_date) return null;
    
    const now = new Date();
    const dueDate = new Date(equipment.next_maintenance_date);
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { label: `${Math.abs(daysUntil)}d overdue`, color: '#DC2626', bgColor: '#FEE2E2', icon: 'warning' as const };
    }
    if (daysUntil <= 14) {
      return { label: `Due in ${daysUntil}d`, color: '#D97706', bgColor: '#FEF3C7', icon: 'time-outline' as const };
    }
    if (daysUntil <= 30) {
      return { label: `Due in ${daysUntil}d`, color: '#3B82F6', bgColor: '#DBEAFE', icon: 'calendar-outline' as const };
    }
    return null;
  };

  const getPriorityIndicator = () => {
    switch (equipment.replacement_priority) {
      case 'critical':
        return { color: '#DC2626', bgColor: '#FEE2E2', label: 'Critical' };
      case 'high':
        return { color: '#D97706', bgColor: '#FEF3C7', label: 'High Priority' };
      default:
        return null;
    }
  };

  const maintenanceStatus = getMaintenanceStatus();
  const priorityIndicator = getPriorityIndicator();
  const conditionColor = getConditionColor(equipment.condition_rating);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactMain}>
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>{equipment.custom_name}</Text>
            {equipment.manufacturer && (
              <Text style={styles.compactMeta} numberOfLines={1}>
                {equipment.manufacturer}{equipment.model ? ` ${equipment.model}` : ''}
              </Text>
            )}
          </View>
          
          <View style={styles.compactIndicators}>
            {equipment.condition_rating !== undefined && equipment.condition_rating !== null && (
              <View style={[styles.conditionBadge, { backgroundColor: `${conditionColor}20` }]}>
                <View style={[styles.conditionDot, { backgroundColor: conditionColor }]} />
                <Text style={[styles.conditionText, { color: conditionColor }]}>
                  {equipment.condition_rating}%
                </Text>
              </View>
            )}
            
            {maintenanceStatus && (
              <View style={[styles.maintenanceBadge, { backgroundColor: maintenanceStatus.bgColor }]}>
                <Ionicons name={maintenanceStatus.icon} size={12} color={maintenanceStatus.color} />
                <Text style={[styles.maintenanceText, { color: maintenanceStatus.color }]}>
                  {maintenanceStatus.label}
                </Text>
              </View>
            )}
            
            {priorityIndicator && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityIndicator.bgColor }]}>
                <Ionicons name="alert-circle" size={12} color={priorityIndicator.color} />
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{equipment.custom_name}</Text>
          {(equipment.manufacturer || equipment.model) && (
            <Text style={styles.meta}>
              {equipment.manufacturer}{equipment.model ? ` • ${equipment.model}` : ''}
            </Text>
          )}
        </View>
        
        {equipment.status !== 'active' && (
          <View style={[styles.statusBadge, { backgroundColor: equipment.status === 'backup' ? '#E0F2FE' : '#F1F5F9' }]}>
            <Text style={styles.statusText}>
              {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Indicators Row */}
      <View style={styles.indicatorsRow}>
        {equipment.condition_rating !== undefined && equipment.condition_rating !== null && (
          <View style={styles.conditionIndicator}>
            <Text style={styles.indicatorLabel}>Condition</Text>
            <View style={styles.conditionBarContainer}>
              <View 
                style={[
                  styles.conditionBar,
                  { width: `${equipment.condition_rating}%`, backgroundColor: conditionColor }
                ]}
              />
            </View>
            <Text style={[styles.conditionValue, { color: conditionColor }]}>
              {equipment.condition_rating}% - {getConditionLabel(equipment.condition_rating)}
            </Text>
          </View>
        )}

        {equipment.current_hours !== undefined && equipment.expected_lifespan_hours && (
          <View style={styles.hoursIndicator}>
            <Text style={styles.indicatorLabel}>Usage</Text>
            <Text style={styles.hoursValue}>
              {equipment.current_hours} / {equipment.expected_lifespan_hours} hrs
            </Text>
          </View>
        )}
      </View>

      {/* Alert Badges */}
      {(maintenanceStatus || priorityIndicator) && (
        <View style={styles.alertsRow}>
          {maintenanceStatus && (
            <View style={[styles.alertBadge, { backgroundColor: maintenanceStatus.bgColor }]}>
              <Ionicons name={maintenanceStatus.icon} size={14} color={maintenanceStatus.color} />
              <Text style={[styles.alertText, { color: maintenanceStatus.color }]}>
                {maintenanceStatus.label}
              </Text>
            </View>
          )}
          
          {priorityIndicator && (
            <View style={[styles.alertBadge, { backgroundColor: priorityIndicator.bgColor }]}>
              <Ionicons name="alert-circle" size={14} color={priorityIndicator.color} />
              <Text style={[styles.alertText, { color: priorityIndicator.color }]}>
                {priorityIndicator.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Details */}
      <View style={styles.detailsRow}>
        {equipment.serial_number && (
          <View style={styles.detailItem}>
            <Ionicons name="barcode-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>S/N: {equipment.serial_number}</Text>
          </View>
        )}
        
        {equipment.purchase_date && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {new Date(equipment.purchase_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            </Text>
          </View>
        )}
        
        {equipment.last_maintenance_date && (
          <View style={styles.detailItem}>
            <Ionicons name="build-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              Last service: {new Date(equipment.last_maintenance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {onMaintenancePress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMaintenancePress();
            }}
          >
            <Ionicons name="build-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionText}>Log Maintenance</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onPress}
        >
          <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionText}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  compactMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  compactMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  compactIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  maintenanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  maintenanceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    padding: 4,
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  meta: {
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
    color: '#475569',
  },
  indicatorsRow: {
    gap: 12,
  },
  conditionIndicator: {
    gap: 4,
  },
  indicatorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionBarContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  conditionBar: {
    height: '100%',
    borderRadius: 3,
  },
  conditionValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  hoursIndicator: {
    gap: 4,
  },
  hoursValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  alertsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
});

export default EquipmentCard;

