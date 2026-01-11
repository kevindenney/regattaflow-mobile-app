/**
 * TufteFleetFields Component
 *
 * Fleet racing specific fields.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TufteFieldRow } from './TufteFieldRow';
import { TufteSectionLabel } from './TufteSectionLabel';
import { BoatSelector } from './BoatSelector';
import { CourseSelector } from './CourseSelector';
import type { FleetRaceData } from './FleetRaceFields';

export interface TufteFleetFieldsProps {
  /** Fleet race data */
  data: FleetRaceData;
  /** Update handler */
  onChange: (data: FleetRaceData) => void;
  /** Fields that were populated by AI */
  aiExtractedFields?: Set<string>;
}

export function TufteFleetFields({
  data,
  onChange,
  aiExtractedFields = new Set(),
}: TufteFleetFieldsProps) {
  const handleChange = (field: keyof FleetRaceData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Handle boat selection - auto-populates class
  const handleBoatSelect = (boatId: string | null, className: string | null) => {
    onChange({
      ...data,
      boatId: boatId || undefined,
      // Auto-populate class from boat (only if not already set or if clearing)
      boatClass: className || data.boatClass,
    });
  };

  return (
    <View>
      <TufteSectionLabel>YOUR BOAT</TufteSectionLabel>

      {/* Boat Selector - auto-fills class */}
      <View style={styles.boatRow}>
        <BoatSelector
          selectedBoatId={data.boatId}
          onSelect={handleBoatSelect}
          placeholder="Select your boat"
          label="Boat"
        />
      </View>

      <TufteSectionLabel>FLEET DETAILS</TufteSectionLabel>

      <View style={styles.row}>
        <TufteFieldRow
          label="Boat class"
          value={data.boatClass || ''}
          onChangeText={(v) => handleChange('boatClass', v)}
          placeholder="e.g., J/70, Laser"
          halfWidth
          aiExtracted={aiExtractedFields.has('fleet.boatClass')}
        />
        <TufteFieldRow
          label="Expected fleet size"
          value={data.expectedFleetSize || ''}
          onChangeText={(v) => handleChange('expectedFleetSize', v)}
          placeholder="e.g., 25"
          keyboardType="numeric"
          halfWidth
          aiExtracted={aiExtractedFields.has('fleet.expectedFleetSize')}
        />
      </View>

      <View style={styles.row}>
        <CourseSelector
          selectedCourse={data.courseType}
          onSelect={(courseName) => handleChange('courseType', courseName || '')}
          raceType="fleet"
          placeholder="Select course type"
          halfWidth
          aiExtracted={aiExtractedFields.has('fleet.courseType')}
        />
        <TufteFieldRow
          label="Number of laps"
          value={data.numberOfLaps || ''}
          onChangeText={(v) => handleChange('numberOfLaps', v)}
          placeholder="e.g., 3"
          keyboardType="numeric"
          halfWidth
          aiExtracted={aiExtractedFields.has('fleet.numberOfLaps')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boatRow: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default TufteFleetFields;
