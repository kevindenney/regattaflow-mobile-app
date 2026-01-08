/**
 * EditFormRow - iOS-style form row component
 *
 * A full-width tappable row for form fields featuring:
 * - Label on the left
 * - Value or input on the right
 * - Optional chevron accessory for navigation
 * - Hairline separator between rows
 * - Support for inline text editing
 * - Destructive (red) variant for danger actions
 *
 * Used within EditFormSection for individual form fields.
 */

import React, { useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  TextInputProps,
  Platform,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { TufteTokens, colors } from '@/constants/designSystem';
import * as Haptics from 'expo-haptics';

export interface EditFormRowProps {
  /** Label displayed on the left */
  label: string;
  /** Current value displayed (when not editing) */
  value?: string;
  /** Placeholder text when value is empty */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Accessory type: chevron for navigation, none for editable */
  accessory?: 'chevron' | 'none';
  /** Callback when row is pressed (for navigation) */
  onPress?: () => void;
  /** Callback when text changes (for inline editing) */
  onChangeText?: (text: string) => void;
  /** Input mode for keyboard type */
  inputMode?: TextInputProps['inputMode'];
  /** Maximum character length */
  maxLength?: number;
  /** Whether this is a destructive action (red text) */
  destructive?: boolean;
  /** Whether row is disabled */
  disabled?: boolean;
  /** Show separator line below row */
  showSeparator?: boolean;
  /** Left icon */
  icon?: React.ReactNode;
  /** Test ID */
  testID?: string;
}

export function EditFormRow({
  label,
  value,
  placeholder,
  required = false,
  accessory = 'none',
  onPress,
  onChangeText,
  inputMode = 'text',
  maxLength,
  destructive = false,
  disabled = false,
  showSeparator = true,
  icon,
  testID,
}: EditFormRowProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onPress) {
      onPress();
    } else if (onChangeText && inputRef.current) {
      // Focus the input for inline editing
      inputRef.current.focus();
    }
  }, [disabled, onPress, onChangeText]);

  // Determine if row is editable inline
  const isInlineEditable = !onPress && !!onChangeText;

  // Text color based on state
  const getValueColor = () => {
    if (destructive) return colors.danger[600];
    if (disabled) return colors.neutral[300];
    if (!value && placeholder) return colors.neutral[400];
    return colors.neutral[900];
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        showSeparator && styles.withSeparator,
        disabled && styles.containerDisabled,
      ]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled && !isInlineEditable}
      testID={testID}
      accessible
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${label}: ${value || placeholder || 'empty'}`}
      accessibilityState={{ disabled }}
    >
      {/* Left side: Icon + Label */}
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.label,
            destructive && styles.labelDestructive,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Right side: Value/Input + Accessory */}
      <View style={styles.rightContent}>
        {isInlineEditable ? (
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              { color: getValueColor() },
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.neutral[400]}
            inputMode={inputMode}
            maxLength={maxLength}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            selectTextOnFocus
            returnKeyType="done"
          />
        ) : (
          <Text
            style={[styles.value, { color: getValueColor() }]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        )}

        {accessory === 'chevron' && (
          <ChevronRight
            size={18}
            color={disabled ? colors.neutral[300] : colors.neutral[400]}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * EditFormRowDivider - Standalone separator for custom spacing
 */
export function EditFormRowDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: TufteTokens.spacing.standard,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: colors.background.primary,
  },
  withSeparator: {
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: colors.border.light,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: TufteTokens.spacing.standard,
  },
  iconContainer: {
    marginRight: TufteTokens.spacing.standard,
    width: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutral[900],
  },
  labelDestructive: {
    color: colors.danger[600],
  },
  labelDisabled: {
    color: colors.neutral[400],
  },
  required: {
    color: colors.danger[500],
    fontWeight: '500',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'right',
    maxWidth: '70%',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'right',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 100,
  },
  inputFocused: {
    // Visual feedback when editing
  },
  chevron: {
    marginLeft: TufteTokens.spacing.compact,
  },
  divider: {
    height: TufteTokens.borders.hairline,
    backgroundColor: colors.border.light,
    marginLeft: TufteTokens.spacing.section,
  },
});

export default EditFormRow;
