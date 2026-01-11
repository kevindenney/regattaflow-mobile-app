/**
 * TideTimesDisplay - Tufte-style tide times
 *
 * Shows HW/LW times prominently with heights:
 * HW 14:32 (2.8m)  →  LW 20:45 (0.4m)
 * Turn: 17:38 · Range: 2.4m
 *
 * Edward Tufte principles:
 * - Data-dense layout
 * - Numbers in context
 * - Minimal decoration
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';

export interface TideTime {
  time: string;     // "14:32" format
  height: number;   // meters
}

export interface TideTimesDisplayProps {
  /** High water time and height */
  highTide?: TideTime | null;
  /** Low water time and height */
  lowTide?: TideTime | null;
  /** Time when tide turns (slack water) */
  turnTime?: string | null;
  /** Tidal range in meters */
  range?: number | null;
  /** Current speed if available */
  currentSpeed?: number | null;
  /** Current direction if available */
  currentDirection?: string | null;
  /** Max flood time */
  maxFloodTime?: string | null;
  /** Max ebb time */
  maxEbbTime?: string | null;
  /** Compact mode - single line */
  compact?: boolean;
}

export function TideTimesDisplay({
  highTide,
  lowTide,
  turnTime,
  range,
  currentSpeed,
  currentDirection,
  maxFloodTime,
  maxEbbTime,
  compact = false,
}: TideTimesDisplayProps) {
  const hasData = highTide || lowTide || turnTime || range;

  if (!hasData) return null;

  // Compact single-line display
  if (compact) {
    const parts: string[] = [];
    if (highTide) parts.push(`HW ${highTide.time}`);
    if (lowTide) parts.push(`LW ${lowTide.time}`);
    if (turnTime) parts.push(`Turn ${turnTime}`);

    return (
      <Text style={styles.compactText}>
        {parts.join(' · ')}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Primary row: HW → LW */}
      {(highTide || lowTide) && (
        <View style={styles.primaryRow}>
          {highTide && (
            <View style={styles.tideItem}>
              <Text style={styles.tideLabel}>HW</Text>
              <Text style={styles.tideTime}>{highTide.time}</Text>
              <Text style={styles.tideHeight}>({highTide.height.toFixed(1)}m)</Text>
            </View>
          )}

          {highTide && lowTide && (
            <Text style={styles.arrow}>→</Text>
          )}

          {lowTide && (
            <View style={styles.tideItem}>
              <Text style={styles.tideLabel}>LW</Text>
              <Text style={styles.tideTime}>{lowTide.time}</Text>
              <Text style={styles.tideHeight}>({lowTide.height.toFixed(1)}m)</Text>
            </View>
          )}
        </View>
      )}

      {/* Secondary row: Turn time, range, current */}
      <View style={styles.secondaryRow}>
        {turnTime && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Turn</Text>
            <Text style={styles.infoValue}>{turnTime}</Text>
          </View>
        )}

        {range !== null && range !== undefined && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Range</Text>
            <Text style={styles.infoValue}>{range.toFixed(1)}m</Text>
          </View>
        )}

        {currentSpeed !== null && currentSpeed !== undefined && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current</Text>
            <Text style={styles.infoValue}>
              {currentSpeed.toFixed(1)}kt {currentDirection || ''}
            </Text>
          </View>
        )}
      </View>

      {/* Current timing row */}
      {(maxFloodTime || maxEbbTime) && (
        <View style={styles.currentTimingRow}>
          {maxFloodTime && (
            <Text style={styles.currentTiming}>
              Max flood {maxFloodTime}
            </Text>
          )}
          {maxFloodTime && maxEbbTime && (
            <Text style={styles.dotSeparator}>·</Text>
          )}
          {maxEbbTime && (
            <Text style={styles.currentTiming}>
              Max ebb {maxEbbTime}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tideItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tideLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.teal,
    textTransform: 'uppercase',
  },
  tideTime: {
    fontSize: 15,
    fontWeight: '700',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  tideHeight: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    marginHorizontal: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  currentTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentTiming: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  dotSeparator: {
    fontSize: 12,
    color: IOS_COLORS.gray3,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
});

export default TideTimesDisplay;
