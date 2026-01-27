/**
 * RaceCardActionBar - iOS HIG Style
 *
 * Bottom action bar for RaceCard with:
 * - Context-aware primary action button
 * - Secondary icon buttons (weather, checklist, share)
 * - Haptic feedback on button press
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SharedValue,
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

type RaceStatus = 'past' | 'next' | 'future';

interface RaceCardActionBarProps {
  /** Race status for context-aware actions */
  raceStatus: RaceStatus;
  /** Days until race (or days since if past) */
  daysUntil: number;
  /** Handler for primary action */
  onPrimaryAction?: () => void;
  /** Handler for weather action */
  onWeatherPress?: () => void;
  /** Handler for checklist action */
  onChecklistPress?: () => void;
  /** Handler for share action */
  onSharePress?: () => void;
  /** Whether the race is expanded/selected */
  isExpanded?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Get context-aware primary action based on race status
 */
function getPrimaryAction(raceStatus: RaceStatus, daysUntil: number): {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
} {
  if (raceStatus === 'past') {
    return {
      label: 'View Results',
      icon: 'trophy-outline',
      color: IOS_COLORS.systemOrange,
    };
  }

  if (daysUntil === 0) {
    return {
      label: 'Race Day',
      icon: 'flag-outline',
      color: IOS_COLORS.systemRed,
    };
  }

  if (daysUntil === 1) {
    return {
      label: 'Final Prep',
      icon: 'checkmark-circle-outline',
      color: IOS_COLORS.systemOrange,
    };
  }

  if (daysUntil <= 3) {
    return {
      label: 'View Forecast',
      icon: 'cloud-outline',
      color: IOS_COLORS.systemBlue,
    };
  }

  return {
    label: 'Start Planning',
    icon: 'calendar-outline',
    color: IOS_COLORS.systemGreen,
  };
}

export function RaceCardActionBar({
  raceStatus,
  daysUntil,
  onPrimaryAction,
  onWeatherPress,
  onChecklistPress,
  onSharePress,
  isExpanded = false,
}: RaceCardActionBarProps) {
  const primaryButtonScale = useSharedValue(1);
  const weatherButtonScale = useSharedValue(1);
  const checklistButtonScale = useSharedValue(1);
  const shareButtonScale = useSharedValue(1);

  const primaryAction = getPrimaryAction(raceStatus, daysUntil);

  const handlePrimaryPress = () => {
    triggerHaptic('impactMedium');
    onPrimaryAction?.();
  };

  const handleSecondaryPress = (action: (() => void) | undefined) => {
    triggerHaptic('impactLight');
    action?.();
  };

  // Animated styles
  const primaryButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryButtonScale.value }],
  }));

  const weatherButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: weatherButtonScale.value }],
  }));

  const checklistButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checklistButtonScale.value }],
  }));

  const shareButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareButtonScale.value }],
  }));

  // Don't show action bar in expanded mode (actions move to content area)
  if (isExpanded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Secondary Actions (left side) */}
      <View style={styles.secondaryActions}>
        {/* Weather Button */}
        {onWeatherPress && (
          <AnimatedPressable
            style={[styles.secondaryButton, weatherButtonStyle]}
            onPress={() => handleSecondaryPress(onWeatherPress)}
            onPressIn={() => {
              weatherButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
            }}
            onPressOut={() => {
              weatherButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
            }}
            accessibilityLabel="View weather"
            accessibilityRole="button"
          >
            <Ionicons name="partly-sunny-outline" size={22} color={IOS_COLORS.systemBlue} />
          </AnimatedPressable>
        )}

        {/* Checklist Button */}
        {onChecklistPress && (
          <AnimatedPressable
            style={[styles.secondaryButton, checklistButtonStyle]}
            onPress={() => handleSecondaryPress(onChecklistPress)}
            onPressIn={() => {
              checklistButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
            }}
            onPressOut={() => {
              checklistButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
            }}
            accessibilityLabel="View checklist"
            accessibilityRole="button"
          >
            <Ionicons name="checkbox-outline" size={22} color={IOS_COLORS.systemGreen} />
          </AnimatedPressable>
        )}

        {/* Share Button */}
        {onSharePress && (
          <AnimatedPressable
            style={[styles.secondaryButton, shareButtonStyle]}
            onPress={() => handleSecondaryPress(onSharePress)}
            onPressIn={() => {
              shareButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
            }}
            onPressOut={() => {
              shareButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
            }}
            accessibilityLabel="Share race"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={22} color={IOS_COLORS.systemPurple} />
          </AnimatedPressable>
        )}
      </View>

      {/* Primary Action Button (right side) */}
      {onPrimaryAction && (
        <AnimatedPressable
          style={[
            styles.primaryButton,
            { backgroundColor: primaryAction.color },
            primaryButtonStyle,
          ]}
          onPress={handlePrimaryPress}
          onPressIn={() => {
            primaryButtonScale.value = withSpring(0.95, IOS_ANIMATIONS.spring.stiff);
          }}
          onPressOut={() => {
            primaryButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
          }}
          accessibilityLabel={primaryAction.label}
          accessibilityRole="button"
        >
          <Ionicons name={primaryAction.icon} size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: IOS_SPACING.md,
    marginTop: IOS_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  secondaryButton: {
    width: 40,
    height: 40,
    borderRadius: IOS_RADIUS.md,
    backgroundColor: IOS_COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.sm + 2,
    paddingHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
  },
  primaryButtonText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RaceCardActionBar;
