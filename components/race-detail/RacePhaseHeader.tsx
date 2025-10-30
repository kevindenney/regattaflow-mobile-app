/**
 * Race Phase Header
 * Visual section divider for race phases (Pre-Race, During, Post-Race)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RacePhaseHeaderProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  badge?: string;
  phase?: 'upcoming' | 'in_progress' | 'completed';
}

export function RacePhaseHeader({
  icon,
  title,
  subtitle,
  badge,
  phase = 'upcoming'
}: RacePhaseHeaderProps) {
  const getPhaseColor = () => {
    switch (phase) {
      case 'upcoming': return '#3B82F6'; // Blue
      case 'in_progress': return '#10B981'; // Green
      case 'completed': return '#8B5CF6'; // Purple
      default: return '#64748B'; // Gray
    }
  };

  const phaseColor = getPhaseColor();

  return (
    <View style={styles.container}>
      {/* Icon & Title */}
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: phaseColor + '20' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={phaseColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>

        {badge && (
          <View style={[styles.badge, { backgroundColor: phaseColor + '20' }]}>
            <Text style={[styles.badgeText, { color: phaseColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      {/* Divider Line */}
      <View style={[styles.divider, { backgroundColor: phaseColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 2,
    borderRadius: 1,
    opacity: 0.3,
  },
});
