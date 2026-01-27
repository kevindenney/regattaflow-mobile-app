import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface IOSCheckmarkProps {
  /** Whether the checkmark is checked */
  checked: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Size of the checkmark */
  size?: 'small' | 'regular' | 'large';
  /** Color when checked */
  checkedColor?: string;
  /** Color when unchecked */
  uncheckedColor?: string;
  /** Whether the checkmark is disabled */
  disabled?: boolean;
  /** Additional style */
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

/**
 * iOS-style animated checkmark with circle fill animation
 * Following Apple Human Interface Guidelines
 */
export function IOSCheckmark({
  checked,
  onChange,
  size = 'regular',
  checkedColor = IOS_COLORS.systemBlue,
  uncheckedColor = IOS_COLORS.systemGray3,
  disabled = false,
  style,
}: IOSCheckmarkProps) {
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  const dimensions = getCheckmarkSize(size);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, IOS_ANIMATIONS.spring.snappy);
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;

    // Trigger haptic and bounce animation
    triggerHaptic(checked ? 'selection' : 'notificationSuccess');
    scale.value = withSequence(
      withSpring(0.85, IOS_ANIMATIONS.spring.stiff),
      withSpring(1.05, IOS_ANIMATIONS.spring.bouncy),
      withSpring(1, IOS_ANIMATIONS.spring.snappy)
    );

    onChange?.(!checked);
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', checkedColor]
    );

    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [uncheckedColor, checkedColor]
    );

    return {
      backgroundColor,
      borderColor,
      transform: [{ scale: scale.value }],
    };
  });

  const animatedCheckStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    const checkScale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.3, 0.5, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale: checkScale }],
    };
  });

  return (
    <AnimatedPressable
      style={[
        styles.container,
        dimensions.container,
        animatedContainerStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <AnimatedIonicons
        name="checkmark"
        size={dimensions.iconSize}
        color="#FFFFFF"
        style={animatedCheckStyle}
      />
    </AnimatedPressable>
  );
}

/**
 * Circle checkmark variant (like iOS Reminders/Tasks)
 */
export function IOSCircleCheckmark({
  checked,
  onChange,
  size = 'regular',
  color = IOS_COLORS.systemBlue,
  disabled = false,
  style,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'small' | 'regular' | 'large';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  const dimensions = getCheckmarkSize(size);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, IOS_ANIMATIONS.spring.snappy);
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;

    triggerHaptic(checked ? 'selection' : 'notificationSuccess');
    scale.value = withSequence(
      withSpring(0.85, IOS_ANIMATIONS.spring.stiff),
      withSpring(1.05, IOS_ANIMATIONS.spring.bouncy),
      withSpring(1, IOS_ANIMATIONS.spring.snappy)
    );

    onChange?.(!checked);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <AnimatedPressable
      style={[styles.circleContainer, animatedStyle, style]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={checked ? 'checkmark-circle-fill' : 'circle-outline'}
        size={dimensions.container.width}
        color={checked ? color : IOS_COLORS.systemGray3}
      />
    </AnimatedPressable>
  );
}

/**
 * Square checkbox variant
 */
export function IOSSquareCheckbox({
  checked,
  onChange,
  size = 'regular',
  color = IOS_COLORS.systemBlue,
  disabled = false,
  style,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'small' | 'regular' | 'large';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  const dimensions = getCheckmarkSize(size);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, IOS_ANIMATIONS.spring.snappy);
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;

    triggerHaptic(checked ? 'selection' : 'notificationSuccess');
    scale.value = withSequence(
      withSpring(0.85, IOS_ANIMATIONS.spring.stiff),
      withSpring(1.05, IOS_ANIMATIONS.spring.bouncy),
      withSpring(1, IOS_ANIMATIONS.spring.snappy)
    );

    onChange?.(!checked);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <AnimatedPressable
      style={[styles.circleContainer, animatedStyle, style]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={dimensions.container.width}
        color={checked ? color : IOS_COLORS.systemGray3}
      />
    </AnimatedPressable>
  );
}

function getCheckmarkSize(size: 'small' | 'regular' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
        iconSize: 12,
      };
    case 'large':
      return {
        container: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5 },
        iconSize: 18,
      };
    case 'regular':
    default:
      return {
        container: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
        iconSize: 16,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IOSCheckmark;
