/**
 * AccordionSection Component
 *
 * Tufte-inspired collapsible section with minimal chrome
 * Designed for mobile detail views with high information density
 *
 * Animation: spring-based expand/collapse with chevron rotation
 */

import { TufteTokens } from '@/constants/designSystem';
import { ChevronDown } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import React, { useCallback, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface AccordionSectionProps {
  /** Section title */
  title: string;
  /** Lucide icon component */
  icon?: React.ReactNode;
  /** Section content */
  children: React.ReactNode;
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Callback when expanded/collapsed */
  onToggle?: (expanded: boolean) => void;
  /** Show count badge */
  count?: number;
  /** Subtitle text */
  subtitle?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function AccordionSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  onToggle,
  count,
  subtitle,
  disabled = false,
}: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const [animation] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const toggleExpand = useCallback(() => {
    if (disabled) return;

    const newExpanded = !expanded;
    setExpanded(newExpanded);

    Animated.spring(animation, {
      toValue: newExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();

    onToggle?.(newExpanded);
  }, [expanded, disabled, animation, onToggle]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  }, [contentHeight]);

  // Animated styles
  const chevronRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const contentMaxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight || 1000],
  });

  const contentOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${expanded ? 'expanded' : 'collapsed'}`}
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, disabled && styles.titleDisabled]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {count !== undefined && count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          )}
          <Animated.View
            style={{
              transform: [{ rotate: chevronRotation }],
            }}
          >
            <ChevronDown
              size={20}
              color={disabled ? IOS_COLORS.gray4 : IOS_COLORS.tertiaryLabel}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            maxHeight: contentMaxHeight,
            opacity: contentOpacity,
          },
        ]}
      >
        <View
          style={styles.content}
          onLayout={handleContentLayout}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * AccordionGroup - Container for multiple accordion sections
 * Only one section can be expanded at a time (optional)
 */
interface AccordionGroupProps {
  children: React.ReactNode;
  /** Only allow one section expanded at a time */
  exclusive?: boolean;
}

export function AccordionGroup({
  children,
  exclusive = false,
}: AccordionGroupProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!exclusive) {
    return <View style={groupStyles.container}>{children}</View>;
  }

  // Clone children with controlled expand state
  const controlledChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    return React.cloneElement(child as React.ReactElement<AccordionSectionProps>, {
      defaultExpanded: expandedIndex === index,
      onToggle: (expanded: boolean) => {
        setExpandedIndex(expanded ? index : null);
        (child.props as AccordionSectionProps).onToggle?.(expanded);
      },
    });
  });

  return <View style={groupStyles.container}>{controlledChildren}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  containerDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.2,
  },
  titleDisabled: {
    color: IOS_COLORS.gray,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  contentWrapper: {
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

const groupStyles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default AccordionSection;
