/**
 * NutritionReview — Displays AI-extracted nutrition entries from a step.
 *
 * Groups meals by type, shows macros, confidence bars, and verify controls.
 * Supports inline editing, deleting, and adding new entries.
 * Mirrors MeasurementReview in pattern and design tokens.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StepNutrition, StepNutritionEntry } from '@/types/step-nutrition';
import type { MealType, NutritionTargets } from '@/types/nutrition';

// Design tokens matching StepCritiqueContent / MeasurementReview
const C = {
  cardBg: '#FFFFFF',
  cardBorder: '#E5E4E1',
  sectionLabel: '#9C9B99',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#D1D0CD',
  accent: '#34C759', // green for nutrition
  accentGlow: '#C8F0D8',
  coral: '#D89575',
  dotInactive: '#EDECEA',
  radius: 12,
} as const;

const MEAL_TYPE_ORDER: MealType[] = [
  'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other',
];

interface NutritionReviewProps {
  nutrition: StepNutrition;
  targets?: NutritionTargets;
  readOnly?: boolean;
  onUpdate?: (updated: StepNutritionEntry[]) => void;
  onReExtract?: () => Promise<void>;
}

export function NutritionReview({
  nutrition,
  targets,
  readOnly,
  onUpdate,
  onReExtract,
}: NutritionReviewProps) {
  const entries = nutrition.entries;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingMealType, setAddingMealType] = useState<MealType | null>(null);
  const [reExtracting, setReExtracting] = useState(false);

  const handleReExtract = useCallback(async () => {
    if (!onReExtract || reExtracting) return;
    setReExtracting(true);
    try {
      await onReExtract();
    } finally {
      setReExtracting(false);
    }
  }, [onReExtract, reExtracting]);

  const handleVerifyAll = useCallback(() => {
    const updated = entries.map((e) => ({ ...e, verified: true }));
    onUpdate?.(updated);
  }, [entries, onUpdate]);

  const handleVerifySingle = useCallback(
    (id: string) => {
      const updated = entries.map((e) => (e.id === id ? { ...e, verified: true } : e));
      onUpdate?.(updated);
    },
    [entries, onUpdate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      onUpdate?.(updated);
      if (editingId === id) setEditingId(null);
    },
    [entries, onUpdate, editingId],
  );

  const handleSaveEdit = useCallback(
    (id: string, changes: Partial<StepNutritionEntry>) => {
      const updated = entries.map((e) =>
        e.id === id ? { ...e, ...changes, verified: true, confidence: 'exact' as const, source: 'manual' as const } : e,
      );
      onUpdate?.(updated);
      setEditingId(null);
    },
    [entries, onUpdate],
  );

  const handleAddEntry = useCallback(
    (entry: StepNutritionEntry) => {
      onUpdate?.([...entries, entry]);
      setAddingMealType(null);
    },
    [entries, onUpdate],
  );

  if (!entries.length && !addingMealType) return null;

  const unverifiedCount = entries.filter((e) => !e.verified).length;

  // Compute totals
  const totalCal = entries.reduce((s, e) => s + (e.calories ?? 0), 0);
  const totalPro = entries.reduce((s, e) => s + (e.protein_g ?? 0), 0);
  const totalCarbs = entries.reduce((s, e) => s + (e.carbs_g ?? 0), 0);
  const totalFat = entries.reduce((s, e) => s + (e.fat_g ?? 0), 0);

  // Group by meal_type
  const grouped = new Map<string, StepNutritionEntry[]>();
  for (const e of entries) {
    const key = e.meal_type ?? 'other';
    const list = grouped.get(key) ?? [];
    list.push(e);
    grouped.set(key, list);
  }

  // Sort groups by meal order
  const sortedGroups = Array.from(grouped.entries()).sort(
    ([a], [b]) => MEAL_TYPE_ORDER.indexOf(a as MealType) - MEAL_TYPE_ORDER.indexOf(b as MealType),
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="nutrition-outline" size={14} color={C.accent} />
          <Text style={styles.sectionLabel}>NUTRITION</Text>
        </View>
        <View style={styles.headerRight}>
          {!readOnly && onReExtract && (
            <Pressable onPress={handleReExtract} hitSlop={8} disabled={reExtracting}>
              {reExtracting ? (
                <ActivityIndicator size="small" color={C.accent} />
              ) : (
                <View style={styles.reExtractButton}>
                  <Ionicons name="refresh-outline" size={12} color={C.accent} />
                  <Text style={styles.verifyAllText}>Re-extract</Text>
                </View>
              )}
            </Pressable>
          )}
          {!readOnly && unverifiedCount > 0 && (
            <Pressable onPress={handleVerifyAll} hitSlop={8}>
              <Text style={styles.verifyAllText}>Verify all</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Meal groups */}
      {sortedGroups.map(([mealType, meals]) => (
        <View key={mealType} style={styles.group}>
          <Text style={styles.groupTitle}>{formatMealType(mealType)}</Text>
          {meals.map((entry) =>
            editingId === entry.id && !readOnly ? (
              <EditEntryForm
                key={entry.id}
                entry={entry}
                onSave={(changes) => handleSaveEdit(entry.id, changes)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDelete(entry.id)}
              />
            ) : (
              <NutritionEntryRow
                key={entry.id}
                entry={entry}
                readOnly={readOnly}
                onVerify={() => handleVerifySingle(entry.id)}
                onEdit={() => setEditingId(entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            ),
          )}
        </View>
      ))}

      {/* Add entry form */}
      {!readOnly && addingMealType && (
        <AddEntryForm
          mealType={addingMealType}
          onSave={handleAddEntry}
          onCancel={() => setAddingMealType(null)}
        />
      )}

      {/* Totals */}
      {entries.length > 0 && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Total</Text>
          <View style={styles.totalsValues}>
            <MacroPill label="Cal" value={totalCal} target={targets?.calories_daily} />
            <MacroPill label="Pro" value={Math.round(totalPro)} unit="g" target={targets?.protein_daily_g} />
            <MacroPill label="Carb" value={Math.round(totalCarbs)} unit="g" target={targets?.carbs_daily_g} />
            <MacroPill label="Fat" value={Math.round(totalFat)} unit="g" target={targets?.fat_daily_g} />
          </View>
        </View>
      )}

      {/* Add meal button */}
      {!readOnly && !addingMealType && (
        <MealTypePicker onSelect={setAddingMealType} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NutritionEntryRow({
  entry,
  readOnly,
  onVerify,
  onEdit,
  onDelete,
}: {
  entry: StepNutritionEntry;
  readOnly?: boolean;
  onVerify: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      style={[styles.row, !entry.verified && styles.rowUnverified]}
      onPress={readOnly ? undefined : onEdit}
    >
      <View style={styles.rowMain}>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>{entry.description}</Text>
          <Text style={styles.rowMacros}>
            {[
              entry.calories && `${entry.calories} cal`,
              entry.protein_g && `${Math.round(entry.protein_g)}g pro`,
              entry.carbs_g && `${Math.round(entry.carbs_g)}g carb`,
              entry.fat_g && `${Math.round(entry.fat_g)}g fat`,
            ].filter(Boolean).join(' · ')}
          </Text>
        </View>

        {!readOnly && (
          <View style={styles.rowActions}>
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
              hitSlop={6}
            >
              <Ionicons name="close-circle-outline" size={16} color={C.coral} />
            </Pressable>
            {!entry.verified ? (
              <Pressable
                onPress={(e) => { e.stopPropagation?.(); onVerify(); }}
                hitSlop={6}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={C.accent} />
              </Pressable>
            ) : (
              <Ionicons name="checkmark-circle" size={16} color={C.accent} />
            )}
          </View>
        )}
      </View>

      {!entry.verified && (
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceBar}>
            <View style={[styles.confidenceFill, { width: `${confidenceToPercent(entry.confidence)}%` }]} />
          </View>
          <Text style={styles.confidenceText}>{entry.confidence}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Inline editor for an existing entry */
function EditEntryForm({
  entry,
  onSave,
  onCancel,
  onDelete,
}: {
  entry: StepNutritionEntry;
  onSave: (changes: Partial<StepNutritionEntry>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [desc, setDesc] = useState(entry.description);
  const [cal, setCal] = useState(entry.calories?.toString() ?? '');
  const [pro, setPro] = useState(entry.protein_g?.toString() ?? '');
  const [carb, setCarb] = useState(entry.carbs_g?.toString() ?? '');
  const [fat, setFat] = useState(entry.fat_g?.toString() ?? '');

  const handleSave = () => {
    onSave({
      description: desc.trim() || entry.description,
      calories: parseNum(cal),
      protein_g: parseNum(pro),
      carbs_g: parseNum(carb),
      fat_g: parseNum(fat),
    });
  };

  return (
    <View style={styles.editForm}>
      <TextInput
        style={styles.editInput}
        value={desc}
        onChangeText={setDesc}
        placeholder="What did you eat?"
        autoFocus
      />
      <View style={styles.editMacroRow}>
        <MacroInput label="Cal" value={cal} onChange={setCal} />
        <MacroInput label="Pro (g)" value={pro} onChange={setPro} />
        <MacroInput label="Carb (g)" value={carb} onChange={setCarb} />
        <MacroInput label="Fat (g)" value={fat} onChange={setFat} />
      </View>
      <View style={styles.editActions}>
        <Pressable style={styles.editDeleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={14} color={C.coral} />
          <Text style={styles.editDeleteText}>Delete</Text>
        </Pressable>
        <View style={styles.editRightActions}>
          <Pressable style={styles.editCancelButton} onPress={onCancel}>
            <Text style={styles.editCancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.editSaveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.editSaveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Form for adding a brand-new entry */
function AddEntryForm({
  mealType,
  onSave,
  onCancel,
}: {
  mealType: MealType;
  onSave: (entry: StepNutritionEntry) => void;
  onCancel: () => void;
}) {
  const [desc, setDesc] = useState('');
  const [cal, setCal] = useState('');
  const [pro, setPro] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  const handleSave = () => {
    if (!desc.trim()) return;
    onSave({
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      meal_type: mealType,
      description: desc.trim(),
      calories: parseNum(cal),
      protein_g: parseNum(pro),
      carbs_g: parseNum(carb),
      fat_g: parseNum(fat),
      confidence: 'exact',
      source: 'manual',
      verified: true,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.editForm}>
      <View style={styles.addFormHeader}>
        <Text style={styles.groupTitle}>{formatMealType(mealType)}</Text>
      </View>
      <TextInput
        style={styles.editInput}
        value={desc}
        onChangeText={setDesc}
        placeholder="What did you eat?"
        autoFocus
      />
      <View style={styles.editMacroRow}>
        <MacroInput label="Cal" value={cal} onChange={setCal} />
        <MacroInput label="Pro (g)" value={pro} onChange={setPro} />
        <MacroInput label="Carb (g)" value={carb} onChange={setCarb} />
        <MacroInput label="Fat (g)" value={fat} onChange={setFat} />
      </View>
      <View style={styles.editActions}>
        <View />
        <View style={styles.editRightActions}>
          <Pressable style={styles.editCancelButton} onPress={onCancel}>
            <Text style={styles.editCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.editSaveButton, !desc.trim() && styles.editSaveButtonDisabled]}
            onPress={handleSave}
            disabled={!desc.trim()}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.editSaveText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Quick-pick meal type, then opens AddEntryForm */
function MealTypePicker({ onSelect }: { onSelect: (type: MealType) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Pressable style={styles.addMealButton} onPress={() => setExpanded(true)}>
        <Ionicons name="add-circle-outline" size={16} color={C.accent} />
        <Text style={styles.addMealText}>Add meal</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.mealPickerContainer}>
      <Text style={styles.mealPickerLabel}>What meal?</Text>
      <View style={styles.mealPickerChips}>
        {MEAL_TYPE_ORDER.map((type) => (
          <Pressable
            key={type}
            style={styles.mealPickerChip}
            onPress={() => { setExpanded(false); onSelect(type); }}
          >
            <Text style={styles.mealPickerChipText}>{formatMealType(type)}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.mealPickerCancel} onPress={() => setExpanded(false)}>
        <Text style={styles.editCancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

/** Small numeric input for a macro field */
function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.macroInputWrap}>
      <Text style={styles.macroInputLabel}>{label}</Text>
      <TextInput
        style={styles.macroInputField}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={C.labelLight}
      />
    </View>
  );
}

function MacroPill({
  label,
  value,
  unit,
  target,
}: {
  label: string;
  value: number;
  unit?: string;
  target?: number;
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : null;

  return (
    <View style={styles.macroPill}>
      <Text style={styles.macroPillValue}>
        {value}{unit && <Text style={styles.macroPillUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.macroPillLabel}>{label}</Text>
      {pct !== null && (
        <View style={styles.macroPillBar}>
          <View style={[styles.macroPillBarFill, { width: `${pct}%` }]} />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMealType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function confidenceToPercent(confidence: string): number {
  switch (confidence) {
    case 'exact': return 95;
    case 'estimated': return 70;
    case 'rough': return 40;
    default: return 50;
  }
}

function parseNum(s: string): number | undefined {
  const n = Number(s);
  return Number.isFinite(n) && s.trim() ? n : undefined;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    borderRadius: C.radius,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reExtractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifyAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: C.labelMid,
  },
  row: {
    backgroundColor: C.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 10,
    gap: 6,
  },
  rowUnverified: {
    borderColor: 'rgba(52,199,89,0.3)',
    backgroundColor: 'rgba(200,240,216,0.15)',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.labelDark,
  },
  rowMacros: {
    fontSize: 11,
    color: C.labelMid,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceBar: {
    flex: 1,
    height: 3,
    backgroundColor: C.dotInactive,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 1.5,
  },
  confidenceText: {
    fontSize: 9,
    color: C.labelLight,
    textTransform: 'capitalize',
  },
  // Edit / Add form
  editForm: {
    backgroundColor: '#FAFAF8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accent,
    padding: 10,
    gap: 8,
  },
  addFormHeader: {
    marginBottom: 2,
  },
  editInput: {
    fontSize: 14,
    fontWeight: '500',
    color: C.labelDark,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    paddingVertical: 4,
  },
  editMacroRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  editRightActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editDeleteText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.coral,
  },
  editCancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editCancelText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.labelMid,
  },
  editSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editSaveButtonDisabled: {
    opacity: 0.4,
  },
  editSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Macro input
  macroInputWrap: {
    flex: 1,
    gap: 2,
  },
  macroInputLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: C.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroInputField: {
    fontSize: 13,
    fontWeight: '600',
    color: C.labelDark,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  // Add meal button
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  addMealText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accent,
  },
  // Meal type picker
  mealPickerContainer: {
    gap: 8,
  },
  mealPickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.labelMid,
  },
  mealPickerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mealPickerChip: {
    backgroundColor: C.accentGlow,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  mealPickerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
  },
  mealPickerCancel: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  // Totals
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  totalsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.labelDark,
  },
  totalsValues: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  macroPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.labelDark,
  },
  macroPillUnit: {
    fontSize: 9,
    fontWeight: '500',
  },
  macroPillLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: C.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroPillBar: {
    width: '100%',
    height: 3,
    backgroundColor: C.dotInactive,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  macroPillBarFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 1.5,
  },
});
