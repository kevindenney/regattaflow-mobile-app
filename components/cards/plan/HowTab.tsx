/**
 * HowTab — "How" phase of the Blank Plan Card
 *
 * Lets users create a step-by-step execution plan with materials and timeline.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { ListChecks, Plus, X, Package, Clock, AlertTriangle, Check } from 'lucide-react-native';
import type { PlanHowData, PlanHowStep } from '@/types/planCard';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  red: '#FF3B30',
  green: '#34C759',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

interface HowTabProps {
  data: PlanHowData;
  onChange: (data: PlanHowData) => void;
  readOnly?: boolean;
}

export function HowTab({ data, onChange, readOnly = false }: HowTabProps) {
  const [newMaterial, setNewMaterial] = useState('');

  // --- Steps ---

  const addStep = useCallback(() => {
    const step: PlanHowStep = { id: Date.now().toString(), text: '', completed: false };
    onChange({ ...data, steps: [...data.steps, step] });
  }, [data, onChange]);

  const updateStep = useCallback(
    (id: string, text: string) => {
      onChange({
        ...data,
        steps: data.steps.map((s) => (s.id === id ? { ...s, text } : s)),
      });
    },
    [data, onChange],
  );

  const toggleStep = useCallback(
    (id: string) => {
      onChange({
        ...data,
        steps: data.steps.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
      });
    },
    [data, onChange],
  );

  const removeStep = useCallback(
    (id: string) => {
      onChange({ ...data, steps: data.steps.filter((s) => s.id !== id) });
    },
    [data, onChange],
  );

  // --- Materials ---

  const addMaterial = useCallback(() => {
    if (!newMaterial.trim()) return;
    onChange({ ...data, materials: [...data.materials, newMaterial.trim()] });
    setNewMaterial('');
  }, [data, onChange, newMaterial]);

  const removeMaterial = useCallback(
    (index: number) => {
      onChange({ ...data, materials: data.materials.filter((_, i) => i !== index) });
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
      {/* Steps */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ListChecks size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>STEPS</Text>
        </View>

        {data.steps.map((step, index) => (
          <View key={step.id} style={styles.stepRow}>
            {!readOnly ? (
              <TouchableOpacity
                style={[styles.stepCheck, step.completed && styles.stepCheckDone]}
                onPress={() => toggleStep(step.id)}
              >
                {step.completed ? (
                  <Check size={12} color={COLORS.systemBackground} />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={[styles.stepCheck, step.completed && styles.stepCheckDone]}>
                {step.completed ? (
                  <Check size={12} color={COLORS.systemBackground} />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
            )}
            {readOnly ? (
              <Text style={[styles.stepText, step.completed && styles.stepTextDone]}>
                {step.text || '\u2014'}
              </Text>
            ) : (
              <TextInput
                style={[styles.stepInput, step.completed && styles.stepTextDone]}
                value={step.text}
                onChangeText={(t) => updateStep(step.id, t)}
                placeholder="What's the next step?"
                placeholderTextColor={COLORS.tertiaryLabel}
              />
            )}
            {!readOnly && (
              <TouchableOpacity
                onPress={() => removeStep(step.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={COLORS.red} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {!readOnly && (
          <TouchableOpacity style={styles.addButton} onPress={addStep} activeOpacity={0.7}>
            <Plus size={14} color={COLORS.blue} />
            <Text style={styles.addButtonText}>Add Step</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Materials */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>MATERIALS & EQUIPMENT</Text>
        </View>

        <View style={styles.chipContainer}>
          {data.materials.map((mat, index) => (
            <View key={`${mat}-${index}`} style={styles.chip}>
              <Text style={styles.chipText}>{mat}</Text>
              {!readOnly && (
                <TouchableOpacity
                  onPress={() => removeMaterial(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color={COLORS.secondaryLabel} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {!readOnly && (
          <TextInput
            style={styles.chipInput}
            value={newMaterial}
            onChangeText={setNewMaterial}
            placeholder="Add material or equipment..."
            placeholderTextColor={COLORS.tertiaryLabel}
            onSubmitEditing={addMaterial}
            returnKeyType="done"
          />
        )}
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>TIMELINE</Text>
        </View>
        {readOnly ? (
          <Text style={styles.bodyText}>{data.timeline || '\u2014'}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={data.timeline ?? ''}
            onChangeText={(t) => onChange({ ...data, timeline: t })}
            placeholder="Time allocation or schedule notes"
            placeholderTextColor={COLORS.tertiaryLabel}
          />
        )}
      </View>

      {/* Contingency */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertTriangle size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>CONTINGENCY</Text>
        </View>
        {readOnly ? (
          <Text style={styles.bodyText}>{data.contingency || '\u2014'}</Text>
        ) : (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={data.contingency ?? ''}
            onChangeText={(t) => onChange({ ...data, contingency: t })}
            placeholder="What if things don't go as planned?"
            placeholderTextColor={COLORS.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />
        )}
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  stepCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  stepNumber: { fontSize: 11, fontWeight: '700', color: COLORS.blue },
  stepInput: { flex: 1, fontSize: 15, color: COLORS.label },
  stepText: { flex: 1, fontSize: 15, color: COLORS.label, lineHeight: 22 },
  stepTextDone: { textDecorationLine: 'line-through', color: COLORS.tertiaryLabel },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  addButtonText: { fontSize: 14, fontWeight: '500', color: COLORS.blue },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.label },
  chipInput: {
    fontSize: 15,
    color: COLORS.label,
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  input: { fontSize: 15, color: COLORS.label, padding: 12, backgroundColor: COLORS.gray6, borderRadius: 10 },
  multiline: { minHeight: 72, paddingTop: 12 },
  bodyText: { fontSize: 15, color: COLORS.label, lineHeight: 22, paddingHorizontal: 4 },
});

export default HowTab;
