/**
 * CardGridTimeline Component
 *
 * Timeline indicator strip for CardGrid showing:
 * - Dots for each race (past = gray, next = green pulse, future = gray)
 * - NOW bar between past and next race
 * - Active race highlighted
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

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
}

export function CardGridTimeline({
  totalRaces,
  activeIndex,
  nextRaceIndex,
  onSelectRace,
  enableHaptics = true,
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

  const handleDotPress = (index: number) => {
    if (enableHaptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectRace(index);
  };

  // Determine if we should show the NOW bar
  // Show it when there are past races and the next race is not at index 0
  const showNowBar = nextRaceIndex !== null && nextRaceIndex > 0;

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        {Array.from({ length: totalRaces }).map((_, index) => {
          const isActive = index === activeIndex;
          const isNextRace = index === nextRaceIndex;
          const isPast = nextRaceIndex !== null && index < nextRaceIndex;

          // Insert NOW bar just before the next race
          const showNowBarBefore = showNowBar && index === nextRaceIndex;

          return (
            <React.Fragment key={index}>
              {/* NOW Bar */}
              {showNowBarBefore && (
                <View style={styles.nowBarContainer}>
                  <View style={styles.nowBar} />
                  <Text style={styles.nowText}>NOW</Text>
                </View>
              )}

              {/* Race Dot */}
              <TouchableOpacity
                onPress={() => handleDotPress(index)}
                hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                    isNextRace && !isActive && styles.dotNext,
                    isPast && !isActive && styles.dotPast,
                    isNextRace && !isActive && {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* Position indicator for many races */}
      {totalRaces > 7 && (
        <Text style={styles.positionText}>
          {activeIndex + 1} / {totalRaces}
        </Text>
      )}
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
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB', // gray-300
  },
  dotActive: {
    width: 24,
    backgroundColor: '#007AFF', // iOS blue
  },
  dotNext: {
    backgroundColor: '#34C759', // iOS green
  },
  dotPast: {
    backgroundColor: '#C7C7CC', // lighter gray for past
    opacity: 0.6,
  },
  nowBarContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  nowBar: {
    width: 2,
    height: 16,
    backgroundColor: '#34C759', // iOS green
    borderRadius: 1,
  },
  nowText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#34C759',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  positionText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
});

export default CardGridTimeline;
