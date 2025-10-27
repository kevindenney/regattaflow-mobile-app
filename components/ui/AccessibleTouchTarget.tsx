import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, TouchableOpacityProps } from 'react-native';

/**
 * AccessibleTouchTarget
 *
 * Ensures minimum 44x44pt touch targets for accessibility compliance (WCAG 2.5.5).
 * Wraps small interactive elements with invisible padding to meet touch target requirements.
 *
 * @example
 * // Wrap a small icon button
 * <AccessibleTouchTarget onPress={handlePress} accessibilityLabel="Close">
 *   <Icon name="x" size={20} />
 * </AccessibleTouchTarget>
 *
 * @example
 * // Wrap notification bell with custom size
 * <AccessibleTouchTarget
 *   onPress={openNotifications}
 *   accessibilityLabel="Notifications"
 *   accessibilityHint="View your notifications"
 *   minSize={48}
 * >
 *   <BellIcon size={24} />
 * </AccessibleTouchTarget>
 *
 * @example
 * // Use as non-interactive wrapper (just for sizing)
 * <AccessibleTouchTarget interactive={false}>
 *   <SmallIcon size={20} />
 * </AccessibleTouchTarget>
 */

interface AccessibleTouchTargetProps extends TouchableOpacityProps {
  /** The content to wrap (typically a small icon or button) */
  children: React.ReactNode;
  /** Minimum touch target size in points (default: 44) */
  minSize?: number;
  /** Whether the element is interactive (default: true) */
  interactive?: boolean;
  /** Custom style for the wrapper */
  style?: ViewStyle;
}

export function AccessibleTouchTarget({
  children,
  minSize = 44,
  interactive = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...touchableProps
}: AccessibleTouchTargetProps) {
  const containerStyle = [
    styles.container,
    {
      minWidth: minSize,
      minHeight: minSize,
    },
    style,
  ];

  if (!interactive) {
    return (
      <View style={containerStyle}>
        {children}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      {...touchableProps}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * Usage Guidelines:
 *
 * 1. Always provide accessibilityLabel for icon-only buttons
 * 2. Add accessibilityHint to explain what happens when tapped
 * 3. Use minSize prop to override default 44pt when needed (e.g., 48pt for better UX)
 * 4. Set interactive={false} if wrapping non-interactive elements that just need sizing
 *
 * Common Use Cases:
 * - Notification bells
 * - Close buttons (X icons)
 * - Small action icons in cards
 * - Tab bar icons
 * - Toolbar icons
 *
 * Before (Non-Accessible):
 * <TouchableOpacity onPress={handleClose}>
 *   <Icon name="x" size={20} />
 * </TouchableOpacity>
 *
 * After (Accessible):
 * <AccessibleTouchTarget
 *   onPress={handleClose}
 *   accessibilityLabel="Close"
 * >
 *   <Icon name="x" size={20} />
 * </AccessibleTouchTarget>
 */
