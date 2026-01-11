/**
 * PhaseMasteryChart Component (Tufte-Style)
 *
 * Dense, typography-driven display of phase mastery scores.
 * Uses Unicode block characters for bars, marginalia for focus indicators.
 *
 * Tufte principles:
 * - High data-ink ratio (no decorative elements)
 * - Aligned numbers for easy comparison
 * - Marginalia for secondary information
 * - No background colors or rounded corners
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { unicodeBar } from '@/lib/tufte';
import type { PhaseMasteryScores } from '@/types/excellenceFramework';

interface PhaseMasteryChartProps {
  mastery: PhaseMasteryScores;
  highlightLowest?: number;
}

// Phase display configuration
const PHASE_CONFIG: { key: keyof PhaseMasteryScores; label: string }[] = [
  { key: 'prep', label: 'Prep' },
  { key: 'launch', label: 'Launch' },
  { key: 'start', label: 'Start' },
  { key: 'upwind', label: 'Upwind' },
  { key: 'downwind', label: 'Downwind' },
  { key: 'markRounding', label: 'Marks' },
  { key: 'finish', label: 'Finish' },
  { key: 'review', label: 'Review' },
];

export function PhaseMasteryChart({
  mastery,
  highlightLowest = 2,
}: PhaseMasteryChartProps) {
  // Find lowest phases to mark as focus areas
  const sortedPhases = [...PHASE_CONFIG]
    .map((p) => ({ ...p, value: mastery[p.key] }))
    .sort((a, b) => a.value - b.value);
  const lowestPhaseKeys = new Set(
    sortedPhases.slice(0, highlightLowest).map((p) => p.key)
  );

  return (
    <View style={styles.container}>
      {/* Section header with marginalia */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>PHASE MASTERY</Text>
        <Text style={styles.marginalia}>focus</Text>
      </View>
      <View style={styles.divider} />

      {/* Phase rows */}
      {PHASE_CONFIG.map((phase) => {
        const value = mastery[phase.key];
        const isLow = lowestPhaseKeys.has(phase.key);

        return (
          <View key={phase.key} style={styles.row}>
            {/* Phase label - fixed width for alignment */}
            <Text style={styles.label}>{phase.label}</Text>

            {/* Unicode bar chart */}
            <Text style={styles.bar}>{unicodeBar(value, 10)}</Text>

            {/* Value - right aligned */}
            <Text style={styles.value}>{Math.round(value)}</Text>

            {/* Focus indicator in marginalia */}
            <Text style={styles.focusIndicator}>
              {isLow ? '◂' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding, no background - let parent handle spacing
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  label: {
    width: 72,
    fontSize: 13,
    fontWeight: '400',
    color: '#4a4a4a',
  },
  bar: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6b7280',
    letterSpacing: -0.5,
  },
  value: {
    width: 28,
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  focusIndicator: {
    width: 24,
    fontSize: 12,
    color: '#d97706',
    textAlign: 'right',
    paddingLeft: 8,
  },
});

export default PhaseMasteryChart;
