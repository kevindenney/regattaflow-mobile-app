import { EmojiTabIcon } from '@/components/icons/EmojiTabIcon';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { useBoats } from '@/hooks/useData';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { createLogger } from '@/lib/utils/logger';
import { useAuth, UserCapabilities } from '@/providers/AuthProvider';
import { CoachWorkspaceProvider } from '@/providers/CoachWorkspaceProvider';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useNavigation, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  isMenuTrigger?: boolean;
  emoji?: string;
};

// Define tabs for each user type (5 visible tabs for sailors)
// Supports capability-based additive tabs for sailors with coaching capability

const logger = createLogger('_layout');

/**
 * Get tabs for a user based on their type and capabilities.
 * For sailors with coaching capability, adds coach tabs to sailor tabs.
 */
const getTabsForUserType = (
  userType: string | null,
  isGuest: boolean = false,
  capabilities?: UserCapabilities
): TabConfig[] => {
  // Guests get limited sailor-style tabs (Races only for now)
  if (isGuest) {
    return [
      { name: 'races', title: 'Races', icon: '', iconFocused: '' },
      // Limited tabs for guests - just races to explore demo/sample content
    ];
  }

  // Club admins get their own dedicated tabs (unchanged)
  if (userType === 'club') {
    return [
      { name: 'events', title: 'Events', icon: 'calendar-outline', iconFocused: 'calendar' },
      { name: 'members', title: 'Members', icon: 'people-outline', iconFocused: 'people' },
      { name: 'race-management', title: 'Racing', icon: 'flag-outline', iconFocused: 'flag' },
      { name: 'profile', title: 'Club', icon: 'business-outline', iconFocused: 'business' },
      { name: 'settings', title: 'Settings', icon: 'cog-outline', iconFocused: 'cog' },
    ];
  }

  // Legacy support: pure coach user type (will be migrated to sailor + capability)
  if (userType === 'coach' && !capabilities?.hasCoaching) {
    return [
      { name: 'clients', title: 'Clients', icon: 'people-outline', iconFocused: 'people' },
      { name: 'schedule', title: 'Schedule', icon: 'calendar-outline', iconFocused: 'calendar' },
      { name: 'earnings', title: 'Earnings', icon: 'cash-outline', iconFocused: 'cash' },
      { name: 'more', title: 'More', icon: 'menu', isMenuTrigger: true },
    ];
  }

  // Sailors (including sailors with coaching capability)
  if (userType === 'sailor' || userType === 'coach') {
    // Base sailor tabs - iOS HIG style: SF Symbol icons (filled when active)
    // 5 tabs: Races, Sailors (discover), Venue, Learn, More
    const tabs: TabConfig[] = [
      { name: 'races', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
      { name: 'discover', title: 'Sailors', icon: 'people-outline', iconFocused: 'people' },
      { name: 'venue', title: 'Venue', icon: 'location-outline', iconFocused: 'location' },
      { name: 'learn', title: 'Learn', icon: 'book-outline', iconFocused: 'book' },
    ];

    // Add coaching tabs if user has coaching capability
    if (capabilities?.hasCoaching) {
      tabs.push(
        { name: 'clients', title: 'Clients', icon: 'people-outline', iconFocused: 'people' },
        { name: 'schedule', title: 'Schedule', icon: 'calendar-outline', iconFocused: 'calendar' },
        { name: 'earnings', title: 'Earnings', icon: 'cash-outline', iconFocused: 'cash' },
      );
    }

    // More menu always at the end - iOS HIG style ellipsis icon
    tabs.push({ name: 'more', title: 'More', icon: 'ellipsis-horizontal-circle-outline', iconFocused: 'ellipsis-horizontal-circle', isMenuTrigger: true });

    return tabs;
  }

  // No tabs for non-logged-in users
  return [];
};

function TabLayoutInner() {
  const { userType, user, clubProfile, personaLoading, isGuest, capabilities } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();

  // Get tabs based on user type and capabilities
  // Sailors with coaching capability will see both sailor and coach tabs
  const tabs = getTabsForUserType(userType ?? null, isGuest, capabilities);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { data: boats, loading: boatsLoading } = useBoats();

  // Redirect legacy coach users (user_type='coach' without capabilities) to /clients
  // Note: Sailors with coaching capability do NOT redirect - they stay on /races
  useEffect(() => {
    const isLegacyCoach = userType === 'coach' && !capabilities?.hasCoaching;
    if (isLegacyCoach && !hasRedirected && !personaLoading) {
      setHasRedirected(true);
      router.replace('/(tabs)/clients');
    }
  }, [userType, capabilities, hasRedirected, personaLoading, router]);

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
      if (Platform.OS !== 'android') return () => { };

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
        { key: 'account', label: 'Account', icon: 'person-outline', route: '/(tabs)/account' }
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

    // Progress - Excellence Framework Dashboard (top priority for sailors)
    items.push(
      { key: 'progress', label: 'Progress', icon: 'trending-up-outline', route: '/(tabs)/progress' }
    );

    // Courses - Race courses (moved from tab bar)
    items.push(
      { key: 'courses', label: 'Courses', icon: 'map-outline', route: '/(tabs)/courses' }
    );

    // Clubs + Fleets merged into Affiliations
    items.push(
      { key: 'affiliations', label: 'Affiliations', icon: 'people-circle-outline', route: '/(tabs)/affiliations' }
    );

    if (userType !== 'club') {
      items.push({
        key: 'coaching',
        label: 'Coaches',
        icon: 'school-outline',
        route: '/(tabs)/coaching',
      });
    }

    // Tuning Guides merged into Boats tab - removed from menu
    items.push(
      { key: 'account', label: 'Account', icon: 'person-outline', route: '/(tabs)/account' }
    );

    return items;
  }, [isProfileIncomplete, userType]);

  // User type flags for conditional rendering
  // Guests are treated as sailors for UI purposes
  const isClubUser = userType === 'club';
  const isSailorUser = userType === 'sailor' || isGuest;
  const isGuestUser = isGuest;

  const handleMenuItemPress = (route: string) => {
    setMenuVisible(false);
    router.push(route as Parameters<typeof router.push>[0]);
  };

  // Helper to check if a tab is active based on pathname
  const isTabActive = (tabName: string): boolean => {
    // Handle special case for boat/index
    const normalizedTabName = tabName === 'boat/index' ? 'boat' : tabName;
    // Check if pathname matches the tab (e.g., /races, /learn, /boat)
    return pathname === `/${normalizedTabName}` || pathname.startsWith(`/${normalizedTabName}/`);
  };

  const renderHamburgerButton = ({ accessibilityState, style }: BottomTabBarButtonProps) => {
    if (!showMenuTrigger) {
      return null;
    }

    const moreTab = findTab('more');

    // iOS HIG style for sailors: icon + label
    if (isSailorUser) {
      // More tab is active when menu is visible or we're on a "more" menu page
      const isMoreActive = isTabActive('more') || menuVisible;
      const iconName = isMoreActive
        ? (moreTab?.iconFocused || 'ellipsis-horizontal-circle')
        : (moreTab?.icon || 'ellipsis-horizontal-circle-outline');

      const handlePress = () => {
        triggerHaptic('selection');
        setMenuVisible(true);
      };

      return (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ ...accessibilityState, selected: isMoreActive }}
          onPress={handlePress}
          style={[style, styles.iosTabButton]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={iconName as any}
            size={24}
            color={isMoreActive ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray}
          />
          <Text style={[
            styles.iosTabLabel,
            isMoreActive && styles.iosTabLabelActive
          ]}>
            {moreTab?.title ?? 'More'}
          </Text>
        </TouchableOpacity>
      );
    }

    // Default style for non-sailors (club/coach)
    const isActive = accessibilityState?.selected;
    const tint = isActive ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        onPress={() => {
          triggerHaptic('selection');
          setMenuVisible(true);
        }}
        style={[style, styles.hamburgerButton]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name={(moreTab?.icon ?? 'ellipsis-horizontal-circle-outline') as any} size={24} color={tint} />
        <Text style={[styles.hamburgerLabel, { color: tint }]}>
          {moreTab?.title ?? 'More'}
        </Text>
      </TouchableOpacity>
    );
  };

  // iOS HIG-style tab button for sailors: icon + label with proper touch handling
  const renderSailorTabButton = (tabName: string, tabTitle: string, tabConfig?: TabConfig) => (props: BottomTabBarButtonProps) => {
    const { accessibilityState, onPress, style } = props;
    // Use pathname-based active detection since accessibilityState.selected is undefined
    const isActive = isTabActive(tabName);
    const iconName = isActive
      ? (tabConfig?.iconFocused || tabConfig?.icon || 'ellipsis-horizontal')
      : (tabConfig?.icon || 'ellipsis-horizontal-outline');

    const handlePress = () => {
      triggerHaptic('selection');
      onPress?.({} as any);
    };

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, selected: isActive }}
        onPress={handlePress}
        style={[style, styles.iosTabButton]}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconName as any}
          size={24}
          color={isActive ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray}
        />
        <Text style={[
          styles.iosTabLabel,
          isActive && styles.iosTabLabelActive
        ]}>
          {tabTitle}
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

  // iOS HIG colors: system blue for active, system gray for inactive
  const tabBarActiveColor = isClubUser ? '#FFFFFF' : IOS_COLORS.systemBlue;
  const tabBarInactiveColor = isClubUser ? 'rgba(148,163,184,0.7)' : IOS_COLORS.systemGray;

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
  const discoverTab = findTab('discover');
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
      {/* Hide navigation header on all tabs - each tab renders its own content */}
      <NavigationHeader backgroundColor="#F8FAFC" showDrawer={false} hidden={true} />
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
            // Show iOS standard tab bar for sailors
            tabBarStyle: isSailorUser
              ? {
                  ...styles.tabBarBase,
                  ...styles.tabBarDefault,
                  display: 'flex',
                }
              : isClubUser
                ? {
                    ...styles.tabBarBase,
                    ...styles.tabBarClub,
                    display: 'flex',
                  }
                : { display: 'none' },
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
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(racesTab, focused, racesTab?.iconFocused ?? 'flag', racesTab?.icon ?? 'flag-outline') as any}
                size={isClubUser ? 26 : size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('races')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('races', racesTab?.title ?? 'Races', racesTab)
                : undefined,
          }}
        />
        {/* Tab 2: Sailors (discover) */}
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Sailors',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('discover')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('discover', 'Sailors', findTab('discover'))
                : undefined,
          }}
        />
        {/* Tab 3: Venue */}
        <Tabs.Screen
          name="venue"
          options={{
            title: venueTab?.title ?? 'Venue',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(venueTab, focused, venueTab?.iconFocused ?? 'location', venueTab?.icon ?? 'location-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('venue')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('venue', venueTab?.title ?? 'Venue', venueTab)
                : undefined,
          }}
        />
        {/* Tab 4: Learn */}
        <Tabs.Screen
          name="learn"
          options={{
            title: learnTab?.title ?? 'Learn',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(learnTab, focused, learnTab?.iconFocused ?? 'school', learnTab?.icon ?? 'school-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('learn')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('learn', learnTab?.title ?? 'Learn', learnTab)
                : undefined,
          }}
        />
        {/* Hidden: Courses (Race Courses) - accessed via More menu */}
        <Tabs.Screen
          name="courses"
          options={{
            title: coursesTab?.title ?? 'Courses',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) =>
              coursesTab?.emoji ? (
                <EmojiTabIcon emoji={coursesTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(coursesTab, focused, coursesTab?.iconFocused ?? 'map', coursesTab?.icon ?? 'map-outline') as any}
                  size={size}
                  color={color}
                />
              ),
            tabBarButton: !isTabVisible('courses')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('courses', coursesTab?.title ?? 'Courses', coursesTab)
                : undefined,
          }}
        />
        {/* Hidden: Boat (singular) */}
        <Tabs.Screen
          name="boat/index"
          options={{
            title: boatTab?.title ?? 'Boat',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) =>
              boatTab?.emoji ? (
                <EmojiTabIcon emoji={boatTab.emoji} focused={focused} size={size} />
              ) : (
                <Ionicons
                  name={getIconName(boatTab, focused, boatTab?.iconFocused ?? 'boat', boatTab?.icon ?? 'boat-outline') as any}
                  size={size}
                  color={color}
                />
              ),
            tabBarButton: !isTabVisible('boat/index')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('boat/index', boatTab?.title ?? 'Boat', boatTab)
                : undefined,
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
          name="account"
          options={{
            title: 'Account',
            href: null, // Hidden from tab bar, accessible via menu
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
          name="progress"
          options={{
            title: 'Progress',
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
          name="race/add-tufte"
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
          name="affiliations"
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
                    onPress={() => {
                      triggerHaptic('selection');
                      handleMenuItemPress(item.route);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 11,
                      paddingHorizontal: 16,
                      backgroundColor: pressed ? '#E5E5EA' : ((item as any).isWarning ? '#FFF5F5' : '#FFFFFF'),
                    })}
                  >
                    <View style={{ width: 28, alignItems: 'center' }}>
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={(item as any).isWarning ? '#FF3B30' : '#007AFF'}
                      />
                    </View>
                    <Text style={{
                      flex: 1,
                      fontSize: 17,
                      color: (item as any).isWarning ? '#FF3B30' : '#000000',
                      marginLeft: 12,
                    }}>
                      {item.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#C7C7CC"
                    />
                  </Pressable>
                  {index < menuItems.length - 1 && (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8', marginLeft: 56 }} />
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    height: Platform.OS === 'ios' ? 52 + 34 : 52, // Tufte: reduced height + safe area
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    paddingHorizontal: 16,
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
    fontSize: 13,                    // Tufte: larger, readable text
    fontWeight: '400',               // Tufte: regular weight for inactive
    marginTop: 0,                    // Tufte: no icon, so no margin
    letterSpacing: 0.2,
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
  // Tufte: active tab gets medium weight
  tabLabelDefaultActive: {
    fontWeight: '500',
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
  // iOS HIG tab button style
  iosTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 44, // iOS minimum touch target
    minHeight: 44, // iOS minimum touch target
  },
  iosTabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.systemGray,
    marginTop: 2,
    letterSpacing: 0,
  },
  iosTabLabelActive: {
    color: IOS_COLORS.systemBlue,
  },
  // Legacy sailor tab styles (kept for backwards compatibility)
  sailorTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  sailorTabLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.systemGray,
    letterSpacing: 0.2,
  },
  sailorTabLabelActive: {
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  sailorTabUnderlineContainer: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sailorTabUnderline: {
    width: 32,
    height: 2,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 1,
  },
  hamburgerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginRight: 12,
    marginBottom: Platform.OS === 'ios' ? 100 : 80,
    minWidth: 200,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 20,
      },
    }),
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
