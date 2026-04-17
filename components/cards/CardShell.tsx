/**
 * CardShell - Universal Card Container
 *
 * Simplified architecture:
 * - iOS system colors and shadows
 * - 16px border radius (SF Symbols style)
 * - Horizontal position-based scale/opacity/rotation animations
 * - Full height card (fills available space)
 */

import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';

import { CardShellProps } from './types';
import {
  CARD_SHADOW_DRAMATIC,
  CARD_SHADOW_DRAMATIC_WEB,
  CARD_SCALE,
  CARD_OPACITY,
  CARD_ROTATE_Y,
  IOS_COLORS,
} from './constants';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Past race cards use white background (same as active cards) for clear contrast
 * against the #F2F2F7 page background. A subtle opacity reduction distinguishes
 * them from current/future cards.
 */
const PAST_CARD_BG = '#FFFFFF';
const PAST_CARD_OPACITY = 0.85;

function CardShellImpl({
  position,
  dimensions,
  gridState,
  children,
  style,
  testID,
  isNextRace = false,
  isLastDone = false,
  isPast = false,
  isDeleting = false,
  onCancelDelete,
}: CardShellProps) {
  const relativeX = position.x;
  const reducedMotion = useReducedMotion();

  /**
   * Animated style for horizontal position
   * Applies scale, opacity, and rotation based on distance from active card
   * Respects reduced-motion preference: skips scale/rotation, keeps opacity
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const currentX = gridState.currentRaceIndex.value;
    const distanceX = relativeX - currentX;
    const absDistanceX = Math.abs(distanceX);

    // Performance: hide cards that are too far
    if (absDistanceX > 1.5) {
      return {
        opacity: 0,
        transform: [{ scale: CARD_SCALE.inactive }],
      };
    }

    // Opacity based on horizontal distance
    const opacity = interpolate(
      absDistanceX,
      [0, 1],
      [CARD_OPACITY.active, CARD_OPACITY.inactive],
      Extrapolation.CLAMP
    );

    // Skip scale and rotation when reduced motion is preferred
    if (reducedMotion) {
      return { opacity, transform: [{ scale: 1 }] };
    }

    // Scale based on horizontal distance
    const scale = interpolate(
      absDistanceX,
      [0, 1],
      [CARD_SCALE.active, CARD_SCALE.inactive],
      Extrapolation.CLAMP
    );

    // Subtle rotation for 3D depth effect
    const rotateY = interpolate(
      distanceX,
      [-1, 0, 1],
      [CARD_ROTATE_Y.left, CARD_ROTATE_Y.center, CARD_ROTATE_Y.right],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { scale },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
    };
  }, [relativeX, reducedMotion]);

  // Static styles based on dimensions
  const cardStyle: ViewStyle = useMemo(
    () => ({
      width: dimensions.cardWidth,
      height: dimensions.cardHeight,
      borderRadius: dimensions.borderRadius,
      backgroundColor: IOS_COLORS.systemBackground,
    }),
    [dimensions.cardWidth, dimensions.cardHeight, dimensions.borderRadius]
  );

  return (
    <Animated.View
      style={[
        styles.card,
        cardStyle,
        Platform.OS !== 'web' && CARD_SHADOW_DRAMATIC,
        animatedStyle,
      style,
      // Status badges moved inside card header (RaceSummaryCard)
    ]}
      testID={testID}
    >
      {children}
      {isDeleting && (
        <View style={styles.deletingOverlay} pointerEvents="box-only">
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.deletingText}>Deleting...</Text>
          {onCancelDelete && (
            <Pressable
              onPress={onCancelDelete}
              style={styles.cancelDeleteButton}
              hitSlop={12}
            >
              <Text style={styles.cancelDeleteText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    // Web shadow
    ...Platform.select({
      web: {
        boxShadow: CARD_SHADOW_DRAMATIC_WEB,
      },
    }),
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  deletingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    letterSpacing: -0.2,
  },
  cancelDeleteButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  cancelDeleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
});

// Memoize so parent re-renders don't cascade into every card's animated wrapper.
// Props are either primitives or stable (position/gridState = shared-value refs,
// dimensions = memoized in parent, children = stable JSX per card).
export const CardShell = React.memo(CardShellImpl);

export default CardShell;
