/**
 * MatchRaceFields Component
 *
 * Type-specific fields for Match Racing
 */

import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { User, Hash, Trophy, Scale } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';

export interface MatchRaceData {
  opponentName?: string;
  matchRound?: string;
  totalRounds?: string;
  seriesFormat?: string;
  hasUmpire?: boolean;
}

interface MatchRaceFieldsProps {
  data: MatchRaceData;
  onChange: (data: Partial<MatchRaceData>) => void;
}

export function MatchRaceFields({ data, onChange }: MatchRaceFieldsProps) {
  return (
    <View style={styles.container}>
      {/* Opponent Name (Required) */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <User size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>
            Opponent Name <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.opponentName || ''}
          onChangeText={(value) => onChange({ opponentName: value })}
          placeholder="e.g., Team Smith"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Match Round */}
      <View style={styles.row}>
        <View style={[styles.field, styles.halfWidth]}>
          <View style={styles.fieldHeader}>
            <Hash size={16} color={colors.text.secondary} />
            <Text style={styles.fieldLabel}>Round</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            value={data.matchRound || ''}
            onChangeText={(value) => onChange({ matchRound: value })}
            placeholder="e.g., 3"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.field, styles.halfWidth]}>
          <View style={styles.fieldHeader}>
            <Trophy size={16} color={colors.text.secondary} />
            <Text style={styles.fieldLabel}>Total Rounds</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            value={data.totalRounds || ''}
            onChangeText={(value) => onChange({ totalRounds: value })}
            placeholder="e.g., 8"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Series Format */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Trophy size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Series Format</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.seriesFormat || ''}
          onChangeText={(value) => onChange({ seriesFormat: value })}
          placeholder="e.g., Best of 5"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Umpire Toggle */}
      <View style={styles.toggleField}>
        <View style={styles.toggleLeft}>
          <Scale size={16} color={colors.text.secondary} />
          <View style={styles.toggleTextContainer}>
            <Text style={styles.fieldLabel}>On-Water Umpire</Text>
            <Text style={styles.toggleHint}>Calls made on the water</Text>
          </View>
        </View>
        <Switch
          value={data.hasUmpire ?? false}
          onValueChange={(value) => onChange({ hasUmpire: value })}
          trackColor={{ false: colors.border.medium, true: '#EA580C40' }}
          thumbColor={data.hasUmpire ? '#EA580C' : colors.neutral[300]}
        />
      </View>

      {/* Match Racing Tips */}
      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Match Racing Tips</Text>
        <Text style={styles.tipText}>
          Pre-start positioning and opponent analysis are key. Study your opponent's tendencies before the race.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  field: {
    gap: Spacing.xs,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldLabel: {
    ...Typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  requiredStar: {
    color: colors.danger[600],
  },
  fieldInput: {
    ...Typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: Spacing.sm,
    color: colors.text.primary,
  },
  toggleField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: Spacing.sm,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleHint: {
    ...Typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  tip: {
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.small,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#EA580C',
  },
  tipTitle: {
    ...Typography.captionBold,
    color: '#EA580C',
    marginBottom: Spacing.xs,
  },
  tipText: {
    ...Typography.caption,
    color: '#9A3412',
    lineHeight: 18,
  },
});

export default MatchRaceFields;
