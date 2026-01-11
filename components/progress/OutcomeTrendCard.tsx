/**
 * OutcomeTrendCard Component (Tufte-Style)
 *
 * Dense inline statistics with Unicode sparkline.
 * No backgrounds, no cards - just data with typography hierarchy.
 *
 * Tufte principles:
 * - Data-ink ratio maximized
 * - Sparklines inline with text
 * - Tabular numbers for alignment
 * - Marginalia for secondary annotations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { sparkline, trendArrow, ordinal } from '@/lib/tufte';
import type { OutcomeMetrics } from '@/types/excellenceFramework';

interface OutcomeTrendCardProps {
  outcomes: OutcomeMetrics;
}

export function OutcomeTrendCard({ outcomes }: OutcomeTrendCardProps) {
  const {
    racesCompleted,
    averagePosition,
    positionTrend,
    bestFinish,
    recentResults,
    previousAveragePosition,
  } = outcomes;

  // Generate sparkline from recent positions (inverted: lower position = higher bar)
  const positions = recentResults.map((r) => r.position);
  const maxPos = Math.max(...positions, 1);
  const invertedForSparkline = positions.map((p) => maxPos - p + 1);
  const positionSparkline = sparkline(invertedForSparkline, { width: 12 });

  // Get trend display
  const getTrendText = () => {
    switch (positionTrend) {
      case 'improving':
        return 'improving';
      case 'declining':
        return 'declining';
      default:
        return 'stable';
    }
  };

  // Calculate change from previous
  const prevAvg = previousAveragePosition || averagePosition;
  const change = prevAvg - averagePosition; // Positive = improvement (lower position)
  const changeArrow = trendArrow(change, 0, 0.3);

  // No data state
  if (racesCompleted === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>RESULTS</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.emptyText}>
          Complete races to see performance trends
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>RESULTS</Text>
        <Text style={styles.marginalia}>{racesCompleted} races</Text>
      </View>
      <View style={styles.divider} />

      {/* Position row */}
      <View style={styles.dataRow}>
        <Text style={styles.label}>Position</Text>
        <Text style={styles.value}>
          {averagePosition > 0 ? averagePosition.toFixed(1) : '—'} avg
        </Text>
        {change !== 0 && prevAvg !== averagePosition && (
          <Text style={styles.change}>
            {changeArrow} from {prevAvg.toFixed(1)}
          </Text>
        )}
        <Text style={styles.separator}>│</Text>
        {bestFinish > 0 && (
          <Text style={styles.annotation}>
            {ordinal(bestFinish)} best
          </Text>
        )}
      </View>

      {/* Trend row with sparkline */}
      {recentResults.length > 1 && (
        <View style={styles.dataRow}>
          <Text style={styles.label}>Trend</Text>
          <Text style={styles.sparkline}>{positionSparkline}</Text>
          <Text style={[
            styles.trendText,
            positionTrend === 'improving' && styles.trendImproving,
            positionTrend === 'declining' && styles.trendDeclining,
          ]}>
            {getTrendText()}
          </Text>
          <Text style={styles.separator}>│</Text>
          <Text style={styles.annotation}>
            last {recentResults.length} races
          </Text>
        </View>
      )}

      {/* Recent positions inline */}
      {recentResults.length > 0 && (
        <View style={styles.recentRow}>
          <Text style={styles.recentLabel}>Recent:</Text>
          <Text style={styles.recentPositions}>
            {recentResults.slice(-8).map((r) => r.position).join(' → ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding, no background
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  marginalia: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    width: 72,
    fontSize: 13,
    fontWeight: '400',
    color: '#4a4a4a',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontSize: 12,
    color: '#6b7280',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    paddingHorizontal: 4,
  },
  annotation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sparkline: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6b7280',
    letterSpacing: -0.5,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  trendImproving: {
    color: '#059669',
  },
  trendDeclining: {
    color: '#dc2626',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingTop: 8,
    gap: 8,
  },
  recentLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  recentPositions: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default OutcomeTrendCard;
