import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { NavigationHeader } from '@/src/components/navigation/NavigationHeader';
import { useAuth } from '@/src/providers/AuthProvider';

type TabConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
};

// Define tabs for each user type
const getTabsForUserType = (userType: string | null): TabConfig[] => {
  const commonTabs: TabConfig[] = [
    { name: 'dashboard', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
    { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
    { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
  ];

  switch (userType) {
    case 'sailor':
      return [
        commonTabs[0], // Dashboard
        { name: 'races', title: 'Races', icon: 'trophy-outline', iconFocused: 'trophy' },
        { name: 'venue', title: 'Venue', icon: 'location-outline', iconFocused: 'location' },
        { name: 'strategy', title: 'Strategy', icon: 'compass-outline', iconFocused: 'compass' },
        { name: 'map', title: 'Map', icon: 'map-outline', iconFocused: 'map' },
        commonTabs[1], // Profile
        commonTabs[2], // Settings
      ];

    case 'coach':
      return [
        commonTabs[0], // Dashboard
        { name: 'clients', title: 'Clients', icon: 'people-outline', iconFocused: 'people' },
        { name: 'schedule', title: 'Schedule', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'earnings', title: 'Earnings', icon: 'cash-outline', iconFocused: 'cash' },
        commonTabs[1], // Profile
        commonTabs[2], // Settings
      ];

    case 'club':
      return [
        commonTabs[0], // Dashboard
        { name: 'events', title: 'Events', icon: 'sailboat', iconFocused: 'sailboat' },
        { name: 'members', title: 'Members', icon: 'people-circle-outline', iconFocused: 'people-circle' },
        { name: 'race-management', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
        commonTabs[1], // Profile
        commonTabs[2], // Settings
      ];

    default:
      // Default to sailor tabs if no type specified
      return [
        commonTabs[0],
        { name: 'races', title: 'Races', icon: 'trophy-outline', iconFocused: 'trophy' },
        commonTabs[1],
        commonTabs[2],
      ];
  }
};

export default function TabLayout() {
  const { userType, user } = useAuth();
  const tabs = getTabsForUserType(userType);

  return (
    <View style={{ flex: 1 }}>
      <NavigationHeader showLogo={false} backgroundColor="#F8FAFC" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
        }}
      >
        {/* Render all possible tabs but hide those not in current user's tab config */}
        {/* This approach ensures routes work but only shows relevant tabs */}

        {/* Common tabs */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'dashboard') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'profile') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'settings') ? undefined : null,
          }}
        />

        {/* Sailor-specific tabs */}
        <Tabs.Screen
          name="races"
          options={{
            title: 'Races',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "trophy" : "trophy-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'races') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="venue"
          options={{
            title: 'Venue',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "location" : "location-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'venue') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="strategy"
          options={{
            title: 'Strategy',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "compass" : "compass-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'strategy') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "map" : "map-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'map') ? undefined : null,
          }}
        />

        {/* Coach-specific tabs */}
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clients',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'clients') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'schedule') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "cash" : "cash-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'earnings') ? undefined : null,
          }}
        />

        {/* Club-specific tabs */}
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sailboat" size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'events') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: 'Members',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "people-circle" : "people-circle-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'members') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="race-management"
          options={{
            title: 'Races',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "flag" : "flag-outline"} size={size} color={color} />
            ),
            href: tabs.some(t => t.name === 'race-management') ? undefined : null,
          }}
        />

        {/* Legacy club tab - hidden but keeps route working */}
        <Tabs.Screen
          name="club"
          options={{
            href: null, // Always hidden
          }}
        />
      </Tabs>
    </View>
  );
}