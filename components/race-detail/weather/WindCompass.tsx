/**
 * WindCompass Component
 *
 * Visual compass showing wind direction with animated arrow
 */

import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { colors, Typography } from '@/constants/designSystem';

interface WindCompassProps {
  direction: number; // 0-360 degrees (0 = North)
  size?: number;
}

export const WindCompass: React.FC<WindCompassProps> = ({ direction, size = 120 }) => {
  const center = size / 2;
  const radius = size / 2 - 10;

  // Convert direction to cardinal/intercardinal
  const getCardinal = (deg: number): string => {
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return cardinals[index];
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Outer circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border.light}
          strokeWidth={2}
          fill="none"
        />

        {/* Cardinal direction markers */}
        <SvgText x={center} y={15} textAnchor="middle" fontSize="12" fill={colors.text.secondary}>
          N
        </SvgText>
        <SvgText x={size - 10} y={center + 5} textAnchor="middle" fontSize="12" fill={colors.text.tertiary}>
          E
        </SvgText>
        <SvgText x={center} y={size - 5} textAnchor="middle" fontSize="12" fill={colors.text.tertiary}>
          S
        </SvgText>
        <SvgText x={10} y={center + 5} textAnchor="middle" fontSize="12" fill={colors.text.tertiary}>
          W
        </SvgText>

        {/* Tick marks for degrees */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = center + (radius - 8) * Math.sin(rad);
          const y1 = center - (radius - 8) * Math.cos(rad);
          const x2 = center + radius * Math.sin(rad);
          const y2 = center - radius * Math.cos(rad);

          return (
            <Line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={colors.border.medium}
              strokeWidth={2}
            />
          );
        })}

        {/* Wind direction arrow */}
        <Path
          d={`M${center},${center - radius + 15}
              L${center},${center}
              M${center},${center - radius + 15}
              L${center - 6},${center - radius + 25}
              M${center},${center - radius + 15}
              L${center + 6},${center - radius + 25}`}
          stroke={colors.wind}
          strokeWidth={3}
          strokeLinecap="round"
          transform={`rotate(${direction} ${center} ${center})`}
        />
      </Svg>

      {/* Direction label */}
      <RNText style={styles.directionLabel}>{getCardinal(direction)}</RNText>
      <RNText style={styles.degreesLabel}>{direction}°</RNText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionLabel: {
    ...Typography.h2,
    color: colors.wind,
    marginTop: 8,
  },
  degreesLabel: {
    ...Typography.caption,
    color: colors.text.secondary,
  },
});
