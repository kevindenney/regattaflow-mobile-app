import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
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
  IOS_RADIUS,
  IOS_SHADOWS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type WidgetSize = 'small' | 'medium' | 'large';

interface IOSWidgetCardProps {
  /** Widget size (affects dimensions and content density) */
  size?: WidgetSize;
  /** Widget title/label */
  title?: string;
  /** Main value to display */
  value?: string;
  /** Unit or suffix for the value */
  unit?: string;
  /** Icon name (Ionicons) */
  icon?: IconName;
  /** Icon color */
  iconColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Accent color for highlights */
  accentColor?: string;
  /** Whether to use gradient background */
  gradient?: boolean;
  /** Custom content component */
  children?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Additional style */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
  /** Custom value style */
  valueStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * iOS Widget-style card (Home Screen widget style)
 * Following Apple Human Interface Guidelines
 */
export function IOSWidgetCard({
  size = 'small',
  title,
  value,
  unit,
  icon,
  iconColor = IOS_COLORS.systemBlue,
  backgroundColor = IOS_COLORS.secondarySystemGroupedBackground,
  accentColor,
  gradient = false,
  children,
  onPress,
  style,
  titleStyle,
  valueStyle,
}: IOSWidgetCardProps) {
  const scale = useSharedValue(1);

  const dimensions = getWidgetDimensions(size);

  const handlePress = () => {
    if (onPress) {
      triggerHaptic('impactLight');
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };

  const content = (
    <View style={styles.content}>
      {/* Header with icon and title */}
      {(icon || title) && (
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, accentColor && { backgroundColor: `${accentColor}20` }]}>
              <Ionicons
                name={icon}
                size={size === 'small' ? 18 : 22}
                color={accentColor || iconColor}
              />
            </View>
          )}
          {title && (
            <Text
              style={[
                styles.title,
                size === 'small' && styles.titleSmall,
                titleStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </View>
      )}

      {/* Custom children or default value display */}
      {children || (
        <View style={styles.valueContainer}>
          {value && (
            <View style={styles.valueRow}>
              <Text
                style={[
                  styles.value,
                  size === 'small' && styles.valueSmall,
                  size === 'large' && styles.valueLarge,
                  accentColor && { color: accentColor },
                  valueStyle,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value}
              </Text>
              {unit && (
                <Text
                  style={[
                    styles.unit,
                    size === 'small' && styles.unitSmall,
                  ]}
                >
                  {unit}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      style={[
        styles.container,
        dimensions,
        { backgroundColor },
        IOS_SHADOWS.card,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      {content}
    </AnimatedPressable>
  );
}

function getWidgetDimensions(size: WidgetSize): ViewStyle {
  switch (size) {
    case 'small':
      return {
        width: 155,
        height: 155,
        borderRadius: IOS_RADIUS.lg,
        padding: IOS_SPACING.md,
      };
    case 'medium':
      return {
        width: '100%',
        height: 155,
        borderRadius: IOS_RADIUS.lg,
        padding: IOS_SPACING.lg,
      };
    case 'large':
      return {
        width: '100%',
        height: 320,
        borderRadius: IOS_RADIUS.xl,
        padding: IOS_SPACING.lg,
      };
  }
}

/**
 * Grid layout for widgets (2x2 small widgets or combinations)
 */
export function IOSWidgetGrid({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.grid, style]}>
      {children}
    </View>
  );
}

/**
 * Compact stat widget for displaying key metrics
 */
export function IOSStatWidget({
  label,
  value,
  unit,
  trend,
  trendUp,
  icon,
  iconColor,
  onPress,
}: {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: IconName;
  iconColor?: string;
  onPress?: () => void;
}) {
  const trendColor = trendUp ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed;

  return (
    <IOSWidgetCard
      size="small"
      title={label}
      icon={icon}
      iconColor={iconColor}
      onPress={onPress}
    >
      <View style={styles.statContent}>
        <View style={styles.valueRow}>
          <Text style={styles.statValue}>{value}</Text>
          {unit && <Text style={styles.statUnit}>{unit}</Text>}
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trendUp ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={trendColor}
            />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend}
            </Text>
          </View>
        )}
      </View>
    </IOSWidgetCard>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.sm,
  },
  title: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  titleSmall: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
  },
  valueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  valueSmall: {
    fontSize: 28,
  },
  valueLarge: {
    fontSize: 44,
  },
  unit: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 4,
  },
  unitSmall: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.md,
  },
  statContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  statValue: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IOS_SPACING.xs,
  },
  trendText: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default IOSWidgetCard;
