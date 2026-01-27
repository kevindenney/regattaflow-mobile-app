import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IOSEmptyStateProps {
  /** Icon to display (Ionicons name) */
  icon: IconName;
  /** Icon color (defaults to secondary label) */
  iconColor?: string;
  /** Icon size (defaults to 56) */
  iconSize?: number;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action button handler */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action button handler */
  onSecondaryAction?: () => void;
  /** Whether to use compact layout */
  compact?: boolean;
  /** Additional container style */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
  /** Custom subtitle style */
  subtitleStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * iOS-style empty state component
 * Following Apple Human Interface Guidelines
 */
export function IOSEmptyState({
  icon,
  iconColor = IOS_COLORS.secondaryLabel,
  iconSize = 56,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style,
  titleStyle,
  subtitleStyle,
}: IOSEmptyStateProps) {
  const primaryScale = useSharedValue(1);
  const secondaryScale = useSharedValue(1);

  const handlePrimaryPress = () => {
    if (onAction) {
      triggerHaptic('impactLight');
      onAction();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondaryAction) {
      triggerHaptic('selection');
      onSecondaryAction();
    }
  };

  const primaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryScale.value }],
  }));

  const secondaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryScale.value }],
  }));

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {/* Icon */}
      <View style={[styles.iconContainer, compact && styles.iconContainerCompact]}>
        <Ionicons
          name={icon}
          size={compact ? 40 : iconSize}
          color={iconColor}
        />
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          compact && styles.titleCompact,
          titleStyle,
        ]}
      >
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            compact && styles.subtitleCompact,
            subtitleStyle,
          ]}
        >
          {subtitle}
        </Text>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <View style={[styles.actionsContainer, compact && styles.actionsContainerCompact]}>
          {actionLabel && onAction && (
            <AnimatedPressable
              style={[styles.primaryButton, primaryAnimatedStyle]}
              onPress={handlePrimaryPress}
              onPressIn={() => {
                primaryScale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
              }}
              onPressOut={() => {
                primaryScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
              }}
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </AnimatedPressable>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <AnimatedPressable
              style={[styles.secondaryButton, secondaryAnimatedStyle]}
              onPress={handleSecondaryPress}
              onPressIn={() => {
                secondaryScale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
              }}
              onPressOut={() => {
                secondaryScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
              }}
            >
              <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
            </AnimatedPressable>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Inline empty state for use within lists or cards
 */
export function IOSInlineEmptyState({
  icon,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.inlineContainer}>
      <Ionicons
        name={icon}
        size={24}
        color={IOS_COLORS.tertiaryLabel}
        style={styles.inlineIcon}
      />
      <Text style={styles.inlineMessage}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text style={styles.inlineAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IOS_SPACING.xxxl,
  },
  containerCompact: {
    padding: IOS_SPACING.lg,
  },
  iconContainer: {
    marginBottom: IOS_SPACING.lg,
  },
  iconContainerCompact: {
    marginBottom: IOS_SPACING.md,
  },
  title: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: IOS_TYPOGRAPHY.title3.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.title3.lineHeight,
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  titleCompact: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
  },
  subtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: IOS_TYPOGRAPHY.subhead.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.subhead.lineHeight,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    maxWidth: 300,
  },
  subtitleCompact: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    maxWidth: 250,
  },
  actionsContainer: {
    marginTop: IOS_SPACING.xl,
    gap: IOS_SPACING.md,
    alignItems: 'center',
  },
  actionsContainerCompact: {
    marginTop: IOS_SPACING.lg,
  },
  primaryButton: {
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.xl,
    borderRadius: 12,
    minWidth: 120,
  },
  primaryButtonText: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
  },
  secondaryButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '400',
    color: IOS_COLORS.systemBlue,
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.sm,
  },
  inlineIcon: {
    marginRight: IOS_SPACING.xs,
  },
  inlineMessage: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },
  inlineAction: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
});

export default IOSEmptyState;
