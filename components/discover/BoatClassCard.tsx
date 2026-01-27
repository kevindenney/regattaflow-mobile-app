/**
 * BoatClassCard Component
 *
 * Card for browsing boat classes in the discovery screen.
 * Shows class name, type, and popularity metrics.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sailboat, Users, ChevronRight } from 'lucide-react-native';
import { BrowseBoatClass } from '@/hooks/useAllBoatClasses';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

/**
 * Get emoji icon for boat type
 */
function getBoatTypeEmoji(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'dinghy':
      return '🛶';
    case 'keelboat':
      return '⛵';
    case 'catamaran':
      return '🚣';
    case 'multihull':
      return '🏄';
    case 'offshore':
      return '🚢';
    default:
      return '⛵';
  }
}

/**
 * Get color for boat type
 */
function getBoatTypeColor(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'dinghy':
      return '#3B82F6'; // Blue
    case 'keelboat':
      return '#10B981'; // Green
    case 'catamaran':
      return '#F59E0B'; // Amber
    case 'multihull':
      return '#8B5CF6'; // Purple
    case 'offshore':
      return '#EF4444'; // Red
    default:
      return '#64748B'; // Slate
  }
}

interface BoatClassCardProps {
  boatClass: BrowseBoatClass;
  onPress: () => void;
}

export function BoatClassCard({ boatClass, onPress }: BoatClassCardProps) {
  const emoji = getBoatTypeEmoji(boatClass.type);
  const color = getBoatTypeColor(boatClass.type);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {boatClass.name}
        </Text>
        <View style={styles.stats}>
          {boatClass.fleetCount > 0 && (
            <View style={styles.stat}>
              <Sailboat size={12} color="#64748B" />
              <Text style={styles.statText}>
                {boatClass.fleetCount} {boatClass.fleetCount === 1 ? 'fleet' : 'fleets'}
              </Text>
            </View>
          )}
          {boatClass.sailorCount > 0 && (
            <View style={styles.stat}>
              <Users size={12} color="#64748B" />
              <Text style={styles.statText}>{boatClass.sailorCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <ChevronRight size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default BoatClassCard;
