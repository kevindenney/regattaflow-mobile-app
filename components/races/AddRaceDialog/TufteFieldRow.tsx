/**
 * TufteFieldRow Component
 *
 * Reusable input field component following Tufte design principles.
 * Features:
 * - Label above input (no decorative icons)
 * - Required asterisk indicator
 * - Error text below field
 * - AI-extracted indicator (purple dot)
 * - Half-width option for side-by-side layout
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
  Platform,
} from 'react-native';
import { tufteFormStyles, TUFTE_FORM_COLORS } from './tufteFormStyles';

export interface TufteFieldRowProps extends Omit<TextInputProps, 'style'> {
  /** Field label */
  label: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Whether field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether field was populated by AI extraction */
  aiExtracted?: boolean;
  /** Use half width for side-by-side layout */
  halfWidth?: boolean;
  /** Optional suffix text (e.g., "nm", "hours") */
  suffix?: string;
}

export function TufteFieldRow({
  label,
  value,
  onChangeText,
  required = false,
  error,
  aiExtracted = false,
  halfWidth = false,
  suffix,
  placeholder,
  multiline = false,
  keyboardType,
  ...textInputProps
}: TufteFieldRowProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <View style={[styles.container, halfWidth && styles.containerHalf]}>
      {/* Label */}
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Input Container */}
      <Pressable onPress={handleContainerPress}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              error && styles.inputError,
              multiline && styles.inputMultiline,
              suffix && styles.inputWithSuffix,
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
            multiline={multiline}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'numeric' || keyboardType === 'decimal-pad' ? 'none' : 'sentences'}
            autoCorrect={keyboardType !== 'numeric' && keyboardType !== 'decimal-pad'}
            {...textInputProps}
          />

          {/* Suffix */}
          {suffix && (
            <Text style={styles.suffix}>{suffix}</Text>
          )}

          {/* AI Extracted Indicator */}
          {aiExtracted && !error && (
            <View style={styles.aiIndicator} />
          )}
        </View>
      </Pressable>

      {/* Error Text */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  containerHalf: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
    marginBottom: 6,
  },
  required: {
    color: TUFTE_FORM_COLORS.error,
    fontWeight: '400',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
  inputFocused: {
    borderColor: TUFTE_FORM_COLORS.inputBorderFocus,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: TUFTE_FORM_COLORS.inputBorderError,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputWithSuffix: {
    paddingRight: 48,
  },
  suffix: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -9,
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  aiIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TUFTE_FORM_COLORS.aiAccent,
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -3,
  },
  errorText: {
    fontSize: 11,
    color: TUFTE_FORM_COLORS.error,
    marginTop: 4,
  },
});

export default TufteFieldRow;
