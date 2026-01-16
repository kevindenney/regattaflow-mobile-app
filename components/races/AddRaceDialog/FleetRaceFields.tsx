/**
 * FleetRaceFields Component
 *
 * Type-specific fields for Fleet Racing
 */

import { BorderRadius, colors, Spacing, Typography } from '@/constants/designSystem';
import { Hash, Navigation, Users } from 'lucide-react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { CourseSelector } from './CourseSelector';

export interface FleetRaceData {
  courseType?: string;
  numberOfLaps?: string;
  expectedFleetSize?: string;
  boatClass?: string;
  /** Selected boat ID from user's boats */
  boatId?: string;
}

interface FleetRaceFieldsProps {
  data: FleetRaceData;
  onChange: (data: Partial<FleetRaceData>) => void;
}

export function FleetRaceFields({ data, onChange }: FleetRaceFieldsProps) {
  return (
    <View style={styles.container}>
      {/* Course Type */}
      <CourseSelector
        label="Course Type"
        selectedCourse={data.courseType}
        onSelect={(courseName) => onChange({ courseType: courseName || '' })}
        placeholder="Select course type"
      />

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
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  suggestionChip: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default FleetRaceFields;
