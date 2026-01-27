import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface IOSProgressRingProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Size of the ring */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Progress color */
  color?: string;
  /** Secondary color for gradient (optional) */
  gradientColor?: string;
  /** Track color (background) */
  trackColor?: string;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Custom center content */
  centerContent?: React.ReactNode;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * iOS-style progress ring (Activity Ring / Health style)
 * Following Apple Human Interface Guidelines
 */
export function IOSProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  color = IOS_COLORS.systemBlue,
  gradientColor,
  trackColor = IOS_COLORS.systemGray5,
  showPercentage = true,
  centerContent,
  animationDuration = 800,
  style,
}: IOSProgressRingProps) {
  const animatedProgress = useSharedValue(0);

  // Calculate ring dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Clamp progress to 0-100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: animationDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [clampedProgress, animationDuration]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * animatedProgress.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  const useGradient = !!gradientColor;
  const gradientId = `progress-gradient-${size}`;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Gradient definition */}
        {useGradient && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={gradientColor} />
            </LinearGradient>
          </Defs>
        )}

        {/* Track (background) circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={useGradient ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContainer}>
        {centerContent || (showPercentage && (
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageValue, { fontSize: size / 4 }]}>
              {Math.round(clampedProgress)}
            </Text>
            <Text style={[styles.percentageSymbol, { fontSize: size / 8 }]}>
              %
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Compact progress ring for use in lists or cards
 */
export function IOSProgressRingCompact({
  progress,
  color = IOS_COLORS.systemGreen,
  size = 40,
}: {
  progress: number;
  color?: string;
  size?: number;
}) {
  return (
    <IOSProgressRing
      progress={progress}
      size={size}
      strokeWidth={4}
      color={color}
      showPercentage={false}
    />
  );
}

/**
 * Activity ring style (like Apple Watch)
 */
export function IOSActivityRing({
  moveProgress,
  exerciseProgress,
  standProgress,
  size = 160,
}: {
  moveProgress: number;
  exerciseProgress: number;
  standProgress: number;
  size?: number;
}) {
  const strokeWidth = size / 10;
  const gap = 4;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Move ring (outer, red) */}
      <View style={styles.absoluteRing}>
        <IOSProgressRing
          progress={moveProgress}
          size={size}
          strokeWidth={strokeWidth}
          color={IOS_COLORS.systemRed}
          trackColor={`${IOS_COLORS.systemRed}33`}
          showPercentage={false}
        />
      </View>

      {/* Exercise ring (middle, green) */}
      <View style={styles.absoluteRing}>
        <IOSProgressRing
          progress={exerciseProgress}
          size={size - strokeWidth * 2 - gap * 2}
          strokeWidth={strokeWidth}
          color={IOS_COLORS.systemGreen}
          trackColor={`${IOS_COLORS.systemGreen}33`}
          showPercentage={false}
        />
      </View>

      {/* Stand ring (inner, cyan) */}
      <View style={styles.absoluteRing}>
        <IOSProgressRing
          progress={standProgress}
          size={size - strokeWidth * 4 - gap * 4}
          strokeWidth={strokeWidth}
          color={IOS_COLORS.systemCyan}
          trackColor={`${IOS_COLORS.systemCyan}33`}
          showPercentage={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  percentageValue: {
    fontWeight: '700',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  percentageSymbol: {
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  absoluteRing: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IOSProgressRing;
