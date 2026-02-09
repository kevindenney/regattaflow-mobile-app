/**
 * CardGridTimeline Component
 *
 * Apple-style collapsing page indicator (like UIPageControl in iOS 14+).
 *
 * Behavior:
 * - ≤ MAX_VISIBLE dots → show all dots normally
 * - > MAX_VISIBLE dots → show a sliding window of MAX_VISIBLE dots centered
 *   on the active index. Edge dots progressively shrink to hint at more
 *   content beyond the visible window.
 *
 * Dot semantics:
 * - Active = elongated blue pill
 * - Next upcoming race = green (with pulse when not active)
 * - Past = lighter gray, reduced opacity
 * - Future = gray
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Maximum dots visible at once before collapsing kicks in */
const MAX_VISIBLE = 7;

/** Scale factors for edge dots (outermost → inner) */
const EDGE_SCALE = [0.45, 0.65]; // position 0/6, position 1/5

interface CardGridTimelineProps {
  /** Total number of races */
  totalRaces: number;
  /** Currently active race index */
  activeIndex: number;
  /** Index of next upcoming race (null if all past or all future) */
  nextRaceIndex: number | null;
  /** Callback when a dot is tapped */
  onSelectRace: (index: number) => void;
  /** Enable haptics on selection */
  enableHaptics?: boolean;
  /** Extra bottom offset to clear floating tab bar or safe area (default: 0) */
  bottomInset?: number;
}

export function CardGridTimeline({
  totalRaces,
  activeIndex,
  nextRaceIndex,
  onSelectRace,
  enableHaptics = true,
  bottomInset = 0,
}: CardGridTimelineProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for next race indicator
  useEffect(() => {
    if (nextRaceIndex !== null && nextRaceIndex !== activeIndex) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [nextRaceIndex, activeIndex, pulseAnim]);

  // Calculate the visible window of dot indices
  const { windowStart, windowEnd, visibleIndices } = useMemo(() => {
    if (totalRaces <= MAX_VISIBLE) {
      const indices = Array.from({ length: totalRaces }, (_, i) => i);
      return { windowStart: 0, windowEnd: totalRaces - 1, visibleIndices: indices };
    }

    const half = Math.floor(MAX_VISIBLE / 2);
    let start = activeIndex - half;
    start = Math.max(0, Math.min(start, totalRaces - MAX_VISIBLE));
    const end = start + MAX_VISIBLE - 1;

    const indices = Array.from({ length: MAX_VISIBLE }, (_, i) => start + i);
    return { windowStart: start, windowEnd: end, visibleIndices: indices };
  }, [totalRaces, activeIndex]);

  // Determine scale for a dot based on its position within the visible window
  const getDotScale = (index: number): number => {
    if (totalRaces <= MAX_VISIBLE) return 1;

    const posInWindow = index - windowStart;
    const hasMoreLeft = windowStart > 0;
    const hasMoreRight = windowEnd < totalRaces - 1;

    // Leftmost edge: shrink if there are more dots to the left
    if (posInWindow === 0 && hasMoreLeft) return EDGE_SCALE[0];
    if (posInWindow === 1 && hasMoreLeft) return EDGE_SCALE[1];

    // Rightmost edge: shrink if there are more dots to the right
    if (posInWindow === MAX_VISIBLE - 1 && hasMoreRight) return EDGE_SCALE[0];
    if (posInWindow === MAX_VISIBLE - 2 && hasMoreRight) return EDGE_SCALE[1];

    return 1;
  };

  const handleDotPress = (index: number) => {
    if (enableHaptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectRace(index);
  };

  return (
    <View style={[styles.container, { bottom: 16 + bottomInset }]}>
      <View style={styles.timeline}>
        {visibleIndices.map((index) => {
          const isActive = index === activeIndex;
          const isNextRace = index === nextRaceIndex;
          const isPast = nextRaceIndex !== null && index < nextRaceIndex;
          const scale = getDotScale(index);
          const isNextPulsing = isNextRace && !isActive;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isNextPulsing && styles.dotNext,
                  isPast && !isActive && styles.dotPast,
                  {
                    transform: [
                      { scale: isNextPulsing ? Animated.multiply(pulseAnim, scale) : scale },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D1D5DB', // gray-300
  },
  dotActive: {
    width: 20,
    borderRadius: 3.5,
    backgroundColor: '#007AFF', // iOS blue
  },
  dotNext: {
    backgroundColor: '#34C759', // iOS green
  },
  dotPast: {
    backgroundColor: '#C7C7CC', // lighter gray for past
    opacity: 0.5,
  },
});

export default CardGridTimeline;
