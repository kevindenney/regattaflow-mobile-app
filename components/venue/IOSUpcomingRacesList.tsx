/**
 * IOSUpcomingRacesList - iOS HIG Inset Grouped List
 *
 * Upcoming races displayed in iOS Settings-style list:
 * - Inset grouped list style
 * - Event type icon (leading)
 * - Title + subtitle + date (trailing)
 * - Disclosure chevron
 * - "See All" in section header
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface VenueRace {
  id: string;
  eventName: string;
  eventType: string;
  formattedDateRange: string;
  clubName?: string;
  daysUntilStart: number;
  isToday?: boolean;
  registrationStatus?: string;
  entryFee?: number;
  currency?: string;
  norUrl?: string;
  siUrl?: string;
}

interface IOSUpcomingRacesListProps {
  races: VenueRace[];
  isLoading?: boolean;
  onRacePress?: (race: VenueRace) => void;
  onSeeAll?: () => void;
  onRefresh?: () => void;
  title?: string;
  emptyMessage?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Event type configuration
function getEventTypeInfo(eventType: string): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
} {
  switch (eventType) {
    case 'championship':
      return { icon: 'trophy', color: IOS_COLORS.systemOrange, label: 'Championship' };
    case 'distance_race':
      return { icon: 'navigate', color: IOS_COLORS.systemPurple, label: 'Distance' };
    case 'weeknight_series':
      return { icon: 'repeat', color: IOS_COLORS.systemBlue, label: 'Series' };
    case 'clinic':
      return { icon: 'school', color: IOS_COLORS.systemGreen, label: 'Training' };
    case 'weekend_regatta':
    default:
      return { icon: 'flag', color: IOS_COLORS.systemRed, label: 'Regatta' };
  }
}

// Format days until
function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 14) return '1 week';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 60) return '1 month';
  return `${Math.floor(days / 30)} months`;
}

// Individual race row
interface RaceRowProps {
  race: VenueRace;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function RaceRow({ race, onPress, isFirst, isLast }: RaceRowProps) {
  const scale = useSharedValue(1);
  const eventInfo = getEventTypeInfo(race.eventType);

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${race.eventName}, ${formatDaysUntil(race.daysUntilStart)}`}
    >
      {/* Leading Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${eventInfo.color}15` }]}>
        <Ionicons name={eventInfo.icon} size={18} color={eventInfo.color} />
      </View>

      {/* Content */}
      <View style={styles.rowContent}>
        <View style={styles.rowMain}>
          <Text style={styles.raceName} numberOfLines={1}>
            {race.eventName}
          </Text>
          <View style={styles.rowDetails}>
            {race.clubName && (
              <Text style={styles.clubName} numberOfLines={1}>
                {race.clubName}
              </Text>
            )}
            <Text style={styles.dateText}>
              {race.formattedDateRange}
            </Text>
          </View>
        </View>

        {/* Trailing */}
        <View style={styles.rowTrailing}>
          {race.isToday ? (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>TODAY</Text>
            </View>
          ) : (
            <Text style={styles.daysUntilText}>
              {formatDaysUntil(race.daysUntilStart)}
            </Text>
          )}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={IOS_COLORS.systemGray3}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Main component
export function IOSUpcomingRacesList({
  races,
  isLoading = false,
  onRacePress,
  onSeeAll,
  onRefresh,
  title = 'Upcoming Races',
  emptyMessage = 'No upcoming races at this venue',
}: IOSUpcomingRacesListProps) {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
        {onSeeAll && races.length > 0 && (
          <Pressable
            style={styles.seeAllButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onSeeAll();
            }}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isLoading && races.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemGray3} />
        </View>
      ) : races.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={28} color={IOS_COLORS.systemGray3} />
          </View>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {races.map((race, index) => (
            <RaceRow
              key={race.id}
              race={race}
              onPress={() => onRacePress?.(race)}
              isFirst={index === 0}
              isLast={index === races.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // List
  listContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: IOS_SPACING.md,
  },
  rowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  rowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  raceName: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  rowDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginTop: 2,
  },
  clubName: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    maxWidth: 100,
  },
  dateText: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  daysUntilText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  todayBadge: {
    backgroundColor: IOS_COLORS.systemRed,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayText: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Loading
  loadingContainer: {
    padding: IOS_SPACING.xxl,
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.xl,
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default IOSUpcomingRacesList;
