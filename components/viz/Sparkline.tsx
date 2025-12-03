/**
 * Sparkline Component
 *
 * Tufte-style "intense, simple, word-sized graphics"
 * Inline data visualization for showing trends without axes or labels
 *
 * Based on Edward Tufte's sparkline concept:
 * "Small, high-resolution graphics embedded in a context of words, numbers, images"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  showDot?: boolean; // Show dot at last data point
  showMinMax?: boolean; // Show dots at min/max values
  showBaseline?: boolean; // Show baseline at zero or average
  baselineValue?: number; // Custom baseline value
  fillArea?: boolean; // Fill area under line
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  strokeWidth = 1.5,
  color = '#0284C7',
  showDot = true,
  showMinMax = false,
  showBaseline = false,
  baselineValue,
  fillArea = false,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Create points for the line
  const points: string[] = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  // Calculate baseline Y position
  let baselineY = height;
  if (showBaseline) {
    const baseline = baselineValue !== undefined ? baselineValue : 0;
    baselineY = height - ((baseline - min) / range) * height;
  }

  // Find min/max indices for dots
  const minIndex = data.indexOf(min);
  const maxIndex = data.indexOf(max);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Baseline */}
        {showBaseline && (
          <Line
            x1={0}
            y1={baselineY}
            x2={width}
            y2={baselineY}
            stroke="#D1D5DB"
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
        )}

        {/* Area fill (optional) */}
        {fillArea && (
          <Polyline
            points={`0,${height} ${polylinePoints} ${width},${height}`}
            fill={`${color}15`}
            stroke="none"
          />
        )}

        {/* Main line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Min/Max dots */}
        {showMinMax && (
          <>
            <Circle
              cx={(minIndex / (data.length - 1)) * width}
              cy={height}
              r={2}
              fill="#EF4444"
            />
            <Circle
              cx={(maxIndex / (data.length - 1)) * width}
              cy={0}
              r={2}
              fill="#10B981"
            />
          </>
        )}

        {/* Last value dot */}
        {showDot && (
          <Circle
            cx={width}
            cy={height - ((data[data.length - 1] - min) / range) * height}
            r={2}
            fill={color}
          />
        )}
      </Svg>
    </View>
  );
}

/**
 * SparklineWithValue
 *
 * Sparkline with the current value displayed inline (Tufte-style)
 */
interface SparklineWithValueProps extends SparklineProps {
  value: string | number;
  unit?: string;
  valueColor?: string;
  precision?: number;
}

export function SparklineWithValue({
  value,
  unit,
  valueColor,
  precision = 1,
  ...sparklineProps
}: SparklineWithValueProps) {
  const formattedValue = typeof value === 'number' ? value.toFixed(precision) : value;

  return (
    <View style={styles.valueContainer}>
      <Text style={[styles.value, valueColor && { color: valueColor }]}>
        {formattedValue}
      </Text>
      {unit && <Text style={styles.unit}>{unit}</Text>}
      <Sparkline {...sparklineProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
