/**
 * TensionBar - Visual tension indicator component
 * Apple-style segmented progress bar for displaying tension levels
 * Used in Rig Setup cards for shroud/rigging tension display
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

type TensionLevel = 'low' | 'medium' | 'high' | 'max';

interface TensionBarProps {
  /** Value from 0-100 representing tension percentage */
  value: number;
  /** Whether to show the label (Low/Med/High/Max) */
  showLabel?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Optional custom label override */
  label?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get tension level from percentage value
 */
function getTensionLevel(value: number): TensionLevel {
  if (value <= 25) return 'low';
  if (value <= 50) return 'medium';
  if (value <= 75) return 'high';
  return 'max';
}

/**
 * Get display label for tension level
 */
function getTensionLabel(level: TensionLevel): string {
  const labels: Record<TensionLevel, string> = {
    low: 'Low',
    medium: 'Med',
    high: 'High',
    max: 'Max',
  };
  return labels[level];
}

/**
 * Get color for tension level
 */
function getTensionColor(level: TensionLevel): string {
  const colors: Record<TensionLevel, string> = {
    low: '#3B82F6',     // blue-500
    medium: '#10B981',  // emerald-500
    high: '#F59E0B',    // amber-500
    max: '#EF4444',     // red-500
  };
  return colors[level];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TensionBar({
  value,
  showLabel = true,
  size = 'medium',
  label,
}: TensionBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const level = getTensionLevel(clampedValue);
  const color = getTensionColor(level);
  const displayLabel = label || getTensionLabel(level);

  // Calculate filled segments (10 total)
  const totalSegments = 10;
  const filledSegments = Math.round((clampedValue / 100) * totalSegments);

  const isSmall = size === 'small';

  return (
    <View style={styles.container}>
      <View style={[styles.barContainer, isSmall && styles.barContainerSmall]}>
        {Array.from({ length: totalSegments }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              isSmall && styles.segmentSmall,
              {
                backgroundColor: index < filledSegments ? color : '#E2E8F0',
              },
            ]}
          />
        ))}
      </View>
      {showLabel && (
        <Text
          style={[
            styles.label,
            isSmall && styles.labelSmall,
            { color },
          ]}
        >
          {displayLabel}
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
  },
  barContainerSmall: {
    gap: 1,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 2,
  },
  segmentSmall: {
    height: 6,
    borderRadius: 1.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  labelSmall: {
    fontSize: 11,
    minWidth: 28,
  },
});

export default TensionBar;
