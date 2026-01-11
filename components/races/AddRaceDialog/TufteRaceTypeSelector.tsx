/**
 * TufteRaceTypeSelector Component
 *
 * Inline segmented control for race type selection.
 * Follows Tufte principles - text only, no decorative icons.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';
import type { RaceType } from '../RaceTypeSelector';

export interface TufteRaceTypeSelectorProps {
  /** Currently selected race type */
  selectedType: RaceType;
  /** Selection handler */
  onSelect: (type: RaceType) => void;
}

const RACE_TYPES: { type: RaceType; label: string }[] = [
  { type: 'fleet', label: 'Fleet' },
  { type: 'distance', label: 'Distance' },
  { type: 'match', label: 'Match' },
  { type: 'team', label: 'Team' },
];

export function TufteRaceTypeSelector({
  selectedType,
  onSelect,
}: TufteRaceTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {RACE_TYPES.map(({ type, label }) => {
        const isSelected = selectedType === type;
        return (
          <Pressable
            key={type}
            style={[styles.segment, isSelected && styles.segmentActive]}
            onPress={() => onSelect(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${label} racing`}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 8,
    padding: 2,
    marginBottom: TUFTE_FORM_SPACING.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  segmentTextActive: {
    color: TUFTE_FORM_COLORS.label,
    fontWeight: '600',
  },
});

export default TufteRaceTypeSelector;
