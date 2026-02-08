/**
 * FleetPositionBar - Apple Weather-inspired fleet position indicator
 *
 * Horizontal bar showing relative position within the fleet:
 * - Background track in systemGray5
 * - Filled portion proportional to (fleetSize - position + 1) / fleetSize
 * - Color: green (top 33%), orange (middle 33%), red (bottom 33%)
 * - Optional percentile label
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const COLORS = {
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray5: '#E5E5EA',
  gray: '#8E8E93',
};

interface FleetPositionBarProps {
  position: number;
  fleetSize: number;
  height?: number;
  showLabel?: boolean;
  disabled?: boolean;
}

function getBarColor(position: number, fleetSize: number): string {
  if (fleetSize <= 0) return COLORS.gray5;
  const percentile = (fleetSize - position + 1) / fleetSize;
  if (percentile >= 0.67) return COLORS.green;
  if (percentile >= 0.34) return COLORS.orange;
  return COLORS.red;
}

function getPercentileLabel(position: number, fleetSize: number): string {
  if (fleetSize <= 0) return '';
  const percentile = Math.round(((position - 1) / fleetSize) * 100);
  if (percentile <= 10) return 'Top 10%';
  if (percentile <= 25) return 'Top 25%';
  if (percentile <= 50) return 'Top half';
  return `Top ${100 - Math.round(((fleetSize - position) / fleetSize) * 100)}%`;
}

export function FleetPositionBar({
  position,
  fleetSize,
  height = 6,
  showLabel = false,
  disabled = false,
}: FleetPositionBarProps) {
  const fillRatio = fleetSize > 0 ? (fleetSize - position + 1) / fleetSize : 0;
  const fillPercent = Math.max(0, Math.min(100, fillRatio * 100));
  const barColor = disabled ? COLORS.gray5 : getBarColor(position, fleetSize);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${fillPercent}%`,
              backgroundColor: barColor,
              height,
            },
          ]}
        />
      </View>
      {showLabel && !disabled && fleetSize > 0 && (
        <Text style={styles.label}>{getPercentileLabel(position, fleetSize)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  track: {
    backgroundColor: COLORS.gray5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray,
  },
});

export default FleetPositionBar;
