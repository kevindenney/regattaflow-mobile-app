/**
 * Badge Component
 *
 * Small pill-shaped badges for status indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, BorderRadius, colors, badges } from '@/constants/designSystem';

interface BadgeProps {
  text: string;
  color?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ text, color, variant = 'info' }) => {
  // Use custom color if provided, otherwise use variant from design system
  const badgeColors = color
    ? { background: color + '20', text: color }
    : {
        background: badges[variant].background,
        text: badges[variant].text,
      };

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.background }]}>
      <Text style={[styles.badgeText, { color: badgeColors.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  badgeText: {
    ...Typography.captionBold,
  },
});
