/**
 * CompetencyProgressRing Component
 *
 * Reusable circular progress indicator for competency completion.
 * Renders a dual-segment SVG ring:
 *   - Practicing segment (amber) for in-progress competencies
 *   - Completed segment (accent color) for validated/competent
 *
 * Uses react-native-svg for rendering and the Animated API
 * for mount animations.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Animated Circle
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompetencyProgressRingProps {
  total: number;
  completed: number;
  practicing?: number;
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  showLabel?: boolean;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SIZE = 120;
const DEFAULT_STROKE = 10;
const DEFAULT_ACCENT = '#0097A7';
const PRACTICING_COLOR = '#B45309';
const PRACTICING_OPACITY = 0.3;
const TRACK_COLOR = '#E5E7EB';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CompetencyProgressRing({
  total,
  completed,
  practicing = 0,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE,
  accentColor = DEFAULT_ACCENT,
  showLabel = true,
  animated = true,
}: CompetencyProgressRingProps) {
  // Ring geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Percentages (clamp to prevent overflow)
  const completedFraction = total > 0 ? Math.min(completed / total, 1) : 0;
  const practicingFraction = total > 0 ? Math.min(practicing / total, 1 - completedFraction) : 0;
  const displayPercent = Math.round(completedFraction * 100);

  // Offsets
  const completedOffset = circumference * (1 - completedFraction);
  const practicingOffset = circumference * (1 - practicingFraction);

  // The practicing segment starts where the completed segment ends.
  // Rotation for practicing segment: completed arc in degrees.
  const practicingRotation = completedFraction * 360;

  // Animation
  const animProgress = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      animProgress.setValue(0);
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start();
    }
  }, [completed, practicing, total, animated]);

  // Animated dash offsets
  const animatedCompletedOffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, completedOffset],
  });

  const animatedPracticingOffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, practicingOffset],
  });

  // Animated rotation for practicing segment (starts after completed arc)
  const animatedPracticingRotation = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${practicingRotation}deg`],
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Practicing segment (amber, behind completed) */}
        {practicingFraction > 0 && (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={PRACTICING_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            opacity={PRACTICING_OPACITY}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={animatedPracticingOffset}
            transform={`rotate(-90, ${center}, ${center})`}
            rotation={practicingRotation}
            origin={`${center}, ${center}`}
          />
        )}

        {/* Completed segment (accent color, on top) */}
        {completedFraction > 0 && (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={animatedCompletedOffset}
            transform={`rotate(-90, ${center}, ${center})`}
          />
        )}
      </Svg>

      {/* Center label */}
      {showLabel && (
        <View style={styles.centerContainer}>
          <Text style={[styles.percentText, { fontSize: size / 3.5 }]}>
            {displayPercent}
            <Text style={[styles.percentSymbol, { fontSize: size / 7 }]}>%</Text>
          </Text>
          <Text style={[styles.completeLabel, { fontSize: size / 10 }]}>
            Complete
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Compact Variant
// ---------------------------------------------------------------------------

/**
 * Small inline progress ring for list items and card headers.
 */
export function CompetencyProgressRingCompact({
  total,
  completed,
  practicing,
  accentColor = DEFAULT_ACCENT,
}: {
  total: number;
  completed: number;
  practicing?: number;
  accentColor?: string;
}) {
  return (
    <CompetencyProgressRing
      total={total}
      completed={completed}
      practicing={practicing}
      size={44}
      strokeWidth={5}
      accentColor={accentColor}
      showLabel={false}
      animated={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  percentSymbol: {
    fontWeight: '600',
    color: '#9CA3AF',
  },
  completeLabel: {
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: -2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default CompetencyProgressRing;
