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
      {/* Header: Name + Status */}
      <View style={styles.header}>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>
        <Badge text={statusLabel} variant={statusVariant} />
      </View>

      {/* Venue */}
      {race.venue && (
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
          <Text style={styles.venueText} numberOfLines={1}>
            {race.venue}
          </Text>
        </View>
      )}

      {/* Countdown Timer */}
      {status === 'upcoming' && (
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>STARTS IN</Text>
          <CountdownTimer targetDate={race.startTime} compact />
        </View>
      )}

      {/* Start Sequence Timer - Only for upcoming races */}
      {status === 'upcoming' && (
        <View style={styles.startSequenceSection}>
          <StartSequenceTimer compact />
        </View>
      )}

      {/* Conditions */}
      {(race.windConditions || race.currentConditions) && (
        <View style={styles.conditionsRow}>
          {race.windConditions && (
            <ConditionBadge
              icon="cloudy-outline"
              label={race.windConditions.summary}
              color={colors.wind}
            />
          )}
          {race.currentConditions && (
            <ConditionBadge
              icon="water-outline"
              label={race.currentConditions.summary}
              color={colors.current}
            />
          )}
        </View>
      )}

      {/* Date/Time */}
      <Text style={styles.dateTime}>
        {formatTime(race.startTime)} • {formatDate(race.startTime)}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    width: 200,
    ...Shadows.small,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  raceName: {
    ...Typography.h3,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text.primary,
    flex: 1,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: Spacing.sm,
  },
  venueText: {
    ...Typography.body,
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.sm,
  },
  timerLabel: {
    ...Typography.captionBold,
    fontSize: 9,
    color: colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dateTime: {
    ...Typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  startSequenceSection: {
    marginBottom: Spacing.sm,
  },
});
