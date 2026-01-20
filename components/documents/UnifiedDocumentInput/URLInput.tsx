/**
 * URLInput Component
 *
 * URL input field with smart detection for document type.
 * Supports pasting from email, browser share sheet, etc.
 * Now supports multiple URLs (one per line).
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { Link2 } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';

interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  onAutoDetect?: (info: { isPdf: boolean; suggestedType?: string }) => void;
  /** Callback when multiple URLs are detected */
  onUrlsDetected?: (urls: string[]) => void;
}

/**
 * Parse URLs from text input (one URL per line)
 */
function parseUrls(text: string): string[] {
  if (!text.trim()) return [];

  return text
    .split(/[\n\r]+/) // Split by newlines
    .map(line => line.trim())
    .filter(line => line.startsWith('http://') || line.startsWith('https://'));
}

export function URLInput({
  value,
  onChangeText,
  placeholder = 'Paste one or more URLs (one per line)\nhttps://club.com/notice-of-race.pdf',
  disabled = false,
  error,
  onAutoDetect,
  onUrlsDetected,
}: URLInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const lastUrlsRef = useRef<string>('');

  // Parse URLs from current value
  const detectedUrls = useMemo(() => parseUrls(value), [value]);
  const urlCount = detectedUrls.length;
  const hasMultipleUrls = urlCount > 1;

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);

    // Parse URLs and notify parent if changed
    const urls = parseUrls(text);
    const urlsKey = urls.join('|');
    if (onUrlsDetected && urlsKey !== lastUrlsRef.current) {
      lastUrlsRef.current = urlsKey;
      onUrlsDetected(urls);
    }

    // Auto-detect document characteristics from the first URL
    if (onAutoDetect && urls.length > 0) {
      const lowerUrl = urls[0].toLowerCase();
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
  }, [onChangeText, onAutoDetect, onUrlsDetected]);

  const hasValidUrl = urlCount > 0;
  const hasInvalidLines = value.trim().length > 0 &&
    value.split(/[\n\r]+/).some(line =>
      line.trim().length > 0 && !line.trim().startsWith('http')
    );

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          styles.inputMultiline,
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
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* URL count indicator */}
      {urlCount > 0 && (
        <View style={styles.urlCountContainer}>
          <Link2 size={14} color={hasMultipleUrls ? TUFTE_FORM_COLORS.aiAccent : TUFTE_FORM_COLORS.secondaryLabel} />
          <Text style={[
            styles.urlCountText,
            hasMultipleUrls && styles.urlCountTextMultiple,
          ]}>
            {urlCount} URL{urlCount !== 1 ? 's' : ''} detected
          </Text>
        </View>
      )}

      {hasInvalidLines && !hasValidUrl && (
        <Text style={styles.hint}>URLs should start with http:// or https://</Text>
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
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
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
  urlCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  urlCountText: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  urlCountTextMultiple: {
    color: TUFTE_FORM_COLORS.aiAccent,
    fontWeight: '500',
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
