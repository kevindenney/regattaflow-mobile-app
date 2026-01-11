/**
 * TufteMatchFields Component
 *
 * Match racing specific fields.
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { TufteFieldRow } from './TufteFieldRow';
import { TufteSectionLabel } from './TufteSectionLabel';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';
import type { MatchRaceData } from './MatchRaceFields';

export interface TufteMatchFieldsProps {
  /** Match race data */
  data: MatchRaceData;
  /** Update handler */
  onChange: (data: MatchRaceData) => void;
  /** Field errors */
  errors?: Record<string, string>;
  /** Fields that were populated by AI */
  aiExtractedFields?: Set<string>;
}

export function TufteMatchFields({
  data,
  onChange,
  errors = {},
  aiExtractedFields = new Set(),
}: TufteMatchFieldsProps) {
  const handleChange = (field: keyof MatchRaceData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <View>
      <TufteSectionLabel>MATCH DETAILS</TufteSectionLabel>

      <TufteFieldRow
        label="Opponent name"
        value={data.opponentName || ''}
        onChangeText={(v) => handleChange('opponentName', v)}
        placeholder="e.g., Team Smith"
        required
        error={errors['match.opponentName']}
        aiExtracted={aiExtractedFields.has('match.opponentName')}
      />

      <View style={styles.row}>
        <TufteFieldRow
          label="Round"
          value={data.matchRound || ''}
          onChangeText={(v) => handleChange('matchRound', v)}
          placeholder="e.g., 3"
          keyboardType="numeric"
          halfWidth
          aiExtracted={aiExtractedFields.has('match.matchRound')}
        />
        <TufteFieldRow
          label="Total rounds"
          value={data.totalRounds || ''}
          onChangeText={(v) => handleChange('totalRounds', v)}
          placeholder="e.g., 8"
          keyboardType="numeric"
          halfWidth
          aiExtracted={aiExtractedFields.has('match.totalRounds')}
        />
      </View>

      <TufteFieldRow
        label="Series format"
        value={data.seriesFormat || ''}
        onChangeText={(v) => handleChange('seriesFormat', v)}
        placeholder="e.g., Best of 5"
        aiExtracted={aiExtractedFields.has('match.seriesFormat')}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>On-water umpire</Text>
        <Switch
          value={data.hasUmpire ?? false}
          onValueChange={(v) => handleChange('hasUmpire', v)}
          trackColor={{ false: IOS_COLORS.gray5, true: IOS_COLORS.blue }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.sm,
    marginBottom: TUFTE_FORM_SPACING.md,
  },
  switchLabel: {
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
});

export default TufteMatchFields;
