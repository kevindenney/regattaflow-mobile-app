/**
 * AnimatedRaceCard Component
 *
 * Wrapper component that applies pager animations to any race card variant.
 * Handles:
 * - Scale interpolation (0.92 inactive → 1.0 active)
 * - Opacity interpolation (0.7 inactive → 1.0 active)
 * - Subtle Y-axis rotation for 3D depth effect
 * - Touch press feedback (scale to 0.98)
 */

import React, { ReactNode, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';

import {
  CARD_SCALE,
  CARD_OPACITY,
  CARD_ROTATE_Y,
  PRESS_SPRING_CONFIG,
  PRESS_FEEDBACK_DURATION,
} from '@/constants/navigationAnimations';
import { usePressAnimation } from '@/hooks/useCardAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface AnimatedRaceCardProps {
  /** The race card to render inside the wrapper */
  children: ReactNode;
  /** Shared value representing card's position relative to center (-1 to 1) */
  position: SharedValue<number>;
  /** Card index for accessibility */
  index: number;
  /** Total number of cards for accessibility */
  totalCards: number;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Callback when card is long pressed */
  onLongPress?: () => void;
  /** Whether this card is the currently active/selected one */
  isActive?: boolean;
  /** Additional styles to apply to the container */
  style?: ViewStyle;
  /** Width of the card (required for proper sizing) */
  cardWidth: number;
  /** Disable press animations (useful during scroll) */
  disablePressAnimation?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedRaceCard({
  children,
  position,
  index,
  totalCards,
  onPress,
  onLongPress,
  isActive,
  style,
  cardWidth,
  disablePressAnimation = false,
  testID,
}: AnimatedRaceCardProps) {
  // Press animation state
  const { isPressing, onPressIn, onPressOut } = usePressAnimation();

  /**
   * Combined animated style for position-based animations
   * Runs entirely on UI thread
   */
  const positionAnimatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Scale based on distance from center
    const scale = interpolate(
      position.value,
      [-1, 0, 1],
      [CARD_SCALE.inactive, CARD_SCALE.active, CARD_SCALE.inactive],
      Extrapolation.CLAMP
    );

    // Opacity fades for peek cards
    const opacity = interpolate(
      position.value,
      [-1, 0, 1],
      [CARD_OPACITY.inactive, CARD_OPACITY.active, CARD_OPACITY.inactive],
      Extrapolation.CLAMP
    );

    // Subtle 3D rotation for depth
    const rotateY = interpolate(
      position.value,
      [-1, 0, 1],
      [CARD_ROTATE_Y.left, CARD_ROTATE_Y.center, CARD_ROTATE_Y.right],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  /**
   * Press feedback animation style
   * Separate from position animations for composition
   */
  const pressAnimatedStyle = useAnimatedStyle(() => {
    'worklet';

    if (disablePressAnimation) {
      return { transform: [{ scale: 1 }] };
    }

    const pressScale = isPressing.value
      ? withTiming(CARD_SCALE.pressed, { duration: PRESS_FEEDBACK_DURATION })
      : withSpring(1, PRESS_SPRING_CONFIG);

    return {
      transform: [{ scale: pressScale }],
    };
  });

  /**
   * Handle press in - trigger scale down
   */
  const handlePressIn = useCallback(() => {
    if (!disablePressAnimation) {
      onPressIn();
    }
  }, [disablePressAnimation, onPressIn]);

  /**
   * Handle press out - spring back
   */
  const handlePressOut = useCallback(() => {
    if (!disablePressAnimation) {
      onPressOut();
    }
  }, [disablePressAnimation, onPressOut]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // On Android, delay press recognition to allow scroll gestures to be detected first
      delayPressIn={Platform.OS === 'android' ? 100 : 0}
      style={[
        styles.container,
        { width: cardWidth },
        positionAnimatedStyle,
        pressAnimatedStyle,
        style,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Race ${index + 1} of ${totalCards}`}
      accessibilityState={{
        selected: isActive,
      }}
      accessibilityHint={onPress ? 'Double tap to view race details' : undefined}
      testID={testID ?? `animated-race-card-${index}`}
    >
      {children}
    </AnimatedPressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    // Card will fill this container
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});

export default AnimatedRaceCard;
