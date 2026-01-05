/**
 * NavigationIndicators Component
 *
 * Timeline dots showing current position in the race card pager.
 * - Active indicator: elongated pill (24px wide)
 * - Inactive indicators: circular dots (8px)
 * - Animated transitions between states
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

export interface NavigationIndicatorsProps {
  /** Total number of indicators to show */
  count: number;
  /** Shared value of the current active index (can be fractional during scroll) */
  activeIndex: SharedValue<number>;
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
  activeColor: string;
  inactiveColor: string;
}

// =============================================================================
// INDICATOR DOT
// =============================================================================

function IndicatorDot({
  index,
  activeIndex,
  activeColor,
  inactiveColor,
}: IndicatorDotProps) {
  /**
   * Animated style that interpolates between dot and pill
   * based on distance from the active index
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Distance from active index (0 = active, 1+ = inactive)
    const distance = Math.abs(index - activeIndex.value);

    // Width interpolation: dot (8px) → pill (24px) when active
    const width = interpolate(
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

    // Background color interpolation
    // Note: Color interpolation in worklet requires numeric values
    // We'll use opacity instead for performance

    return {
      width: withSpring(width, FOCUS_SPRING_CONFIG),
      opacity: withSpring(opacity, FOCUS_SPRING_CONFIG),
      backgroundColor: distance < 0.5 ? activeColor : inactiveColor,
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
  activeColor = '#2563EB', // blue-600
  inactiveColor = '#D1D5DB', // gray-300
  testID,
}: NavigationIndicatorsProps) {
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

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel={`Race ${Math.round(activeIndex.value) + 1} of ${count}`}
      testID={testID ?? 'navigation-indicators'}
    >
      {visibleIndices.map((index, i) => {
        // Render ellipsis
        if (index === -1) {
          return (
            <View key="ellipsis" style={styles.ellipsis}>
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
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: INDICATOR.verticalPadding,
    gap: INDICATOR.gap,
  },
  dot: {
    height: INDICATOR.dotSize,
    borderRadius: INDICATOR.dotSize / 2,
    // Width and backgroundColor are animated
  },
  ellipsis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  ellipsisDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

export default NavigationIndicators;
