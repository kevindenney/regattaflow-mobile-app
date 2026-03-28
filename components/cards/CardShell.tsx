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

/**
 * Past race cards use white background (same as active cards) for clear contrast
 * against the #F2F2F7 page background. A subtle opacity reduction distinguishes
 * them from current/future cards.
 */
const PAST_CARD_BG = '#FFFFFF';
const PAST_CARD_OPACITY = 0.85;

/** Subtle green left-border accent for the next upcoming race */
const NEXT_RACE_BORDER_WIDTH = 3;
const NEXT_RACE_BORDER_COLOR = IOS_COLORS.green; // #34C759

export function CardShell({
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
      isNextRace && styles.nextRaceCard,
      isLastDone && styles.lastDoneCard,
    ]}
      testID={testID}
    >
      {/* NOW bar on the left edge of the next step card */}
      {isNextRace && (
        <>
          <View style={styles.nowBarStripe} />
          <View style={styles.nowLabel}>
            <Text style={styles.nowLabelText}>NOW</Text>
          </View>
        </>
      )}
      {isLastDone && relativeX !== gridState.currentRaceIndex.value ? (
        <View style={styles.lastDoneBadge}>
          <Text style={styles.lastDoneBadgeText}>LAST DONE</Text>
        </View>
      ) : null}
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
  nextRaceBorder: {
    borderLeftWidth: NEXT_RACE_BORDER_WIDTH,
    borderLeftColor: NEXT_RACE_BORDER_COLOR,
  },
  nextRaceCard: {
    borderWidth: 2,
    borderColor: 'rgba(52, 199, 89, 0.65)',
  },
  nowBarStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: IOS_COLORS.green,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    zIndex: 12,
  },
  nowLabel: {
    position: 'absolute',
    top: -12,
    left: -4,
    zIndex: 13,
    backgroundColor: IOS_COLORS.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nowLabelText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  lastDoneCard: {
    borderWidth: 2,
    borderColor: 'rgba(107, 114, 128, 0.55)',
  },
  nextRaceBadge: {
    position: 'absolute',
    top: 8,
    right: 44,
    zIndex: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nextRaceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: IOS_COLORS.green,
  },
  lastDoneBadge: {
    position: 'absolute',
    top: 8,
    right: 44,
    zIndex: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lastDoneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#4B5563',
  },
});

export default CardShell;
