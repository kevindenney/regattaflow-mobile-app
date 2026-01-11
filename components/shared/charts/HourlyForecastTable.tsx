/**
 * HourlyForecastTable - Tufte-style time-series display
 *
 * Combines sparkline with time/value table below:
 * - Sparkline for visual trend (glanceable)
 * - Time axis row
 * - Values row with "now" indicator
 *
 * Edward Tufte principles:
 * - Maximum data-ink ratio
 * - Numbers in context with times
 * - Layered information (visual + precise)
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TinySparkline } from './TinySparkline';
import { IOS_COLORS } from '@/components/cards/constants';

export interface HourlyDataPoint {
  time: string;        // "09:00" format
  value: number;
  label?: string;      // Optional direction label like "E", "NE"
}

export interface HourlyForecastTableProps {
  /** Array of hourly data points */
  data: HourlyDataPoint[];
  /** Unit label (e.g., "kt", "m") */
  unit: string;
  /** Index of "now" in the data array */
  nowIndex?: number;
  /** Sparkline variant */
  variant?: 'line' | 'area';
  /** Sparkline color */
  color?: string;
  /** Show trend text (e.g., "building", "easing") */
  trendText?: string;
  /** Maximum columns to show (default: 8) */
  maxColumns?: number;
  /** Decimal places for values (default: 0) */
  decimals?: number;
}

export function HourlyForecastTable({
  data,
  unit,
  nowIndex = 0,
  variant = 'line',
  color = IOS_COLORS.blue,
  trendText,
  maxColumns = 8,
  decimals = 0,
}: HourlyForecastTableProps) {
  // Limit data to maxColumns
  const displayData = useMemo(() => {
    if (data.length <= maxColumns) return data;

    // Try to center around nowIndex
    const halfWindow = Math.floor(maxColumns / 2);
    let startIdx = Math.max(0, nowIndex - halfWindow);
    let endIdx = startIdx + maxColumns;

    if (endIdx > data.length) {
      endIdx = data.length;
      startIdx = Math.max(0, endIdx - maxColumns);
    }

    return data.slice(startIdx, endIdx);
  }, [data, maxColumns, nowIndex]);

  // Extract values for sparkline
  const sparklineData = useMemo(() =>
    displayData.map(d => d.value),
    [displayData]
  );

  // Calculate adjusted nowIndex for displayed data
  const adjustedNowIndex = useMemo(() => {
    if (data.length <= maxColumns) return nowIndex;

    const halfWindow = Math.floor(maxColumns / 2);
    let startIdx = Math.max(0, nowIndex - halfWindow);
    if (startIdx + maxColumns > data.length) {
      startIdx = Math.max(0, data.length - maxColumns);
    }

    return nowIndex - startIdx;
  }, [data.length, maxColumns, nowIndex]);

  // Format time for display (strip leading zero, just show hour)
  const formatTime = (time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    return hour.toString().padStart(2, ' ');
  };

  // Format value with unit
  const formatValue = (value: number) => {
    return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  };

  if (displayData.length < 2) return null;

  return (
    <View style={styles.container}>
      {/* Sparkline */}
      <View style={styles.sparklineContainer}>
        <TinySparkline
          data={sparklineData}
          width={displayData.length * 32}
          height={28}
          color={color}
          nowIndex={adjustedNowIndex}
          showNowDot
          variant={variant}
        />
        {trendText && (
          <Text style={[styles.trendText, { color }]}>{trendText}</Text>
        )}
      </View>

      {/* Time row */}
      <View style={styles.timeRow}>
        {displayData.map((d, i) => (
          <View
            key={`time-${i}`}
            style={[
              styles.cell,
              i === adjustedNowIndex && styles.nowCell,
            ]}
          >
            <Text style={[
              styles.timeText,
              i === adjustedNowIndex && styles.nowTimeText,
            ]}>
              {formatTime(d.time)}
            </Text>
          </View>
        ))}
      </View>

      {/* Value row */}
      <View style={styles.valueRow}>
        {displayData.map((d, i) => (
          <View
            key={`value-${i}`}
            style={[
              styles.cell,
              i === adjustedNowIndex && styles.nowCell,
            ]}
          >
            <Text style={[
              styles.valueText,
              i === adjustedNowIndex && styles.nowValueText,
            ]}>
              {formatValue(d.value)}
              {i === displayData.length - 1 && (
                <Text style={styles.unitText}>{unit}</Text>
              )}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  timeRow: {
    flexDirection: 'row',
  },
  valueRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    minWidth: 28,
  },
  nowCell: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontVariant: ['tabular-nums'],
  },
  nowTimeText: {
    color: IOS_COLORS.blue,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  nowValueText: {
    color: IOS_COLORS.blue,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
});

export default HourlyForecastTable;
