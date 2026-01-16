/**
 * DataStatement - Read-only data display
 *
 * Transforms checklist items into clean data statements.
 * Example: "Forestay: 12mm (tight for heavy air)"
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  gray5: '#E5E5EA',
};

export interface DataStatementProps {
  /** Label for the data (e.g., "Mainsail") */
  label: string;
  /** Value to display (e.g., "#1 Quantum") */
  value: string;
  /** Optional subtext (e.g., "Selected Jan 10") */
  subtext?: string;
  /** Layout variant */
  variant?: 'inline' | 'stacked';
}

export function DataStatement({
  label,
  value,
  subtext,
  variant = 'inline',
}: DataStatementProps) {
  if (variant === 'stacked') {
    return (
      <View style={styles.stackedContainer}>
        <Text style={styles.stackedLabel}>{label}</Text>
        <Text style={styles.stackedValue}>{value}</Text>
        {subtext && <Text style={styles.subtext}>{subtext}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inlineContainer}>
      <Text style={styles.inlineLabel}>{label}:</Text>
      <Text style={styles.inlineValue} numberOfLines={1}>
        {value}
      </Text>
      {subtext && <Text style={styles.inlineSubtext}>{subtext}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // Inline variant
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  inlineLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  inlineValue: {
    fontSize: 13,
    color: IOS_COLORS.label,
    fontWeight: '400',
    flex: 1,
  },
  inlineSubtext: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Stacked variant
  stackedContainer: {
    gap: 2,
  },
  stackedLabel: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stackedValue: {
    fontSize: 15,
    color: IOS_COLORS.label,
    fontWeight: '400',
  },
  subtext: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
});

export default DataStatement;
