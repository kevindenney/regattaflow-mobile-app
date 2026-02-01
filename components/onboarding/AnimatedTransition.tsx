/**
 * AnimatedTransition - Shared transition wrapper for onboarding screens
 * Provides consistent enter/exit animations across all screens
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Duration of animation (ms) */
  duration?: number;
}

export function AnimatedTransition({
  children,
  style,
  delay = 0,
  duration = 300,
}: AnimatedTransitionProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/**
 * StaggeredContainer - Container that staggers children animations
 */
interface StaggeredContainerProps {
  children: React.ReactNode;
  /** Base delay before first child animation */
  baseDelay?: number;
  /** Delay increment between each child */
  staggerDelay?: number;
  style?: ViewStyle;
}

export function StaggeredContainer({
  children,
  baseDelay = 0,
  staggerDelay = 100,
  style,
}: StaggeredContainerProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <Animated.View style={[styles.container, style]}>
      {childrenArray.map((child, index) => (
        <AnimatedTransition key={index} delay={baseDelay + index * staggerDelay}>
          {child}
        </AnimatedTransition>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default AnimatedTransition;
