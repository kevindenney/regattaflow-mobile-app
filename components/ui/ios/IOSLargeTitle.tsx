import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

interface IOSLargeTitleProps {
  /** The main title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional right accessory component */
  rightAccessory?: React.ReactNode;
  /** Optional left accessory component */
  leftAccessory?: React.ReactNode;
  /** Whether to show the large title (for scroll animation) */
  showLargeTitle?: boolean;
  /** Shared scroll value for animation */
  scrollY?: SharedValue<number>;
  /** Height at which to collapse the title */
  collapseThreshold?: number;
  /** Additional container style */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
  /** Custom subtitle style */
  subtitleStyle?: TextStyle;
}

const LARGE_TITLE_HEIGHT = 52;
const INLINE_TITLE_HEIGHT = 44;
const COLLAPSE_THRESHOLD = 80;

/**
 * iOS-style large title with collapse behavior on scroll
 * Following Apple Human Interface Guidelines
 */
export function IOSLargeTitle({
  title,
  subtitle,
  rightAccessory,
  leftAccessory,
  showLargeTitle = true,
  scrollY,
  collapseThreshold = COLLAPSE_THRESHOLD,
  style,
  titleStyle,
  subtitleStyle,
}: IOSLargeTitleProps) {
  // Animated styles for large title collapse
  const animatedLargeTitleStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: showLargeTitle ? 1 : 0 };
    }

    const opacity = interpolate(
      scrollY.value,
      [0, collapseThreshold * 0.5, collapseThreshold],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, collapseThreshold],
      [0, -20],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, collapseThreshold],
      [1, 0.9],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  }, [scrollY, showLargeTitle, collapseThreshold]);

  // Animated styles for inline title (shows when large title is hidden)
  const animatedInlineTitleStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: showLargeTitle ? 0 : 1 };
    }

    const opacity = interpolate(
      scrollY.value,
      [collapseThreshold * 0.7, collapseThreshold],
      [0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  }, [scrollY, showLargeTitle, collapseThreshold]);

  return (
    <View style={[styles.container, style]}>
      {/* Inline navigation bar (shows when scrolled) */}
      <View style={styles.inlineHeader}>
        <View style={styles.inlineLeft}>
          {leftAccessory}
        </View>
        <Animated.View
          style={[styles.inlineTitleContainer, animatedInlineTitleStyle]}
        >
          <Text style={styles.inlineTitle} numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
        <View style={styles.inlineRight}>
          {rightAccessory}
        </View>
      </View>

      {/* Large title section */}
      {showLargeTitle && (
        <Animated.View style={[styles.largeTitleContainer, animatedLargeTitleStyle]}>
          <Text style={[styles.largeTitle, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Hook to create a scroll handler for large title collapse
 */
export function useLargeTitleScroll() {
  const scrollY = Animated.useSharedValue(0);

  const scrollHandler = Animated.useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return { scrollY, scrollHandler };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.systemBackground,
  },
  inlineHeader: {
    height: INLINE_TITLE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent', // Will show on scroll
  },
  inlineLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  inlineRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  inlineTitleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  inlineTitle: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: IOS_TYPOGRAPHY.headline.fontWeight,
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  largeTitleContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.md,
    transformOrigin: 'left center',
  },
  largeTitle: {
    fontSize: IOS_TYPOGRAPHY.largeTitle.fontSize,
    fontWeight: IOS_TYPOGRAPHY.largeTitle.fontWeight as any,
    lineHeight: IOS_TYPOGRAPHY.largeTitle.lineHeight,
    letterSpacing: IOS_TYPOGRAPHY.largeTitle.letterSpacing,
    color: IOS_COLORS.label,
    ...(Platform.OS === 'ios' && {
      fontFamily: 'System',
    }),
  },
  subtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: IOS_TYPOGRAPHY.subhead.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.subhead.lineHeight,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },
});

export default IOSLargeTitle;
