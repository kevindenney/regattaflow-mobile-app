/**
 * CoachingSuggestionTile - Adaptive coaching suggestion widget
 *
 * Compact 155x155 pressable tile matching CoachFeedbackTile pattern.
 * Shows contextual coaching suggestions based on whether the sailor
 * has an active coach relationship.
 *
 * Two visual states:
 *   1. Discovery (green accent) - no coach, shows CTA to find one
 *   2. Has Coach (blue accent) - shows coach name with action CTA
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Users, MessageCircle, Share2, Search, ChevronRight, User } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { ActiveCoach } from '@/hooks/useSailorActiveCoaches';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export type CoachingPhase = 'prep' | 'review';

export interface CoachingSuggestionTileProps {
  /** Whether the sailor has an active coach */
  hasCoach: boolean;
  /** The most relevant coach (when hasCoach is true) */
  primaryCoach?: ActiveCoach | null;
  /** Whether there are multiple active coaches */
  hasMultipleCoaches?: boolean;
  /** Current race phase context */
  phase: CoachingPhase;
  /** Race boat class for filtering coach discovery */
  raceBoatClass?: string;
  /** Callback when tile is pressed (main action) */
  onPress: () => void;
  /** Callback when "Choose another coach" is pressed */
  onChooseAnotherCoach?: () => void;
}

/**
 * Get phase-specific copy for the tile
 */
function getTileCopy(phase: CoachingPhase, hasCoach: boolean, coachName?: string) {
  if (hasCoach && coachName) {
    if (phase === 'prep') {
      return {
        header: 'COACHING',
        title: coachName,
        hint: 'Ask about your race plan',
        icon: MessageCircle,
      };
    }
    return {
      header: 'COACHING',
      title: coachName,
      hint: 'Share this debrief',
      icon: Share2,
    };
  }

  // Discovery state
  if (phase === 'prep') {
    return {
      header: 'COACHING',
      title: 'Get advice',
      hint: 'Book a pre-race consult',
      icon: Search,
    };
  }
  return {
    header: 'COACHING',
    title: 'Get feedback',
    hint: 'Find a coach to review',
    icon: Search,
  };
}

export function CoachingSuggestionTile({
  hasCoach,
  primaryCoach,
  hasMultipleCoaches = false,
  phase,
  raceBoatClass: _raceBoatClass,
  onPress,
  onChooseAnotherCoach,
}: CoachingSuggestionTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const copy = getTileCopy(phase, hasCoach, primaryCoach?.displayName);
  const IconComponent = copy.icon;

  // Visual style based on state
  const isDiscovery = !hasCoach;
  const accentColor = isDiscovery ? COLORS.green : COLORS.blue;

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        hasCoach && styles.tileHasCoach,
        isDiscovery && styles.tileDiscovery,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        hasCoach
          ? `Message ${primaryCoach?.displayName || 'your coach'}`
          : 'Find a coach'
      }
    >
      {/* Header row */}
      <View style={styles.header}>
        <Users size={12} color={accentColor} />
        <Text style={[styles.headerLabel, { color: COLORS.gray }]}>{copy.header}</Text>
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {hasCoach && primaryCoach ? (
          <>
            {/* Coach avatar or fallback icon */}
            {primaryCoach.avatarUrl ? (
              <Image
                source={{ uri: primaryCoach.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: `${accentColor}20` }]}>
                <User size={20} color={accentColor} />
              </View>
            )}
            <Text style={styles.coachName} numberOfLines={1}>
              {copy.title}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.discoveryIcon, { backgroundColor: `${accentColor}15` }]}>
              <IconComponent size={22} color={accentColor} />
            </View>
            <Text style={styles.discoveryTitle}>{copy.title}</Text>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.hint, { color: accentColor }]} numberOfLines={1}>
          {copy.hint}
        </Text>
        <ChevronRight size={14} color={accentColor} />
      </View>

      {/* Multiple coaches indicator */}
      {hasCoach && hasMultipleCoaches && onChooseAnotherCoach && (
        <Pressable
          style={styles.multipleCoachesBadge}
          onPress={(e) => {
            e.stopPropagation();
            triggerHaptic('impactLight');
            onChooseAnotherCoach();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.multipleCoachesText}>+</Text>
        </Pressable>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileHasCoach: {
    borderColor: `${COLORS.blue}40`,
    backgroundColor: `${COLORS.blue}04`,
  },
  tileDiscovery: {
    borderColor: `${COLORS.green}40`,
    backgroundColor: `${COLORS.green}04`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  // Coach avatar styles
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
  },
  // Discovery state styles
  discoveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  // Multiple coaches badge
  multipleCoachesBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multipleCoachesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CoachingSuggestionTile;
