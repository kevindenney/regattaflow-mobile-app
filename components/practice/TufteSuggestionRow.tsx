/**
 * TufteSuggestionRow
 *
 * Minimal suggestion row following Tufte principles:
 * - Typography-only hierarchy (no badges, icons)
 * - Marginalia-style drill details
 * - Maximum data-ink ratio
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import type { PracticeSuggestion } from '@/types/practice';

interface TufteSuggestionRowProps {
  suggestion: PracticeSuggestion;
  onPress: (suggestion: PracticeSuggestion) => void;
}

export function TufteSuggestionRow({
  suggestion,
  onPress,
}: TufteSuggestionRowProps) {
  const topDrill = suggestion.suggestedDrills[0];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={() => onPress(suggestion)}
    >
      <View style={styles.content}>
        {/* Title row with duration */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{suggestion.skillAreaLabel}</Text>
          <Text style={styles.duration}>{suggestion.estimatedDuration} min</Text>
        </View>

        {/* Marginalia-style drill detail */}
        {topDrill && (
          <Text style={styles.marginalia}>
            <Text style={styles.connector}>└─ </Text>
            {topDrill.drill.name}
          </Text>
        )}

        {/* Brief reason */}
        <Text style={styles.reason} numberOfLines={1}>
          {suggestion.reason}
        </Text>
      </View>

      <ChevronRight size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.md,
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
    backgroundColor: '#FFFFFF',
  },
  containerPressed: {
    backgroundColor: TUFTE_FORM_COLORS.separator,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  duration: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  marginalia: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    paddingLeft: TUFTE_FORM_SPACING.sm,
  },
  connector: {
    color: '#D1D5DB',
  },
  reason: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

export default TufteSuggestionRow;
