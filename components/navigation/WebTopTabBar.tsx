/**
 * WebTopTabBar - Horizontal tab bar for web (iPad-style)
 *
 * Apple HIG pattern for iPad landscape / desktop web:
 * - Horizontal tabs across the top
 * - Icon + label for each tab
 * - Active state with underline indicator
 * - Subtle hover states
 *
 * Only rendered on web platform.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { IOS_COLORS, IOS_TYPOGRAPHY } from '@/lib/design-tokens-ios';
import { type TabConfig } from '@/lib/navigation-config';

interface WebTopTabBarProps {
  tabs: TabConfig[];
  pathname: string;
}

export function WebTopTabBar({ tabs, pathname }: WebTopTabBarProps) {
  const router = useRouter();

  const isTabActive = (tabName: string): boolean => {
    const normalizedTabName = tabName === 'boat/index' ? 'boat' : tabName;
    return pathname === `/${normalizedTabName}` || pathname.startsWith(`/${normalizedTabName}/`);
  };

  const handleTabPress = (tabName: string) => {
    router.push(`/(tabs)/${tabName}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.name);
          const iconName = isActive
            ? (tab.iconFocused || tab.icon || 'ellipsis-horizontal')
            : (tab.icon || 'ellipsis-horizontal-outline');

          return (
            <Pressable
              key={tab.name}
              onPress={() => handleTabPress(tab.name)}
              style={({ hovered, pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                hovered && !isActive && styles.tabHovered,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={iconName as any}
                size={20}
                color={isActive ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel}
                style={styles.tabIcon}
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
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    paddingTop: Platform.OS === 'web' ? 8 : 0,
    // Web-specific: ensure it sticks to top
    ...(Platform.OS === 'web' ? {
      position: 'sticky' as any,
      top: 0,
      zIndex: 100,
    } : {}),
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: `${IOS_COLORS.systemBlue}10`,
  },
  tabHovered: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 1,
  },
});

export default WebTopTabBar;
