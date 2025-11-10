/**
 * EnhancedRaceCard Component
 *
 * Beautiful race card for horizontal scroll with:
 * - Prominent countdown timer
 * - Status badge
 * - Condition indicators
 * - Clean typography
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/race-ui/Badge';
import { CountdownTimer } from './CountdownTimer';
import { StartSequenceTimer } from './StartSequenceTimer';
import { ConditionBadge } from './ConditionBadge';
import { Typography, Spacing, BorderRadius, Shadows, colors } from '@/constants/designSystem';

interface Race {
  id: string;
  name: string;
  venue?: string;
  startTime: Date;
  status?: 'upcoming' | 'inProgress' | 'completed' | 'cancelled';
  windConditions?: {
    summary: string;
  };
  currentConditions?: {
    summary: string;
  };
}

interface EnhancedRaceCardProps extends Omit<PressableProps, 'style'> {
  race: Race;
  isSelected?: boolean;
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  upcoming: 'info',
  inProgress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'UPCOMING',
  inProgress: 'IN PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

export const EnhancedRaceCard: React.FC<EnhancedRaceCardProps> = ({
  race,
  isSelected = false,
  ...pressableProps
}) => {
  const status = race.status || 'upcoming';
  const statusVariant = STATUS_VARIANTS[status];
  const statusLabel = STATUS_LABELS[status];

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      {...pressableProps}
    >
      {/* Status Badge - Positioned at top right */}
      <View style={styles.statusBadgeContainer}>
        <Badge text={statusLabel} variant={statusVariant} />
      </View>

      {/* Header: Name */}
      <View style={styles.header}>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>
      </View>

      {/* Venue */}
      {race.venue && (
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.venueText} numberOfLines={1}>
            {race.venue}
          </Text>
        </View>
      )}

      {/* Countdown Timer */}
      {status === 'upcoming' && (
        <View style={styles.timerSection}>
          <CountdownTimer targetDate={race.startTime} compact />
        </View>
      )}

      {/* Conditions */}
      {(race.windConditions || race.currentConditions) && (
        <View style={styles.conditionsContainer}>
          {race.windConditions && (
            <View style={styles.conditionRow}>
              <Ionicons name="wind" size={16} color={colors.primary[500]} />
              <Text style={styles.conditionText} numberOfLines={1}>
                {race.windConditions.summary}
              </Text>
            </View>
          )}
          {race.currentConditions && (
            <View style={styles.conditionRow}>
              <Ionicons name="water" size={16} color={colors.primary[400]} />
              <Text style={styles.conditionText} numberOfLines={1}>
                {race.currentConditions.summary}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Strategy Section */}
      {status === 'upcoming' && (
        <View style={styles.strategySection}>
          <View style={styles.strategySectionHeader}>
            <Ionicons name="map-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.strategySectionLabel}>STRATEGY</Text>
          </View>
          <Text style={styles.strategySectionText} numberOfLines={2}>
            Race strategy will be generated based on conditions
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginHorizontal: Spacing.sm,
    width: 240,
    minHeight: 280,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
    ...Shadows.large,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
  header: {
    marginBottom: Spacing.xs,
    paddingRight: 60, // Space for status badge
  },
  raceName: {
    ...Typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  venueText: {
    ...Typography.body,
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  conditionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionText: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  strategySection: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  strategySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  strategySectionLabel: {
    ...Typography.captionBold,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  strategySectionText: {
    ...Typography.body,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
