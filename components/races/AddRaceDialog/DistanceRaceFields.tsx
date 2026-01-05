/**
 * DistanceRaceFields Component
 *
 * Type-specific fields for Distance Racing
 */

import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { Navigation, Clock, MapPin, RotateCcw } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';

export interface DistanceRaceData {
  totalDistanceNm?: string;
  timeLimitHours?: string;
  startFinishSameLocation?: boolean;
  routeDescription?: string;
}

interface DistanceRaceFieldsProps {
  data: DistanceRaceData;
  onChange: (data: Partial<DistanceRaceData>) => void;
}

export function DistanceRaceFields({ data, onChange }: DistanceRaceFieldsProps) {
  return (
    <View style={styles.container}>
      {/* Total Distance */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Navigation size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Total Distance (nm)</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.totalDistanceNm || ''}
          onChangeText={(value) => onChange({ totalDistanceNm: value })}
          placeholder="e.g., 26"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Time Limit */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Clock size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Time Limit (hours)</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.timeLimitHours || ''}
          onChangeText={(value) => onChange({ timeLimitHours: value })}
          placeholder="e.g., 9"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Route Description */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <MapPin size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Route Description</Text>
        </View>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputMultiline]}
          value={data.routeDescription || ''}
          onChangeText={(value) => onChange({ routeDescription: value })}
          placeholder="e.g., Start at RHKYC → Stanley Bay → Around Island → Finish at RHKYC"
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Start/Finish Same Location Toggle */}
      <View style={styles.toggleField}>
        <View style={styles.toggleLeft}>
          <RotateCcw size={16} color={colors.text.secondary} />
          <View style={styles.toggleTextContainer}>
            <Text style={styles.fieldLabel}>Start & Finish Same Location</Text>
            <Text style={styles.toggleHint}>Round trip race</Text>
          </View>
        </View>
        <Switch
          value={data.startFinishSameLocation ?? false}
          onValueChange={(value) => onChange({ startFinishSameLocation: value })}
          trackColor={{ false: colors.border.medium, true: '#7C3AED40' }}
          thumbColor={data.startFinishSameLocation ? '#7C3AED' : colors.neutral[300]}
        />
      </View>

      {/* Note about waypoints */}
      <View style={styles.note}>
        <Text style={styles.noteText}>
          You can add detailed waypoints after creating the race
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
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
  note: {
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
  },
  noteText: {
    ...Typography.caption,
    color: '#7C3AED',
    fontStyle: 'italic',
  },
});

export default DistanceRaceFields;
