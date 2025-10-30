/**
 * ConditionBadge Component
 *
 * Small badge displaying wind/current conditions with icon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, colors } from '@/constants/designSystem';

interface ConditionBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({
  icon,
  label,
  color = colors.primary[600],
}) => {
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
