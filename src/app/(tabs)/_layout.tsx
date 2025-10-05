import React, { useMemo, useState } from 'react';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { BackHandler, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationHeader } from '@/src/components/navigation/NavigationHeader';
import { useAuth } from '@/src/providers/AuthProvider';
import { EmojiTabIcon } from '@/src/components/icons/EmojiTabIcon';

type TabConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  isMenuTrigger?: boolean;
};

// Define tabs for each user type (5 visible tabs for sailors)
const getTabsForUserType = (userType: string | null): TabConfig[] => {
  switch (userType) {
    case 'sailor':
      return [
        { name: 'dashboard', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
        { name: 'calendar', title: 'Calendar', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'courses', title: 'Courses', icon: 'map-outline', iconFocused: 'map' },
        { name: 'boat/index', title: 'Boats', icon: 'boat-outline', iconFocused: 'boat' },
        { name: 'more', title: 'More', icon: 'menu', isMenuTrigger: true },
      ];

    case 'coach':
      return [
        { name: 'dashboard', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
        { name: 'clients', title: 'Clients', icon: 'people-outline', iconFocused: 'people' },
        { name: 'schedule', title: 'Schedule', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'earnings', title: 'Earnings', icon: 'cash-outline', iconFocused: 'cash' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];

    case 'club':
      return [
        { name: 'dashboard', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
        { name: 'events', title: 'Events', icon: 'sailboat', iconFocused: 'sailboat' },
        { name: 'members', title: 'Members', icon: 'people-circle-outline', iconFocused: 'people-circle' },
        { name: 'race-management', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];

    default:
      // Default to a minimal tab set when type is unknown
      return [
        { name: 'dashboard', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
        { name: 'events', title: 'Calendar', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'courses', title: 'Courses', icon: 'navigate-outline', iconFocused: 'navigate' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];
  }
};

export default function TabLayout() {
  const { userType } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const tabs = getTabsForUserType(userType);
  const [menuVisible, setMenuVisible] = useState(false);

  const isTabVisible = (name: string) => tabs.some(t => t.name === name);
  const findTab = (name: string) => tabs.find(tab => tab.name === name);
  const showMenuTrigger = tabs.some(tab => tab.isMenuTrigger);

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
  console.log('[TabLayout] userType:', userType);
  console.log('[TabLayout] tabs:', tabs);
  console.log('[TabLayout] Visible tabs:', tabs.map(t => t.name));

  const menuItems = useMemo(
    () => [
      { key: 'fleet', label: 'Fleets', icon: 'people-outline', route: '/(tabs)/fleet' },
      { key: 'club', label: 'Clubs', icon: 'people-circle-outline', route: '/(tabs)/clubs' },
      { key: 'venue', label: 'Venue', icon: 'location-outline', route: '/(tabs)/venue' },
      { key: 'crew', label: 'Crew', icon: 'people-outline', route: '/(tabs)/crew' },
      { key: 'tuning-guides', label: 'Tuning Guides', icon: 'book-outline', route: '/(tabs)/tuning-guides' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
      { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/(tabs)/settings' },
    ],
    []
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

  const dashboardTab = findTab('dashboard');
  const calendarTab = findTab('calendar');
  const fleetTab = findTab('fleet');
  const boatTab = findTab('boat/index');
  const profileTab = findTab('profile');
  const settingsTab = findTab('settings');
  const coursesTab = findTab('courses');
  const racesTab = findTab('races'); // Legacy - keep for backward compatibility
  const venueTab = findTab('venue');
  const strategyTab = findTab('strategy');
  const mapTab = findTab('map');
  const clubTab = findTab('club');
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
            display: 'flex',
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 60,
          },
          // Block swipe-back gesture on iOS to prevent navigating to Auth
          gestureEnabled: false,
        }}
      >
        {/* Tab 1: Dashboard */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: dashboardTab?.title ?? 'Dashboard',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(dashboardTab, focused, dashboardTab?.iconFocused ?? 'home', dashboardTab?.icon ?? 'home-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('dashboard') ? undefined : () => null,
          }}
        />
        {/* Tab 2: Calendar */}
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
        {/* Tab 3: Courses (New Wizard Pattern) */}
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
        {/* Legacy races tab - hidden but kept for backward compatibility */}
        <Tabs.Screen
          name="races"
          options={{
            title: 'Races (Legacy)',
            href: null,
          }}
        />
        {/* Tab 4: Boats */}
        <Tabs.Screen
          name="boat/index"
          options={{
            title: boatTab?.title ?? 'Boat',
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
        {/* Tab 5: Fleets */}
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
        {/* Tab 6: Clubs */}
        <Tabs.Screen
          name="club"
          options={{
            title: clubTab?.title ?? 'Club',
            tabBarIcon: ({ color, size, focused }) =>
              clubTab?.emoji ? (
                <EmojiTabIcon emoji={clubTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(clubTab, focused, clubTab?.iconFocused ?? 'people-circle', clubTab?.icon ?? 'people-circle-outline') as any}
                  size={size}
                  color={color}
                />
              ),
            tabBarButton: isTabVisible('club') ? undefined : () => null,
          }}
        />
        {/* Tab 7: More - MUST BE LAST VISIBLE TAB */}
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
          name="venue"
          options={{
            title: venueTab?.title ?? 'Venue',
            tabBarButton: isTabVisible('venue') ? undefined : () => null,
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
          name="boat/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="venue-old"
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
              {menuItems.map(item => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  onPress={() => handleMenuItemPress(item.route)}
                >
                  <Ionicons name={item.icon as any} size={20} color="#1F2937" />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </Pressable>
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
  menuItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  menuLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});
