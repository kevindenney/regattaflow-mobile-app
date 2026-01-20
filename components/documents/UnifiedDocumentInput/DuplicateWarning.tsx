/**
 * DuplicateWarning Component
 *
 * Warning banner shown when a duplicate document is detected.
 * Offers options to add as amendment or cancel.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle, FilePlus, X } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';
import type { RaceSourceDocument } from '@/services/UnifiedDocumentService';

interface DuplicateWarningProps {
  existingDocument: RaceSourceDocument;
  onAddAsAmendment: () => void;
  onCancel: () => void;
  onReplace: () => void;
}

export function DuplicateWarning({
  existingDocument,
  onAddAsAmendment,
  onCancel,
  onReplace,
}: DuplicateWarningProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={20} color="#F59E0B" />
        <Text style={styles.title}>Duplicate Document</Text>
      </View>

      <Text style={styles.message}>
        A similar document "{existingDocument.title}" was already added to this race.
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.amendmentButton]}
          onPress={onAddAsAmendment}
        >
          <FilePlus size={16} color={IOS_COLORS.blue} />
          <Text style={styles.amendmentButtonText}>Add as Amendment</Text>
        </Pressable>

        <View style={styles.secondaryActions}>
          <Pressable style={styles.textButton} onPress={onReplace}>
            <Text style={styles.replaceText}>Replace</Text>
          </Pressable>

          <Pressable style={styles.textButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  message: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  actions: {
    marginTop: 4,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  amendmentButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  amendmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  textButton: {
    padding: 4,
  },
  replaceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelText: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.error,
  },
});

export default DuplicateWarning;
