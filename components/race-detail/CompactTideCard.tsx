/**
 * CompactTideCard Component
 *
 * Compact tide & current display card inspired by macOS Weather app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherMetricCard } from './WeatherMetricCard';
import { colors, Spacing } from '@/constants/designSystem';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

interface CompactTideCardProps {
  currentSpeed: number; // knots
  currentDirection: number; // 0-360 degrees
  strength?: 'slack' | 'moderate' | 'strong';
  highTide?: { time: string; height: string };
  lowTide?: { time: string; height: string };
}

// Compact current arrow indicator
const CompactCurrentArrow: React.FC<{ direction: number; strength: string; size: number }> = ({
  direction,
  strength,
  size,
}) => {
  const center = size / 2;
  const color =
    strength === 'slack'
      ? colors.neutral[400]
      : strength === 'moderate'
      ? colors.current
      : colors.danger[600];

  // Calculate arrow points
  const arrowLength = size * 0.4;

  // Convert direction to radians (0° = North, clockwise)
  const angle = ((direction - 90) * Math.PI) / 180;

  // Arrow tip point
  const tipX = center + arrowLength * Math.cos(angle);
  const tipY = center + arrowLength * Math.sin(angle);

  // Arrow base points
  const baseAngle1 = angle + (2.5 * Math.PI) / 3;
  const baseAngle2 = angle - (2.5 * Math.PI) / 3;
  const base1X = center + (arrowLength * 0.5) * Math.cos(baseAngle1);
  const base1Y = center + (arrowLength * 0.5) * Math.sin(baseAngle1);
  const base2X = center + (arrowLength * 0.5) * Math.cos(baseAngle2);
  const base2Y = center + (arrowLength * 0.5) * Math.sin(baseAngle2);

  return (
    <Svg width={size} height={size}>
      {/* Outer circle */}
      <Circle
        cx={center}
        cy={center}
        r={center - 4}
        stroke={colors.border.default}
        strokeWidth={1.5}
        fill="none"
        opacity={0.3}
      />

      {/* Current direction arrow */}
      <Polygon
        points={`${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`}
        fill={color}
        opacity={0.9}
      />

      {/* Direction line */}
      <Line
        x1={center}
        y1={center}
        x2={tipX}
        y2={tipY}
        stroke={color}
        strokeWidth={2}
        opacity={0.7}
      />
    </Svg>
  );
};

const getCardinalDirection = (deg: number): string => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return cardinals[index];
};

export const CompactTideCard: React.FC<CompactTideCardProps> = ({
  currentSpeed,
  currentDirection,
  strength = 'moderate',
  highTide,
  lowTide,
}) => {
  const cardinalDir = getCardinalDirection(currentDirection);

  return (
    <WeatherMetricCard
      title="TIDE"
      icon="water-outline"
      backgroundColor={colors.background.card}
    >
      <View style={styles.container}>
        {/* Current arrow */}
        <CompactCurrentArrow direction={currentDirection} strength={strength} size={80} />

        {/* Current speed */}
        <View style={styles.speedContainer}>
          <Text style={styles.speed}>{currentSpeed.toFixed(1)}</Text>
          <Text style={styles.unit}>kn</Text>
        </View>

        {/* Direction */}
        <Text style={styles.direction}>{cardinalDir}</Text>

        {/* Tide times */}
        {(highTide || lowTide) && (
          <View style={styles.tideTimesContainer}>
            {highTide && (
              <View style={styles.tideTime}>
                <Text style={styles.tideLabel}>H</Text>
                <Text style={styles.tideValue}>{highTide.time}</Text>
              </View>
            )}
            {lowTide && (
              <View style={styles.tideTime}>
                <Text style={styles.tideLabel}>L</Text>
                <Text style={styles.tideValue}>{lowTide.time}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </WeatherMetricCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  speed: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  direction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tideTimesContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  tideTime: {
    alignItems: 'center',
    gap: 2,
  },
  tideLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tideValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});
