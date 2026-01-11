/**
 * TuftePracticeLogForm
 *
 * Inline log form following Tufte principles:
 * - Typography-driven hierarchy
 * - Minimal visual chrome
 * - Data-dense chip selectors
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  TUFTE_FORM_COLORS,
  TUFTE_FORM_SPACING,
} from '@/components/races/AddRaceDialog/tufteFormStyles';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import type { SkillArea } from '@/types/practice';

// Skill area options - condensed labels
const SKILL_OPTIONS: Array<{ area: SkillArea; label: string }> = [
  { area: 'start-execution', label: 'Starts' },
  { area: 'upwind-execution', label: 'Upwind' },
  { area: 'downwind-speed', label: 'Downwind' },
  { area: 'shift-awareness', label: 'Shifts' },
  { area: 'windward-rounding', label: 'Windward' },
  { area: 'leeward-rounding', label: 'Leeward' },
  { area: 'crew-coordination', label: 'Crew' },
  { area: 'equipment-prep', label: 'Boat' },
];

// Duration presets
const DURATION_PRESETS = [15, 30, 45, 60, 90];

export interface LogPracticeData {
  focusAreas: SkillArea[];
  durationMinutes: number;
  notes: string;
}

interface TuftePracticeLogFormProps {
  onSubmit: (data: LogPracticeData) => Promise<void>;
  isSubmitting?: boolean;
}

export function TuftePracticeLogForm({
  onSubmit,
  isSubmitting = false,
}: TuftePracticeLogFormProps) {
  const [focusAreas, setFocusAreas] = useState<SkillArea[]>([]);
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');

  const toggleFocusArea = (area: SkillArea) => {
    setFocusAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area].slice(0, 3)
    );
  };

  const handleSubmit = async () => {
    if (focusAreas.length === 0 || duration === 0) return;

    await onSubmit({
      focusAreas,
      durationMinutes: duration,
      notes,
    });

    // Reset form on success
    setFocusAreas([]);
    setDuration(30);
    setNotes('');
  };

  const isValid = focusAreas.length > 0 && duration > 0;

  return (
    <View style={styles.container}>
      {/* Focus Areas */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WHAT DID YOU PRACTICE?</Text>
        <View style={styles.chipGrid}>
          {SKILL_OPTIONS.map((option) => {
            const isSelected = focusAreas.includes(option.area);
            return (
              <TouchableOpacity
                key={option.area}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleFocusArea(option.area)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextSelected]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HOW LONG?</Text>
        <View style={styles.durationRow}>
          {DURATION_PRESETS.map((mins) => {
            const isSelected = duration === mins;
            return (
              <TouchableOpacity
                key={mins}
                style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                onPress={() => setDuration(mins)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationText,
                    isSelected && styles.durationTextSelected,
                  ]}
                >
                  {mins}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Key takeaways..."
          placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, (!isValid || isSubmitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={TUFTE_FORM_COLORS.primary} />
        ) : (
          <Text style={styles.submitText}>Log This</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.lg,
    gap: TUFTE_FORM_SPACING.lg,
  },
  section: {
    gap: TUFTE_FORM_SPACING.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: TUFTE_BACKGROUND,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  chipSelected: {
    backgroundColor: TUFTE_FORM_COLORS.primary,
    borderColor: TUFTE_FORM_COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: TUFTE_BACKGROUND,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  durationChipSelected: {
    backgroundColor: TUFTE_FORM_COLORS.primary,
    borderColor: TUFTE_FORM_COLORS.primary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
    minHeight: 60,
  },
  submitButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.primary,
  },
});

export default TuftePracticeLogForm;
