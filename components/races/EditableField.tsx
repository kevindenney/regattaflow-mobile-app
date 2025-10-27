/**
 * Editable Field Component
 * Allows inline editing of extracted fields with confidence indicators
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit2, Check, X } from 'lucide-react-native';
import { FieldConfidenceBadge } from './FieldConfidenceBadge';

interface EditableFieldProps {
  label: string;
  value: string;
  confidence?: number;
  onValueChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}

export function EditableField({
  label,
  value,
  confidence,
  onValueChange,
  placeholder,
  multiline = false,
  editable = true,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onValueChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      {/* Label and Confidence Row */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {confidence !== undefined && (
          <FieldConfidenceBadge confidence={confidence} size="small" />
        )}
      </View>

      {/* Value Display or Edit Mode */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            value={editValue}
            onChangeText={setEditValue}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <X size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.actionButton, styles.saveButton]}
            >
              <Check size={16} color="#ffffff" strokeWidth={2} />
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.displayContainer}>
          <Text style={[
            styles.value,
            !value && styles.valuePlaceholder,
          ]}>
            {value || placeholder || 'Not extracted'}
          </Text>
          {editable && (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Edit2 size={16} color="#6b7280" strokeWidth={2} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  valuePlaceholder: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  editContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 8,
  },
  input: {
    fontSize: 14,
    color: '#111827',
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
});
