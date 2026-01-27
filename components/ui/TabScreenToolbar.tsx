/**
 * TabScreenToolbar
 *
 * Reusable toolbar for tab screens with a large title on the left
 * and action icons grouped in a white capsule pill on the right.
 * Inspired by the Apple Health "Records" screen pattern.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SHADOWS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolbarAction {
  /** Ionicons name (e.g. 'search-outline') */
  icon: string;
  /** Accessibility label */
  label: string;
  onPress: () => void;
  /** When true the icon renders filled + blue tint */
  isActive?: boolean;
  /** Override tint color when active (default: systemBlue) */
  activeTint?: string;
}

export interface TabScreenToolbarProps {
  title: string;
  subtitle?: string;
  onSubtitlePress?: () => void;
  actions?: ToolbarAction[];
  /**
   * Custom right-side content that replaces the default actions capsule.
   * Use this when you need a ref or custom layout for the right element.
   */
  rightContent?: React.ReactNode;
  /** Safe area top inset from useSafeAreaInsets().top */
  topInset?: number;
  /** Background color (default: systemGroupedBackground) */
  backgroundColor?: string;
  /** Show hairline border at bottom (default: true) */
  showBorder?: boolean;
  /** Show a spinner next to the title */
  isLoading?: boolean;
  /** Extra content below the nav row (e.g. segmented controls, search bar) */
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Internal: animated action button
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ActionButton({ action }: { action: ToolbarAction }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tint = action.isActive
    ? action.activeTint ?? IOS_COLORS.systemBlue
    : IOS_COLORS.secondaryLabel;

  // Resolve filled icon name when active (convention: remove '-outline' suffix)
  const iconName = action.isActive
    ? action.icon.replace('-outline', '')
    : action.icon;

  return (
    <AnimatedPressable
      style={[styles.actionButton, animStyle]}
      accessibilityLabel={action.label}
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic('selection');
        action.onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <Ionicons name={iconName as any} size={20} color={tint} />
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TabScreenToolbar({
  title,
  subtitle,
  onSubtitlePress,
  actions,
  rightContent,
  topInset = 0,
  backgroundColor = IOS_COLORS.systemGroupedBackground,
  showBorder = true,
  isLoading = false,
  children,
}: TabScreenToolbarProps) {
  const hasActions = actions && actions.length > 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, backgroundColor },
        showBorder && styles.border,
      ]}
    >
      {/* Nav row: title left  |  capsule right */}
      <View style={styles.navRow}>
        {/* Left: title + optional subtitle */}
        <View style={styles.titleSection}>
          <Text
            style={styles.largeTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {title}
          </Text>
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={IOS_COLORS.secondaryLabel}
              style={styles.loadingSpinner}
            />
          )}
        </View>

        {subtitle ? (
          <Pressable
            style={styles.subtitleContainer}
            onPress={onSubtitlePress}
            disabled={!onSubtitlePress}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.subtitleText,
                onSubtitlePress && styles.subtitleLink,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </Pressable>
        ) : null}

        {/* Right: custom content or default action capsule */}
        {rightContent
          ? rightContent
          : hasActions && (
              <View style={styles.capsule}>
                {actions.map((action, idx) => (
                  <React.Fragment key={action.label}>
                    {idx > 0 && <View style={styles.capsuleDivider} />}
                    <ActionButton action={action} />
                  </React.Fragment>
                ))}
              </View>
            )}
      </View>

      {/* Children slot for tab-specific extras */}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },

  // Nav row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },

  // Title
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  loadingSpinner: {
    marginLeft: 0,
  },

  // Subtitle (center area)
  subtitleContainer: {
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.2,
  },
  subtitleLink: {
    color: IOS_COLORS.systemBlue,
  },

  // Capsule pill
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 9999,
    ...IOS_SHADOWS.sm,
    // Web-specific shadow fallback
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
      } as any,
      default: {},
    }),
  },
  capsuleDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: IOS_COLORS.separator,
  },

  // Action button inside capsule
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Exported capsule styles for consumers that build custom right content
 * matching the capsule look (e.g. RacesFloatingHeader).
 */
export const capsuleStyles = {
  capsule: styles.capsule,
  capsuleDivider: styles.capsuleDivider,
  actionButton: styles.actionButton,
};

export default TabScreenToolbar;
