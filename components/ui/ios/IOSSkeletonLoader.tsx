import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IOSSkeletonProps {
  /** Width of the skeleton */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Whether to show shimmer animation */
  shimmer?: boolean;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * iOS-style skeleton loader with shimmer effect
 * Following Apple Human Interface Guidelines
 */
export function IOSSkeleton({
  width = '100%',
  height = 20,
  borderRadius = IOS_RADIUS.sm,
  shimmer = true,
  style,
}: IOSSkeletonProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    if (shimmer) {
      animatedValue.value = withRepeat(
        withTiming(1, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        false
      );
    }
  }, [shimmer]);

  const animatedGradientStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animatedValue.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const containerWidth = typeof width === 'number' ? width : undefined;
  const containerFlex = width === '100%' ? 1 : undefined;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerWidth,
          flex: containerFlex,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      {shimmer && (
        <Animated.View style={[styles.shimmer, animatedGradientStyle]}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255, 255, 255, 0.4)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Circle skeleton for avatars
 */
export function IOSSkeletonCircle({
  size = 40,
  shimmer = true,
  style,
}: {
  size?: number;
  shimmer?: boolean;
  style?: ViewStyle;
}) {
  return (
    <IOSSkeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      shimmer={shimmer}
      style={style}
    />
  );
}

/**
 * Text line skeleton
 */
export function IOSSkeletonText({
  width = '100%',
  lines = 1,
  lineHeight = 16,
  spacing = IOS_SPACING.sm,
  shimmer = true,
  style,
}: {
  width?: number | string;
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  shimmer?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <IOSSkeleton
          key={index}
          width={index === lines - 1 && lines > 1 ? '75%' : width}
          height={lineHeight}
          borderRadius={lineHeight / 2}
          shimmer={shimmer}
          style={index < lines - 1 ? { marginBottom: spacing } : undefined}
        />
      ))}
    </View>
  );
}

/**
 * List item skeleton (avatar + text lines)
 */
export function IOSSkeletonListItem({
  showAvatar = true,
  avatarSize = 40,
  lines = 2,
  shimmer = true,
  style,
}: {
  showAvatar?: boolean;
  avatarSize?: number;
  lines?: number;
  shimmer?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.listItem, style]}>
      {showAvatar && (
        <IOSSkeletonCircle
          size={avatarSize}
          shimmer={shimmer}
          style={styles.listItemAvatar}
        />
      )}
      <View style={styles.listItemContent}>
        <IOSSkeleton
          width="60%"
          height={16}
          shimmer={shimmer}
          style={styles.listItemTitle}
        />
        {lines > 1 && (
          <IOSSkeleton
            width="40%"
            height={14}
            shimmer={shimmer}
          />
        )}
      </View>
    </View>
  );
}

/**
 * Card skeleton (for widget cards)
 */
export function IOSSkeletonCard({
  width = '100%',
  height = 155,
  shimmer = true,
  style,
}: {
  width?: number | string;
  height?: number;
  shimmer?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.card,
        { width: typeof width === 'number' ? width : undefined, height },
        typeof width === 'string' && width === '100%' && { flex: 1 },
        style,
      ]}
    >
      {/* Icon area */}
      <View style={styles.cardHeader}>
        <IOSSkeletonCircle size={28} shimmer={shimmer} />
        <IOSSkeleton width={80} height={14} shimmer={shimmer} />
      </View>
      {/* Value area */}
      <View style={styles.cardContent}>
        <IOSSkeleton width={100} height={34} shimmer={shimmer} />
        <IOSSkeleton
          width={60}
          height={14}
          shimmer={shimmer}
          style={{ marginTop: IOS_SPACING.sm }}
        />
      </View>
    </View>
  );
}

/**
 * Full screen loading skeleton
 */
export function IOSSkeletonScreen({
  header = true,
  cards = 2,
  list = 3,
}: {
  header?: boolean;
  cards?: number;
  list?: number;
}) {
  return (
    <View style={styles.screen}>
      {/* Header skeleton */}
      {header && (
        <View style={styles.screenHeader}>
          <IOSSkeleton width={200} height={34} />
          <IOSSkeleton width={120} height={16} style={{ marginTop: IOS_SPACING.sm }} />
        </View>
      )}

      {/* Cards grid */}
      {cards > 0 && (
        <View style={styles.cardsGrid}>
          {Array.from({ length: cards }).map((_, index) => (
            <IOSSkeletonCard key={`card-${index}`} />
          ))}
        </View>
      )}

      {/* List items */}
      {list > 0 && (
        <View style={styles.listSection}>
          {Array.from({ length: list }).map((_, index) => (
            <IOSSkeletonListItem key={`list-${index}`} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.systemGray5,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH * 2,
  },
  gradient: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  textContainer: {},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
  },
  listItemAvatar: {
    marginRight: IOS_SPACING.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: IOS_SPACING.sm,
  },
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  cardContent: {
    marginTop: 'auto',
  },
  screen: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    padding: IOS_SPACING.lg,
  },
  screenHeader: {
    marginBottom: IOS_SPACING.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.md,
    marginBottom: IOS_SPACING.xl,
  },
  listSection: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
  },
});

export default IOSSkeleton;
