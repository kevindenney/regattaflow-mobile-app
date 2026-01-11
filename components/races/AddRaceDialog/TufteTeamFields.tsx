/**
 * TufteTeamFields Component
 *
 * Team racing specific fields.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TufteFieldRow } from './TufteFieldRow';
import { TufteSectionLabel } from './TufteSectionLabel';
import type { TeamRaceData } from './TeamRaceFields';

export interface TufteTeamFieldsProps {
  /** Team race data */
  data: TeamRaceData;
  /** Update handler */
  onChange: (data: TeamRaceData) => void;
  /** Field errors */
  errors?: Record<string, string>;
  /** Fields that were populated by AI */
  aiExtractedFields?: Set<string>;
}

export function TufteTeamFields({
  data,
  onChange,
  errors = {},
  aiExtractedFields = new Set(),
}: TufteTeamFieldsProps) {
  const handleChange = (field: keyof TeamRaceData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <View>
      <TufteSectionLabel>TEAM DETAILS</TufteSectionLabel>

      <View style={styles.row}>
        <TufteFieldRow
          label="Your team name"
          value={data.yourTeamName || ''}
          onChangeText={(v) => handleChange('yourTeamName', v)}
          placeholder="e.g., RHKYC A"
          required
          halfWidth
          error={errors['team.yourTeamName']}
          aiExtracted={aiExtractedFields.has('team.yourTeamName')}
        />
        <TufteFieldRow
          label="Opponent team"
          value={data.opponentTeamName || ''}
          onChangeText={(v) => handleChange('opponentTeamName', v)}
          placeholder="e.g., ABC YC"
          required
          halfWidth
          error={errors['team.opponentTeamName']}
          aiExtracted={aiExtractedFields.has('team.opponentTeamName')}
        />
      </View>

      <View style={styles.row}>
        <TufteFieldRow
          label="Heat number"
          value={data.heatNumber || ''}
          onChangeText={(v) => handleChange('heatNumber', v)}
          placeholder="e.g., 4"
          keyboardType="numeric"
          halfWidth
          aiExtracted={aiExtractedFields.has('team.heatNumber')}
        />
        <TufteFieldRow
          label="Team size"
          value={data.teamSize || ''}
          onChangeText={(v) => handleChange('teamSize', v)}
          placeholder="e.g., 3"
          keyboardType="numeric"
          halfWidth
          aiExtracted={aiExtractedFields.has('team.teamSize')}
        />
      </View>

      <TufteFieldRow
        label="Team members"
        value={data.teamMembers || ''}
        onChangeText={(v) => handleChange('teamMembers', v)}
        placeholder="e.g., Jones #12, Lee #15, Chen #18"
        multiline
        aiExtracted={aiExtractedFields.has('team.teamMembers')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default TufteTeamFields;
