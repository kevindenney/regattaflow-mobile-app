import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface Tab<T extends string> {
  value: T;
  label: string;
  badge?: number;
}

interface IOSUnderlineTabsProps<T extends string> {
  /** Array of tabs with value and label */
  tabs: Tab<T>[];
  /** Currently selected tab value */
  selectedValue: T;
  /** Callback when tab changes */
  onChange: (value: T) => void;
  /** Whether to scroll horizontally (for many tabs) */
  scrollable?: boolean;
  /** Accent color for the underline and active label */
  accentColor?: string;
  /** Whether to show compact styling */
  compact?: boolean;
  /** Current phase value (shows orange dot indicator when not selected) */
  currentPhaseValue?: T;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * iOS-style underline tabs component
 * Following Apple Human Interface Guidelines
 *
 * Features:
 * - Animated underline indicator
 * - Haptic feedback on tab change
 * - Scrollable for many tabs
 * - Badge support
 * - Crossfade transition
 */
export function IOSUnderlineTabs<T extends string>({
  tabs,
  selectedValue,
  onChange,
  scrollable = false,
  accentColor = IOS_COLORS.systemBlue,
  compact = false,
  currentPhaseValue,
}: IOSUnderlineTabsProps<T>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const tabWidths = useRef<Record<string, number>>({});
  const tabOffsets = useRef<Record<string, number>>({});

  // Animation values
  const underlineWidth = useSharedValue(0);
  const underlineOffset = useSharedValue(0);

  const selectedIndex = tabs.findIndex((tab) => tab.value === selectedValue);

  // Update underline position when selection changes
  useEffect(() => {
    const selectedTab = tabs[selectedIndex];
    if (selectedTab) {
      const width = tabWidths.current[selectedTab.value] || 60;
      const offset = tabOffsets.current[selectedTab.value] || 0;

      underlineWidth.value = withSpring(width, IOS_ANIMATIONS.spring.snappy);
      underlineOffset.value = withSpring(offset, IOS_ANIMATIONS.spring.snappy);
    }
  }, [selectedIndex, selectedValue]);

  const handleTabPress = (value: T) => {
    if (value !== selectedValue) {
      triggerHaptic('selection');
      onChange(value);
    }
  };

  const handleTabLayout = (value: string, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    tabWidths.current[value] = width;
    tabOffsets.current[value] = x;

    // Update underline if this is the selected tab
    if (value === selectedValue) {
      underlineWidth.value = withTiming(width, { duration: 0 });
      underlineOffset.value = withTiming(x, { duration: 0 });
    }
  };

  const underlineStyle = useAnimatedStyle(() => ({
    width: underlineWidth.value,
    transform: [{ translateX: underlineOffset.value }],
  }));

  const renderTab = (tab: Tab<T>, index: number) => {
    const isSelected = tab.value === selectedValue;
    const isCurrentPhase = currentPhaseValue !== undefined && tab.value === currentPhaseValue;
    const showCurrentIndicator = isCurrentPhase && !isSelected;
    const scale = useSharedValue(1);

    const animatedTabStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        key={tab.value}
        style={[
          styles.tab,
          compact && styles.tabCompact,
          animatedTabStyle,
        ]}
        onLayout={(e) => handleTabLayout(tab.value, e)}
        onPress={() => handleTabPress(tab.value)}
        onPressIn={() => {
          scale.value = withSpring(0.95, IOS_ANIMATIONS.spring.stiff);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
        }}
      >
        <View style={styles.tabContent}>
          <Text
            style={[
              styles.tabLabel,
              compact && styles.tabLabelCompact,
              isSelected && [styles.tabLabelSelected, { color: accentColor }],
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge !== undefined && tab.badge > 0 && (
            <View
              style={[
                styles.badge,
                isSelected && { backgroundColor: accentColor },
              ]}
            >
              <Text style={styles.badgeText}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </Text>
            </View>
          )}
        </View>
        {/* Current phase indicator (orange dot) */}
        {showCurrentIndicator && (
          <View style={styles.currentPhaseIndicator} />
        )}
      </AnimatedPressable>
    );
  };

  const TabsContent = (
    <>
      <View style={styles.tabsRow}>
        {tabs.map((tab, index) => renderTab(tab, index))}
      </View>
      {/* Animated underline */}
      <Animated.View
        style={[
          styles.underline,
          { backgroundColor: accentColor },
          underlineStyle,
        ]}
      />
    </>
  );

  if (scrollable) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {TabsContent}
        </ScrollView>
      </View>
    );
  }

  return <View style={styles.container}>{TabsContent}</View>;
}

/**
 * Convenience hook for managing tab state
 */
export function useUnderlineTabs<T extends string>(
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(initialValue);
  return [value, setValue];
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  scrollContent: {
    paddingHorizontal: IOS_SPACING.lg,
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    flexDirection: 'column',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  tabCompact: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  tabLabel: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  tabLabelCompact: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
  },
  tabLabelSelected: {
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.systemGray4,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  currentPhaseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.systemOrange,
    marginTop: 2,
  },
});

export default IOSUnderlineTabs;
