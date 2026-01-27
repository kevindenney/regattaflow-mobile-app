/**
 * TufteInlineEditRow
 *
 * Reusable inline editable row component following Tufte principles.
 * Tap to edit in place, Done/blur to save.
 * Subtle visual feedback during edit mode.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import { TufteTokens } from '@/constants/designSystem';

interface TufteInlineEditRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  isLast?: boolean;
  editable?: boolean;
}

export function TufteInlineEditRow({
  label,
  value,
  placeholder = 'Not set',
  onSave,
  isLast = false,
  editable = true,
}: TufteInlineEditRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handlePress = useCallback(() => {
    if (!editable || isSaving) return;
    setEditValue(value);
    setIsEditing(true);
    // Focus the input after state update
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [editable, isSaving, value]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // If unchanged, just exit edit mode
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('[TufteInlineEditRow] Save error:', error);
      // Revert to original value on error
      setEditValue(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleBlur = useCallback(() => {
    // Save on blur
    handleSave();
  }, [handleSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  return (
    <View style={[styles.container, isLast && styles.containerLast]}>
      <Text style={styles.label}>{label}</Text>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.input, isSaving && styles.inputSaving]}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={handleBlur}
            onSubmitEditing={handleSave}
            placeholder={placeholder}
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            returnKeyType="done"
            autoCapitalize="words"
            editable={!isSaving}
            selectTextOnFocus
          />
          {isSaving && (
            <ActivityIndicator
              size="small"
              color={IOS_COLORS.blue}
              style={styles.spinner}
            />
          )}
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePress}
          style={styles.valueContainer}
          disabled={!editable || isSaving}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[
              styles.value,
              !value && styles.valuePlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>
          {editable && <Text style={styles.editHint}>Edit</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 40,
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    minWidth: 80,
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'right',
  },
  valuePlaceholder: {
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  editHint: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    marginLeft: 12,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  inputSaving: {
    opacity: 0.6,
  },
  spinner: {
    marginLeft: 8,
  },
});
