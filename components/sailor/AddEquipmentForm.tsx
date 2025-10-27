/**
 * Add Equipment Form
 * Modal form for adding new equipment to a boat
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddEquipmentFormProps {
  visible: boolean;
  boatId: string;
  classId: string;
  onClose: () => void;
  onSubmit: (equipment: EquipmentFormData) => void;
}

export interface EquipmentFormData {
  customName: string;
  category: string;
  subcategory?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseLocation?: string;
  condition: string;
  notes?: string;
}

const CATEGORIES = [
  { value: 'mainsail', label: 'Mainsail' },
  { value: 'jib', label: 'Jib' },
  { value: 'spinnaker', label: 'Spinnaker' },
  { value: 'mast', label: 'Mast' },
  { value: 'boom', label: 'Boom' },
  { value: 'rigging', label: 'Rigging' },
  { value: 'bottom_paint', label: 'Bottom Paint' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'electronics', label: 'Electronics' },
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', color: '#10B981' },
  { value: 'good', label: 'Good', color: '#3B82F6' },
  { value: 'fair', label: 'Fair', color: '#F59E0B' },
  { value: 'poor', label: 'Poor', color: '#EF4444' },
];

export function AddEquipmentForm({
  visible,
  boatId,
  classId,
  onClose,
  onSubmit,
}: AddEquipmentFormProps) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    customName: '',
    category: 'mainsail',
    condition: 'excellent',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.customName.trim()) {
      newErrors.customName = 'Equipment name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit(formData);

    // Reset form
    setFormData({
      customName: '',
      category: 'mainsail',
      condition: 'excellent',
    });
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      customName: '',
      category: 'mainsail',
      condition: 'excellent',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Equipment</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Equipment Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Equipment Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.customName && styles.inputError]}
              placeholder="e.g., Main #1 - All Purpose"
              value={formData.customName}
              onChangeText={(text) => setFormData({ ...formData, customName: text })}
            />
            {errors.customName && (
              <Text style={styles.errorText}>{errors.customName}</Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.chip,
                    formData.category === cat.value && styles.chipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat.value })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.category === cat.value && styles.chipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition */}
          <View style={styles.section}>
            <Text style={styles.label}>Current Condition</Text>
            <View style={styles.conditionContainer}>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond.value}
                  style={[
                    styles.conditionButton,
                    formData.condition === cond.value && {
                      backgroundColor: cond.color,
                      borderColor: cond.color,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, condition: cond.value })}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      formData.condition === cond.value && styles.conditionTextActive,
                    ]}
                  >
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Serial Number */}
          <View style={styles.section}>
            <Text style={styles.label}>Serial Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              value={formData.serialNumber}
              onChangeText={(text) => setFormData({ ...formData, serialNumber: text })}
            />
          </View>

          {/* Purchase Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              value={formData.purchaseDate}
              onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
            />
          </View>

          {/* Purchase Price */}
          <View style={styles.section}>
            <Text style={styles.label}>Purchase Price</Text>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInputField}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={formData.purchasePrice?.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, purchasePrice: parseFloat(text) || undefined })
                }
              />
            </View>
          </View>

          {/* Purchase Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Purchase Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., North Sails Hong Kong"
              value={formData.purchaseLocation}
              onChangeText={(text) => setFormData({ ...formData, purchaseLocation: text })}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes about this equipment..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelButton: {
    width: 80,
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  saveButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  conditionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  conditionTextActive: {
    color: '#FFFFFF',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingLeft: 14,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 4,
  },
  priceInputField: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  bottomPadding: {
    height: 40,
  },
});