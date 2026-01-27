/**
 * IOSInsetGroupedSection - Collapsible inset grouped section
 *
 * Matches Apple's Settings app inset grouped list style.
 * Tap header to expand/collapse with LayoutAnimation.
 *
 * Props:
 * - title: Section header text
 * - icon: Lucide icon component
 * - iconColor: Icon tint color
 * - badge: Completion count string (e.g., "3/5")
 * - defaultCollapsed: Initial collapsed state
 * - children: Content to show when expanded
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
  IOS_SHADOWS,
  IOS_TOUCH,
} from '@/lib/design-tokens-ios';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// TYPES
// =============================================================================

interface IOSInsetGroupedSectionProps {
  /** Section title displayed in header */
  title: string;
  /** Lucide icon component */
  icon?: React.ComponentType<{ size: number; color: string }>;
  /** Icon tint color */
  iconColor?: string;
  /** Badge text (e.g., "3/5" completion count) */
  badge?: string;
  /** Badge color — auto-determined if not set */
  badgeColor?: string;
  /** Whether section starts collapsed */
  defaultCollapsed?: boolean;
  /** Whether the section is collapsible at all */
  collapsible?: boolean;
  /** Section content */
  children: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function IOSInsetGroupedSection({
  title,
  icon: IconComponent,
  iconColor = IOS_COLORS.systemBlue,
  badge,
  badgeColor,
  defaultCollapsed = true,
  collapsible = true,
  children,
}: IOSInsetGroupedSectionProps) {
  const [collapsed, setCollapsed] = useState(collapsible ? defaultCollapsed : false);

  const toggleCollapsed = useCallback(() => {
    if (!collapsible) return;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setCollapsed((prev) => !prev);
  }, [collapsible]);

  // Determine badge color from content (parse "3/5" pattern)
  const effectiveBadgeColor = badgeColor || (() => {
    if (!badge) return IOS_COLORS.systemGray;
    const match = badge.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (match) {
      const completed = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (completed === total) return IOS_COLORS.systemGreen;
      if (completed > 0) return IOS_COLORS.systemOrange;
    }
    return IOS_COLORS.systemGray;
  })();

  const ChevronIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <View style={styles.container}>
      {/* Tappable header */}
      <Pressable
        onPress={toggleCollapsed}
        style={({ pressed }) => [
          styles.header,
          pressed && collapsible && styles.headerPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={`${title}${badge ? `, ${badge}` : ''}`}
      >
        <View style={styles.headerLeft}>
          {IconComponent && (
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
              <IconComponent size={16} color={iconColor} />
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {badge && (
            <Text style={[styles.badge, { color: effectiveBadgeColor }]}>
              {badge}
            </Text>
          )}
          {collapsible && (
            <ChevronIcon size={16} color={IOS_COLORS.systemGray2} />
          )}
        </View>
      </Pressable>

      {/* Collapsible content */}
      {!collapsed && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: IOS_TOUCH.listItemHeight,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
  },
  headerPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  badge: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.lg,
  },
});
