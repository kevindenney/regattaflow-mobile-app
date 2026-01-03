import React, { useMemo, useState, useEffect } from 'react';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { BackHandler, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { useAuth } from '@/providers/AuthProvider';
import { CoachWorkspaceProvider } from '@/providers/CoachWorkspaceProvider';
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
        { name: 'learn', title: 'Learn', icon: 'school-outline', iconFocused: 'school' },
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
        { name: 'more', title: 'More', icon: 'menu', isMenuTrigger: true },
      ];

    case 'club':
      return [
        { name: 'events', title: 'Events', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'members', title: 'Members', icon: 'people-outline', iconFocused: 'people' },
        { name: 'race-management', title: 'Racing', icon: 'flag-outline', iconFocused: 'flag' },
        { name: 'profile', title: 'Club', icon: 'business-outline', iconFocused: 'business' },
        { name: 'settings', title: 'Settings', icon: 'cog-outline', iconFocused: 'cog' },
      ];

    default:
      // No tabs for non-logged-in users - they see venue page only
      return [];
  }
};

function TabLayoutInner() {
  const { userType, user, clubProfile, personaLoading } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const tabs = getTabsForUserType(userType ?? null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { data: boats, loading: boatsLoading } = useBoats();

  // Redirect coaches to /clients on initial load
  useEffect(() => {
    if (userType === 'coach' && !hasRedirected && !personaLoading) {
      setHasRedirected(true);
      router.replace('/(tabs)/clients');
    }
  }, [userType, hasRedirected, personaLoading, router]);

  // Redirect club users to /events on initial load
  useEffect(() => {
    if (userType === 'club' && !hasRedirected && !personaLoading) {
      setHasRedirected(true);
      router.replace('/(tabs)/events');
    }
  }, [userType, hasRedirected, personaLoading, router]);

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

  // COMPREHENSIVE DEBUG LOGGING FOR CLUB USERS
  logger.debug('[TabLayout] === TAB BAR RENDER DEBUG ===');
  logger.debug('[TabLayout] userType:', userType);
  logger.debug('[TabLayout] user.id:', user?.id);
  logger.debug('[TabLayout] personaLoading:', personaLoading);
  logger.debug('[TabLayout] clubProfile:', clubProfile ? 'loaded' : 'null');
  logger.debug('[TabLayout] tabs config:', tabs);
  logger.debug('[TabLayout] Visible tabs:', tabs.map(t => t.name));
  logger.debug('[TabLayout] isClubUser:', userType === 'club');
  logger.debug('[TabLayout] Platform:', Platform.OS);
  logger.debug('[TabLayout] ==============================');

  const menuItems = useMemo(() => {
    const items: Array<{ key: string; label: string; icon: string; route: string; isWarning?: boolean }> = [];

    // Coach menu items (simplified)
    if (userType === 'coach') {
      items.push(
        { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
        { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/(tabs)/settings' }
      );
      return items;
    }

    // Sailor menu items (original)
    if (isProfileIncomplete) {
      items.push({
        key: 'complete-profile',
        label: 'Complete Profile',
        icon: 'warning-outline',
        route: '/(auth)/sailor-onboarding-chat',
        isWarning: true,
      });
    }

    items.push(
      { key: 'fleet', label: 'Fleets', icon: 'people-outline', route: '/(tabs)/fleet' },
      { key: 'club', label: 'Clubs', icon: 'people-circle-outline', route: '/(tabs)/clubs' },
      { key: 'crew', label: 'Crew', icon: 'people-outline', route: '/(tabs)/crew' }
    );

    if (userType !== 'club') {
      items.push({
        key: 'coaching',
        label: 'Coaching Marketplace',
        icon: 'school-outline',
        route: '/(tabs)/coaching',
      });
    }

    items.push(
      { key: 'tuning-guides', label: 'Tuning Guides', icon: 'book-outline', route: '/(tabs)/tuning-guides' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
      { key: 'settings', label: 'Settings', icon: 'settings-outline', route: '/(tabs)/settings' }
    );

    return items;
  }, [isProfileIncomplete, userType]);

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

  // Custom tab button for club users with active indicator
  const renderClubTabButton = (props: BottomTabBarButtonProps) => {
    const { accessibilityState, children, onPress, style } = props;
    const isActive = accessibilityState?.selected;
    
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        onPress={onPress}
        style={[
          style,
          styles.clubTabButton,
          isActive && styles.clubTabButtonActive,
        ]}
        activeOpacity={0.7}
      >
        {isActive && (
          <View style={styles.clubTabActiveIndicator} />
        )}
        {children}
      </TouchableOpacity>
    );
  };

  const isClubUser = userType === 'club';
  const tabBarActiveColor = isClubUser ? '#FFFFFF' : '#2563EB'; // White for active club tabs
  const tabBarInactiveColor = isClubUser ? 'rgba(148,163,184,0.7)' : '#9CA3AF'; // Subtle gray for inactive

  const racesTab = findTab('races');
  const dashboardTab = findTab('dashboard'); // Legacy for non-sailor user types
  const calendarTab = findTab('calendar');
  const fleetTab = findTab('fleet');
  const boatTab = findTab('boat/index');
  const profileTab = findTab('profile');
  const settingsTab = findTab('settings');
  const learnTab = findTab('learn');
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
    <View style={styles.container}>
      <NavigationHeader backgroundColor="#F8FAFC" />
      <Tabs
        screenOptions={({ route }) => {
          const visible = isTabVisible(route.name);
          const tab = findTab(route.name);
          const labelText = tab?.title ?? tab?.name ?? route.name;

          return {
            headerShown: false,
            tabBarShowLabel: true,
            tabBarLabelPosition: 'below-icon',
            tabBarActiveTintColor: tabBarActiveColor,
            tabBarInactiveTintColor: tabBarInactiveColor,
            tabBarStyle: tabs.length === 0
              ? { display: 'none' }
              : [
                  styles.tabBarBase,
                  isClubUser ? styles.tabBarClub : styles.tabBarDefault,
                ],
            tabBarIconStyle: isClubUser ? styles.tabIconClub : styles.tabIconDefault,
            tabBarLabelStyle: isClubUser ? styles.tabLabelClub : styles.tabLabelDefault,
            tabBarItemStyle: visible
              ? isClubUser
                ? styles.tabItemClub
                : styles.tabItemDefault
              : styles.hiddenTabItem,
          };
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
                size={isClubUser ? 26 : size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('races') ? undefined : () => null,
          }}
        />
        {/* Tab 2: Learn */}
        <Tabs.Screen
          name="learn"
          options={{
            title: learnTab?.title ?? 'Learn',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(learnTab, focused, learnTab?.iconFocused ?? 'school', learnTab?.icon ?? 'school-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('learn') ? undefined : () => null,
          }}
        />
        {/* Tab 3: Courses (Race Courses) */}
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
          name="events"
          options={{
            title: eventsTab?.title ?? 'Events',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(eventsTab, focused, eventsTab?.iconFocused ?? 'calendar', eventsTab?.icon ?? 'calendar-outline') as any}
                size={isClubUser ? 24 : size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('events') 
              ? () => null 
              : isClubUser 
                ? renderClubTabButton 
                : undefined,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: membersTab?.title ?? 'Members',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(membersTab, focused, membersTab?.iconFocused ?? 'people', membersTab?.icon ?? 'people-outline') as any}
                size={isClubUser ? 24 : size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('members') 
              ? () => null 
              : isClubUser 
                ? renderClubTabButton 
                : undefined,
          }}
        />
        <Tabs.Screen
          name="race-management"
          options={{
            title: raceManagementTab?.title ?? 'Racing',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(raceManagementTab, focused, raceManagementTab?.iconFocused ?? 'flag', raceManagementTab?.icon ?? 'flag-outline') as any}
                size={isClubUser ? 24 : size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('race-management') 
              ? () => null 
              : isClubUser 
                ? renderClubTabButton 
                : undefined,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: profileTab?.title ?? 'Club',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(profileTab, focused, profileTab?.iconFocused ?? 'business', profileTab?.icon ?? 'business-outline') as any}
                size={isClubUser ? 24 : size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('profile') 
              ? () => null 
              : isClubUser 
                ? renderClubTabButton 
                : undefined,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: settingsTab?.title ?? 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(settingsTab, focused, settingsTab?.iconFocused ?? 'cog', settingsTab?.icon ?? 'cog-outline') as any}
                size={isClubUser ? 24 : size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('settings') 
              ? () => null 
              : isClubUser 
                ? renderClubTabButton 
                : undefined,
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

        {/* Coach Tabs */}
        <Tabs.Screen
          name="clients"
          options={{
            title: clientsTab?.title ?? 'Clients',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(clientsTab, focused, clientsTab?.iconFocused ?? 'people', clientsTab?.icon ?? 'people-outline') as any}
                size={isClubUser ? 26 : size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('clients') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: scheduleTab?.title ?? 'Schedule',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(scheduleTab, focused, scheduleTab?.iconFocused ?? 'calendar', scheduleTab?.icon ?? 'calendar-outline') as any}
                size={isClubUser ? 26 : size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('schedule') ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: earningsTab?.title ?? 'Earnings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(earningsTab, focused, earningsTab?.iconFocused ?? 'cash', earningsTab?.icon ?? 'cash-outline') as any}
                size={isClubUser ? 26 : size}
                color={color}
              />
            ),
            tabBarButton: isTabVisible('earnings') ? undefined : () => null,
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
  container: {
    flex: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowX: 'hidden',
        overflowY: 'hidden',
      } as any,
      default: {},
    }),
  },
  tabBarBase: {
    borderTopWidth: 0,
    elevation: 0,
    ...Platform.select({
      web: {
        boxShadow: 'none',
        touchAction: 'none',
        userSelect: 'none',
      } as any,
      default: { 
        shadowOpacity: 0,
        overflow: 'hidden',
      },
    }),
  },
  tabBarDefault: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 72,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    ...Platform.select({
      web: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      } as any,
      default: {},
    }),
  },
  tabBarClub: {
    backgroundColor: '#0F172A',
    borderTopWidth: 0,
    height: 80,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Platform.select({
      web: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundImage: 'linear-gradient(to top, #0F172A 0%, #1E293B 100%)',
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: 'rgba(71, 85, 105, 0.3)',
        backdropFilter: 'blur(12px)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 12,
      },
    }),
  },
  tabLabelBase: {
    textAlign: 'center',
  },
  tabLabelDefault: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 4,
    letterSpacing: 0.15,
    ...Platform.select({
      web: {
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        height: 'auto',
        overflow: 'visible',
      } as any,
      default: {},
    }),
  },
  tabLabelClub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 0,
    letterSpacing: 0.3,
  },
  tabLabelClubActive: {
    fontWeight: '600',
  },
  tabIconDefault: {
    marginTop: 2,
    marginBottom: 2,
  },
  tabIconClub: {
    marginTop: 0,
    marginBottom: 0,
  },
  tabItemDefault: {
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemClub: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 2,
    flex: 1,
    minWidth: 64,
    maxWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemClubActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  clubTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    marginHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  clubTabButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  clubTabActiveIndicator: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  hiddenTabItem: {
    display: 'none',
  },
  hamburgerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingBottom: 4,
  },
  hamburgerLabel: {
    fontSize: 10,
    marginTop: 4,
    marginBottom: 4,
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

// Wrap with CoachWorkspaceProvider for coach users
export default function TabLayout() {
  return (
    <CoachWorkspaceProvider>
      <TabLayoutInner />
    </CoachWorkspaceProvider>
  );
}
