/**
 * FleetRaceFields Component
 *
 * Type-specific fields for Fleet Racing
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Navigation, Hash, Users } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';

export interface FleetRaceData {
  courseType?: string;
  numberOfLaps?: string;
  expectedFleetSize?: string;
  boatClass?: string;
}

interface FleetRaceFieldsProps {
  data: FleetRaceData;
  onChange: (data: Partial<FleetRaceData>) => void;
}

export function FleetRaceFields({ data, onChange }: FleetRaceFieldsProps) {
  return (
    <View style={styles.container}>
      {/* Course Type */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Navigation size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Course Type</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.courseType || ''}
          onChangeText={(value) => onChange({ courseType: value })}
          placeholder="e.g., Windward-Leeward, Triangle"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Number of Laps */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Hash size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Number of Laps</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.numberOfLaps || ''}
          onChangeText={(value) => onChange({ numberOfLaps: value })}
          placeholder="e.g., 3"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
        />
      </View>

      {/* Expected Fleet Size */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Users size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Expected Fleet Size</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.expectedFleetSize || ''}
          onChangeText={(value) => onChange({ expectedFleetSize: value })}
          placeholder="e.g., 25 boats"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
        />
      </View>

      {/* Boat Class */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Navigation size={16} color={colors.text.secondary} />
          <Text style={styles.fieldLabel}>Boat Class</Text>
        </View>
        <TextInput
          style={styles.fieldInput}
          value={data.boatClass || ''}
          onChangeText={(value) => onChange({ boatClass: value })}
          placeholder="e.g., J/70, Laser, 420"
          placeholderTextColor={colors.text.tertiary}
        />
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
});

export default FleetRaceFields;
