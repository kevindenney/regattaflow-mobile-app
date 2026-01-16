/**
 * Timeline Indicators
 *
 * Minimal circle-based timeline navigation for race cards.
 * Uniform circles: hollow for inactive, filled for active.
 * Small "now" bar above upcoming race.
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const MAX_VISIBLE_DOTS = 9;

export interface TimelineRace {
  id: string;
}

export interface TimelineIndicatorsProps {
  /** Array of races with IDs */
  races: TimelineRace[];
  /** Currently selected race ID */
  selectedId: string | null;
  /** Index of the next upcoming race (defines temporal boundary) */
  nextRaceIndex?: number;
  /** Callback when a dot is pressed */
  onSelect: (id: string, index: number) => void;
  /** Snap interval for scroll positioning */
  snapInterval: number;
  /** Reference to the ScrollView to control scrolling */
  scrollViewRef: React.RefObject<ScrollView>;
  /** Active dot color (default: #374151 dark gray) */
  activeColor?: string;
  /** Next race dot accent color (default: #34C759 green) */
  nextRaceColor?: string;
  /** Whether to show the "Now" button (default: true) */
  showNowButton?: boolean;
  /** Whether to offset scroll index (for demo with add card at start) */
  scrollIndexOffset?: number;
}

/**
 * Timeline Indicators Component - Uniform Circles
 */
export function TimelineIndicators({
  races,
  selectedId,
  nextRaceIndex,
  onSelect,
  snapInterval,
  scrollViewRef,
  activeColor = '#374151',
  nextRaceColor = '#34C759',
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

  // Render a single uniform circle
  const renderDot = (race: TimelineRace, index: number) => {
    const isCurrentRace = race.id === selectedId;
    const isNextRace = index === nextRaceIndex;

    return (
      <TouchableOpacity
        key={race.id || `dot-${index}`}
        onPress={() => handleDotPress(race.id, index)}
        style={styles.dotContainer}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        {/* Now bar - subtle vertical line above the "now" dot */}
        {isNextRace && (
          <View style={[styles.nowBar, { backgroundColor: nextRaceColor }]} />
        )}
        {/* Uniform circle - filled when active, hollow when inactive */}
        <View
          style={[
            styles.dot,
            isCurrentRace
              ? { backgroundColor: activeColor }
              : styles.dotInactive,
          ]}
        />
      </TouchableOpacity>
    );
  };

  // If total races fit within max, show all dots
  if (totalRaces <= MAX_VISIBLE_DOTS) {
    return (
      <View style={styles.container}>
        <View style={styles.dotsRow}>
          {races.map((race, index) => renderDot(race, index))}
        </View>
      </View>
    );
  }

  // Otherwise, show windowed view centered on current selection
  const halfWindow = Math.floor((MAX_VISIBLE_DOTS - 1) / 2);
  let startIdx = Math.max(0, currentIndex - halfWindow);
  let endIdx = startIdx + MAX_VISIBLE_DOTS - 1;
  if (endIdx >= totalRaces) {
    endIdx = totalRaces - 1;
    startIdx = Math.max(0, endIdx - MAX_VISIBLE_DOTS + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {/* Fade indicator for more races before */}
        {startIdx > 0 && <View style={styles.fadeIndicator} />}

        {races.slice(startIdx, endIdx + 1).map((race, idx) => {
          const actualIndex = startIdx + idx;
          return renderDot(race, actualIndex);
        })}

        {/* Fade indicator for more races after */}
        {endIdx < totalRaces - 1 && <View style={styles.fadeIndicator} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24, // Lift dots up from the bottom edge
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dotContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
  nowBar: {
    width: 2,
    height: 6,
    borderRadius: 1,
    marginBottom: 3,
  },
  fadeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
});

export default TimelineIndicators;
