/**
 * Log Maintenance Form
 * Modal form for logging maintenance and service events
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

interface LogMaintenanceFormProps {
  visible: boolean;
  boatId: string;
  equipmentList: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (maintenance: MaintenanceFormData) => void;
}

export interface MaintenanceFormData {
  equipmentId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string;
  performedBy?: string;
  location?: string;
  cost?: number;
  conditionBefore?: string;
  conditionAfter?: string;
  notes?: string;
}

const MAINTENANCE_TYPES = [
  { value: 'installation', label: 'Installation', icon: 'add-circle' },
  { value: 'repair', label: 'Repair', icon: 'build' },
  { value: 'service', label: 'Service', icon: 'construct' },
  { value: 'replacement', label: 'Replacement', icon: 'swap-horizontal' },
  { value: 'inspection', label: 'Inspection', icon: 'eye' },
  { value: 'modification', label: 'Modification', icon: 'settings' },
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export function LogMaintenanceForm({
  visible,
  boatId,
  equipmentList,
  onClose,
  onSubmit,
}: LogMaintenanceFormProps) {
  const [formData, setFormData] = useState<MaintenanceFormData>({
    equipmentId: equipmentList[0]?.id || '',
    maintenanceDate: new Date().toISOString().split('T')[0],
    maintenanceType: 'service',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Please select equipment';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.maintenanceDate) {
      newErrors.maintenanceDate = 'Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit(formData);

    // Reset form
    setFormData({
      equipmentId: equipmentList[0]?.id || '',
      maintenanceDate: new Date().toISOString().split('T')[0],
      maintenanceType: 'service',
      description: '',
    });
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      equipmentId: equipmentList[0]?.id || '',
      maintenanceDate: new Date().toISOString().split('T')[0],
      maintenanceType: 'service',
      description: '',
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
          <Text style={styles.headerTitle}>Log Maintenance</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Equipment Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Equipment <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              {equipmentList.map((equipment) => (
                <TouchableOpacity
                  key={equipment.id}
                  style={[
                    styles.equipmentOption,
                    formData.equipmentId === equipment.id && styles.equipmentOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, equipmentId: equipment.id })}
                >
                  <Text
                    style={[
                      styles.equipmentOptionText,
                      formData.equipmentId === equipment.id && styles.equipmentOptionTextActive,
                    ]}
                  >
                    {equipment.name}
                  </Text>
                  {formData.equipmentId === equipment.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.equipmentId && (
              <Text style={styles.errorText}>{errors.equipmentId}</Text>
            )}
          </View>

          {/* Maintenance Type */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {MAINTENANCE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.maintenanceType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, maintenanceType: type.value })}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={formData.maintenanceType === type.value ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.maintenanceType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.maintenanceDate && styles.inputError]}
              placeholder="MM/DD/YYYY"
              value={formData.maintenanceDate}
              onChangeText={(text) => setFormData({ ...formData, maintenanceDate: text })}
            />
            {errors.maintenanceDate && (
              <Text style={styles.errorText}>{errors.maintenanceDate}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="What was done..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Performed By */}
          <View style={styles.section}>
            <Text style={styles.label}>Performed By</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., North Sails Hong Kong or Self"
              value={formData.performedBy}
              onChangeText={(text) => setFormData({ ...formData, performedBy: text })}
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Where was the work done?"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          {/* Cost */}
          <View style={styles.section}>
            <Text style={styles.label}>Cost</Text>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInputField}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={formData.cost?.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, cost: parseFloat(text) || undefined })
                }
              />
            </View>
          </View>

          {/* Condition Before/After */}
          <View style={styles.row}>
            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.label}>Condition Before</Text>
              <View style={styles.conditionSelect}>
                {CONDITIONS.map((cond) => (
                  <TouchableOpacity
                    key={cond.value}
                    style={[
                      styles.conditionOption,
                      formData.conditionBefore === cond.value && styles.conditionOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, conditionBefore: cond.value })}
                  >
                    <Text
                      style={[
                        styles.conditionOptionText,
                        formData.conditionBefore === cond.value && styles.conditionOptionTextActive,
                      ]}
                    >
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.label}>Condition After</Text>
              <View style={styles.conditionSelect}>
                {CONDITIONS.map((cond) => (
                  <TouchableOpacity
                    key={cond.value}
                    style={[
                      styles.conditionOption,
                      formData.conditionAfter === cond.value && styles.conditionOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, conditionAfter: cond.value })}
                  >
                    <Text
                      style={[
                        styles.conditionOptionText,
                        formData.conditionAfter === cond.value && styles.conditionOptionTextActive,
                      ]}
                    >
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any other details, recommendations, or observations..."
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
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  equipmentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  equipmentOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  equipmentOptionText: {
    fontSize: 15,
    color: '#64748B',
  },
  equipmentOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  conditionSelect: {
    gap: 6,
  },
  conditionOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  conditionOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  conditionOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  conditionOptionTextActive: {
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});