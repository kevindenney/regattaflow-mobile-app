/**
 * PDFUpload Component
 *
 * File picker for PDF documents with preview.
 * Shows file name and size after selection.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FileText, X, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

export interface SelectedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface PDFUploadProps {
  selectedFile: SelectedFile | null;
  onFileSelect: (file: SelectedFile | null) => void;
  disabled?: boolean;
  error?: string | null;
  onAutoDetect?: (info: { suggestedType?: string }) => void;
}

export function PDFUpload({
  selectedFile,
  onFileSelect,
  disabled = false,
  error,
  onAutoDetect,
}: PDFUploadProps) {
  const handlePickDocument = useCallback(async () => {
    if (disabled) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const file: SelectedFile = {
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        };
        onFileSelect(file);

        // Auto-detect document type from filename
        if (onAutoDetect) {
          const lowerName = asset.name.toLowerCase();
          let suggestedType: string | undefined;

          if (lowerName.includes('nor') || lowerName.includes('notice')) {
            suggestedType = 'nor';
          } else if (lowerName.includes('si') || lowerName.includes('sailing')) {
            suggestedType = 'si';
          } else if (lowerName.includes('amend')) {
            suggestedType = 'amendment';
          } else if (lowerName.includes('course') || lowerName.includes('chart')) {
            suggestedType = 'course_diagram';
          }

          onAutoDetect({ suggestedType });
        }
      }
    } catch (err) {
      console.error('[PDFUpload] Error picking document:', err);
    }
  }, [disabled, onFileSelect, onAutoDetect]);

  const handleClear = useCallback(() => {
    onFileSelect(null);
  }, [onFileSelect]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // File selected state
  if (selectedFile) {
    return (
      <View style={styles.selectedContainer}>
        <View style={styles.selectedContent}>
          <View style={styles.fileIcon}>
            <FileText size={20} color={IOS_COLORS.blue} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {selectedFile.name}
            </Text>
            {selectedFile.size && (
              <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
            )}
          </View>
          <Pressable
            style={styles.clearButton}
            onPress={handleClear}
            disabled={disabled}
            hitSlop={8}
          >
            <X size={18} color={TUFTE_FORM_COLORS.secondaryLabel} />
          </Pressable>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Empty state - upload prompt
  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.uploadArea,
          disabled && styles.uploadAreaDisabled,
          error && styles.uploadAreaError,
        ]}
        onPress={handlePickDocument}
        disabled={disabled}
      >
        <View style={styles.uploadIcon}>
          <Upload size={24} color={TUFTE_FORM_COLORS.secondaryLabel} />
        </View>
        <Text style={styles.uploadText}>Tap to select PDF</Text>
        <Text style={styles.uploadHint}>Notice of Race, Sailing Instructions, etc.</Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: TUFTE_FORM_SPACING.xs,
  },
  uploadArea: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  uploadAreaDisabled: {
    opacity: 0.5,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
  },
  uploadAreaError: {
    borderColor: TUFTE_FORM_COLORS.error,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
  },
  uploadHint: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  selectedContainer: {
    gap: TUFTE_FORM_SPACING.xs,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EFF6FF', // Light blue
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
  },
  fileSize: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.error,
    paddingHorizontal: 4,
  },
});

export default PDFUpload;
