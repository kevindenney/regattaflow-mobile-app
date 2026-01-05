/**
 * useCardAnimations Hook
 *
 * Reusable animation primitives for card navigation pager.
 * All animations run on the UI thread via Reanimated worklets.
 */

import { useMemo } from 'react';
import {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';

import {
  CARD_SCALE,
  CARD_OPACITY,
  CARD_ROTATE_Y,
  PRESS_SPRING_CONFIG,
  PRESS_FEEDBACK_DURATION,
  FOCUS_SPRING_CONFIG,
} from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface CardAnimationStyles {
  transform: { scale: number }[] | { rotateY: string }[];
  opacity: number;
}

export interface UseCardPositionAnimationsReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

export interface UsePressAnimationReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  isPressing: SharedValue<boolean>;
  onPressIn: () => void;
  onPressOut: () => void;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for card scale animation based on position relative to center
 *
 * @param position - SharedValue representing card's position relative to center (-1, 0, 1)
 * @returns Animated style with scale transform
 */
export function useCardScaleAnimation(
  position: SharedValue<number>
): UseCardPositionAnimationsReturn {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = interpolate(
      position.value,
      [-1, 0, 1],
      [CARD_SCALE.inactive, CARD_SCALE.active, CARD_SCALE.inactive],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  return { animatedStyle };
}

/**
 * Hook for card opacity animation based on position relative to center
 *
 * @param position - SharedValue representing card's position relative to center (-1, 0, 1)
 * @returns Animated style with opacity
 */
export function useCardOpacityAnimation(
  position: SharedValue<number>
): UseCardPositionAnimationsReturn {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      position.value,
      [-1, 0, 1],
      [CARD_OPACITY.inactive, CARD_OPACITY.active, CARD_OPACITY.inactive],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return { animatedStyle };
}

/**
 * Hook for card Y-axis rotation (3D depth effect)
 *
 * @param position - SharedValue representing card's position relative to center (-1, 0, 1)
 * @returns Animated style with rotateY transform
 */
export function useCardRotateYAnimation(
  position: SharedValue<number>
): UseCardPositionAnimationsReturn {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const rotateY = interpolate(
      position.value,
      [-1, 0, 1],
      [CARD_ROTATE_Y.left, CARD_ROTATE_Y.center, CARD_ROTATE_Y.right],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
    };
  });

  return { animatedStyle };
}

/**
 * Hook for touch press feedback animation
 * Scales card to 0.98 on press with immediate timing,
 * springs back on release
 *
 * @returns Animated style, pressing state, and press handlers
 */
export function usePressAnimation(): UsePressAnimationReturn {
  const isPressing = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = isPressing.value
      ? withTiming(CARD_SCALE.pressed, { duration: PRESS_FEEDBACK_DURATION })
      : withSpring(CARD_SCALE.active, PRESS_SPRING_CONFIG);

    return {
      transform: [{ scale }],
    };
  });

  const onPressIn = () => {
    isPressing.value = true;
  };

  const onPressOut = () => {
    isPressing.value = false;
  };

  return {
    animatedStyle,
    isPressing,
    onPressIn,
    onPressOut,
  };
}

/**
 * Combined hook for all card position-based animations
 * Use this for the full animated card experience
 *
 * @param position - SharedValue representing card's position relative to center (-1, 0, 1)
 * @returns Combined animated style with scale, opacity, and rotation
 */
export function useCardPositionAnimations(
  position: SharedValue<number>
): UseCardPositionAnimationsReturn {
  const animatedStyle = useAnimatedStyle(() => {
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
      transform: [{ perspective: 1000 }, { scale }, { rotateY: `${rotateY}deg` }],
    };
  });

  return { animatedStyle };
}

/**
 * Hook for card expansion animation (when detail stack is revealed)
 *
 * @param expansionProgress - SharedValue (0-1) representing expansion state
 * @returns Animated style for the main card during expansion
 */
export function useCardExpansionAnimation(
  expansionProgress: SharedValue<number>
): UseCardPositionAnimationsReturn {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Scale down as detail cards expand
    const scale = interpolate(
      expansionProgress.value,
      [0, 1],
      [CARD_SCALE.active, CARD_SCALE.expanded],
      Extrapolation.CLAMP
    );

    // Translate up to make room for detail cards
    const translateY = interpolate(
      expansionProgress.value,
      [0, 1],
      [0, -100], // Move up 100px when fully expanded
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return { animatedStyle };
}

/**
 * Creates a derived position value based on scroll offset and card index
 * Position ranges from -1 (left peek) to 0 (center) to 1 (right peek)
 *
 * @param scrollOffset - SharedValue of horizontal scroll position
 * @param cardIndex - Index of the card
 * @param cardWidth - Width of each card including gap
 * @returns SharedValue representing position relative to center
 */
export function useCardPosition(
  scrollOffset: SharedValue<number>,
  cardIndex: number,
  cardWidth: number
): SharedValue<number> {
  const position = useSharedValue(0);

  // This is calculated in the parent and passed down, but we provide
  // a factory function for convenience
  useMemo(() => {
    // Position is calculated in the animated style worklet
    // This hook just provides the shared value
  }, [cardIndex, cardWidth]);

  return position;
}
