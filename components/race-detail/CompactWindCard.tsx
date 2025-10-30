/**
 * CompactWindCard Component
 *
 * Compact wind display card inspired by macOS Weather app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherMetricCard } from './WeatherMetricCard';
import { colors, Spacing } from '@/constants/designSystem';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

interface CompactWindCardProps {
  speed: number; // knots
  direction: number; // 0-360 degrees
  gusts?: number; // knots
}

// Compact wind compass with arrow
const CompactWindCompass: React.FC<{ direction: number; size: number }> = ({
  direction,
  size,
}) => {
  const center = size / 2;
  const radius = size / 2 - 4;

  // Calculate arrow points
  const arrowLength = radius * 0.7;
  const arrowWidth = 8;

  // Convert direction to radians (0° = North, clockwise)
  const angle = ((direction - 90) * Math.PI) / 180;

  // Arrow tip point
  const tipX = center + arrowLength * Math.cos(angle);
  const tipY = center + arrowLength * Math.sin(angle);

  // Arrow base points
  const baseAngle1 = angle + (2.5 * Math.PI) / 3;
  const baseAngle2 = angle - (2.5 * Math.PI) / 3;
  const base1X = center + (arrowLength * 0.4) * Math.cos(baseAngle1);
  const base1Y = center + (arrowLength * 0.4) * Math.sin(baseAngle1);
  const base2X = center + (arrowLength * 0.4) * Math.cos(baseAngle2);
  const base2Y = center + (arrowLength * 0.4) * Math.sin(baseAngle2);

  return (
    <Svg width={size} height={size}>
      {/* Outer circle */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.border.default}
        strokeWidth={1.5}
        fill="none"
        opacity={0.3}
      />

      {/* Cardinal direction markers */}
      {[0, 90, 180, 270].map((deg, i) => {
        const markAngle = ((deg - 90) * Math.PI) / 180;
        const x1 = center + (radius - 8) * Math.cos(markAngle);
        const y1 = center + (radius - 8) * Math.sin(markAngle);
        const x2 = center + radius * Math.cos(markAngle);
        const y2 = center + radius * Math.sin(markAngle);

        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colors.border.default}
            strokeWidth={2}
            opacity={0.5}
          />
        );
      })}

      {/* Wind direction arrow */}
      <Polygon
        points={`${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`}
        fill={colors.wind}
        opacity={0.9}
      />
    </Svg>
  );
};

const getCardinalDirection = (deg: number): string => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return cardinals[index];
};

export const CompactWindCard: React.FC<CompactWindCardProps> = ({
  speed,
  direction,
  gusts,
}) => {
  const cardinalDir = getCardinalDirection(direction);

  return (
    <WeatherMetricCard
      title="WIND"
      icon="cloudy-outline"
      backgroundColor={colors.background.card}
    >
      <View style={styles.container}>
        {/* Wind compass */}
        <View style={styles.compassContainer}>
          <CompactWindCompass direction={direction} size={100} />

          {/* Cardinal direction label overlay */}
          <View style={styles.directionOverlay}>
            <Text style={styles.cardinalLabel}>{cardinalDir}</Text>
          </View>
        </View>

        {/* Wind speed */}
        <View style={styles.speedContainer}>
          <Text style={styles.speed}>{speed}</Text>
          <Text style={styles.unit}>kn</Text>
        </View>

        {/* Gusts */}
        {gusts && gusts > speed && (
          <Text style={styles.gusts}>Gusts: {gusts} kn {cardinalDir}</Text>
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
  compassContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
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
  gusts: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
