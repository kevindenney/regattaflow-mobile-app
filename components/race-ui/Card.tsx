/**
 * Card Component for Race Detail Redesign
 *
 * Clean, card-based container with consistent styling
 * Inspired by Apple Weather's design
 *
 * Variants:
 * - default: No shadow, just background
 * - elevated: Subtle shadow for depth
 * - outlined: Border instead of shadow
 * - tufte: Minimal decoration following Edward Tufte's principles
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Shadows, BorderRadius, Spacing, colors, TufteTokens } from '@/constants/designSystem';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined' | 'tufte';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  size = 'medium',
  variant = 'elevated',
}) => {
  // Standard size styles
  const sizeStyles: Record<string, ViewStyle> = {
    small: { padding: Spacing.sm },
    medium: { padding: Spacing.md },
    large: { padding: Spacing.lg },
  };

  // Tufte uses tighter spacing for information density
  const tufteSizeStyles: Record<string, ViewStyle> = {
    small: { padding: TufteTokens.spacing.compact }, // 8px
    medium: { padding: TufteTokens.spacing.standard }, // 12px
    large: { padding: TufteTokens.spacing.section }, // 16px
  };

  const variantStyles: Record<string, ViewStyle> = {
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
    // Tufte variant: minimal decoration, maximum data-ink ratio
    tufte: {
      backgroundColor: TufteTokens.backgrounds.paper,
      borderWidth: TufteTokens.borders.hairline, // 0.5px
      borderColor: TufteTokens.borders.color,
      ...Platform.select({
        web: TufteTokens.shadows.subtleWeb,
        default: TufteTokens.shadows.subtle,
      }),
    } as ViewStyle,
  };

  // Use Tufte-specific size if variant is tufte
  const appliedSizeStyle = variant === 'tufte'
    ? tufteSizeStyles[size]
    : sizeStyles[size];

  // Use Tufte-specific border radius if variant is tufte
  const baseStyle = variant === 'tufte'
    ? styles.cardTufte
    : styles.card;

  return (
    <View
      style={[
        baseStyle,
        appliedSizeStyle,
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
    borderRadius: BorderRadius.medium, // 8px default
    marginBottom: Spacing.sm,
  },
  cardTufte: {
    borderRadius: TufteTokens.borderRadius.subtle, // 4px for Tufte (minimal)
    marginBottom: Spacing.sm,
  },
});
