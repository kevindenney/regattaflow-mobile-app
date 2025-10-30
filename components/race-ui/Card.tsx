/**
 * Card Component for Race Detail Redesign
 *
 * Clean, card-based container with consistent styling
 * Inspired by Apple Weather's design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Shadows, BorderRadius, Spacing, colors } from '@/constants/designSystem';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  size = 'medium',
  variant = 'elevated',
}) => {
  const sizeStyles = {
    small: { padding: Spacing.sm },
    medium: { padding: Spacing.md },
    large: { padding: Spacing.lg },
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.background.primary,
      ...Shadows.none,
    },
    elevated: {
      backgroundColor: colors.background.primary,
      ...Shadows.small,
    },
    outlined: {
      backgroundColor: colors.background.primary,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...Shadows.none,
    },
  };

  return (
    <View
      style={[
        styles.card,
        sizeStyles[size],
        variantStyles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
});
