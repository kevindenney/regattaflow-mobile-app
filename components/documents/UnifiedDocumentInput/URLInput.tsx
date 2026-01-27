/**
 * URLInput Component
 *
 * Multi-purpose text input that accepts:
 * - URLs (one per line) - processes as document links
 * - Plain text content - processes as pasted document text
 *
 * Supports pasting from email, browser share sheet, copied document text, etc.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { Link2, FileText } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';

export type InputContentType = 'urls' | 'text' | 'empty';

interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  onAutoDetect?: (info: { isPdf: boolean; suggestedType?: string }) => void;
  /** Callback when multiple URLs are detected */
  onUrlsDetected?: (urls: string[]) => void;
  /** Callback when plain text content is detected */
  onTextContentDetected?: (text: string) => void;
  /** Callback when content type changes */
  onContentTypeChange?: (type: InputContentType) => void;
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

/**
 * Determine the content type based on the input text
 * - If empty, return 'empty'
 * - If contains URLs, return 'urls'
 * - Otherwise, return 'text' (plain document content)
 */
function detectContentType(text: string): InputContentType {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';

  const urls = parseUrls(text);
  if (urls.length > 0) return 'urls';

  // If we have substantial text (more than just a few characters), treat as document text
  if (trimmed.length > 20) return 'text';

  return 'empty';
}

/**
 * Try to detect document type from pasted text content
 */
function detectDocTypeFromText(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Check for NOR indicators
  if (lower.includes('notice of race') || lower.includes('nor')) {
    return 'nor';
  }

  // Check for SI indicators
  if (lower.includes('sailing instructions') || lower.includes('sailing instruction')) {
    return 'si';
  }

  // Check for amendment indicators
  if (lower.includes('amendment') || lower.includes('change to')) {
    return 'amendment';
  }

  // Check for course-related content
  if (lower.includes('course sequence') || lower.includes('mark rounding') ||
      lower.includes('windward') || lower.includes('leeward')) {
    return 'courses';
  }

  return undefined;
}

export function URLInput({
  value,
  onChangeText,
  placeholder = 'Paste URLs or document text\nhttps://club.com/notice-of-race.pdf\n— or paste copied text directly —',
  disabled = false,
  error,
  onAutoDetect,
  onUrlsDetected,
  onTextContentDetected,
  onContentTypeChange,
}: URLInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const lastUrlsRef = useRef<string>('');
  const lastContentTypeRef = useRef<InputContentType>('empty');

  // Detect content type and parse URLs
  const contentType = useMemo(() => detectContentType(value), [value]);
  const detectedUrls = useMemo(() => parseUrls(value), [value]);
  const urlCount = detectedUrls.length;
  const hasMultipleUrls = urlCount > 1;
  const isTextContent = contentType === 'text';

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);

    const newContentType = detectContentType(text);

    // Notify parent of content type change
    if (onContentTypeChange && newContentType !== lastContentTypeRef.current) {
      lastContentTypeRef.current = newContentType;
      onContentTypeChange(newContentType);
    }

    if (newContentType === 'urls') {
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
        } else if (lowerUrl.includes('courses') || (lowerUrl.includes('attachment') && lowerUrl.includes('b'))) {
          suggestedType = 'courses';
        } else if (lowerUrl.includes('course') || lowerUrl.includes('chart')) {
          suggestedType = 'course_diagram';
        }

        onAutoDetect({ isPdf, suggestedType });
      }
    } else if (newContentType === 'text') {
      // Notify parent of text content
      if (onTextContentDetected) {
        onTextContentDetected(text);
      }

      // Try to auto-detect document type from text content
      if (onAutoDetect) {
        const suggestedType = detectDocTypeFromText(text);
        onAutoDetect({ isPdf: false, suggestedType });
      }
    }
  }, [onChangeText, onAutoDetect, onUrlsDetected, onTextContentDetected, onContentTypeChange]);

  const hasValidUrl = urlCount > 0;

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

      {/* Content type indicator */}
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

      {isTextContent && (
        <View style={styles.urlCountContainer}>
          <FileText size={14} color={TUFTE_FORM_COLORS.aiAccent} />
          <Text style={[styles.urlCountText, styles.urlCountTextMultiple]}>
            Document text detected ({value.trim().length.toLocaleString()} chars)
          </Text>
        </View>
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
