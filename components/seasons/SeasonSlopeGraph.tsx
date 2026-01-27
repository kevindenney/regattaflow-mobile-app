/**
 * Season Slope Graph
 *
 * Tufte-inspired slope graph showing position trajectory across seasons.
 * Connects standings to visualize improvement or decline over time.
 *
 * Visual:
 *          Summer '24    Winter '24    Spring '25
 *              │             │             │
 *             4th ──────── 3rd ──────── 2nd
 *
 * Uses thin 1.5px lines with subtle color for trend direction:
 * - Green: improvement (lower position number)
 * - Red: decline (higher position number)
 * - Gray: no change
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { ordinal } from '@/lib/tufte';
import type { SeasonWithSummary } from '@/types/season';

// =============================================================================
// TYPES
// =============================================================================

interface SeasonDataPoint {
  id: string;
  shortName: string;
  position: number;       // 1-based position
  totalEntries: number;   // Fleet size for context
  points: number;
}

interface SeasonSlopeGraphProps {
  /** Seasons with standings data (ordered chronologically, oldest first) */
  seasons: SeasonWithSummary[];
  /** Graph width (default: container width - 32) */
  width?: number;
  /** Graph height */
  height?: number;
  /** Show position labels on each point */
  showLabels?: boolean;
  /** Highlight the current/most recent season */
  highlightLatest?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
  improving: '#10B981',    // Green
  declining: '#EF4444',    // Red
  neutral: '#9CA3AF',      // Gray
  point: IOS_COLORS.label,
  pointLatest: IOS_COLORS.blue,
  grid: IOS_COLORS.gray5,
  label: IOS_COLORS.secondaryLabel,
  seasonLabel: IOS_COLORS.gray,
};

const DEFAULTS = {
  height: 100,
  strokeWidth: 1.5,
  pointRadius: 4,
  pointRadiusLatest: 5,
};

// =============================================================================
// HELPERS
// =============================================================================

function formatShortSeasonName(name: string, year: number): string {
  const words = name.split(' ');
  const seasonWord = words[0].slice(0, 3); // "Sum", "Win", "Spr"
  const yearShort = `'${String(year).slice(-2)}`;
  return `${seasonWord} ${yearShort}`;
}

function extractDataPoints(seasons: SeasonWithSummary[]): SeasonDataPoint[] {
  return seasons
    .filter(s => s.summary.user_standing)
    .map(s => ({
      id: s.id,
      shortName: s.short_name || formatShortSeasonName(s.name, s.year),
      position: s.summary.user_standing!.rank,
      totalEntries: s.summary.user_standing!.total_entries,
      points: s.summary.user_standing!.net_points,
    }));
}

function getTrendColor(currentPos: number, previousPos: number): string {
  if (currentPos < previousPos) return COLORS.improving;
  if (currentPos > previousPos) return COLORS.declining;
  return COLORS.neutral;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SeasonSlopeGraph({
  seasons,
  width: propWidth,
  height = DEFAULTS.height,
  showLabels = true,
  highlightLatest = true,
}: SeasonSlopeGraphProps) {
  // Extract data points (only seasons with user standings)
  const dataPoints = extractDataPoints(seasons);

  // Need at least 2 points to draw a slope graph
  if (dataPoints.length < 2) {
    return null;
  }

  // Calculate dimensions
  const containerWidth = propWidth || Dimensions.get('window').width - 32;
  const padding = { top: 20, bottom: 24, left: 16, right: 16 };
  const graphWidth = containerWidth - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate position range for Y-axis scaling
  const positions = dataPoints.map(d => d.position);
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const posRange = Math.max(maxPos - minPos, 1); // Avoid division by zero

  // Add buffer to range for visual padding
  const yMin = Math.max(1, minPos - 1);
  const yMax = maxPos + 1;
  const yRange = yMax - yMin;

  // Calculate X positions (evenly spaced)
  const xSpacing = graphWidth / (dataPoints.length - 1);

  // Map position to Y coordinate (inverted: lower position = higher on graph)
  const posToY = (pos: number): number => {
    const normalized = (pos - yMin) / yRange;
    return padding.top + (normalized * graphHeight);
  };

  // Generate coordinates
  const points = dataPoints.map((d, i) => ({
    ...d,
    x: padding.left + (i * xSpacing),
    y: posToY(d.position),
    isLatest: i === dataPoints.length - 1,
  }));

  // Generate line segments with trend colors
  const segments: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
  }> = [];

  for (let i = 1; i < points.length; i++) {
    segments.push({
      x1: points[i - 1].x,
      y1: points[i - 1].y,
      x2: points[i].x,
      y2: points[i].y,
      color: getTrendColor(points[i].position, points[i - 1].position),
    });
  }

  return (
    <View style={styles.container}>
      <Svg width={containerWidth} height={height}>
        {/* Vertical grid lines at each data point */}
        {points.map((p, i) => (
          <Line
            key={`grid-${i}`}
            x1={p.x}
            y1={padding.top - 4}
            x2={p.x}
            y2={height - padding.bottom + 4}
            stroke={COLORS.grid}
            strokeWidth={StyleSheet.hairlineWidth}
          />
        ))}

        {/* Trend lines */}
        {segments.map((seg, i) => (
          <Line
            key={`line-${i}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={seg.color}
            strokeWidth={DEFAULTS.strokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r={p.isLatest && highlightLatest
              ? DEFAULTS.pointRadiusLatest
              : DEFAULTS.pointRadius
            }
            fill={p.isLatest && highlightLatest
              ? COLORS.pointLatest
              : COLORS.point
            }
          />
        ))}
      </Svg>

      {/* Position labels */}
      {showLabels && (
        <View style={[styles.labelsRow, { paddingHorizontal: padding.left }]}>
          {points.map((p, i) => (
            <View
              key={`label-${i}`}
              style={[
                styles.labelContainer,
                { left: p.x - 20, top: p.y - 24 },
              ]}
            >
              <Text
                style={[
                  styles.positionLabel,
                  p.isLatest && highlightLatest && styles.positionLabelLatest,
                ]}
              >
                {ordinal(p.position)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Season labels at bottom */}
      <View style={[styles.seasonLabelsRow, { marginTop: -padding.bottom + 4 }]}>
        {points.map((p, i) => (
          <Text
            key={`season-${i}`}
            style={[
              styles.seasonLabel,
              {
                width: xSpacing,
                marginLeft: i === 0 ? padding.left - xSpacing / 2 : 0,
              },
            ]}
            numberOfLines={1}
          >
            {p.shortName}
          </Text>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// COMPACT INLINE VERSION
// =============================================================================

interface CompactSlopeGraphProps {
  /** Seasons with standings data */
  seasons: SeasonWithSummary[];
  /** Graph width */
  width?: number;
  /** Graph height */
  height?: number;
}

/**
 * Compact slope graph for inline use (e.g., in a table cell or header)
 * Shows just the trend line without labels
 */
export function CompactSlopeGraph({
  seasons,
  width = 80,
  height = 24,
}: CompactSlopeGraphProps) {
  const dataPoints = extractDataPoints(seasons);

  if (dataPoints.length < 2) return null;

  const padding = 4;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const positions = dataPoints.map(d => d.position);
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const yMin = Math.max(1, minPos - 1);
  const yMax = maxPos + 1;
  const yRange = Math.max(yMax - yMin, 1);

  const xSpacing = graphWidth / (dataPoints.length - 1);

  const posToY = (pos: number): number => {
    const normalized = (pos - yMin) / yRange;
    return padding + (normalized * graphHeight);
  };

  const points = dataPoints.map((d, i) => ({
    x: padding + (i * xSpacing),
    y: posToY(d.position),
  }));

  // Create path string
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Overall trend color
  const firstPos = dataPoints[0].position;
  const lastPos = dataPoints[dataPoints.length - 1].position;
  const trendColor = getTrendColor(lastPos, firstPos);

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathD}
        stroke={trendColor}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point dot */}
      <Circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={trendColor}
      />
    </Svg>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: TUFTE_BACKGROUND,
    position: 'relative',
  },

  // Labels overlay
  labelsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  labelContainer: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
  },
  positionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  positionLabelLatest: {
    color: IOS_COLORS.blue,
  },

  // Season labels
  seasonLabelsRow: {
    flexDirection: 'row',
  },
  seasonLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});

export default SeasonSlopeGraph;
