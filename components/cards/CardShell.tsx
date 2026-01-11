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
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
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

// Subtle green tint for next race card (noticeable but not distracting)
const NEXT_RACE_BACKGROUND = '#F0FDF4'; // Light green-50 tint

export function CardShell({
  position,
  dimensions,
  gridState,
  children,
  style,
  testID,
  isNextRace = false,
  isDeleting = false,
}: CardShellProps) {
  const relativeX = position.x;

  /**
   * Animated style for horizontal position
   * Applies scale, opacity, and rotation based on distance from active card
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

    // Scale based on horizontal distance
    const scale = interpolate(
      absDistanceX,
      [0, 1],
      [CARD_SCALE.active, CARD_SCALE.inactive],
      Extrapolation.CLAMP
    );

    // Opacity based on horizontal distance
    const opacity = interpolate(
      absDistanceX,
      [0, 1],
      [CARD_OPACITY.active, CARD_OPACITY.inactive],
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
  }, [relativeX]);

  // Static styles based on dimensions
  const cardStyle: ViewStyle = useMemo(
    () => ({
      width: dimensions.cardWidth,
      height: dimensions.cardHeight,
      borderRadius: dimensions.borderRadius,
      backgroundColor: isNextRace ? NEXT_RACE_BACKGROUND : IOS_COLORS.systemBackground,
    }),
    [dimensions.cardWidth, dimensions.cardHeight, dimensions.borderRadius, isNextRace]
  );

  return (
    <Animated.View
      style={[
        styles.card,
        cardStyle,
        Platform.OS !== 'web' && CARD_SHADOW_DRAMATIC,
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      {children}
      {isDeleting && (
        <View style={styles.deletingOverlay} pointerEvents="box-only">
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.deletingText}>Deleting...</Text>
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
});

export default CardShell;
