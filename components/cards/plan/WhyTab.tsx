/**
 * WhyTab — "Why" phase of the Blank Plan Card
 *
 * Lets users define learning objectives, personal motivation, and linked lessons.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Target, Plus, X, Heart, BookOpen } from 'lucide-react-native';
import type { PlanWhyData } from '@/types/planCard';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  red: '#FF3B30',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

interface WhyTabProps {
  data: PlanWhyData;
  onChange: (data: PlanWhyData) => void;
  readOnly?: boolean;
}

export function WhyTab({ data, onChange, readOnly = false }: WhyTabProps) {
  const addObjective = useCallback(() => {
    onChange({ ...data, objectives: [...data.objectives, ''] });
  }, [data, onChange]);

  const updateObjective = useCallback(
    (index: number, text: string) => {
      const updated = [...data.objectives];
      updated[index] = text;
      onChange({ ...data, objectives: updated });
    },
    [data, onChange],
  );

  const removeObjective = useCallback(
    (index: number) => {
      onChange({ ...data, objectives: data.objectives.filter((_, i) => i !== index) });
    },
    [data, onChange],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Learning Objectives */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>LEARNING OBJECTIVES</Text>
        </View>

        {data.objectives.map((obj, index) => (
          <View key={index} style={styles.objectiveRow}>
            <View style={styles.objectiveNumber}>
              <Text style={styles.objectiveNumberText}>{index + 1}</Text>
            </View>
            {readOnly ? (
              <Text style={styles.objectiveText}>{obj || '\u2014'}</Text>
            ) : (
              <TextInput
                style={styles.objectiveInput}
                value={obj}
                onChangeText={(t) => updateObjective(index, t)}
                placeholder="What do you want to learn or achieve?"
                placeholderTextColor={COLORS.tertiaryLabel}
              />
            )}
            {!readOnly && (
              <TouchableOpacity
                onPress={() => removeObjective(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={COLORS.red} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {!readOnly && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={addObjective}
            activeOpacity={0.7}
          >
            <Plus size={14} color={COLORS.blue} />
            <Text style={styles.addButtonText}>Add Objective</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Personal Motivation */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Heart size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>PERSONAL MOTIVATION</Text>
        </View>
        {readOnly ? (
          <Text style={styles.bodyText}>{data.motivation || '\u2014'}</Text>
        ) : (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={data.motivation ?? ''}
            onChangeText={(t) => onChange({ ...data, motivation: t })}
            placeholder="Why is this important to you?"
            placeholderTextColor={COLORS.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />
        )}
      </View>

      {/* Linked Lesson */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BookOpen size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>LINKED LESSON</Text>
        </View>
        <View style={styles.linkedLesson}>
          <Text style={data.linkedLessonTitle ? styles.linkedLessonText : styles.linkedLessonPlaceholder}>
            {data.linkedLessonTitle || 'Link to a lesson...'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  objectiveNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.blue}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveNumberText: { fontSize: 12, fontWeight: '700', color: COLORS.blue },
  objectiveInput: { flex: 1, fontSize: 15, color: COLORS.label },
  objectiveText: { flex: 1, fontSize: 15, color: COLORS.label, lineHeight: 22 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  addButtonText: { fontSize: 14, fontWeight: '500', color: COLORS.blue },
  input: {
    fontSize: 15,
    color: COLORS.label,
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  multiline: { minHeight: 72, paddingTop: 12 },
  bodyText: { fontSize: 15, color: COLORS.label, lineHeight: 22, paddingHorizontal: 4 },
  linkedLesson: {
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  linkedLessonText: { fontSize: 15, color: COLORS.blue, fontWeight: '500' },
  linkedLessonPlaceholder: { fontSize: 15, color: COLORS.tertiaryLabel },
});

export default WhyTab;
