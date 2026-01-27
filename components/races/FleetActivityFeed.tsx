/**
 * FleetActivityFeed Component
 *
 * Horizontal scroll section showing fleet mates' race activity.
 * Auto-surfaces content from inner circle without explicit follow.
 *
 * Apple HIG compliant with iOS system colors and shadows.
 */

import React, { useCallback } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, FileText, Lightbulb, Users } from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY } from '@/lib/design-tokens-ios';
import { useFleetActivity, FleetMateRace } from '@/hooks/useFleetActivity';
import { useRouter } from 'expo-router';

/**
 * Props for FleetActivityFeed
 */
interface FleetActivityFeedProps {
  /** Callback when a race is selected */
  onRaceSelect?: (race: FleetMateRace) => void;
  /** Maximum number of items to show */
  maxItems?: number;
  /** Callback when "See All" is pressed */
  onSeeAll?: () => void;
}

/**
 * Individual fleet activity card
 */
function FleetActivityCard({
  race,
  onPress,
}: {
  race: FleetMateRace;
  onPress?: () => void;
}) {
  const daysText = race.isPast
    ? 'Past'
    : race.daysUntil === 0
      ? 'Today'
      : race.daysUntil === 1
        ? 'Tomorrow'
        : `${race.daysUntil}d`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: race.avatarColor || IOS_COLORS.systemBlue }]}>
        <Text style={styles.avatarEmoji}>{race.avatarEmoji || '⛵'}</Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.userName} numberOfLines={1}>
          {race.userName}
        </Text>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>

        {/* Countdown badge */}
        <View style={[
          styles.countdownBadge,
          race.isPast && styles.countdownBadgePast,
        ]}>
          <Calendar size={10} color={race.isPast ? IOS_COLORS.systemGray : IOS_COLORS.systemBlue} />
          <Text style={[
            styles.countdownText,
            race.isPast && styles.countdownTextPast,
          ]}>
            {daysText}
          </Text>
        </View>

        {/* Content indicators */}
        <View style={styles.contentIndicators}>
          {race.prepNotes && (
            <View style={styles.indicator}>
              <FileText size={12} color={IOS_COLORS.systemGreen} />
              <Text style={styles.indicatorText}>Prep</Text>
            </View>
          )}
          {race.lessonsLearned && race.lessonsLearned.length > 0 && (
            <View style={styles.indicator}>
              <Lightbulb size={12} color={IOS_COLORS.systemYellow} />
              <Text style={styles.indicatorText}>Lessons</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Fleet Activity Feed component
 */
export function FleetActivityFeed({
  onRaceSelect,
  maxItems = 10,
  onSeeAll,
}: FleetActivityFeedProps) {
  const { allFleetRaces, isLoading, totalRaceCount } = useFleetActivity();
  const router = useRouter();

  const displayRaces = allFleetRaces.slice(0, maxItems);

  const handleRacePress = useCallback((race: FleetMateRace) => {
    if (onRaceSelect) {
      onRaceSelect(race);
    }
  }, [onRaceSelect]);

  // Don't render if no activity
  if (!isLoading && displayRaces.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.headerTitle}>Fleet Activity</Text>
        </View>
        {totalRaceCount > maxItems && onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        )}
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading fleet activity...</Text>
        </View>
      )}

      {/* Race cards */}
      {!isLoading && displayRaces.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={168} // card width + gap
        >
          {displayRaces.map((race) => (
            <FleetActivityCard
              key={race.id}
              race={race}
              onPress={() => handleRacePress(race)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: IOS_SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  seeAllText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemBlue,
  },
  scrollContent: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.sm,
  },
  card: {
    width: 160,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  userName: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  raceName: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: IOS_RADIUS.xs,
    alignSelf: 'flex-start',
    marginBottom: IOS_SPACING.xs,
  },
  countdownBadgePast: {
    backgroundColor: IOS_COLORS.systemGray6,
  },
  countdownText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  countdownTextPast: {
    color: IOS_COLORS.systemGray,
  },
  contentIndicators: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
    marginTop: IOS_SPACING.xs,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  indicatorText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  loadingContainer: {
    padding: IOS_SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
});

export default FleetActivityFeed;
