/**
 * CardHeader Component
 *
 * Consistent header for card components with icon, title, and optional badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, colors } from '@/constants/designSystem';
import { Badge } from './Badge';

interface CardHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  badgeColor?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'ai';
  iconColor?: string;
  rightElement?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon,
  title,
  badge,
  badgeColor,
  badgeVariant,
  iconColor = colors.primary[600],
  rightElement,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {badge && (
        <Badge text={badge} color={badgeColor} variant={badgeVariant} />
      )}
      {rightElement}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  title: {
    ...Typography.h3,
    fontSize: 13,
    color: colors.text.primary,
  },
});
