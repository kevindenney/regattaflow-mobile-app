/**
 * CompactWaveCard Component
 *
 * Compact wave conditions display card inspired by macOS Weather app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherMetricCard } from './WeatherMetricCard';
import { colors, Spacing } from '@/constants/designSystem';
import Svg, { Path } from 'react-native-svg';

interface CompactWaveCardProps {
  height: number; // meters
  period?: number; // seconds
  direction?: number; // 0-360 degrees
}

// Wave illustration
const WaveIllustration: React.FC<{ height: number; size: number }> = ({ height, size }) => {
  const waveColor = height < 0.5 ? colors.info[400] : height < 1.5 ? colors.info[600] : colors.danger[600];

  // Create a smooth wave path
  const waveHeight = Math.min(height * 15, size * 0.3);
  const centerY = size / 2;

  // Multiple wave layers for visual depth
  const waves = [
    { offset: 0, opacity: 0.8, height: waveHeight },
    { offset: size * 0.15, opacity: 0.5, height: waveHeight * 0.7 },
    { offset: size * 0.25, opacity: 0.3, height: waveHeight * 0.5 },
  ];

  return (
    <Svg width={size} height={size}>
      {waves.map((wave, index) => {
        const amplitude = wave.height;
        const frequency = 2; // 2 complete waves
        const yBase = centerY + wave.offset;

        // Create smooth sine wave using quadratic bezier curves
        const pathData = `
          M 0,${yBase}
          Q ${size * 0.125},${yBase - amplitude} ${size * 0.25},${yBase}
          T ${size * 0.5},${yBase}
          T ${size * 0.75},${yBase}
          T ${size},${yBase}
        `;

        return (
          <Path
            key={index}
            d={pathData}
            stroke={waveColor}
            strokeWidth={2.5}
            fill="none"
            opacity={wave.opacity}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
};

const getCardinalDirection = (deg: number): string => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return cardinals[index];
};

const getWaveDescription = (height: number): string => {
  if (height < 0.3) return 'Calm';
  if (height < 0.6) return 'Slight';
  if (height < 1.0) return 'Moderate';
  if (height < 2.0) return 'Rough';
  if (height < 3.0) return 'Very Rough';
  return 'High';
};

export const CompactWaveCard: React.FC<CompactWaveCardProps> = ({
  height,
  period,
  direction,
}) => {
  const waveDesc = getWaveDescription(height);
  const cardinalDir = direction ? getCardinalDirection(direction) : null;

  return (
    <WeatherMetricCard
      title="WAVES"
      icon="water-outline"
      backgroundColor={colors.background.card}
    >
      <View style={styles.container}>
        {/* Wave illustration */}
        <WaveIllustration height={height} size={80} />

        {/* Wave height */}
        <View style={styles.heightContainer}>
          <Text style={styles.height}>{height.toFixed(1)}</Text>
          <Text style={styles.unit}>m</Text>
        </View>

        {/* Wave description */}
        <Text style={styles.description}>{waveDesc}</Text>

        {/* Period and direction */}
        <View style={styles.detailsContainer}>
          {period && (
            <Text style={styles.detail}>Period: {period}s</Text>
          )}
          {cardinalDir && (
            <Text style={styles.detail}>from {cardinalDir}</Text>
          )}
        </View>
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
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  height: {
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
  description: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  detailsContainer: {
    alignItems: 'center',
    gap: 2,
    marginTop: Spacing.xs,
  },
  detail: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});
