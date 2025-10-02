/**
 * Upload Document Form
 * Modal form for uploading boat documents (manuals, bulletins, instructions)
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

interface UploadDocumentFormProps {
  visible: boolean;
  boatId: string;
  onClose: () => void;
  onSubmit: (document: DocumentFormData) => void;
}

export interface DocumentFormData {
  name: string;
  documentType: 'manual' | 'bulletin' | 'instructions' | 'warranty' | 'specifications' | 'other';
  category?: string;
  fileUri?: string;
  fileName?: string;
  notes?: string;
}

const DOCUMENT_TYPES = [
  { value: 'manual', label: 'Maintenance Manual', icon: 'book' },
  { value: 'bulletin', label: 'Class Bulletin', icon: 'newspaper' },
  { value: 'instructions', label: 'Setup Instructions', icon: 'document-text' },
  { value: 'warranty', label: 'Warranty Info', icon: 'shield-checkmark' },
  { value: 'specifications', label: 'Specifications', icon: 'list' },
  { value: 'other', label: 'Other Document', icon: 'document' },
];

export function UploadDocumentForm({
  visible,
  boatId,
  onClose,
  onSubmit,
}: UploadDocumentFormProps) {
  const [formData, setFormData] = useState<DocumentFormData>({
    name: '',
    documentType: 'manual',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSelectFile = () => {
    // TODO: Integrate with expo-document-picker
    alert('File picker coming soon! Will support PDF, images, and URLs.');
  };

  const handleSubmit = () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Document name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit(formData);

    // Reset form
    setFormData({
      name: '',
      documentType: 'manual',
    });
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      documentType: 'manual',
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
          <Text style={styles.headerTitle}>Upload Document</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Document Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Document Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g., North Sails Mainsail Manual 2024"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Document Type */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Document Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {DOCUMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.documentType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, documentType: type.value as any })
                  }
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={formData.documentType === type.value ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.documentType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sails, Rigging, Electronics"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />
          </View>

          {/* File Upload */}
          <View style={styles.section}>
            <Text style={styles.label}>File</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleSelectFile}>
              <Ionicons name="cloud-upload-outline" size={32} color="#3B82F6" />
              <Text style={styles.uploadTitle}>
                {formData.fileName || 'Choose File or Take Photo'}
              </Text>
              <Text style={styles.uploadDescription}>
                PDF, Image, or enter URL below
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional information about this document..."
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
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  uploadDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  bottomPadding: {
    height: 40,
  },
});