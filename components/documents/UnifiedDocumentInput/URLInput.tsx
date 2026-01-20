/**
 * URLInput Component
 *
 * URL input field with smart detection for document type.
 * Supports pasting from email, browser share sheet, etc.
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';

interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  onAutoDetect?: (info: { isPdf: boolean; suggestedType?: string }) => void;
}

export function URLInput({
  value,
  onChangeText,
  placeholder = 'https://club.com/notice-of-race.pdf',
  disabled = false,
  error,
  onAutoDetect,
}: URLInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);

    // Auto-detect document characteristics
    if (onAutoDetect && text.trim()) {
      const lowerUrl = text.toLowerCase();
      const isPdf = lowerUrl.includes('.pdf') ||
                    lowerUrl.includes('pdf=') ||
                    lowerUrl.includes('_files/ugd/'); // Wix PDF pattern

      let suggestedType: string | undefined;
      if (lowerUrl.includes('nor') || lowerUrl.includes('notice')) {
        suggestedType = 'nor';
      } else if (lowerUrl.includes('si') || lowerUrl.includes('sailing-instruction') || lowerUrl.includes('sailing_instruction')) {
        suggestedType = 'si';
      } else if (lowerUrl.includes('amend')) {
        suggestedType = 'amendment';
      } else if (lowerUrl.includes('course') || lowerUrl.includes('chart')) {
        suggestedType = 'course_diagram';
      }

      onAutoDetect({ isPdf, suggestedType });
    }
  }, [onChangeText, onAutoDetect]);

  const isValidUrl = value.trim().startsWith('http');

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        selectTextOnFocus
      />

      {value.trim() && !isValidUrl && (
        <Text style={styles.hint}>URL should start with http:// or https://</Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: TUFTE_FORM_SPACING.xs,
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
    borderColor: TUFTE_FORM_COLORS.error,
  },
  inputDisabled: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  hint: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.error,
    paddingHorizontal: 4,
  },
});

export default URLInput;
