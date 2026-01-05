/**
 * NavigationIndicators Component
 *
 * Timeline dots showing current position in pagers (race cards or detail cards).
 * Supports both horizontal (race timeline) and vertical (detail cards) orientations.
 *
 * Features:
 * - Active indicator: elongated pill (24px)
 * - Inactive indicators: circular dots (8px)
 * - Animated transitions between states with spring physics
 * - Horizontal mode: width animation for pill
 * - Vertical mode: height animation for pill
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';

import { INDICATOR, FOCUS_SPRING_CONFIG } from '@/constants/navigationAnimations';
import { TufteTokens } from '@/constants/designSystem';

// =============================================================================
// TYPES
// =============================================================================

export type IndicatorOrientation = 'horizontal' | 'vertical';

export interface NavigationIndicatorsProps {
  /** Total number of indicators to show */
  count: number;
  /** Shared value of the current active index (can be fractional during scroll) */
  activeIndex: SharedValue<number>;
  /** Orientation: horizontal (default) or vertical */
  orientation?: IndicatorOrientation;
  /** Primary color for active indicator */
  activeColor?: string;
  /** Secondary color for inactive indicators */
  inactiveColor?: string;
  /** Test ID for testing */
  testID?: string;
}

interface IndicatorDotProps {
  index: number;
  activeIndex: SharedValue<number>;
  orientation: IndicatorOrientation;
  activeColor: string;
  inactiveColor: string;
}

// =============================================================================
// INDICATOR DOT
// =============================================================================

function IndicatorDot({
  index,
  activeIndex,
  orientation,
  activeColor,
  inactiveColor,
}: IndicatorDotProps) {
  const isVertical = orientation === 'vertical';

  /**
   * Animated style that interpolates between dot and pill
   * based on distance from the active index.
   * - Horizontal: animates width (dot → pill horizontally)
   * - Vertical: animates height (dot → pill vertically)
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Distance from active index (0 = active, 1+ = inactive)
    const distance = Math.abs(index - activeIndex.value);

    // Size interpolation: dot (8px) → pill (24px) when active
    const activeSize = interpolate(
      distance,
      [0, 0.5, 1],
      [INDICATOR.activePillWidth, INDICATOR.dotSize + 4, INDICATOR.dotSize],
      Extrapolation.CLAMP
    );

    // Opacity interpolation for subtle fade
    const opacity = interpolate(
      distance,
      [0, 1, 2],
      [1, 0.6, 0.4],
      Extrapolation.CLAMP
    );

    // Background color based on proximity to active
    const backgroundColor = distance < 0.5 ? activeColor : inactiveColor;

    // Return orientation-specific styles
    if (isVertical) {
      return {
        width: INDICATOR.dotSize,
        height: withSpring(activeSize, FOCUS_SPRING_CONFIG),
        opacity: withSpring(opacity, FOCUS_SPRING_CONFIG),
        backgroundColor,
      };
    }

    return {
      width: withSpring(activeSize, FOCUS_SPRING_CONFIG),
      height: INDICATOR.dotSize,
      opacity: withSpring(opacity, FOCUS_SPRING_CONFIG),
      backgroundColor,
    };
  });

  return (
    <Animated.View
      style={[styles.dot, animatedStyle]}
      accessibilityRole="tab"
      accessibilityState={{ selected: false }} // Will be updated dynamically
    />
  );
}

// =============================================================================
// NAVIGATION INDICATORS
// =============================================================================

export function NavigationIndicators({
  count,
  activeIndex,
  orientation = 'horizontal',
  activeColor = '#2563EB', // blue-600
  inactiveColor = '#D1D5DB', // gray-300
  testID,
}: NavigationIndicatorsProps) {
  const isVertical = orientation === 'vertical';

  // Don't render if only one or no items
  if (count <= 1) {
    return null;
  }

  // Limit indicators for very long lists (show first 5, ..., last)
  const maxIndicators = 7;
  const showEllipsis = count > maxIndicators;
  const visibleIndices = showEllipsis
    ? [...Array(5).keys(), -1, count - 1] // -1 represents ellipsis
    : [...Array(count).keys()];

  // Accessibility label varies by orientation
  const accessibilityLabel = isVertical
    ? `Card ${Math.round(activeIndex.value) + 1} of ${count}`
    : `Race ${Math.round(activeIndex.value) + 1} of ${count}`;

  return (
    <View
      style={[
        styles.container,
        isVertical && styles.containerVertical,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID ?? 'navigation-indicators'}
    >
      {visibleIndices.map((index, i) => {
        // Render ellipsis
        if (index === -1) {
          return (
            <View
              key="ellipsis"
              style={[styles.ellipsis, isVertical && styles.ellipsisVertical]}
            >
              <View style={[styles.ellipsisDot, { backgroundColor: inactiveColor }]} />
              <View style={[styles.ellipsisDot, { backgroundColor: inactiveColor }]} />
              <View style={[styles.ellipsisDot, { backgroundColor: inactiveColor }]} />
            </View>
          );
        }

        return (
          <IndicatorDot
            key={index}
            index={index}
            activeIndex={activeIndex}
            orientation={orientation}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
          />
        );
      })}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Horizontal container (default)
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: INDICATOR.verticalPadding,
    gap: INDICATOR.gap,
  },
  // Vertical container
  containerVertical: {
    flexDirection: 'column',
    paddingVertical: 0,
    paddingHorizontal: INDICATOR.verticalPadding,
  },
  // Base dot style - dimensions are animated
  dot: {
    borderRadius: INDICATOR.dotSize / 2,
    // Width, height, and backgroundColor are animated
  },
  // Horizontal ellipsis
  ellipsis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  // Vertical ellipsis
  ellipsisVertical: {
    flexDirection: 'column',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  ellipsisDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

export default NavigationIndicators;
