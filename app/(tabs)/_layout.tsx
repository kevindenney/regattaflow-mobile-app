import React, { useMemo, useState } from 'react';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { BackHandler, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { useAuth } from '@/providers/AuthProvider';
import { EmojiTabIcon } from '@/components/icons/EmojiTabIcon';
import { useBoats } from '@/hooks/useData';
import { createLogger } from '@/lib/utils/logger';

type TabConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  isMenuTrigger?: boolean;
  emoji?: string;
};

// Define tabs for each user type (5 visible tabs for sailors)

const logger = createLogger('_layout');
const getTabsForUserType = (userType: string | null): TabConfig[] => {
  switch (userType) {
    case 'sailor':
      return [
        { name: 'races', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
        { name: 'courses', title: 'Courses', icon: 'map-outline', iconFocused: 'map' },
        { name: 'boat/index', title: 'Boats', icon: 'boat-outline', iconFocused: 'boat' },
        { name: 'venue', title: 'Venues', icon: 'location-outline', iconFocused: 'location' },
        { name: 'more', title: 'More', icon: 'menu', isMenuTrigger: true },
      ];

    case 'coach':
      return [
        { name: 'clients', title: 'Clients', icon: 'people-outline', iconFocused: 'people' },
        { name: 'schedule', title: 'Schedule', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'earnings', title: 'Earnings', icon: 'cash-outline', iconFocused: 'cash' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];

    case 'club':
      return [
        { name: 'events', title: 'Events', icon: 'boat', iconFocused: 'boat' },
        { name: 'members', title: 'Members', icon: 'people-circle-outline', iconFocused: 'people-circle' },
        { name: 'race-management', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];

    default:
      // Default to sailor tabs when type is unknown
      return [
        { name: 'races', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
        { name: 'courses', title: 'Courses', icon: 'map-outline', iconFocused: 'map' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];
  }
};

export default function TabLayout() {
  const { userType, user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const tabs = getTabsForUserType(userType ?? null);
  const [menuVisible, setMenuVisible] = useState(false);
  const { data: boats, loading: boatsLoading } = useBoats();

  const isTabVisible = (name: string) => tabs.some(t => t.name === name);
  const findTab = (name: string) => tabs.find(tab => tab.name === name);
  const showMenuTrigger = tabs.some(tab => tab.isMenuTrigger);

  // Check if profile is incomplete (for sailors only)
  const isProfileIncomplete = userType === 'sailor' && !boatsLoading && (!boats || boats.length === 0);

  // Swallow Android hardware back while in Tabs to avoid popping to Auth
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android') return () => {};

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // eat the event; user can switch tabs or use explicit logout
        return true;
      });

      return () => {
        sub.remove();
      };
    }, [navigation])
  );

  // DEBUG LOGGING
  logger.debug('[TabLayout] userType:', userType);
  logger.debug('[TabLayout] tabs:', tabs);
  logger.debug('[TabLayout] Visible tabs:', tabs.map(t => t.name));

  const menuItems = useMemo(
    () => {
      const items = [];

      // Add profile completion item at the top if incomplete
      if (isProfileIncomplete) {
        items.push({
          key: 'complete-profile',
          label: 'Complete Profile',
          icon: 'warning-outline',
          route: '/(auth)/sailor-onboarding-chat',
          isWarning: true,
        });
      }

      // Add regular menu items
      items.push(
        { key: 'fleet', label: 'Fleets', icon: 'people-outline', route: '/(tabs)/fleet' },
        { key: 'club', label: 'Clubs', icon: 'people-circle-outline', route: '/(tabs)/clubs' },
        { key: 'crew', label: 'Crew', icon: 'people-outline', route: '/(tabs)/crew' },
        { key: 'coaching', label: 'Coaching Marketplace', icon: 'school-outline', route: '/(tabs)/coaching' },
        { key: 'tuning-guides', label: 'Tuning Guides', icon: 'book-outline', route: '/(tabs)/tuning-guides' },
        { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
        { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/(tabs)/settings' }
      );

      return items;
    },
    [isProfileIncomplete]
  );

  const handleMenuItemPress = (route: string) => {
    setMenuVisible(false);
    router.push(route as Parameters<typeof router.push>[0]);
  };

  const renderHamburgerButton = ({ accessibilityState, style }: BottomTabBarButtonProps) => {
    if (!showMenuTrigger) {
      return null;
    }

    const isActive = accessibilityState?.selected;
    const tint = isActive ? '#007AFF' : '#6B7280';
    const moreTab = findTab('more');

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        onPress={() => setMenuVisible(true)}
        style={[style, styles.hamburgerButton]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name={(moreTab?.icon ?? 'menu') as any} size={22} color={tint} />
        <Text style={[styles.hamburgerLabel, { color: tint }]}>
          {moreTab?.title ?? 'More'}
        </Text>
      </TouchableOpacity>
    );
  };

  const racesTab = findTab('races');
  const dashboardTab = findTab('dashboard'); // Legacy for non-sailor user types
  const calendarTab = findTab('calendar');
  const fleetTab = findTab('fleet');
  const boatTab = findTab('boat/index');
  const profileTab = findTab('profile');
  const settingsTab = findTab('settings');
  const coursesTab = findTab('courses');
  const venueTab = findTab('venue');
  const strategyTab = findTab('strategy');
  const mapTab = findTab('map');
  const clientsTab = findTab('clients');
  const scheduleTab = findTab('schedule');
  const earningsTab = findTab('earnings');
  const eventsTab = findTab('events');
  const membersTab = findTab('members');
  const raceManagementTab = findTab('race-management');
  const moreTab = findTab('more');

  return (
    <View style={{ flex: 1 }}>
      <NavigationHeader showLogo={false} backgroundColor="#F8FAFC" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 60,
          },
        }}
      >
        {/* Tab 1: Races */}
        <Tabs.Screen
          name="races"
          options={{
            title: racesTab?.title ?? 'Races',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(racesTab, focused, racesTab?.iconFocused ?? 'flag', racesTab?.icon ?? 'flag-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('races') ? undefined : () => null,
          }}
        />
        {/* Tab 2: Courses */}
        <Tabs.Screen
          name="courses"
          options={{
            title: coursesTab?.title ?? 'Courses',
            tabBarIcon: ({ color, size, focused }) =>
              coursesTab?.emoji ? (
                <EmojiTabIcon emoji={coursesTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(coursesTab, focused, coursesTab?.iconFocused ?? 'map', coursesTab?.icon ?? 'map-outline') as any}
                  size={size}
                  color={color}
                />
              ),
            tabBarButton: isTabVisible('courses') ? undefined : () => null,
          }}
        />
        {/* Tab 3: Boats */}
        <Tabs.Screen
          name="boat/index"
          options={{
            title: boatTab?.title ?? 'Boats',
            tabBarIcon: ({ color, size, focused }) =>
              boatTab?.emoji ? (
                <EmojiTabIcon emoji={boatTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(boatTab, focused, boatTab?.iconFocused ?? 'boat', boatTab?.icon ?? 'boat-outline') as any}
                  size={size}
                  color={color}
                />
              ),
            tabBarButton: isTabVisible('boat/index') ? undefined : () => null,
          }}
        />
        {/* Tab 4: Venues */}
        <Tabs.Screen
          name="venue"
          options={{
            title: venueTab?.title ?? 'Venues',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(venueTab, focused, venueTab?.iconFocused ?? 'location', venueTab?.icon ?? 'location-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('venue') ? undefined : () => null,
          }}
        />
        {/* Tab 5: More - MUST BE LAST VISIBLE TAB */}
        <Tabs.Screen
          name="more"
          options={{
            title: moreTab?.title ?? 'More',
            tabBarButton: showMenuTrigger ? renderHamburgerButton : () => null,
            tabBarIcon: ({ color, size, focused }) =>
              moreTab?.emoji ? (
                <EmojiTabIcon emoji={moreTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(moreTab, focused, moreTab?.iconFocused ?? 'menu', moreTab?.icon ?? 'menu') as any}
                  size={size}
                  color={color}
                />
              ),
          }}
        />
        {/* Hidden tabs - Use tabBarButton to actually hide them on web */}
        <Tabs.Screen
          name="calendar"
          options={{
            title: calendarTab?.title ?? 'Calendar',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(calendarTab, focused, calendarTab?.iconFocused ?? 'calendar', calendarTab?.icon ?? 'calendar-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('calendar') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="fleet"
          options={{
            title: fleetTab?.title ?? 'Fleet',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(fleetTab, focused, fleetTab?.iconFocused ?? 'people', fleetTab?.icon ?? 'people-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('fleet') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: profileTab?.title ?? 'Profile',
            tabBarButton: isTabVisible('profile') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: settingsTab?.title ?? 'Settings',
            tabBarButton: isTabVisible('settings') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="strategy"
          options={{
            title: strategyTab?.title ?? 'Strategy',
            tabBarButton: isTabVisible('strategy') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: mapTab?.title ?? 'Map',
            tabBarButton: isTabVisible('map') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: clientsTab?.title ?? 'Clients',
            tabBarButton: isTabVisible('clients') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: scheduleTab?.title ?? 'Schedule',
            tabBarButton: isTabVisible('schedule') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: earningsTab?.title ?? 'Earnings',
            tabBarButton: isTabVisible('earnings') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: eventsTab?.title ?? 'Events',
            tabBarButton: isTabVisible('events') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: membersTab?.title ?? 'Members',
            tabBarButton: isTabVisible('members') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="race-management"
          options={{
            title: raceManagementTab?.title ?? 'Races',
            tabBarButton: isTabVisible('race-management') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="tuning-guides"
          options={{
            title: 'Tuning Guides',
            href: null,
          }}
        />
        <Tabs.Screen
          name="crew"
          options={{
            title: 'Crew',
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/add"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/timer"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/course"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/strategy"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/register/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="boat/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="boat/add"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="boat/edit/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="boats"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="clubs"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="fleets"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race-session/[sessionId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/scrollable/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="add-next-race"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="add-race-redesign"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race/comprehensive-add"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="race-detail-demo"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {showMenuTrigger && (
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.menuOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <React.Fragment key={item.key}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      (item as any).isWarning && styles.menuItemWarning,
                      pressed && styles.menuItemPressed
                    ]}
                    onPress={() => handleMenuItemPress(item.route)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={(item as any).isWarning ? '#EF4444' : '#1F2937'}
                    />
                    <Text style={[
                      styles.menuLabel,
                      (item as any).isWarning && styles.menuLabelWarning
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                  {(item as any).isWarning && index < menuItems.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const getIconName = (
  tab: TabConfig | undefined,
  focused: boolean,
  fallbackFocused: string,
  fallback: string
) => {
  if (!tab) {
    return focused ? fallbackFocused : fallback;
  }

  if (focused) {
    return tab.iconFocused ?? tab.icon;
  }

  return tab.icon;
};

const styles = StyleSheet.create({
  hamburgerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  hamburgerLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 96,
    paddingVertical: 12,
    width: 220,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
      : {
          boxShadow: '0px 4px',
          elevation: 8,
        }
    ),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemWarning: {
    backgroundColor: '#FEF2F2',
  },
  menuItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  menuLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuLabelWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});
