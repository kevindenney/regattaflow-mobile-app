/**
 * TeamRaceFields Component
 *
 * Type-specific fields for Team Racing
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Users, Hash, UserPlus } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';

export interface TeamRaceData {
  yourTeamName?: string;
  opponentTeamName?: string;
  heatNumber?: string;
  teamSize?: string;
  teamMembers?: string;
}

interface TeamRaceFieldsProps {
  data: TeamRaceData;
  onChange: (data: Partial<TeamRaceData>) => void;
}

export function TeamRaceFields({ data, onChange }: TeamRaceFieldsProps) {
  return (
    <View style={styles.container}>
      {/* Your Team Name (Required) */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Users size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>
            Your Team Name <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.yourTeamName || ''}
          onChangeText={(value) => onChange({ yourTeamName: value })}
          placeholder="e.g., RHKYC A"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Opponent Team Name (Required) */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Users size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>
            Opponent Team Name <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.opponentTeamName || ''}
          onChangeText={(value) => onChange({ opponentTeamName: value })}
          placeholder="e.g., ABC Yacht Club"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Heat Number & Team Size */}
      <View style={styles.row}>
        <View style={[styles.field, styles.halfWidth]}>
          <View style={styles.fieldHeader}>
            <Hash size={16} color={colors.text.secondary} />
            <Text style={styles.fieldLabel}>Heat Number</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            value={data.heatNumber || ''}
            onChangeText={(value) => onChange({ heatNumber: value })}
            placeholder="e.g., 4"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.field, styles.halfWidth]}>
          <View style={styles.fieldHeader}>
            <Users size={16} color={colors.text.secondary} />
            <Text style={styles.fieldLabel}>Team Size</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            value={data.teamSize || ''}
            onChangeText={(value) => onChange({ teamSize: value })}
            placeholder="e.g., 3 or 4"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Team Members */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <UserPlus size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Team Members</Text>
        </View>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputMultiline]}
          value={data.teamMembers || ''}
          onChangeText={(value) => onChange({ teamMembers: value })}
          placeholder="e.g., Jones #12, Lee #15, Chen #18"
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Text style={styles.fieldHint}>
          Enter names and sail numbers, separated by commas
        </Text>
      </View>

      {/* Scoring Reference */}
      <View style={styles.scoringReference}>
        <Text style={styles.scoringTitle}>Team Racing Scoring</Text>
        <View style={styles.scoringRow}>
          <View style={styles.scoringItem}>
            <Text style={styles.scoringLabel}>Win Condition</Text>
            <Text style={styles.scoringValue}>Sum 10</Text>
          </View>
          <View style={styles.scoringItem}>
            <Text style={styles.scoringLabel}>Best Score</Text>
            <Text style={styles.scoringValue}>1+2+3 = 6</Text>
          </View>
          <View style={styles.scoringItem}>
            <Text style={styles.scoringLabel}>Worst Score</Text>
            <Text style={styles.scoringValue}>4+5+6 = 15</Text>
          </View>
        </View>
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
  fieldInputMultiline: {
    minHeight: 80,
  },
  fieldHint: {
    ...Typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  scoringReference: {
    backgroundColor: '#F0FDFA',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#0D948820',
  },
  scoringTitle: {
    ...Typography.captionBold,
    color: '#0D9488',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoringItem: {
    alignItems: 'center',
  },
  scoringLabel: {
    ...Typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    marginBottom: 2,
  },
  scoringValue: {
    ...Typography.bodyBold,
    color: '#0D9488',
    fontSize: 13,
  },
});

export default TeamRaceFields;
