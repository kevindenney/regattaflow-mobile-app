/**
 * PasteInput Component
 *
 * Multi-line text area for pasting document content.
 * Smart detection to identify if pasted content is actually a URL.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';

interface PasteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  /** Called when pasted content looks like a URL */
  onUrlDetected?: (url: string) => void;
  minHeight?: number;
}

export function PasteInput({
  value,
  onChangeText,
  placeholder = 'Paste race notice, sailing instructions, or any text containing race details...',
  disabled = false,
  error,
  onUrlDetected,
  minHeight = 120,
}: PasteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [urlWarning, setUrlWarning] = useState<string | null>(null);

  // Check if pasted content is a URL
  const checkForUrl = useCallback((text: string) => {
    const trimmed = text.trim();

    // Check if the entire pasted content is a URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // Check if it's just a URL (no other content)
      if (!trimmed.includes('\n') && trimmed.split(' ').length <= 3) {
        setUrlWarning('This looks like a URL. Consider using the URL tab instead.');
        if (onUrlDetected) {
          onUrlDetected(trimmed);
        }
        return;
      }
    }

    setUrlWarning(null);
  }, [onUrlDetected]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    checkForUrl(text);
  }, [onChangeText, checkForUrl]);

  const characterCount = value.length;
  const hasEnoughContent = characterCount >= 20;

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          { minHeight },
          isFocused && styles.inputFocused,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
        multiline
        textAlignVertical="top"
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <View style={styles.footer}>
        {urlWarning && (
          <Text style={styles.warningText}>{urlWarning}</Text>
        )}

        {!urlWarning && value.trim() && !hasEnoughContent && (
          <Text style={styles.hint}>Need at least 20 characters</Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.characterCount}>
          {characterCount > 0 ? `${characterCount} chars` : ''}
        </Text>
      </View>
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
    paddingVertical: 12,
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
    textAlignVertical: 'top',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  hint: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  warningText: {
    fontSize: 12,
    color: '#D97706', // Amber for warning
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.error,
    flex: 1,
  },
  characterCount: {
    fontSize: 11,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
});

export default PasteInput;
