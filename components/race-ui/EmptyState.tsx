/**
 * EmptyState Component
 *
 * Displays when there's no content with icon, title, description and optional action
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, colors } from '@/constants/designSystem';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <View style={styles.container}>
    <Ionicons name={icon} size={48} color={colors.text.tertiary} />
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {action && (
      <View style={styles.action}>
        {React.Children.map(action, (child, index) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return (
              <Text key={`action-text-${index}`} style={Typography.body}>
                {child}
              </Text>
            );
          }
          return child;
        })}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    color: colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
