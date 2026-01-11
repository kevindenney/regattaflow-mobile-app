/**
 * LogPracticeForm
 *
 * Quick form for logging ad-hoc practice sessions.
 * Minimal fields: focus area, duration, rating, notes.
 * Apple HIG compliant with Tufte design principles.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Target,
  Clock,
  Star,
  MessageSquare,
  Check,
} from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import type { SkillArea, SKILL_AREA_LABELS } from '@/types/practice';

// Skill area options
const SKILL_OPTIONS: Array<{ area: SkillArea; label: string }> = [
  { area: 'start-execution', label: 'Starting' },
  { area: 'upwind-execution', label: 'Upwind' },
  { area: 'shift-awareness', label: 'Shifts' },
  { area: 'windward-rounding', label: 'Windward Mark' },
  { area: 'downwind-speed', label: 'Downwind' },
  { area: 'leeward-rounding', label: 'Leeward Mark' },
  { area: 'crew-coordination', label: 'Crew Work' },
  { area: 'equipment-prep', label: 'Equipment' },
];

// Duration presets
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

interface LogPracticeFormProps {
  onSubmit: (data: LogPracticeData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface LogPracticeData {
  focusAreas: SkillArea[];
  durationMinutes: number;
  rating: number;
  notes: string;
}

/**
 * Star Rating Component
 */
function StarRating({
  rating,
  onSelect,
  size = 32,
}: {
  rating: number;
  onSelect: (rating: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          <Star
            size={size}
            color={IOS_COLORS.orange}
            fill={i <= rating ? IOS_COLORS.orange : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function LogPracticeForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LogPracticeFormProps) {
  const [focusAreas, setFocusAreas] = useState<SkillArea[]>([]);
  const [duration, setDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const toggleFocusArea = (area: SkillArea) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area].slice(0, 3)
    );
  };

  const handleDurationSelect = (mins: number) => {
    setDuration(mins);
    setCustomDuration('');
  };

  const handleCustomDuration = (text: string) => {
    setCustomDuration(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDuration(parsed);
    }
  };

  const handleSubmit = async () => {
    if (focusAreas.length === 0) return;

    await onSubmit({
      focusAreas,
      durationMinutes: duration,
      rating,
      notes,
    });
  };

  const isValid = focusAreas.length > 0 && duration > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Focus Areas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={IOS_COLORS.purple} />
            <Text style={styles.sectionTitle}>What did you practice?</Text>
          </View>
          <Text style={styles.sectionHint}>Select up to 3 focus areas</Text>
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
          <View style={styles.sectionHeader}>
            <Clock size={18} color={IOS_COLORS.blue} />
            <Text style={styles.sectionTitle}>How long?</Text>
          </View>
          <View style={styles.durationGrid}>
            {DURATION_PRESETS.map((mins) => {
              const isSelected = duration === mins && customDuration === '';
              return (
                <TouchableOpacity
                  key={mins}
                  style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                  onPress={() => handleDurationSelect(mins)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      isSelected && styles.durationChipTextSelected,
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TextInput
              style={[
                styles.customDurationInput,
                customDuration !== '' && styles.customDurationInputActive,
              ]}
              value={customDuration}
              onChangeText={handleCustomDuration}
              placeholder="Other"
              placeholderTextColor={IOS_COLORS.gray3}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={18} color={IOS_COLORS.orange} />
            <Text style={styles.sectionTitle}>How did it go?</Text>
          </View>
          <Text style={styles.sectionHint}>Optional rating</Text>
          <View style={styles.ratingContainer}>
            <StarRating rating={rating} onSelect={setRating} />
            {rating > 0 && (
              <TouchableOpacity onPress={() => setRating(0)}>
                <Text style={styles.clearRatingText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={18} color={IOS_COLORS.gray} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="What went well? What to improve?"
            placeholderTextColor={IOS_COLORS.gray3}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValid || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Logging...' : 'Log Practice'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginTop: -4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  chipSelected: {
    backgroundColor: `${IOS_COLORS.purple}15`,
    borderColor: IOS_COLORS.purple,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  chipTextSelected: {
    color: IOS_COLORS.purple,
    fontWeight: '600',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    minWidth: 60,
    alignItems: 'center',
  },
  durationChipSelected: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderColor: IOS_COLORS.blue,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  durationChipTextSelected: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  customDurationInput: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    minWidth: 70,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  customDurationInputActive: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderColor: IOS_COLORS.blue,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 2,
  },
  clearRatingText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  notesInput: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
    minHeight: 100,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.purple,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LogPracticeForm;
