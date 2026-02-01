/**
 * OnboardingProgressDots - Animated progress indicator
 * Shows current position in onboarding flow with spring animations
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface OnboardingProgressDotsProps {
  /** Current step index (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Color for active dot */
  activeColor?: string;
  /** Color for inactive dots */
  inactiveColor?: string;
  /** Color for completed dots */
  completedColor?: string;
}

function AnimatedDot({
  isActive,
  isCompleted,
  activeColor,
  inactiveColor,
  completedColor,
}: {
  isActive: boolean;
  isCompleted: boolean;
  activeColor: string;
  inactiveColor: string;
  completedColor: string;
}) {
  const width = useSharedValue(isActive ? 24 : 8);
  const opacity = useSharedValue(isActive ? 1 : isCompleted ? 0.6 : 0.3);

  useEffect(() => {
    width.value = withSpring(isActive ? 24 : 8, {
      damping: 15,
      stiffness: 120,
    });
    opacity.value = withSpring(isActive ? 1 : isCompleted ? 0.6 : 0.3, {
      damping: 15,
      stiffness: 120,
    });
  }, [isActive, isCompleted]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  const backgroundColor = isActive
    ? activeColor
    : isCompleted
      ? completedColor
      : inactiveColor;

  return <Animated.View style={[styles.dot, animatedStyle, { backgroundColor }]} />;
}

export function OnboardingProgressDots({
  currentStep,
  totalSteps,
  activeColor = '#FFFFFF',
  inactiveColor = 'rgba(255, 255, 255, 0.3)',
  completedColor = 'rgba(255, 255, 255, 0.6)',
}: OnboardingProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <AnimatedDot
          key={index}
          isActive={index === currentStep}
          isCompleted={index < currentStep}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          completedColor={completedColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingProgressDots;
