/**
 * Timeline Indicators
 *
 * Horizontal dot-based timeline navigation for race cards.
 * Shows windowed view with position indicator when many races exist.
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const MAX_VISIBLE_DOTS = 7;

export interface TimelineRace {
  id: string;
}

export interface TimelineIndicatorsProps {
  /** Array of races with IDs */
  races: TimelineRace[];
  /** Currently selected race ID */
  selectedId: string | null;
  /** Callback when a dot is pressed */
  onSelect: (id: string, index: number) => void;
  /** Snap interval for scroll positioning */
  snapInterval: number;
  /** Reference to the ScrollView to control scrolling */
  scrollViewRef: React.RefObject<ScrollView>;
  /** Active dot color (default: #2563EB blue) */
  activeColor?: string;
  /** Whether to offset scroll index (for demo with add card at start) */
  scrollIndexOffset?: number;
}

/**
 * Timeline Indicators Component
 */
export function TimelineIndicators({
  races,
  selectedId,
  onSelect,
  snapInterval,
  scrollViewRef,
  activeColor = '#2563EB',
  scrollIndexOffset = 0,
}: TimelineIndicatorsProps) {
  const totalRaces = races.length;
  const currentIndex = races.findIndex((r) => r.id === selectedId);

  const handleDotPress = useCallback(
    (id: string, index: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const scrollX = (index + scrollIndexOffset) * snapInterval;
      scrollViewRef.current?.scrollTo({ x: scrollX, y: 0, animated: true });
      onSelect(id, index);
    },
    [snapInterval, scrollViewRef, onSelect, scrollIndexOffset]
  );

  if (totalRaces <= 1) {
    return null;
  }

  // If total races fit within max, show all dots
  if (totalRaces <= MAX_VISIBLE_DOTS) {
    return (
      <View style={styles.container}>
        {races.map((race, index) => {
          const isCurrentRace = race.id === selectedId;
          return (
            <TouchableOpacity
              key={race.id || `dot-${index}`}
              onPress={() => handleDotPress(race.id, index)}
              style={[
                styles.dot,
                {
                  width: isCurrentRace ? 24 : 8,
                  backgroundColor: isCurrentRace ? activeColor : '#D1D5DB',
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            />
          );
        })}
      </View>
    );
  }

  // Otherwise, show windowed view with position indicator
  const halfWindow = Math.floor((MAX_VISIBLE_DOTS - 1) / 2);
  let startIdx = Math.max(0, currentIndex - halfWindow);
  let endIdx = startIdx + MAX_VISIBLE_DOTS - 1;
  if (endIdx >= totalRaces) {
    endIdx = totalRaces - 1;
    startIdx = Math.max(0, endIdx - MAX_VISIBLE_DOTS + 1);
  }

  return (
    <View style={styles.windowedContainer}>
      {/* Left indicator if more races before */}
      {startIdx > 0 && (
        <Text style={styles.arrowIndicator}>‹</Text>
      )}
      {races.slice(startIdx, endIdx + 1).map((race, idx) => {
        const actualIndex = startIdx + idx;
        const isCurrentRace = race.id === selectedId;
        return (
          <TouchableOpacity
            key={race.id || `dot-${actualIndex}`}
            onPress={() => handleDotPress(race.id, actualIndex)}
            style={[
              styles.smallDot,
              {
                width: isCurrentRace ? 20 : 6,
                backgroundColor: isCurrentRace ? activeColor : '#D1D5DB',
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          />
        );
      })}
      {/* Right indicator if more races after */}
      {endIdx < totalRaces - 1 && (
        <Text style={[styles.arrowIndicator, { marginLeft: 2, marginRight: 0 }]}>›</Text>
      )}
      {/* Position indicator */}
      <Text style={styles.positionIndicator}>
        {currentIndex + 1}/{totalRaces}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  windowedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  smallDot: {
    height: 6,
    borderRadius: 3,
  },
  arrowIndicator: {
    fontSize: 10,
    color: '#94A3B8',
    marginRight: 2,
  },
  positionIndicator: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 8,
  },
});

export default TimelineIndicators;
