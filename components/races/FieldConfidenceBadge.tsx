/**
 * Field Confidence Badge Component
 * Displays AI confidence score with color-coded indicator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';

interface FieldConfidenceBadgeProps {
  confidence: number; // 0.0 to 1.0
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
}

export function FieldConfidenceBadge({
  confidence,
  size = 'medium',
  showPercentage = true,
}: FieldConfidenceBadgeProps) {
  // Determine confidence level
  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  };

  const level = getConfidenceLevel();
  const percentage = Math.round(confidence * 100);

  // Confidence colors
  const colors = {
    high: '#10b981', // green
    medium: '#f59e0b', // amber
    low: '#ef4444', // red
  };

  const textColors = {
    high: '#065f46', // dark green
    medium: '#92400e', // dark amber
    low: '#7f1d1d', // dark red
  };

  const bgColors = {
    high: '#d1fae5', // light green
    medium: '#fef3c7', // light amber
    low: '#fee2e2', // light red
  };

  // Icon sizes
  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20,
  };

  const Icon = level === 'high' ? CheckCircle : level === 'medium' ? AlertCircle : XCircle;

  return (
    <View style={[
      styles.container,
      { backgroundColor: bgColors[level] },
      size === 'small' && styles.containerSmall,
      size === 'large' && styles.containerLarge,
    ]}>
      <Icon
        size={iconSizes[size]}
        color={colors[level]}
        strokeWidth={2}
      />
      {showPercentage && (
        <Text style={[
          styles.text,
          { color: textColors[level] },
          size === 'small' && styles.textSmall,
          size === 'large' && styles.textLarge,
        ]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  containerLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 14,
  },
});
