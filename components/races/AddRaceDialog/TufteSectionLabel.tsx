/**
 * TufteSectionLabel Component
 *
 * Section header following Tufte typography principles.
 * 11px uppercase, letterspaced, neutral gray.
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';

export interface TufteSectionLabelProps {
  /** Section label text */
  children: string;
  /** Whether this is the first section (less top margin) */
  first?: boolean;
}

export function TufteSectionLabel({ children, first = false }: TufteSectionLabelProps) {
  return (
    <Text style={[styles.label, first && styles.labelFirst]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: TUFTE_FORM_SPACING.xl,
    marginBottom: TUFTE_FORM_SPACING.md,
  },
  labelFirst: {
    marginTop: TUFTE_FORM_SPACING.lg,
  },
});

export default TufteSectionLabel;
