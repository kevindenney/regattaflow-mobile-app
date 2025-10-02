import { useMemo, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationHeader } from '@/src/components/navigation/NavigationHeader';
import { useAuth } from '@/src/providers/AuthProvider';

type TabConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  isMenuTrigger?: boolean;
};

// Define tabs for each user type
const getTabsForUserType = (userType: string | null): TabConfig[] => {
  switch (userType) {
    case 'sailor':
      return [
        { name: 'dashboard', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
        { name: 'races', title: 'Races', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'boat/index', title: 'Boat', icon: 'boat-outline', iconFocused: 'boat' },
        { name: 'fleet', title: 'Fleet', icon: 'people-outline', iconFocused: 'people' },
        { name: 'club', title: 'Clubs', icon: 'people-circle-outline', iconFocused: 'people-circle' },
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
        { name: 'races', title: 'Races', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
        { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
      ];
  }
};

export default function TabLayout() {
  const { userType } = useAuth();
  const router = useRouter();
  const tabs = getTabsForUserType(userType);
  const [menuVisible, setMenuVisible] = useState(false);

  const isTabVisible = (name: string) => tabs.some(t => t.name === name);
  const findTab = (name: string) => tabs.find(tab => tab.name === name);
  const showMenuTrigger = tabs.some(tab => tab.isMenuTrigger);

  const menuItems = useMemo(
    () => [
      { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
      { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/(tabs)/settings' },
      { key: 'venue', label: 'Venue', icon: 'location-outline', route: '/(tabs)/venue' },
      { key: 'crew', label: 'Crew', icon: 'people-outline', route: '/(tabs)/crew' },
      { key: 'tuning-guides', label: 'Tuning Guides', icon: 'book-outline', route: '/(tabs)/tuning-guides' },
      { key: 'strategy', label: 'Strategy', icon: 'compass-outline', route: '/(tabs)/strategy' },
      { key: 'map', label: 'Map', icon: 'map-outline', route: '/(tabs)/map' },
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
  const fleetTab = findTab('fleet');
  const boatTab = findTab('boat/index');
  const profileTab = findTab('profile');
  const settingsTab = findTab('settings');
  const racesTab = findTab('races');
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
        }}
      >
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
            href: isTabVisible('dashboard') ? undefined : null,
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
            href: isTabVisible('fleet') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: profileTab?.title ?? 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(profileTab, focused, profileTab?.iconFocused ?? 'person', profileTab?.icon ?? 'person-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('profile') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: settingsTab?.title ?? 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(settingsTab, focused, settingsTab?.iconFocused ?? 'settings', settingsTab?.icon ?? 'settings-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('settings') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="races"
          options={{
            title: racesTab?.title ?? 'Races',
            tabBarIcon: ({ color, size, focused }) =>
              racesTab?.emoji ? (
                <EmojiTabIcon emoji={racesTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(racesTab, focused, racesTab?.iconFocused ?? 'calendar', racesTab?.icon ?? 'calendar-outline') as any}
                  size={size}
                  color={color}
                />
              ),
            href: isTabVisible('races') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="venue"
          options={{
            title: venueTab?.title ?? 'Venue',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(venueTab, focused, venueTab?.iconFocused ?? 'location', venueTab?.icon ?? 'location-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('venue') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="strategy"
          options={{
            title: strategyTab?.title ?? 'Strategy',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(strategyTab, focused, strategyTab?.iconFocused ?? 'compass', strategyTab?.icon ?? 'compass-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('strategy') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: mapTab?.title ?? 'Map',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(mapTab, focused, mapTab?.iconFocused ?? 'map', mapTab?.icon ?? 'map-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('map') ? undefined : null,
          }}
        />
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
            href: isTabVisible('club') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: clientsTab?.title ?? 'Clients',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(clientsTab, focused, clientsTab?.iconFocused ?? 'people', clientsTab?.icon ?? 'people-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('clients') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: scheduleTab?.title ?? 'Schedule',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(scheduleTab, focused, scheduleTab?.iconFocused ?? 'calendar', scheduleTab?.icon ?? 'calendar-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('schedule') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: earningsTab?.title ?? 'Earnings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(earningsTab, focused, earningsTab?.iconFocused ?? 'cash', earningsTab?.icon ?? 'cash-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('earnings') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: eventsTab?.title ?? 'Events',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(eventsTab, focused, eventsTab?.iconFocused ?? 'sailboat', eventsTab?.icon ?? 'sailboat') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('events') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: membersTab?.title ?? 'Members',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(membersTab, focused, membersTab?.iconFocused ?? 'people-circle', membersTab?.icon ?? 'people-circle-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('members') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="race-management"
          options={{
            title: raceManagementTab?.title ?? 'Races',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(raceManagementTab, focused, raceManagementTab?.iconFocused ?? 'flag', raceManagementTab?.icon ?? 'flag-outline') as any}
                size={size}
                color={color}
              />
            ),
            href: isTabVisible('race-management') ? undefined : null,
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
          name="more"
          options={{
            title: moreTab?.title ?? 'More',
            href: showMenuTrigger ? undefined : null,
            tabBarButton: showMenuTrigger ? renderHamburgerButton : undefined,
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
            href: isTabVisible('boat/index') ? undefined : null,
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
