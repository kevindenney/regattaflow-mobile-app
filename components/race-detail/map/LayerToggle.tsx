/**
 * LayerToggle Component
 *
 * Toggle button for map layers with active state indicator
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BorderRadius, Spacing, colors } from '@/constants/designSystem';

interface LayerToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
}

export const LayerToggle: React.FC<LayerToggleProps> = ({
  icon,
  label,
  isActive,
  onToggle,
  color,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.layerToggle,
        isActive && {
          backgroundColor: color + '20',
          borderColor: color,
        },
        pressed && styles.pressed,
      ]}
      onPress={onToggle}
    >
      <Ionicons name={icon} size={20} color={isActive ? color : colors.text.tertiary} />
      <Text
        style={[
          styles.layerToggleText,
          isActive && { color },
        ]}
      >
        {label}
      </Text>
      {isActive && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  layerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    gap: Spacing.xs,
    minWidth: 100,
  },
  layerToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});
