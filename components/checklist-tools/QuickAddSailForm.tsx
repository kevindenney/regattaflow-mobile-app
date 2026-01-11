/**
 * QuickAddSailForm Component
 *
 * Inline form for quickly adding a sail to a boat.
 * Used in empty states when user has no sails configured.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Plus, X, Sailboat, Check } from 'lucide-react-native';
import { EquipmentService } from '@/services/EquipmentService';

const COLORS = {
  primary: '#007AFF',
  label: '#000000',
  secondaryLabel: '#8E8E93',
  tertiaryLabel: '#C7C7CC',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  separator: '#C6C6C8',
  success: '#34C759',
  error: '#FF3B30',
};

// Common sail categories
const SAIL_CATEGORIES = [
  { id: 'mainsail', name: 'Mainsail', icon: 'M' },
  { id: 'jib', name: 'Jib', icon: 'J' },
  { id: 'genoa', name: 'Genoa', icon: 'G' },
  { id: 'spinnaker', name: 'Spinnaker', icon: 'S' },
  { id: 'code_zero', name: 'Code Zero', icon: '0' },
] as const;

// Sail condition ratings
const CONDITION_RATINGS = [
  { value: 5, label: 'Excellent' },
  { value: 4, label: 'Good' },
  { value: 3, label: 'Fair' },
  { value: 2, label: 'Worn' },
  { value: 1, label: 'Poor' },
] as const;

interface QuickAddSailFormProps {
  /** Boat ID to add sail to */
  boatId: string;
  /** Called when sail is successfully added */
  onSuccess: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Show inline or as expanded card */
  variant?: 'inline' | 'card';
}

export function QuickAddSailForm({
  boatId,
  onSuccess,
  onCancel,
  variant = 'card',
}: QuickAddSailFormProps) {
  const [category, setCategory] = useState<string>('mainsail');
  const [name, setName] = useState('');
  const [sailmaker, setSailmaker] = useState('');
  const [condition, setCondition] = useState(4);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!category) {
      Alert.alert('Error', 'Please select a sail category');
      return;
    }

    setIsSaving(true);
    try {
      const equipmentService = new EquipmentService();

      // Generate default name if not provided
      const sailName = name.trim() || `${SAIL_CATEGORIES.find(c => c.id === category)?.name || category} #1`;

      await equipmentService.createEquipment({
        boat_id: boatId,
        category,
        custom_name: sailName,
        manufacturer: sailmaker.trim() || undefined,
        condition_rating: condition,
        notes: `Added via quick-add form`,
      });

      onSuccess();
    } catch (error) {
      console.error('[QuickAddSailForm] Error saving sail:', error);
      Alert.alert('Error', 'Failed to add sail. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [boatId, category, name, sailmaker, condition, onSuccess]);

  const isValid = !!category;

  return (
    <View style={[styles.container, variant === 'card' && styles.cardContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sailboat size={18} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Add Sail</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <X size={20} color={COLORS.secondaryLabel} />
        </Pressable>
      </View>

      {/* Category Selector */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.categoryRow}>
          {SAIL_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryButton,
                category === cat.id && styles.categoryButtonSelected,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryIcon,
                  category === cat.id && styles.categoryIconSelected,
                ]}
              >
                {cat.icon}
              </Text>
              <Text
                style={[
                  styles.categoryText,
                  category === cat.id && styles.categoryTextSelected,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Name Input */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Name (optional)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Race Main, Light Air Jib"
          placeholderTextColor={COLORS.tertiaryLabel}
        />
      </View>

      {/* Sailmaker Input */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Sailmaker (optional)</Text>
        <TextInput
          style={styles.input}
          value={sailmaker}
          onChangeText={setSailmaker}
          placeholder="e.g., North, Quantum, UK Sailmakers"
          placeholderTextColor={COLORS.tertiaryLabel}
        />
      </View>

      {/* Condition Rating */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Condition</Text>
        <View style={styles.conditionRow}>
          {CONDITION_RATINGS.map((rating) => (
            <Pressable
              key={rating.value}
              style={[
                styles.conditionButton,
                condition === rating.value && styles.conditionButtonSelected,
              ]}
              onPress={() => setCondition(rating.value)}
            >
              <Text
                style={[
                  styles.conditionValue,
                  condition === rating.value && styles.conditionValueSelected,
                ]}
              >
                {rating.value}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.conditionLabel}>
          {CONDITION_RATINGS.find(r => r.value === condition)?.label}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Sail</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Button to trigger the quick add form
 */
interface QuickAddSailButtonProps {
  onPress: () => void;
}

export function QuickAddSailButton({ onPress }: QuickAddSailButtonProps) {
  return (
    <Pressable style={styles.addButton} onPress={onPress}>
      <Plus size={18} color={COLORS.primary} />
      <Text style={styles.addButtonText}>Add Sail Now</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  cardContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.separator,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
  },
  closeButton: {
    padding: 4,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.label,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondaryLabel,
    width: 16,
    textAlign: 'center',
  },
  categoryIconSelected: {
    color: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  categoryTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  conditionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  conditionValueSelected: {
    color: '#FFFFFF',
  },
  conditionLabel: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Add button styles
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default QuickAddSailForm;
