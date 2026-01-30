/**
 * ProgressRing - Circular SVG progress indicator for course completion
 *
 * Two size variants:
 * - 20px (course rows): compact inline indicator
 * - 40px with label (banner): prominent progress display
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { IOS_COLORS } from '@/components/cards/constants';

interface ProgressRingProps {
  /** Completion progress from 0 to 100 */
  progress: number;
  /** Ring size in points (diameter) */
  size?: number;
  /** Stroke width for the ring */
  strokeWidth?: number;
  /** Whether to show the percentage label inside */
  showLabel?: boolean;
  /** Ring color */
  color?: string;
}

export function ProgressRing({
  progress,
  size = 20,
  strokeWidth = 2.5,
  showLabel = false,
  color = '#007AFF',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={IOS_COLORS.gray5}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        {clamped > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
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
                fontSize: size <= 24 ? 7 : size <= 32 ? 9 : 11,
                color: clamped > 0 ? color : IOS_COLORS.gray,
              },
            ]}
            numberOfLines={1}
          >
            {Math.round(clamped)}%
          </Text>
        </View>
      )}
    </View>
  );
}

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
