/**
 * Sparkline - Word-sized inline chart
 *
 * Tufte-inspired compact data visualization
 * Shows trend in minimal space, perfect for inline display with text
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export interface SparklineProps {
  /** Array of numeric data points */
  data: number[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Stroke color */
  color?: string;
  /** Show dots at each data point */
  showDots?: boolean;
  /** Highlight the maximum value with a larger dot */
  highlightMax?: boolean;
  /** Highlight the minimum value with a larger dot */
  highlightMin?: boolean;
  /** Stroke width */
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 80,
  height = 20,
  color = '#3B82F6',
  showDots = false,
  highlightMax = false,
  highlightMin = false,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Calculate points with padding
  const padding = 2;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - padding * 2) - padding;
    return { x, y, value };
  });

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const maxIndex = data.indexOf(max);
  const minIndex = data.indexOf(min);

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathD}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={color}
          opacity={0.5}
        />
      ))}
      {highlightMax && maxIndex >= 0 && (
        <Circle
          cx={points[maxIndex].x}
          cy={points[maxIndex].y}
          r={3}
          fill={color}
        />
      )}
      {highlightMin && minIndex >= 0 && (
        <Circle
          cx={points[minIndex].x}
          cy={points[minIndex].y}
          r={3}
          fill="#94A3B8"
        />
      )}
    </Svg>
  );
}

export default Sparkline;
