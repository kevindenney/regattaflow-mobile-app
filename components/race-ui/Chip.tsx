/**
 * Chip Component
 *
 * Outlined chip component for tags and selectable items
 */

import React from 'react';
import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BorderRadius, Spacing, colors } from '@/constants/designSystem';

interface ChipProps extends Omit<PressableProps, 'style'> {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  variant?: 'outlined' | 'filled';
}

export const Chip: React.FC<ChipProps> = ({
  text,
  icon,
  color = colors.primary[600],
  variant = 'outlined',
  ...pressableProps
}) => {
  const isOutlined = variant === 'outlined';

  return (
    <Pressable
      style={[
        styles.chip,
        {
          borderColor: color,
          backgroundColor: isOutlined ? 'transparent' : color + '20',
        },
      ]}
      {...pressableProps}
    >
      {icon && <Ionicons name={icon} size={16} color={color} />}
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  chipText: {
    ...Typography.body,
    fontSize: 14,
  },
});
