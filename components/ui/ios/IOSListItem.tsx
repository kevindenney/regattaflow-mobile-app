import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_TOUCH,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SwipeAction {
  icon: IconName;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface IOSListItemProps {
  /** Primary title text */
  title: string;
  /** Secondary subtitle text */
  subtitle?: string;
  /** Leading icon name (Ionicons) */
  leadingIcon?: IconName;
  /** Leading icon color */
  leadingIconColor?: string;
  /** Leading icon background color */
  leadingIconBackgroundColor?: string;
  /** Custom leading component (overrides icon) */
  leadingComponent?: React.ReactNode;
  /** Trailing accessory type */
  trailingAccessory?: 'chevron' | 'checkmark' | 'switch' | 'badge' | 'none';
  /** Badge text (when trailingAccessory is 'badge') */
  badgeText?: string;
  /** Badge color */
  badgeColor?: string;
  /** Switch value (when trailingAccessory is 'switch') */
  switchValue?: boolean;
  /** Switch change handler */
  onSwitchChange?: (value: boolean) => void;
  /** Custom trailing component (overrides accessory) */
  trailingComponent?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Left swipe action (usually destructive) */
  leftSwipeAction?: SwipeAction;
  /** Right swipe action (usually positive) */
  rightSwipeAction?: SwipeAction;
  /** Whether the item is selected */
  selected?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Additional container style */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
  /** Custom subtitle style */
  subtitleStyle?: TextStyle;
}

const SWIPE_THRESHOLD = 80;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * iOS-style list item with swipe actions, accessories, and animations
 * Following Apple Human Interface Guidelines
 */
export function IOSListItem({
  title,
  subtitle,
  leadingIcon,
  leadingIconColor = IOS_COLORS.systemBlue,
  leadingIconBackgroundColor,
  leadingComponent,
  trailingAccessory = 'chevron',
  badgeText,
  badgeColor = IOS_COLORS.systemRed,
  switchValue,
  onSwitchChange,
  trailingComponent,
  onPress,
  onLongPress,
  leftSwipeAction,
  rightSwipeAction,
  selected = false,
  disabled = false,
  style,
  titleStyle,
  subtitleStyle,
}: IOSListItemProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      triggerHaptic('selection');
      onPress();
    }
  }, [disabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (!disabled && onLongPress) {
      triggerHaptic('impactMedium');
      onLongPress();
    }
  }, [disabled, onLongPress]);

  const panGesture = Gesture.Pan()
    .enabled(!!(leftSwipeAction || rightSwipeAction) && !disabled)
    .onUpdate((event) => {
      // Limit swipe range
      const maxSwipe = SWIPE_THRESHOLD * 1.5;
      if (event.translationX > 0 && rightSwipeAction) {
        translateX.value = Math.min(event.translationX, maxSwipe);
      } else if (event.translationX < 0 && leftSwipeAction) {
        translateX.value = Math.max(event.translationX, -maxSwipe);
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD && rightSwipeAction) {
        runOnJS(triggerHaptic)('impactMedium');
        runOnJS(rightSwipeAction.onPress)();
      } else if (event.translationX < -SWIPE_THRESHOLD && leftSwipeAction) {
        runOnJS(triggerHaptic)('impactMedium');
        runOnJS(leftSwipeAction.onPress)();
      }
      translateX.value = withSpring(0, IOS_ANIMATIONS.spring.snappy);
    });

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedLeftActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
    transform: [
      {
        scale: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0.8, 1]),
      },
    ],
  }));

  const animatedRightActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
    transform: [
      {
        scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.8, 1]),
      },
    ],
  }));

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isPressed.value
      ? IOS_COLORS.systemGray5
      : IOS_COLORS.secondarySystemGroupedBackground,
  }));

  const renderLeading = () => {
    if (leadingComponent) {
      return <View style={styles.leadingContainer}>{leadingComponent}</View>;
    }

    if (leadingIcon) {
      return (
        <View
          style={[
            styles.leadingIconContainer,
            leadingIconBackgroundColor && {
              backgroundColor: leadingIconBackgroundColor,
              borderRadius: 6,
            },
          ]}
        >
          <Ionicons
            name={leadingIcon}
            size={22}
            color={leadingIconBackgroundColor ? '#FFFFFF' : leadingIconColor}
          />
        </View>
      );
    }

    return null;
  };

  const renderTrailing = () => {
    if (trailingComponent) {
      return <View style={styles.trailingContainer}>{trailingComponent}</View>;
    }

    switch (trailingAccessory) {
      case 'chevron':
        return (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={IOS_COLORS.tertiaryLabel}
          />
        );
      case 'checkmark':
        return selected ? (
          <Ionicons
            name="checkmark"
            size={22}
            color={IOS_COLORS.systemBlue}
          />
        ) : null;
      case 'badge':
        return badgeText ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        ) : null;
      case 'switch':
        return (
          <Pressable
            onPress={() => {
              if (onSwitchChange) {
                triggerHaptic('selection');
                onSwitchChange(!switchValue);
              }
            }}
          >
            <View
              style={[
                styles.switch,
                switchValue && styles.switchOn,
              ]}
            >
              <Animated.View
                style={[
                  styles.switchThumb,
                  switchValue && styles.switchThumbOn,
                ]}
              />
            </View>
          </Pressable>
        );
      case 'none':
      default:
        return null;
    }
  };

  const content = (
    <AnimatedPressable
      style={[styles.row, animatedRowStyle, animatedPressStyle, style]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={() => {
        isPressed.value = true;
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.snappy);
      }}
      onPressOut={() => {
        isPressed.value = false;
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      disabled={disabled}
    >
      {renderLeading()}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            disabled && styles.titleDisabled,
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              disabled && styles.subtitleDisabled,
              subtitleStyle,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {renderTrailing()}
    </AnimatedPressable>
  );

  // If no swipe actions, just return the content
  if (!leftSwipeAction && !rightSwipeAction) {
    return content;
  }

  // With swipe actions, wrap in gesture detector
  return (
    <View style={styles.swipeContainer}>
      {/* Left swipe action (revealed when swiping left) */}
      {leftSwipeAction && (
        <Animated.View
          style={[
            styles.swipeAction,
            styles.leftSwipeAction,
            { backgroundColor: leftSwipeAction.backgroundColor },
            animatedLeftActionStyle,
          ]}
        >
          <Ionicons
            name={leftSwipeAction.icon}
            size={24}
            color={leftSwipeAction.color}
          />
        </Animated.View>
      )}
      {/* Right swipe action (revealed when swiping right) */}
      {rightSwipeAction && (
        <Animated.View
          style={[
            styles.swipeAction,
            styles.rightSwipeAction,
            { backgroundColor: rightSwipeAction.backgroundColor },
            animatedRightActionStyle,
          ]}
        >
          <Ionicons
            name={rightSwipeAction.icon}
            size={24}
            color={rightSwipeAction.color}
          />
        </Animated.View>
      )}
      <GestureDetector gesture={panGesture}>{content}</GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftSwipeAction: {
    right: 0,
  },
  rightSwipeAction: {
    left: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: IOS_TOUCH.listItemHeight,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  leadingContainer: {
    marginRight: IOS_SPACING.md,
  },
  leadingIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: IOS_TYPOGRAPHY.body.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.body.lineHeight,
    color: IOS_COLORS.label,
  },
  titleDisabled: {
    color: IOS_COLORS.tertiaryLabel,
  },
  subtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: IOS_TYPOGRAPHY.subhead.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.subhead.lineHeight,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  subtitleDisabled: {
    color: IOS_COLORS.quaternaryLabel,
  },
  trailingContainer: {
    marginLeft: IOS_SPACING.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemGray4,
    padding: 2,
  },
  switchOn: {
    backgroundColor: IOS_COLORS.systemGreen,
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  switchThumbOn: {
    transform: [{ translateX: 20 }],
  },
});

export default IOSListItem;
