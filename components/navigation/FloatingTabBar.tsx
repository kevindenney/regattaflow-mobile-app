/**
 * FloatingTabBar - Floating pill-shaped tab bar for sailor users
 *
 * A custom bottom tab bar that renders as a floating pill/capsule shape
 * with blur background on iOS, solid on Android, and backdrop-filter on web.
 * Includes active indicator pill, press animation, and keyboard hiding.
 */

import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Exported constants for layout calculations
export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_BOTTOM_MARGIN = 0;

type TabItemConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  isMenuTrigger?: boolean;
};

interface FloatingTabBarProps extends BottomTabBarProps {
  visibleTabs: TabItemConfig[];
  onOpenMenu: () => void;
  pathname: string;
  /** Position at 'top' or 'bottom' of the screen (default: 'bottom') */
  position?: 'top' | 'bottom';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Individual tab item with press scale animation
 */
function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabItemConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const iconName = isActive
    ? (tab.iconFocused || tab.icon)
    : tab.icon;

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.title}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedStyle]}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <View style={[styles.tabItemInner, isActive && styles.tabItemActive]}>
        <Ionicons
          name={iconName as any}
          size={22}
          color={isActive ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {tab.title}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export default function FloatingTabBar({
  state,
  navigation,
  visibleTabs,
  onOpenMenu,
  pathname,
  position = 'bottom',
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const isTop = position === 'top';
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Hide tab bar when keyboard is open
  useEffect(() => {
    const hideDistance = isTop
      ? -(FLOATING_TAB_BAR_HEIGHT + 40)  // slide up when at top
      : FLOATING_TAB_BAR_HEIGHT + 40;     // slide down when at bottom

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        translateY.value = withTiming(hideDistance, { duration: 250 });
        opacity.value = withTiming(0, { duration: 150 });
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        translateY.value = withTiming(0, { duration: 250 });
        opacity.value = withTiming(1, { duration: 200 });
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY, opacity, isTop]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Helper to check if a tab is active based on pathname
  const isTabActive = (tabName: string): boolean => {
    const normalizedTabName = tabName === 'boat/index' ? 'boat' : tabName;
    return pathname === `/${normalizedTabName}` || pathname.startsWith(`/${normalizedTabName}/`);
  };

  const handleTabPress = (tab: TabItemConfig) => {
    triggerHaptic('selection');

    if (tab.isMenuTrigger) {
      onOpenMenu();
      return;
    }

    // Navigate to the tab route
    const route = state.routes.find(r => r.name === tab.name);
    if (route) {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }
  };

  // Position close to screen edge.
  // Bottom: half the safe-area inset so the pill clears the home indicator
  // Top: safe-area top for iPad portrait mode
  const edgePosition = isTop
    ? Math.max(insets.top, 12)
    : Math.max(Math.round(insets.bottom / 2), 8) + FLOATING_TAB_BAR_BOTTOM_MARGIN;

  const barContent = (
    <View
      accessibilityRole="tablist"
      style={styles.tabRow}
    >
      {visibleTabs.map((tab) => (
        <TabItem
          key={tab.name}
          tab={tab}
          isActive={isTabActive(tab.name)}
          onPress={() => handleTabPress(tab)}
        />
      ))}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        isTop ? { top: edgePosition } : { bottom: edgePosition },
        containerAnimatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pillContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint="systemChromeMaterial"
            style={styles.blurBackground}
          >
            {barContent}
          </BlurView>
        ) : (
          <View style={styles.solidBackground}>
            {barContent}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    ...Platform.select({
      web: {
        position: 'fixed',
      } as any,
      default: {},
    }),
  },
  pillContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...IOS_SHADOWS.lg,
      },
      android: {
        elevation: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
      },
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
      } as any,
    }),
  },
  blurBackground: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  solidBackground: {
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
      },
      web: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as any,
      default: {
        backgroundColor: '#FFFFFF',
      },
    }),
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: FLOATING_TAB_BAR_HEIGHT,
  },
  tabItem: {
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.systemGray,
    marginTop: 2,
  },
  tabLabelActive: {
    color: IOS_COLORS.systemBlue,
  },
});
