/**
 * LearningCaptureTile - Apple Weather-inspired learning capture progress widget
 *
 * Compact 155x155 pressable tile matching the DebriefTile pattern.
 * Shows learning capture completion progress with three visual states:
 * not started, in progress, and complete.
 *
 * Tracks a checklist of learning items: key learning, what worked,
 * improvement areas, and coach feedback.
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GraduationCap, Check } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// iOS System Colors (matching DebriefTile / RaceResultTile)
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface LearningCaptureTileProps {
  /** Number of completed items */
  completedCount: number;
  /** Total number of items */
  totalCount: number;
  /** Whether all items are complete */
  isComplete: boolean;
  /** Label of the next item to capture (optional) */
  nextItemLabel?: string;
  /** Callback when tile is pressed */
  onPress: () => void;
}

export function LearningCaptureTile({
  completedCount,
  totalCount,
  isComplete,
  nextItemLabel,
  onPress,
}: LearningCaptureTileProps) {
  // Animation (IOSWidgetCard pattern)
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

  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        isComplete && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        isComplete
          ? `Learning capture complete: ${completedCount} captured`
          : completedCount > 0
            ? `Learning capture in progress: ${completedCount} of ${totalCount}`
            : 'Start learning capture'
      }
    >
      {/* Completion badge */}
      {isComplete && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <GraduationCap size={12} color={COLORS.purple} />
        <Text style={styles.headerLabel}>LEARNING</Text>
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {isComplete ? (
          <>
            <View style={styles.completeIcon}>
              <Check size={24} color={COLORS.green} />
            </View>
            <Text style={styles.completeText}>{completedCount} captured</Text>
          </>
        ) : completedCount === 0 && nextItemLabel ? (
          <>
            <GraduationCap size={20} color={COLORS.purple} />
            <Text style={styles.nextItemLabel} numberOfLines={2}>
              {nextItemLabel}
            </Text>
            <Text style={styles.itemCountHint}>{totalCount} items</Text>
          </>
        ) : (
          <>
            <View style={styles.countRow}>
              <Text style={styles.countLarge}>{completedCount}</Text>
              <Text style={styles.countSuffix}>/{totalCount}</Text>
            </View>
            {nextItemLabel && (
              <Text style={styles.nextItemLabelSmall} numberOfLines={1}>
                Next: {nextItemLabel}
              </Text>
            )}
            <View style={styles.progressTrack}>
              {progress > 0 && (
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              )}
            </View>
          </>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {isComplete ? 'Tap to review' : completedCount > 0 ? 'Continue' : 'Start'}
      </Text>
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
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  // Not started / In progress
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  countSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: 2,
  },
  // Next item preview
  nextItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
    lineHeight: 17,
  },
  nextItemLabelSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemCountHint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray,
  },
  // Complete state
  completeIcon: {
    marginBottom: 2,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  // Footer
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default LearningCaptureTile;
