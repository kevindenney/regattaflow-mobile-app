/**
 * IOSLoadingSpinner.tsx
 * iOS-style activity indicators and loading states
 * Following Apple Human Interface Guidelines
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

interface IOSActivityIndicatorProps {
  /** Size of the indicator */
  size?: 'small' | 'large';
  /** Custom color */
  color?: string;
  /** Whether the indicator is animating */
  animating?: boolean;
  /** Hide when not animating */
  hidesWhenStopped?: boolean;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * iOS-style activity indicator
 * Uses native ActivityIndicator with iOS styling
 */
export function IOSActivityIndicator({
  size = 'small',
  color = IOS_COLORS.systemGray,
  animating = true,
  hidesWhenStopped = true,
  style,
}: IOSActivityIndicatorProps) {
  if (hidesWhenStopped && !animating) {
    return null;
  }

  return (
    <ActivityIndicator
      size={size}
      color={color}
      animating={animating}
      hidesWhenStopped={hidesWhenStopped}
      style={style}
    />
  );
}

interface IOSSpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom color */
  color?: string;
  /** Additional style */
  style?: ViewStyle;
}

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Custom iOS-style spinner with smooth rotation
 * For cases where you need more control than ActivityIndicator
 */
export function IOSSpinner({
  size = 20,
  strokeWidth = 2,
  color = IOS_COLORS.systemGray,
  style,
}: IOSSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(rotation);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          {/* Animated arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

interface IOSLoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Use blur background */
  blur?: boolean;
  /** Dark mode overlay */
  dark?: boolean;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Full-screen loading overlay
 */
export function IOSLoadingOverlay({
  visible,
  message,
  blur = false,
  dark = false,
  style,
}: IOSLoadingOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: visible ? 'auto' : 'none',
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        dark ? styles.overlayDark : styles.overlayLight,
        blur && styles.overlayBlur,
        animatedStyle,
        style,
      ]}
    >
      <View style={[styles.loadingCard, dark && styles.loadingCardDark]}>
        <IOSActivityIndicator
          size="large"
          color={dark ? IOS_COLORS.systemGray : IOS_COLORS.systemGray2}
        />
        {message && (
          <Text style={[styles.loadingMessage, dark && styles.loadingMessageDark]}>
            {message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

interface IOSInlineLoadingProps {
  /** Loading message */
  message?: string;
  /** Size of spinner */
  size?: 'small' | 'large';
  /** Custom color */
  color?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Inline loading indicator with optional message
 */
export function IOSInlineLoading({
  message,
  size = 'small',
  color = IOS_COLORS.secondaryLabel,
  align = 'center',
  style,
}: IOSInlineLoadingProps) {
  const alignStyle = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }[align] as 'flex-start' | 'center' | 'flex-end';

  return (
    <View style={[styles.inlineContainer, { justifyContent: alignStyle }, style]}>
      <IOSActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.inlineMessage, { color }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

interface IOSLoadingButtonProps {
  /** Whether loading is in progress */
  loading: boolean;
  /** Button label when not loading */
  label: string;
  /** Loading label (optional) */
  loadingLabel?: string;
  /** Button press handler */
  onPress?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary';
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Button with integrated loading state
 */
export function IOSLoadingButton({
  loading,
  label,
  loadingLabel,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: IOSLoadingButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <View
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <>
          <IOSActivityIndicator
            size="small"
            color={isPrimary ? '#FFFFFF' : IOS_COLORS.systemBlue}
          />
          {loadingLabel && (
            <Text
              style={[
                styles.buttonLabel,
                isPrimary ? styles.buttonLabelPrimary : styles.buttonLabelSecondary,
              ]}
            >
              {loadingLabel}
            </Text>
          )}
        </>
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            isPrimary ? styles.buttonLabelPrimary : styles.buttonLabelSecondary,
            isDisabled && styles.buttonLabelDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

interface IOSPulsingDotProps {
  /** Dot color */
  color?: string;
  /** Dot size */
  size?: number;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Pulsing dot indicator (like typing indicator)
 */
export function IOSPulsingDot({
  color = IOS_COLORS.systemGray,
  size = 8,
  style,
}: IOSPulsingDotProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Three-dot typing indicator
 */
export function IOSTypingIndicator({
  color = IOS_COLORS.systemGray,
  dotSize = 6,
  style,
}: {
  color?: string;
  dotSize?: number;
  style?: ViewStyle;
}) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Staggered animation for each dot
    const duration = 400;
    const delay = 150;

    dot1.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    setTimeout(() => {
      dot2.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, delay);

    setTimeout(() => {
      dot3.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, delay * 2);

    return () => {
      cancelAnimation(dot1);
      cancelAnimation(dot2);
      cancelAnimation(dot3);
    };
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot1.value, [0, 1], [0, -4]) }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot2.value, [0, 1], [0, -4]) }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot3.value, [0, 1], [0, -4]) }],
  }));

  const dotBase = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
    marginHorizontal: 2,
  };

  return (
    <View style={[styles.typingContainer, style]}>
      <Animated.View style={[dotBase, dot1Style]} />
      <Animated.View style={[dotBase, dot2Style]} />
      <Animated.View style={[dotBase, dot3Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  overlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBlur: {
    ...Platform.select({
      ios: {
        // iOS blur effect would need BlurView
      },
      default: {},
    }),
  },
  loadingCard: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: IOS_SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 120,
  },
  loadingCardDark: {
    backgroundColor: 'rgba(50, 50, 50, 0.95)',
  },
  loadingMessage: {
    marginTop: IOS_SPACING.md,
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  loadingMessageDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Inline loading styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: IOS_SPACING.md,
  },
  inlineMessage: {
    marginLeft: IOS_SPACING.sm,
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
  },

  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.xl,
    borderRadius: 12,
    minHeight: 44,
    gap: IOS_SPACING.sm,
  },
  buttonPrimary: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
  },
  buttonLabelPrimary: {
    color: '#FFFFFF',
  },
  buttonLabelSecondary: {
    color: IOS_COLORS.systemBlue,
  },
  buttonLabelDisabled: {
    opacity: 0.7,
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: IOS_SPACING.sm,
  },
});

export default IOSActivityIndicator;
