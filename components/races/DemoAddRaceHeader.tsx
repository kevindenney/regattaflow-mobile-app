/**
 * Demo Add Race Header
 *
 * Helpful hint with add button for demo/new users who haven't added races yet.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { addRaceHeaderStyles } from '@/components/races/styles';

export interface DemoAddRaceHeaderProps {
  /** Callback when add button is pressed */
  onAddRace: () => void;
  /** Optional custom message text */
  message?: string;
}

/**
 * Demo Add Race Header Component
 */
export function DemoAddRaceHeader({
  onAddRace,
  message = 'Add your own to get started',
}: DemoAddRaceHeaderProps) {
  return (
    <View style={addRaceHeaderStyles.container}>
      <Text style={addRaceHeaderStyles.countText}>{message}</Text>
      <Pressable
        onPress={onAddRace}
        style={({ pressed }) => [
          addRaceHeaderStyles.addButton,
          pressed && { opacity: 0.6 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={addRaceHeaderStyles.addButtonText}>+ Add</Text>
      </Pressable>
    </View>
  );
}

export default DemoAddRaceHeader;
