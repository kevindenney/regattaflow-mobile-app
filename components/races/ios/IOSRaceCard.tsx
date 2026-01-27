/**
 * IOSRaceCard - Award-Winning Apple iOS Design
 *
 * Full-screen immersive race card following Apple HIG:
 * - Clean, minimal interface
 * - Content-first approach
 * - Progressive disclosure
 * - Smooth animations and haptics
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types
interface RaceData {
  id: string;
  name: string;
  venue?: string;
  date: string;
  startTime: string;
  raceType?: 'fleet' | 'distance' | 'match' | 'team';
  status: 'upcoming' | 'today' | 'past';
  daysUntil: number;
  hoursUntil?: number;
  minutesUntil?: number;
  wind?: { direction: string; speed: number };
  numberOfRaces?: number;
  progress?: number; // 0-1 for prep completion
}

interface IOSRaceCardProps {
  race: RaceData;
  onPress?: () => void;
  onPrepPress?: () => void;
  onWeatherPress?: () => void;
  onDocsPress?: () => void;
  isActive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Get countdown display text
 */
function getCountdownText(race: RaceData): { value: string; label: string; urgent: boolean } {
  if (race.status === 'past') {
    return { value: 'Done', label: 'Completed', urgent: false };
  }

  if (race.daysUntil === 0) {
    if (race.hoursUntil !== undefined && race.hoursUntil < 1) {
      return { value: `${race.minutesUntil || 0}`, label: 'min', urgent: true };
    }
    return { value: `${race.hoursUntil || 0}`, label: 'hours', urgent: true };
  }

  if (race.daysUntil === 1) {
    return { value: 'Tomorrow', label: '', urgent: false };
  }

  if (race.daysUntil <= 7) {
    return { value: `${race.daysUntil}`, label: 'days', urgent: false };
  }

  return { value: `${race.daysUntil}`, label: 'days', urgent: false };
}

/**
 * Get status color based on urgency
 */
function getStatusColor(race: RaceData): string {
  if (race.status === 'past') return IOS_COLORS.systemGray;
  if (race.daysUntil === 0) return IOS_COLORS.systemRed;
  if (race.daysUntil <= 1) return IOS_COLORS.systemOrange;
  if (race.daysUntil <= 3) return IOS_COLORS.systemYellow;
  return IOS_COLORS.systemGreen;
}

/**
 * Race type badge
 */
const RaceTypeBadge: React.FC<{ type?: string }> = ({ type }) => {
  const label = type === 'distance' ? 'DISTANCE' :
                type === 'match' ? 'MATCH' :
                type === 'team' ? 'TEAM' : 'FLEET';

  return (
    <View style={styles.typeBadge}>
      <Text style={styles.typeBadgeText}>{label}</Text>
    </View>
  );
};

/**
 * Countdown display
 */
const CountdownDisplay: React.FC<{ race: RaceData }> = ({ race }) => {
  const { value, label, urgent } = getCountdownText(race);
  const color = getStatusColor(race);

  return (
    <View style={styles.countdownContainer}>
      <Text style={[styles.countdownValue, { color }]}>
        {value}
      </Text>
      {label && (
        <Text style={[styles.countdownLabel, { color }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

/**
 * Quick action button
 */
const QuickAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  badge?: number;
  color?: string;
}> = ({ icon, label, onPress, badge, color = IOS_COLORS.systemBlue }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.quickAction, animatedStyle]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress?.();
      }}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </AnimatedPressable>
  );
};

/**
 * Progress ring for prep completion
 */
const PrepProgressRing: React.FC<{ progress: number; size?: number }> = ({
  progress,
  size = 64
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderRadius: (size - strokeWidth) / 2,
          borderWidth: strokeWidth,
          borderColor: IOS_COLORS.systemGray5,
        }}
      />
      {/* Progress circle - using a view with border for simplicity */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderRadius: (size - strokeWidth) / 2,
          borderWidth: strokeWidth,
          borderColor: progress >= 1 ? IOS_COLORS.systemGreen : IOS_COLORS.systemBlue,
          borderTopColor: progress >= 0.25 ? (progress >= 1 ? IOS_COLORS.systemGreen : IOS_COLORS.systemBlue) : 'transparent',
          borderRightColor: progress >= 0.5 ? (progress >= 1 ? IOS_COLORS.systemGreen : IOS_COLORS.systemBlue) : 'transparent',
          borderBottomColor: progress >= 0.75 ? (progress >= 1 ? IOS_COLORS.systemGreen : IOS_COLORS.systemBlue) : 'transparent',
          borderLeftColor: progress >= 1 ? IOS_COLORS.systemGreen : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      {/* Center content */}
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.progressPercent}>
          {Math.round(progress * 100)}%
        </Text>
        <Text style={styles.progressLabel}>Ready</Text>
      </View>
    </View>
  );
};

/**
 * Main Race Card Component
 */
export function IOSRaceCard({
  race,
  onPress,
  onPrepPress,
  onWeatherPress,
  onDocsPress,
  isActive = true,
}: IOSRaceCardProps) {
  const scale = useSharedValue(1);
  const statusColor = getStatusColor(race);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    triggerHaptic('impactLight');
    onPress?.();
  }, [onPress]);

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(race.date);
    if (race.daysUntil === 0) return 'Today';
    if (race.daysUntil === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [race.date, race.daysUntil]);

  return (
    <Animated.View
      style={[styles.card, cardAnimatedStyle]}
      entering={FadeIn.duration(300)}
    >
      {/* Top Section - Status Bar */}
      <View style={styles.statusBar}>
        <RaceTypeBadge type={race.raceType} />
        <View style={{ flex: 1 }} />
        {race.numberOfRaces && race.numberOfRaces > 1 && (
          <View style={styles.raceCountBadge}>
            <Ionicons name="flag" size={12} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.raceCountText}>{race.numberOfRaces} races</Text>
          </View>
        )}
      </View>

      {/* Hero Section - Race Name & Countdown */}
      <View style={styles.heroSection}>
        <View style={styles.heroLeft}>
          <Text style={styles.raceName} numberOfLines={3}>
            {race.name}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.metaText}>
              {race.venue || 'Location TBD'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.metaText}>
              {formattedDate} at {race.startTime}
            </Text>
          </View>
        </View>

        <CountdownDisplay race={race} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Prep Status Section */}
      {race.status !== 'past' && (
        <Pressable
          style={styles.prepSection}
          onPress={() => {
            triggerHaptic('selection');
            onPrepPress?.();
          }}
        >
          <PrepProgressRing progress={race.progress || 0} />
          <View style={styles.prepContent}>
            <Text style={styles.prepTitle}>Race Preparation</Text>
            <Text style={styles.prepSubtitle}>
              {race.progress === 1
                ? 'All tasks complete'
                : `${Math.round((race.progress || 0) * 5)} of 5 tasks done`}
            </Text>
            <View style={styles.prepHint}>
              <Text style={styles.prepHintText}>Tap to view checklist</Text>
              <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.tertiaryLabel} />
            </View>
          </View>
        </Pressable>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <QuickAction
          icon="document-text-outline"
          label="Documents"
          onPress={onDocsPress}
          badge={2}
          color={IOS_COLORS.systemIndigo}
        />
        <QuickAction
          icon="partly-sunny-outline"
          label="Weather"
          onPress={onWeatherPress}
          color={IOS_COLORS.systemOrange}
        />
        <QuickAction
          icon="navigate-outline"
          label="Course"
          color={IOS_COLORS.systemTeal}
        />
        <QuickAction
          icon="people-outline"
          label="Crew"
          color={IOS_COLORS.systemPink}
        />
      </View>

      {/* Wind Preview (if available) */}
      {race.wind && race.status !== 'past' && (
        <View style={styles.windPreview}>
          <Ionicons name="flag" size={16} color={IOS_COLORS.systemBlue} />
          <Text style={styles.windText}>
            {race.wind.direction} at {race.wind.speed} kts forecast
          </Text>
        </View>
      )}

      {/* Bottom Action */}
      {race.status !== 'past' && (
        <Pressable
          style={({ pressed }) => [
            styles.primaryAction,
            { backgroundColor: pressed ? `${statusColor}E0` : statusColor },
          ]}
          onPress={handlePress}
        >
          <Text style={styles.primaryActionText}>
            {race.daysUntil === 0 ? 'Start Race Day' : 'View Race Details'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Past Race Result Summary */}
      {race.status === 'past' && (
        <View style={styles.resultSection}>
          <View style={styles.resultBadge}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.resultPosition}>3rd</Text>
          </View>
          <Text style={styles.resultMeta}>of 24 boats</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.xl,
    marginHorizontal: IOS_SPACING.lg,
    marginVertical: IOS_SPACING.sm,
    padding: IOS_SPACING.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      } as any,
    }),
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IOS_SPACING.lg,
  },
  typeBadge: {
    backgroundColor: IOS_COLORS.systemGray6,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  raceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raceCountText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },

  // Hero Section
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: IOS_SPACING.xl,
  },
  heroLeft: {
    flex: 1,
    marginRight: IOS_SPACING.lg,
  },
  raceName: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 34,
    marginBottom: IOS_SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginTop: IOS_SPACING.xs,
  },
  metaText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  countdownLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: -4,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginVertical: IOS_SPACING.lg,
  },

  // Prep Section
  prepSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.xl,
  },
  prepContent: {
    flex: 1,
    marginLeft: IOS_SPACING.lg,
  },
  prepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  prepSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  prepHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IOS_SPACING.sm,
  },
  prepHintText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  progressPercent: {
    fontSize: 17,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: -2,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: IOS_SPACING.xl,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.xs,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: IOS_COLORS.systemRed,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Wind Preview
  windPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: `${IOS_COLORS.systemBlue}08`,
    borderRadius: IOS_RADIUS.md,
    marginBottom: IOS_SPACING.xl,
  },
  windText: {
    fontSize: 14,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },

  // Primary Action
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.lg,
  },
  primaryActionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Result Section
  resultSection: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xl,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  resultPosition: {
    fontSize: 32,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  resultMeta: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },
});

export default IOSRaceCard;
