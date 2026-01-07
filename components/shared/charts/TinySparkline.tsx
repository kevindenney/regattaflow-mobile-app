/**
 * TinySparkline - Ultra-compact inline trend chart
 *
 * Tufte-inspired word-sized graphic for race card conditions.
 * Shows 6-12hr forecast trend in minimal space (40-60px).
 * Highlights "now" position for temporal context.
 *
 * Usage in race cards:
 *   Wind  E 6-11kt ╱╲╱╲  <- TinySparkline shows trend
 *   Tide  Rising 2.5m ▂▄▆  <- TinySparkline shows tide cycle
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

export interface TinySparklineProps {
  /** Array of numeric forecast values (6-12 points typical) */
  data: number[];
  /** Width in pixels (default: 50) */
  width?: number;
  /** Height in pixels (default: 14) */
  height?: number;
  /** Line color (default: gray) */
  color?: string;
  /** Index of "now" in the data array (0 = first point) */
  nowIndex?: number;
  /** Show a vertical line at "now" position */
  showNowMarker?: boolean;
  /** Show dot at current (now) value */
  showNowDot?: boolean;
  /** Highlight peak value with a dot */
  highlightPeak?: boolean;
  /** Variant: 'line' for wind, 'area' for tide */
  variant?: 'line' | 'area';
}

export function TinySparkline({
  data,
  width = 50,
  height = 14,
  color = '#6B7280',
  nowIndex,
  showNowMarker = false,
  showNowDot = true,
  highlightPeak = false,
  variant = 'line',
}: TinySparklineProps) {
  const { pathD, areaPathD, points, peakIndex } = useMemo(() => {
    if (!data || data.length < 2) {
      return { pathD: '', areaPathD: '', points: [], peakIndex: -1 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Minimal padding for tiny display
    const padding = 1;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Generate points
    const pts = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y, value };
    });

    // SVG path for line
    const lineD = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    // SVG path for area fill (tide visualization)
    const areaD =
      lineD +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`;

    // Find peak (max) index
    const peak = data.indexOf(max);

    return { pathD: lineD, areaPathD: areaD, points: pts, peakIndex: peak };
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  // Calculate now position
  const nowPosition = nowIndex !== undefined && nowIndex >= 0 && nowIndex < points.length
    ? points[nowIndex]
    : null;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Area fill for tide variant */}
        {variant === 'area' && (
          <Path
            d={areaPathD}
            fill={`${color}20`}
            stroke="none"
          />
        )}

        {/* Main sparkline path */}
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={variant === 'area' ? 1 : 1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* "Now" vertical marker line */}
        {showNowMarker && nowPosition && (
          <Line
            x1={nowPosition.x}
            y1={0}
            x2={nowPosition.x}
            y2={height}
            stroke={color}
            strokeWidth={0.5}
            strokeDasharray="2,2"
            opacity={0.5}
          />
        )}

        {/* "Now" dot - current value */}
        {showNowDot && nowPosition && (
          <Circle
            cx={nowPosition.x}
            cy={nowPosition.y}
            r={2}
            fill={color}
          />
        )}

        {/* Peak value dot (for tide peak annotation) */}
        {highlightPeak && peakIndex >= 0 && points[peakIndex] && (
          <Circle
            cx={points[peakIndex].x}
            cy={points[peakIndex].y}
            r={2}
            fill={color}
            opacity={0.7}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default TinySparkline;
