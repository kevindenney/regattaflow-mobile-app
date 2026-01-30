/**
 * SailorActivityCard
 *
 * Card component for displaying a sailor's race activity in the Follow feed.
 * Shows race name, date, venue, and activity type (upcoming/result).
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { PublicRacePreview } from '@/services/CrewFinderService';

interface SailorActivityCardProps {
  race: PublicRacePreview;
  onSailorPress?: (userId: string) => void;
}

export function SailorActivityCard({ race, onSailorPress }: SailorActivityCardProps) {
  const router = useRouter();

  const handleRacePress = useCallback(() => {
    triggerHaptic('selection');
    // Navigate to the race detail as read-only
    router.push(`/sailor/${race.userId}/race/${race.id}`);
  }, [router, race.id, race.userId]);

  const handleSailorPress = useCallback(() => {
    triggerHaptic('selection');
    if (onSailorPress) {
      onSailorPress(race.userId);
    } else {
      router.push(`/sailor/${race.userId}`);
    }
  }, [onSailorPress, race.userId, router]);

  // Format the date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Activity type label
  const activityLabel = race.isPast ? 'Raced at' : 'Racing at';
  const activityIcon = race.isPast ? 'checkmark-circle' : 'time-outline';

  return (
    <Pressable onPress={handleRacePress} style={styles.card}>
      {/* Sailor Header */}
      <Pressable onPress={handleSailorPress} style={styles.sailorRow}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: race.avatarColor || IOS_COLORS.systemGray5 },
          ]}
        >
          <Text style={styles.avatarEmoji}>{race.avatarEmoji || '⛵'}</Text>
        </View>
        <View style={styles.sailorInfo}>
          <Text style={styles.sailorName} numberOfLines={1}>
            {race.userName}
          </Text>
          <View style={styles.activityRow}>
            <Ionicons
              name={activityIcon as any}
              size={12}
              color={IOS_COLORS.secondaryLabel}
            />
            <Text style={styles.activityLabel}>
              {activityLabel} • {formatDate(race.startDate)}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Race Info */}
      <View style={styles.raceContent}>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>

        {race.venue && (
          <View style={styles.venueRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={IOS_COLORS.tertiaryLabel}
            />
            <Text style={styles.venueText} numberOfLines={1}>
              {race.venue}
            </Text>
          </View>
        )}

        {/* Content Indicators */}
        <View style={styles.indicatorsRow}>
          {race.boatClass && (
            <View style={styles.indicator}>
              <Ionicons name="boat-outline" size={12} color={IOS_COLORS.systemBlue} />
              <Text style={styles.indicatorText}>{race.boatClass}</Text>
            </View>
          )}
          {race.hasPrepNotes && (
            <View style={styles.indicator}>
              <Ionicons name="document-text-outline" size={12} color={IOS_COLORS.systemGreen} />
              <Text style={styles.indicatorText}>Prep Notes</Text>
            </View>
          )}
          {race.hasTuning && (
            <View style={styles.indicator}>
              <Ionicons name="settings-outline" size={12} color={IOS_COLORS.systemOrange} />
              <Text style={styles.indicatorText}>Tuning</Text>
            </View>
          )}
          {race.hasLessons && (
            <View style={styles.indicator}>
              <Ionicons name="bulb-outline" size={12} color={IOS_COLORS.systemPurple} />
              <Text style={styles.indicatorText}>Lessons</Text>
            </View>
          )}
        </View>
      </View>

      {/* View Chevron */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sailorRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
    width: 56,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  sailorInfo: {
    marginTop: IOS_SPACING.xs,
    alignItems: 'center',
  },
  sailorName: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    maxWidth: 56,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  activityLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  raceContent: {
    flex: 1,
  },
  raceName: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: IOS_SPACING.sm,
  },
  venueText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  indicatorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: IOS_RADIUS.sm,
  },
  indicatorText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: IOS_SPACING.sm,
    alignSelf: 'center',
  },
});

export default SailorActivityCard;
