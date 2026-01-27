/**
 * TimelineAvatarStrip - Tufte-Inspired Vertical People Navigation
 *
 * Replaces abstract pagination dots with meaningful avatar + sparkline indicators
 * following Tufte's principles: every mark conveys data.
 *
 * Features:
 * - Emoji avatar circles (reuse existing avatar system)
 * - Mini sparkline bar under each showing race density over next 30 days
 * - "Now racing" indicator dot for live races
 * - Tap avatar to jump directly to that timeline
 * - Overflow indicator (•••) for 5+ followed users
 *
 * Tufte Principles Applied:
 * - Data-Ink Ratio: Sparklines show "who has races coming up" at a glance
 * - Direct Labeling: Avatar IS the navigation, no separate legend needed
 * - Small Multiples: Sparklines enable quick comparison across users
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Timeline } from '@/hooks/useFollowedTimelines';

// Design tokens
const COLORS = {
  homeActive: '#10B981', // Green for current user
  otherActive: '#3B82F6', // Blue for others
  avatarBg: '#F1F5F9',
  avatarBgActive: '#3B82F6',
  sparklineActive: '#3B82F6',
  sparklineInactive: '#E2E8F0',
  nowDot: '#10B981',
  text: '#334155',
  textMuted: '#94A3B8',
  overflow: '#64748B',
  border: '#E2E8F0',
};

const SIZES = {
  avatarSize: 36,
  avatarSizeActive: 42,
  sparklineWidth: 28,
  sparklineHeight: 6,
  sparklineSegments: 4, // Number of time segments
  containerHeight: 72,
  maxVisibleAvatars: 5,
};

interface AvatarConfig {
  emoji?: string;
  color?: string;
}

interface TimelineData {
  user: {
    id: string;
    name: string;
    avatar: AvatarConfig;
    isCurrentUser: boolean;
  };
  races: Array<{ date?: string; start_date?: string }>;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export interface TimelineAvatarStripProps {
  /** All timelines (index 0 is current user) */
  timelines: TimelineData[];
  /** Currently active timeline index */
  currentIndex: number;
  /** Callback when avatar is pressed */
  onSelectTimeline: (index: number) => void;
  /** Whether haptic feedback is enabled */
  enableHaptics?: boolean;
}

/**
 * Calculate sparkline data for a timeline
 * Divides next 30 days into segments, marks which have races
 */
function calculateSparkline(
  races: Array<{ date?: string; start_date?: string }>,
  segments: number = SIZES.sparklineSegments
): boolean[] {
  const now = new Date();
  const daysPerSegment = 30 / segments;
  const result = new Array(segments).fill(false);

  races.forEach((race) => {
    const raceDate = new Date(race.start_date || race.date || '');
    if (isNaN(raceDate.getTime())) return;

    const daysFromNow = Math.floor(
      (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only count future races within 30 days
    if (daysFromNow >= 0 && daysFromNow < 30) {
      const segmentIndex = Math.floor(daysFromNow / daysPerSegment);
      if (segmentIndex < segments) {
        result[segmentIndex] = true;
      }
    }
  });

  return result;
}

/**
 * Check if any races are happening "now" (within 4 hours)
 */
function hasRaceNow(races: Array<{ date?: string; start_date?: string }>): boolean {
  const now = Date.now();
  const fourHours = 4 * 60 * 60 * 1000;

  return races.some((race) => {
    const raceDate = new Date(race.start_date || race.date || '');
    if (isNaN(raceDate.getTime())) return false;

    const diff = Math.abs(raceDate.getTime() - now);
    return diff < fourHours;
  });
}

/**
 * Mini Sparkline Component
 * Shows race density as filled/empty segments
 */
function Sparkline({ data, isActive }: { data: boolean[]; isActive: boolean }) {
  return (
    <View style={styles.sparkline}>
      {data.map((hasRace, idx) => (
        <View
          key={idx}
          style={[
            styles.sparklineSegment,
            hasRace && styles.sparklineSegmentActive,
            isActive && hasRace && styles.sparklineSegmentHighlight,
          ]}
        />
      ))}
    </View>
  );
}

/**
 * Single Avatar with Sparkline
 */
function AvatarWithSparkline({
  timeline,
  index,
  isActive,
  onPress,
}: {
  timeline: TimelineData;
  index: number;
  isActive: boolean;
  onPress: () => void;
}) {
  const { user, races } = timeline;
  const sparklineData = useMemo(() => calculateSparkline(races), [races]);
  const isRacingNow = useMemo(() => hasRaceNow(races), [races]);
  const isHome = user.isCurrentUser;

  const avatarSize = isActive ? SIZES.avatarSizeActive : SIZES.avatarSize;
  const bgColor = isActive
    ? isHome
      ? COLORS.homeActive
      : COLORS.otherActive
    : user.avatar.color || COLORS.avatarBg;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.avatarContainer, isActive && styles.avatarContainerActive]}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      activeOpacity={0.7}
    >
      {/* "Now racing" indicator */}
      {isRacingNow && (
        <View style={styles.nowDot} />
      )}

      {/* Avatar circle */}
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: bgColor,
          },
          isActive && styles.avatarActive,
        ]}
      >
        <Text
          style={[
            styles.avatarEmoji,
            isActive && styles.avatarEmojiActive,
            { fontSize: isActive ? 20 : 18 },
          ]}
        >
          {isHome ? '🏠' : user.avatar.emoji || '⛵'}
        </Text>
      </View>

      {/* Sparkline under avatar */}
      <Sparkline data={sparklineData} isActive={isActive} />

      {/* Name label (only for active) */}
      {isActive && (
        <Text style={styles.nameLabel} numberOfLines={1}>
          {isHome ? 'You' : user.name.split(' ')[0]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * Overflow Menu Avatar (•••)
 */
function OverflowIndicator({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.overflowContainer}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      activeOpacity={0.7}
    >
      <View style={styles.overflowAvatar}>
        <Text style={styles.overflowDots}>•••</Text>
      </View>
      <Text style={styles.overflowCount}>+{count}</Text>
    </TouchableOpacity>
  );
}

/**
 * TimelineAvatarStrip Component
 */
export function TimelineAvatarStrip({
  timelines,
  currentIndex,
  onSelectTimeline,
  enableHaptics = true,
}: TimelineAvatarStripProps) {
  // Handle avatar press
  const handlePress = useCallback(
    (index: number) => {
      if (enableHaptics && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onSelectTimeline(index);
    },
    [enableHaptics, onSelectTimeline]
  );

  // Determine visible avatars
  const { visibleTimelines, overflowCount, showOverflow } = useMemo(() => {
    if (timelines.length <= SIZES.maxVisibleAvatars) {
      return {
        visibleTimelines: timelines.map((t, i) => ({ timeline: t, originalIndex: i })),
        overflowCount: 0,
        showOverflow: false,
      };
    }

    // Show first MAX_VISIBLE - 1 + current if not in view
    const visible: Array<{ timeline: TimelineData; originalIndex: number }> = [];
    const maxShow = SIZES.maxVisibleAvatars - 1; // Reserve one for overflow

    // Always include current user (index 0)
    visible.push({ timeline: timelines[0], originalIndex: 0 });

    // If current is not home, ensure it's visible
    if (currentIndex !== 0 && currentIndex < timelines.length) {
      visible.push({ timeline: timelines[currentIndex], originalIndex: currentIndex });
    }

    // Fill remaining slots
    for (let i = 1; i < timelines.length && visible.length < maxShow; i++) {
      if (i !== currentIndex) {
        visible.push({ timeline: timelines[i], originalIndex: i });
      }
    }

    // Sort by original index to maintain order
    visible.sort((a, b) => a.originalIndex - b.originalIndex);

    return {
      visibleTimelines: visible,
      overflowCount: timelines.length - visible.length,
      showOverflow: timelines.length > SIZES.maxVisibleAvatars,
    };
  }, [timelines, currentIndex]);

  // Don't render if only one timeline
  if (timelines.length <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.strip}>
        {/* Visible avatars */}
        {visibleTimelines.map(({ timeline, originalIndex }) => (
          <AvatarWithSparkline
            key={timeline.user.id}
            timeline={timeline}
            index={originalIndex}
            isActive={originalIndex === currentIndex}
            onPress={() => handlePress(originalIndex)}
          />
        ))}

        {/* Overflow indicator */}
        {showOverflow && overflowCount > 0 && (
          <OverflowIndicator
            count={overflowCount}
            onPress={() => {
              // TODO: Show full list picker
              // For now, just go to first hidden one
              const firstHidden = timelines.findIndex(
                (_, i) => !visibleTimelines.some((v) => v.originalIndex === i)
              );
              if (firstHidden !== -1) {
                handlePress(firstHidden);
              }
            }}
          />
        )}
      </View>

      {/* Context label */}
      <View style={styles.contextContainer}>
        {currentIndex > 0 && currentIndex < timelines.length && (
          <Text style={styles.contextLabel}>
            ← {timelines[currentIndex].user.name}
          </Text>
        )}
        {currentIndex === 0 && timelines.length > 1 && (
          <Text style={styles.contextLabel}>
            {timelines.length - 1} following
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SIZES.containerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    minWidth: 44,
  },
  avatarContainerActive: {
    // Slightly larger hit area
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  avatarEmojiActive: {
    // Slightly larger handled by fontSize
  },
  nowDot: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.nowDot,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  sparkline: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
    height: SIZES.sparklineHeight,
  },
  sparklineSegment: {
    width: (SIZES.sparklineWidth - (SIZES.sparklineSegments - 1) * 2) / SIZES.sparklineSegments,
    height: SIZES.sparklineHeight,
    borderRadius: 1,
    backgroundColor: COLORS.sparklineInactive,
  },
  sparklineSegmentActive: {
    backgroundColor: COLORS.sparklineActive,
    opacity: 0.5,
  },
  sparklineSegmentHighlight: {
    opacity: 1,
  },
  nameLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 2,
    maxWidth: 48,
  },
  overflowContainer: {
    alignItems: 'center',
    minWidth: 44,
  },
  overflowAvatar: {
    width: SIZES.avatarSize,
    height: SIZES.avatarSize,
    borderRadius: SIZES.avatarSize / 2,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowDots: {
    fontSize: 14,
    color: COLORS.overflow,
    fontWeight: '600',
    letterSpacing: -2,
  },
  overflowCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  contextContainer: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  contextLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default TimelineAvatarStrip;
