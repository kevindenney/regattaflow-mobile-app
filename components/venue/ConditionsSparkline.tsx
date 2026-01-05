/**
 * ConditionsSparkline
 *
 * Tufte-inspired word-sized graphics for displaying condition trends.
 * Pure data visualization with no axes, labels, or chrome.
 * "Data-ink ratio" maximized - every pixel conveys information.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { TufteTokens } from '@/constants/designSystem';

interface SparklineData {
  value: number;
  timestamp?: Date | string;
}

interface ConditionsSparklineProps {
  data: SparklineData[] | number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showDot?: boolean; // Show dot at current (last) value
  showMinMax?: boolean; // Show min/max dots
  showTrend?: boolean; // Show trend line
  label?: string;
  unit?: string;
  currentValue?: number | string;
  variant?: 'line' | 'area' | 'bar';
}

export function ConditionsSparkline({
  data,
  width = 60,
  height = 20,
  color = '#2563EB',
  strokeWidth = 1.5,
  showDot = true,
  showMinMax = false,
  showTrend = false,
  label,
  unit,
  currentValue,
  variant = 'line',
}: ConditionsSparklineProps) {
  const { path, areaPath, lastPoint, minPoint, maxPoint, trendPath } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', areaPath: '', lastPoint: null, minPoint: null, maxPoint: null, trendPath: '' };
    }

    // Normalize data to number array
    const values = data.map((d) => (typeof d === 'number' ? d : d.value));

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Padding for dots
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Generate points
    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y, value };
    });

    // SVG path for line
    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    // SVG path for area (filled below line)
    const areaD =
      pathD +
      ` L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`;

    // Find min/max points
    let minIdx = 0;
    let maxIdx = 0;
    values.forEach((v, i) => {
      if (v < values[minIdx]) minIdx = i;
      if (v > values[maxIdx]) maxIdx = i;
    });

    // Trend line (linear regression)
    let trendD = '';
    if (showTrend && values.length >= 2) {
      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
      const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const y1 = padding + chartHeight - ((intercept - min) / range) * chartHeight;
      const y2 =
        padding +
        chartHeight -
        ((intercept + slope * (values.length - 1) - min) / range) * chartHeight;
      trendD = `M ${padding} ${y1.toFixed(1)} L ${width - padding} ${y2.toFixed(1)}`;
    }

    return {
      path: pathD,
      areaPath: areaD,
      lastPoint: points[points.length - 1],
      minPoint: points[minIdx],
      maxPoint: points[maxIdx],
      trendPath: trendD,
    };
  }, [data, width, height, showTrend]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.noData}>
          <Text style={styles.noDataText}>—</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {(label || currentValue !== undefined) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {currentValue !== undefined && (
            <Text style={styles.currentValue}>
              {currentValue}
              {unit && <Text style={styles.unit}>{unit}</Text>}
            </Text>
          )}
        </View>
      )}
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          {/* Trend line (behind) */}
          {showTrend && trendPath && (
            <Path d={trendPath} stroke={color} strokeWidth={0.5} strokeOpacity={0.3} fill="none" />
          )}

          {/* Area fill */}
          {variant === 'area' && <Path d={areaPath} fill={color} fillOpacity={0.1} />}

          {/* Main line */}
          <Path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />

          {/* Min/Max dots */}
          {showMinMax && minPoint && maxPoint && (
            <>
              <Circle cx={minPoint.x} cy={minPoint.y} r={2} fill="#DC2626" />
              <Circle cx={maxPoint.x} cy={maxPoint.y} r={2} fill="#059669" />
            </>
          )}

          {/* Current value dot */}
          {showDot && lastPoint && (
            <Circle cx={lastPoint.x} cy={lastPoint.y} r={2.5} fill={color} />
          )}
        </Svg>
      </View>
    </View>
  );
}

/**
 * WindSparkline - Pre-configured for wind speed display
 */
export function WindSparkline({
  data,
  currentSpeed,
  currentDirection,
  ...props
}: Omit<ConditionsSparklineProps, 'color' | 'label'> & {
  currentSpeed?: number;
  currentDirection?: string;
}) {
  return (
    <View style={styles.conditionWrapper}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionLabel}>Wind</Text>
        {currentSpeed !== undefined && (
          <Text style={styles.conditionValue}>
            {currentSpeed}kt {currentDirection || ''}
          </Text>
        )}
      </View>
      <ConditionsSparkline data={data} color="#2563EB" {...props} />
    </View>
  );
}

/**
 * TideSparkline - Pre-configured for tide height display
 */
export function TideSparkline({
  data,
  currentHeight,
  phase,
  ...props
}: Omit<ConditionsSparklineProps, 'color' | 'label' | 'variant'> & {
  currentHeight?: number;
  phase?: 'flood' | 'ebb' | 'slack';
}) {
  const phaseArrow = phase === 'flood' ? '↑' : phase === 'ebb' ? '↓' : '—';

  return (
    <View style={styles.conditionWrapper}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionLabel}>Tide</Text>
        {currentHeight !== undefined && (
          <Text style={styles.conditionValue}>
            {currentHeight.toFixed(1)}m {phaseArrow}
          </Text>
        )}
      </View>
      <ConditionsSparkline data={data} color="#059669" variant="area" showMinMax {...props} />
    </View>
  );
}

/**
 * CurrentSparkline - Pre-configured for current speed display
 */
export function CurrentSparkline({
  data,
  currentSpeed,
  currentDirection,
  ...props
}: Omit<ConditionsSparklineProps, 'color' | 'label'> & {
  currentSpeed?: number;
  currentDirection?: string;
}) {
  return (
    <View style={styles.conditionWrapper}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionLabel}>Current</Text>
        {currentSpeed !== undefined && (
          <Text style={styles.conditionValue}>
            {currentSpeed.toFixed(1)}kt {currentDirection || ''}
          </Text>
        )}
      </View>
      <ConditionsSparkline data={data} color="#7C3AED" showTrend {...props} />
    </View>
  );
}

/**
 * ConditionsBar - Horizontal row of condition sparklines
 */
interface ConditionsBarProps {
  wind?: { data: number[]; currentSpeed?: number; currentDirection?: string };
  tide?: { data: number[]; currentHeight?: number; phase?: 'flood' | 'ebb' | 'slack' };
  current?: { data: number[]; currentSpeed?: number; currentDirection?: string };
  compact?: boolean;
}

export function ConditionsBar({ wind, tide, current, compact = false }: ConditionsBarProps) {
  const sparklineWidth = compact ? 40 : 60;
  const sparklineHeight = compact ? 16 : 20;

  return (
    <View style={[styles.conditionsBar, compact && styles.conditionsBarCompact]}>
      {wind && (
        <WindSparkline
          data={wind.data}
          currentSpeed={wind.currentSpeed}
          currentDirection={wind.currentDirection}
          width={sparklineWidth}
          height={sparklineHeight}
        />
      )}
      {tide && (
        <TideSparkline
          data={tide.data}
          currentHeight={tide.currentHeight}
          phase={tide.phase}
          width={sparklineWidth}
          height={sparklineHeight}
        />
      )}
      {current && (
        <CurrentSparkline
          data={current.data}
          currentSpeed={current.currentSpeed}
          currentDirection={current.currentDirection}
          width={sparklineWidth}
          height={sparklineHeight}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    gap: 2,
  },
  container: {
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
  },
  currentValue: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#111827',
  },
  unit: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
    marginLeft: 1,
  },
  noData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },

  // Condition-specific wrappers
  conditionWrapper: {
    flexDirection: 'column',
    gap: 2,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 4,
  },
  conditionLabel: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionValue: {
    ...TufteTokens.typography.tertiary,
    fontWeight: '600',
    color: '#111827',
  },

  // Conditions bar
  conditionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.subtle,
    gap: TufteTokens.spacing.section,
  },
  conditionsBarCompact: {
    paddingVertical: TufteTokens.spacing.tight,
    gap: TufteTokens.spacing.compact,
  },
});

export default ConditionsSparkline;
