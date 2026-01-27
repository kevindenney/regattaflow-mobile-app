/**
 * PrepProgressRing - Circular SVG progress indicator
 *
 * Shows overall prep completion (0-100%) as a circular ring.
 * Color: green (on track), orange (behind), gray (not started)
 * Uses REGATTA_SEMANTIC_COLORS for checklist status.
 */

import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  IOS_COLORS,
  REGATTA_SEMANTIC_COLORS,
  IOS_TYPOGRAPHY,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface PrepProgressRingProps {
  /** Completion progress from 0 to 1 */
  progress: number;
  /** Ring size in points (diameter) */
  size?: number;
  /** Stroke width for the ring */
  strokeWidth?: number;
  /** Whether to show the percentage label inside */
  showLabel?: boolean;
  /** Optional override color — otherwise auto from progress */
  color?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getProgressColor(progress: number): string {
  if (progress <= 0) return REGATTA_SEMANTIC_COLORS.checklistNotStarted;
  if (progress < 0.5) return REGATTA_SEMANTIC_COLORS.checklistPending;
  return REGATTA_SEMANTIC_COLORS.checklistComplete;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PrepProgressRing({
  progress,
  size = 36,
  strokeWidth = 3,
  showLabel = true,
  color,
}: PrepProgressRingProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const ringColor = color || getProgressColor(clampedProgress);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  const percentText = `${Math.round(clampedProgress * 100)}`;

  // Web fallback: SVG from react-native-svg works on web via
  // the react-native-web + react-native-svg-web bridge.
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={IOS_COLORS.systemGray5}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        {clampedProgress > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                fontSize: size <= 28 ? 8 : size <= 36 ? 10 : 12,
                color: clampedProgress > 0 ? ringColor : IOS_COLORS.systemGray,
              },
            ]}
            numberOfLines={1}
          >
            {percentText}
          </Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
