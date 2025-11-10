/**
 * WeatherMetricCard Component
 *
 * Compact square card for displaying weather metrics
 * Inspired by macOS Weather app design
 */

// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, BorderRadius, Spacing } from '@/constants/designSystem';

interface WeatherMetricCardProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  backgroundColor?: string;
}

export const WeatherMetricCard: React.FC<WeatherMetricCardProps> = ({
  title,
  icon,
  children,
  backgroundColor = colors.background.card,
}) => {
  const { width } = useWindowDimensions();

  // Calculate card width to fit 3 per row with proper spacing
  // Account for container padding and gaps
  const cardWidth = (width - 32 - 16) / 3; // 32px padding, 16px for gaps

  return (
    <View style={[styles.container, { backgroundColor, width: cardWidth }]}>
      {/* Header */}
      <View style={styles.header}>
        {icon && <Ionicons name={icon} size={14} color={colors.text.tertiary} />}
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {React.Children.map(children, (child, index) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return (
              <Text key={`content-text-${index}`} style={{ textAlign: 'center' }}>
                {child}
              </Text>
            );
          }
          return child;
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    minHeight: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: -0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
