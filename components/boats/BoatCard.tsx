import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BoatCardProps {
  boat: {
    id: string;
    name: string;
    className: string;
    sailNumber?: string;
    isPrimary: boolean;
    condition?: 'excellent' | 'good' | 'fair' | 'needs_attention';
    currentSetup?: string;
    stats?: {
      sails: number;
      maintenanceDue: number;
      equipmentStatus: 'good' | 'warning' | 'critical';
    };
  };
  onPress: () => void;
  onSetDefault?: (boatId: string) => void;
}

export function BoatCard({ boat, onPress, onSetDefault }: BoatCardProps) {
  const conditionColors = {
    excellent: '#10B981',
    good: '#3B82F6',
    fair: '#F59E0B',
    needs_attention: '#EF4444',
  };

  const equipmentStatusColors = {
    good: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
  };

  const condition = boat.condition || 'good';
  const stats = boat.stats || {
    sails: 0,
    maintenanceDue: 0,
    equipmentStatus: 'good' as const,
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="boat" size={28} color="#3B82F6" />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{boat.name}</Text>
            {boat.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {boat.className}
            {boat.sailNumber && ` • Sail #${boat.sailNumber}`}
          </Text>
        </View>
        {onSetDefault && (
          <TouchableOpacity
            style={styles.starButton}
            onPress={(e) => {
              e.stopPropagation();
              onSetDefault(boat.id);
            }}
          >
            <Ionicons
              name={boat.isPrimary ? 'star' : 'star-outline'}
              size={24}
              color={boat.isPrimary ? '#F59E0B' : '#94A3B8'}
            />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>

      {/* Condition & Setup */}
      <View style={styles.statusRow}>
        <View style={styles.conditionContainer}>
          <View
            style={[
              styles.conditionDot,
              { backgroundColor: conditionColors[condition] },
            ]}
          />
          <Text style={styles.conditionText}>
            {condition.replace('_', ' ')}
          </Text>
        </View>
        {boat.currentSetup && (
          <Text style={styles.setupText}>Setup: {boat.currentSetup}</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="fish" size={16} color="#64748B" />
          <Text style={styles.statText}>{stats.sails} Sails</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="build-outline" size={16} color="#64748B" />
          <Text style={styles.statText}>
            {stats.maintenanceDue > 0
              ? `${stats.maintenanceDue} Due`
              : 'Up to date'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  equipmentStatusColors[stats.equipmentStatus],
              },
            ]}
          />
          <Text style={styles.statText}>Equipment</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#EFF6FF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  primaryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    textTransform: 'capitalize',
  },
  setupText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 13,
    color: '#64748B',
  },
  starButton: {
    padding: 8,
    marginRight: 4,
  },
});
