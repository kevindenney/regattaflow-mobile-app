/**
 * QuickAddRaceForm Component
 *
 * Minimal form for quick race creation within the FamilyButton.
 * Follows Tufte design principles - minimal decoration, maximum utility.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TufteTokens } from '@/constants/designSystem';

// ============================================================================
// Types
// ============================================================================

export interface QuickAddRaceData {
  name: string;
  dateTime: string;
}

interface QuickAddRaceFormProps {
  onSubmit: (data: QuickAddRaceData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const QuickAddRaceForm: React.FC<QuickAddRaceFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      setError('Race name is required');
      return false;
    }
    if (!dateTime.trim()) {
      setError('Date/time is required');
      return false;
    }

    // Try to parse the date
    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      setError('Invalid date format. Use YYYY-MM-DD HH:MM');
      return false;
    }

    setError(null);
    return true;
  }, [name, dateTime]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (isSubmitting) return;

    try {
      await onSubmit({
        name: name.trim(),
        dateTime: new Date(dateTime).toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create race');
    }
  }, [name, dateTime, validateForm, isSubmitting, onSubmit]);

  const isValid = name.trim().length > 0 && dateTime.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Race Name Input */}
      <View style={styles.field}>
        <Text style={styles.label}>Race Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Spring Regatta Race 1"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isSubmitting}
        />
      </View>

      {/* Date/Time Input */}
      <View style={styles.field}>
        <Text style={styles.label}>Date & Time</Text>
        <TextInput
          style={styles.input}
          value={dateTime}
          onChangeText={setDateTime}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          editable={!isSubmitting}
        />
        <Text style={styles.hint}>e.g., 2025-03-15 10:00</Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.buttonPressed,
          ]}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            !isValid && styles.submitButtonDisabled,
            pressed && isValid && styles.buttonPressed,
          ]}
          disabled={!isValid || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Add race"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Race</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: TufteTokens.spacing.compact,
  },
  field: {
    gap: TufteTokens.spacing.tight,
  },
  label: {
    ...TufteTokens.typography.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
    borderRadius: TufteTokens.borderRadius.subtle,
    paddingHorizontal: TufteTokens.spacing.compact,
    paddingVertical: TufteTokens.spacing.compact,
    ...TufteTokens.typography.secondary,
    backgroundColor: TufteTokens.backgrounds.subtle,
  },
  hint: {
    fontSize: 10,
    color: '#9CA3AF', // gray-400
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2', // red-50
    borderWidth: TufteTokens.borders.hairline,
    borderColor: '#FECACA', // red-200
    borderRadius: TufteTokens.borderRadius.subtle,
    padding: TufteTokens.spacing.compact,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626', // red-600
  },
  buttonRow: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.compact,
    marginTop: TufteTokens.spacing.tight,
  },
  cancelButton: {
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
    backgroundColor: TufteTokens.backgrounds.paper,
  },
  cancelButtonText: {
    ...TufteTokens.typography.secondary,
    color: '#6B7280', // gray-500
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    borderRadius: TufteTokens.borderRadius.subtle,
    backgroundColor: '#047857', // green-700
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB', // gray-300
  },
  submitButtonText: {
    ...TufteTokens.typography.secondary,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});

export default QuickAddRaceForm;
