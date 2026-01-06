/**
 * IntentionInput Component
 *
 * A simple text input for free-form user intentions with:
 * - Icon and label
 * - Auto-save on blur
 * - Optional placeholder and hint text
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';

interface IntentionInputProps {
  /** Label displayed above the input */
  label: string;
  /** Icon name (Ionicons) */
  icon?: string;
  /** Current value */
  value: string;
  /** Called when value changes (on blur for auto-save) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Hint text below input */
  hint?: string;
  /** Whether to allow multiline input */
  multiline?: boolean;
  /** Maximum height for multiline */
  maxHeight?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Show saving indicator */
  isSaving?: boolean;
}

export function IntentionInput({
  label,
  icon = 'create-outline',
  value,
  onChange,
  placeholder = 'Enter your plan...',
  hint,
  multiline = false,
  maxHeight = 100,
  disabled = false,
  isSaving = false,
}: IntentionInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const initialValueRef = useRef(value);
  const inputRef = useRef<TextInput>(null);

  // Sync local state with prop changes (from external updates)
  useEffect(() => {
    if (value !== initialValueRef.current) {
      setLocalValue(value);
      initialValueRef.current = value;
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    // Only trigger onChange if value actually changed
    if (localValue !== initialValueRef.current) {
      onChange(localValue);
      initialValueRef.current = localValue;
    }
  }, [localValue, onChange]);

  const handleFocus = useCallback(() => {
    // Store current value when focusing
    initialValueRef.current = localValue;
  }, [localValue]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name={icon as any}
          size={16}
          color={colors.primary.default}
        />
        <Text style={styles.label}>{label}</Text>
        {isSaving && (
          <View style={styles.savingBadge}>
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          multiline && { minHeight: 60, maxHeight },
          disabled && styles.inputDisabled,
        ]}
        value={localValue}
        onChangeText={setLocalValue}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={!disabled}
        returnKeyType={multiline ? 'default' : 'done'}
        blurOnSubmit={!multiline}
      />

      {/* Hint */}
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  savingBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingText: {
    fontSize: 10,
    color: colors.primary.default,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
  },
  inputDisabled: {
    backgroundColor: colors.background.elevated,
    color: colors.text.tertiary,
  },
  hint: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
