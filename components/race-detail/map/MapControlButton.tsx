/**
 * MapControlButton Component
 *
 * Floating control buttons for map interactions
 */

import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadows, BorderRadius, colors } from '@/constants/designSystem';

interface MapControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tooltip?: string;
  isActive?: boolean;
}

export const MapControlButton: React.FC<MapControlButtonProps> = ({
  icon,
  onPress,
  tooltip,
  isActive = false,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isActive && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      hitSlop={8}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isActive ? colors.primary[600] : colors.text.primary}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.small,
    padding: 10,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  buttonActive: {
    backgroundColor: colors.primary[50],
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
