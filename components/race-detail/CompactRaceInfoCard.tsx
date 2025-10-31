/**
 * CompactRaceInfoCard Component
 *
 * Compact race information display card inspired by macOS Weather app
 */

// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherMetricCard } from './WeatherMetricCard';
import { colors, Spacing } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';

interface CompactRaceInfoCardProps {
  raceName?: string;
  startDate?: string;
  startTime?: string;
  boatClass?: string;
  venue?: string;
}

export const CompactRaceInfoCard: React.FC<CompactRaceInfoCardProps> = ({
  raceName,
  startDate,
  startTime,
  boatClass,
  venue,
}) => {
  return (
    <WeatherMetricCard
      title="RACE INFO"
      icon="flag-outline"
      backgroundColor={colors.background.card}
    >
      <View style={styles.container}>
        {/* Race icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="trophy" size={40} color={colors.primary[500]} opacity={0.2} />
        </View>

        {/* Race name */}
        {raceName && (
          <Text style={styles.raceName} numberOfLines={2}>
            {raceName}
          </Text>
        )}

        {/* Date & Time */}
        <View style={styles.dateTimeContainer}>
          {startDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.text.tertiary} />
              <Text style={styles.infoText}>{startDate}</Text>
            </View>
          )}
          {startTime && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
              <Text style={styles.infoText}>{startTime}</Text>
            </View>
          )}
        </View>

        {/* Boat class */}
        {boatClass && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{boatClass}</Text>
          </View>
        )}
      </View>
    </WeatherMetricCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
    paddingVertical: Spacing.xs,
  },
  iconContainer: {
    marginBottom: Spacing.xs,
  },
  raceName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.xs,
  },
  dateTimeContainer: {
    gap: 4,
    alignItems: 'center',
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary[700],
    letterSpacing: 0.3,
  },
});
