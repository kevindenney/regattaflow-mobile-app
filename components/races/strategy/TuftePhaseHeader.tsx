/**
 * TuftePhaseHeader - Minimal phase label in Tufte style
 *
 * Simple uppercase typography for phase sections (START, UPWIND, etc.)
 * No icons, no decoration - just clear typographic hierarchy.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Tufte-inspired colors
const COLORS = {
  label: '#8E8E93', // iOS secondary label
  separator: '#E5E7EB',
};

export interface TuftePhaseHeaderProps {
  /** Phase name to display (e.g., "START", "UPWIND") */
  phase: string;
  /** Whether this is the first phase (no top margin) */
  isFirst?: boolean;
}

export function TuftePhaseHeader({ phase, isFirst = false }: TuftePhaseHeaderProps) {
  return (
    <View style={[styles.container, isFirst && styles.containerFirst]}>
      <Text style={styles.label}>{phase.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 12,
  },
  containerFirst: {
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.label,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default TuftePhaseHeader;
