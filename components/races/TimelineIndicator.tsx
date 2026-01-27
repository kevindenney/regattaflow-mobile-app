/**
 * TimelineIndicator - Tufte-inspired vertical dots for timeline navigation
 *
 * Following Tufte's principle: "The interface should disappear. Show only data."
 * - Dots only appear during vertical swipe gesture
 * - Fades away after gesture completes
 * - Minimal visual footprint
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
};

interface TimelineIndicatorProps {
  /** Total number of timelines */
  totalTimelines: number;
  /** Currently active timeline index (0-based) */
  currentIndex: number;
  /** Whether the indicator is visible (during gesture) */
  isVisible: boolean;
  /** Accent color for active dot */
  accentColor?: string;
  /** Position on screen - 'left' or 'right' */
  position?: 'left' | 'right';
}

/**
 * Individual dot in the timeline indicator
 */
function TimelineDot({
  isActive,
  isVisible,
  index,
  accentColor,
}: {
  isActive: boolean;
  isVisible: boolean;
  index: number;
  accentColor: string;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (isVisible) {
      // Stagger entrance for each dot
      opacity.value = withDelay(index * 30, withTiming(1, { duration: 150 }));
      scale.value = withDelay(index * 30, withTiming(1, { duration: 200 }));
    } else {
      // Fade out all at once
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.5, { duration: 200 });
    }
  }, [isVisible, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        isActive && [styles.dotActive, { backgroundColor: accentColor }],
        animatedStyle,
      ]}
    />
  );
}

/**
 * TimelineIndicator Component
 *
 * Displays vertical dots on the edge of the screen to indicate
 * position in timeline stack. Follows Tufte principle of showing
 * elements only when needed (during swipe gesture).
 */
export function TimelineIndicator({
  totalTimelines,
  currentIndex,
  isVisible,
  accentColor = IOS_COLORS.blue,
  position = 'left',
}: TimelineIndicatorProps) {
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (totalTimelines <= 1) return;
    if (isVisible) {
      containerOpacity.value = withTiming(1, { duration: 150 });
    } else {
      // Delay fade out slightly so user can see their position
      containerOpacity.value = withDelay(300, withTiming(0, { duration: 300 }));
    }
  }, [isVisible, totalTimelines]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // Don't render if only one timeline
  if (totalTimelines <= 1) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'left' ? styles.containerLeft : styles.containerRight,
        containerStyle,
      ]}
      pointerEvents="none"
    >
      {Array.from({ length: totalTimelines }).map((_, index) => (
        <TimelineDot
          key={index}
          isActive={index === currentIndex}
          isVisible={isVisible}
          index={index}
          accentColor={accentColor}
        />
      ))}
    </Animated.View>
  );
}

/**
 * TimelineContextBadge - Shows whose timeline you're viewing
 * Only visible when viewing someone else's timeline
 */
interface TimelineContextBadgeProps {
  /** Name to display (e.g., "Sarah's Races") */
  displayName: string;
  /** Whether viewing someone else's timeline */
  isOtherTimeline: boolean;
  /** Avatar emoji or first letter */
  avatarContent?: string;
}

export function TimelineContextBadge({
  displayName,
  isOtherTimeline,
  avatarContent,
}: TimelineContextBadgeProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isOtherTimeline ? 1 : 0, { duration: 200 });
  }, [isOtherTimeline]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isOtherTimeline) return null;

  return (
    <Animated.View style={[styles.contextBadge, animatedStyle]}>
      <View style={styles.contextAvatar}>
        <Animated.Text style={styles.contextAvatarText}>
          {avatarContent || displayName.charAt(0).toUpperCase()}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -40 }], // Center vertically
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    zIndex: 100,
  },
  containerLeft: {
    left: 8,
  },
  containerRight: {
    right: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IOS_COLORS.gray3,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TimelineIndicator;
