/**
 * Document Type Picker Modal
 *
 * Modal for selecting document type when uploading race documents.
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, TouchableWithoutFeedback } from 'react-native';
import { documentTypePickerStyles } from '@/components/races/styles';
import { DOCUMENT_TYPE_OPTIONS } from '@/lib/races';

export interface DocumentTypePickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
  /** Callback when a document type is selected */
  onSelect: (type: string) => void;
  /** Whether an upload is in progress */
  isUploading?: boolean;
}

/**
 * Document Type Picker Modal Component
 */
export function DocumentTypePickerModal({
  visible,
  onDismiss,
  onSelect,
  isUploading = false,
}: DocumentTypePickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={documentTypePickerStyles.overlay} onPress={onDismiss}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={documentTypePickerStyles.sheet}>
            <Text style={documentTypePickerStyles.title}>Choose document type</Text>
            <Text style={documentTypePickerStyles.subtitle}>
              Pick the category that best matches what you are uploading.
            </Text>
            {DOCUMENT_TYPE_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  documentTypePickerStyles.option,
                  index === DOCUMENT_TYPE_OPTIONS.length - 1 && documentTypePickerStyles.lastOption,
                ]}
                onPress={() => onSelect(option.value)}
                disabled={isUploading}
              >
                <Text style={documentTypePickerStyles.optionLabel}>{option.label}</Text>
                <Text style={documentTypePickerStyles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={documentTypePickerStyles.cancelButton}
              onPress={onDismiss}
              disabled={isUploading}
            >
              <Text style={documentTypePickerStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}

export default DocumentTypePickerModal;
