/**
 * AnnotatedSparkline - Sparkline with text annotations for expanded views
 *
 * Tufte-inspired data graphic with contextual annotations.
 * Designed for expanded race cards where more space is available.
 *
 * Features:
 * - Larger sparkline (100-120px wide)
 * - Trend annotation (building/easing/steady)
 * - Peak time annotation for tide
 * - Min/max value labels
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { IOS_COLORS } from '@/components/cards/constants';

export interface AnnotatedSparklineProps {
  /** Array of numeric forecast values */
  data: number[];
  /** Width in pixels (default: 100) */
  width?: number;
  /** Height in pixels (default: 24) */
  height?: number;
  /** Line color */
  color?: string;
  /** Index of "now" in the data array */
  nowIndex?: number;
  /** Trend annotation text */
  trendText?: string;
  /** Peak time annotation (e.g., "14:30") */
  peakTime?: string;
  /** Variant: 'line' for wind, 'area' for tide */
  variant?: 'line' | 'area';
  /** Show min/max value labels */
  showMinMax?: boolean;
  /** Unit for values (e.g., "kt", "m") */
  unit?: string;
}

export function AnnotatedSparkline({
  data,
  width = 100,
  height = 24,
  color = IOS_COLORS.secondaryLabel,
  nowIndex,
  trendText,
  peakTime,
  variant = 'line',
  showMinMax = false,
  unit = '',
}: AnnotatedSparklineProps) {
  const { pathD, areaPathD, points, peakIndex, minIndex, min, max } = useMemo(() => {
    if (!data || data.length < 2) {
      return { pathD: '', areaPathD: '', points: [], peakIndex: -1, minIndex: -1, min: 0, max: 0 };
    }

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    // Padding for labels if showing min/max
    const padding = showMinMax ? 3 : 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Generate points
    const pts = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minVal) / range) * chartHeight;
      return { x, y, value };
    });

    // SVG path for line
    const lineD = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    // SVG path for area fill
    const areaD =
      lineD +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`;

    // Find peak and min indices
    const peak = data.indexOf(maxVal);
    const minIdx = data.indexOf(minVal);

    return {
      pathD: lineD,
      areaPathD: areaD,
      points: pts,
      peakIndex: peak,
      minIndex: minIdx,
      min: minVal,
      max: maxVal,
    };
  }, [data, width, height, showMinMax]);

  if (!data || data.length < 2) return null;

  // Calculate now position
  const nowPosition =
    nowIndex !== undefined && nowIndex >= 0 && nowIndex < points.length
      ? points[nowIndex]
      : null;

  return (
    <View style={styles.container}>
      {/* Sparkline SVG */}
      <View style={[styles.chartContainer, { width, height }]}>
        <Svg width={width} height={height}>
          {/* Area fill for tide variant */}
          {variant === 'area' && (
            <Path d={areaPathD} fill={`${color}20`} stroke="none" />
          )}

          {/* Main sparkline path */}
          <Path
            d={pathD}
            stroke={color}
            strokeWidth={variant === 'area' ? 1.5 : 2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* "Now" vertical marker line */}
          {nowPosition && (
            <Line
              x1={nowPosition.x}
              y1={1}
              x2={nowPosition.x}
              y2={height - 1}
              stroke={IOS_COLORS.blue}
              strokeWidth={1}
              strokeDasharray="3,2"
              opacity={0.6}
            />
          )}

          {/* "Now" dot */}
          {nowPosition && (
            <Circle cx={nowPosition.x} cy={nowPosition.y} r={3} fill={IOS_COLORS.blue} />
          )}

          {/* Peak dot */}
          {peakIndex >= 0 && points[peakIndex] && (
            <Circle
              cx={points[peakIndex].x}
              cy={points[peakIndex].y}
              r={2.5}
              fill={color}
              opacity={0.8}
            />
          )}

          {/* Min/Max labels */}
          {showMinMax && peakIndex >= 0 && points[peakIndex] && (
            <SvgText
              x={points[peakIndex].x}
              y={points[peakIndex].y - 4}
              fontSize={8}
              fill={color}
              textAnchor="middle"
            >
              {Math.round(max)}
            </SvgText>
          )}
        </Svg>
      </View>

      {/* Text annotations */}
      {(trendText || peakTime) && (
        <View style={styles.annotations}>
          {trendText && <Text style={styles.trendText}>{trendText}</Text>}
          {peakTime && (
            <Text style={styles.peakText}>
              peak {peakTime}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 2,
  },
  chartContainer: {
    overflow: 'hidden',
  },
  annotations: {
    flexDirection: 'row',
    gap: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  peakText: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
});

export default AnnotatedSparkline;
