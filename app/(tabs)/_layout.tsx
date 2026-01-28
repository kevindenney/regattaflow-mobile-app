import { EmojiTabIcon } from '@/components/icons/EmojiTabIcon';
import FloatingTabBar, { FLOATING_TAB_BAR_BOTTOM_MARGIN, FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { GlobalSearchProvider } from '@/providers/GlobalSearchProvider';
import { useWebDrawer, WebDrawerProvider } from '@/providers/WebDrawerProvider';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { type TabConfig, getTabsForUserType } from '@/lib/navigation-config';
import { triggerHaptic } from '@/lib/haptics';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { CoachWorkspaceProvider } from '@/providers/CoachWorkspaceProvider';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useNavigation, usePathname, useRouter } from 'expo-router';
import React, { Suspense, useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

// Lazy import WebSidebarNav only on web to avoid bundling on native
const WebSidebarNav = Platform.OS === 'web'
  ? React.lazy(() => import('@/components/navigation/WebSidebarNav'))
  : null;

// Whether to use the web sidebar layout (web only, behind feature flag)
const useWebSidebar = Platform.OS === 'web' && FEATURE_FLAGS.USE_WEB_SIDEBAR_LAYOUT;

const logger = createLogger('_layout');

function TabLayoutInner() {
  const { userType, user, clubProfile, personaLoading, isGuest, capabilities } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const { isDrawerOpen, closeDrawer } = useWebDrawer();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // iPad portrait: tab bar moves to top of screen
  const isIPadPortrait = Platform.OS === 'ios' && (Platform as any).isPad === true && windowHeight > windowWidth;

  // Get tabs based on user type and capabilities
  // Sailors with coaching capability will see both sailor and coach tabs
  const tabs = getTabsForUserType(userType ?? null, isGuest, capabilities);
  const [hasRedirected, setHasRedirected] = useState(false);

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

  // User type flags for conditional rendering
  // Guests are treated as sailors for UI purposes
  const isClubUser = userType === 'club';
  const isSailorUser = userType === 'sailor' || isGuest;
  const isGuestUser = isGuest;

  // Helper to check if a tab is active based on pathname
  const isTabActive = (tabName: string): boolean => {
    // Handle special case for boat/index
    const normalizedTabName = tabName === 'boat/index' ? 'boat' : tabName;
    // Check if pathname matches the tab (e.g., /races, /learn, /boat)
    return pathname === `/${normalizedTabName}` || pathname.startsWith(`/${normalizedTabName}/`);
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

  // Determine tab bar and scene style based on platform
  const getTabBarConfig = () => {
    // Web sidebar mode: hide the tab bar entirely, sidebar handles navigation
    if (useWebSidebar) {
      return {
        tabBar: () => null as any,
        tabBarStyle: { display: 'none' as const },
        sceneStyle: undefined,
      };
    }

    // Native / web without sidebar: existing behavior
    // iPad portrait: tab bar at top → use paddingTop instead of paddingBottom
    const tabBarPadding = isSailorUser
      ? isIPadPortrait
        ? { paddingTop: FLOATING_TAB_BAR_HEIGHT + 20 }
        : { paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_MARGIN + 20 }
      : undefined;

    return {
      tabBar: isSailorUser ? (props: any) => (
        <FloatingTabBar
          {...props}
          visibleTabs={tabs}
          onOpenMenu={() => {}}
          pathname={pathname}
          position={isIPadPortrait ? 'top' : 'bottom'}
        />
      ) : undefined,
      tabBarStyle: isSailorUser
        ? { display: 'none' as const }
        : isClubUser
          ? {
            ...styles.tabBarBase,
            ...styles.tabBarClub,
            display: 'flex' as const,
          }
          : { display: 'none' as const },
      sceneStyle: tabBarPadding,
    };
  };

  const tabBarConfig = getTabBarConfig();

  const tabsContent = (
    <Tabs
      tabBar={tabBarConfig.tabBar}
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
          tabBarStyle: tabBarConfig.tabBarStyle,
          sceneStyle: tabBarConfig.sceneStyle,
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
        {/* Tab 2: Community (discover) */}
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Community',
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
                ? renderSailorTabButton('discover', discoverTab?.title ?? 'Community', findTab('discover'))
                : undefined,
          }}
        />
        {/* Tab 3: Venue */}
        <Tabs.Screen
          name="venue"
          options={{
            title: venueTab?.title ?? 'Local',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(venueTab, focused, venueTab?.iconFocused ?? 'compass', venueTab?.icon ?? 'compass-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('venue')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('venue', venueTab?.title ?? 'Local', venueTab)
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
        <Tabs.Screen
          name="race-browser"
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
        {/* More tab removed — coaching moved to Learn, account is a modal */}
        <Tabs.Screen
          name="more"
          options={{
            href: null,
          }}
        />
    </Tabs>
  );

  return (
    <View style={styles.container}>
      {/* Hide navigation header on all tabs - each tab renders its own content */}
      <NavigationHeader backgroundColor="#F8FAFC" showDrawer={false} hidden={true} />

      <View style={useWebSidebar ? styles.webShelfRow : styles.nativeRow}>
        {/* Shelf panel — persistent on web, pushes content right */}
        {useWebSidebar && isDrawerOpen && (
          <View style={styles.shelfPanel}>
            <Suspense fallback={<View style={{ width: 280 }} />}>
              {WebSidebarNav && <WebSidebarNav onClose={closeDrawer} />}
            </Suspense>
          </View>
        )}

        {/* Content area — always flex: 1 */}
        <View style={styles.shelfContent}>
          {tabsContent}
        </View>
      </View>

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
  // Web shelf layout (persistent sidebar + content)
  webShelfRow: {
    flex: 1,
    flexDirection: 'row',
  },
  // Native: no row layout needed, just flex fill
  nativeRow: {
    flex: 1,
  },
  shelfPanel: {
    width: 280,
  },
  shelfContent: {
    flex: 1,
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
});

// Wrap with CoachWorkspaceProvider for coach users and GlobalSearchProvider for search
export default function TabLayout() {
  return (
    <WebDrawerProvider>
      <CoachWorkspaceProvider>
        <GlobalSearchProvider>
          <TabLayoutInner />
        </GlobalSearchProvider>
      </CoachWorkspaceProvider>
    </WebDrawerProvider>
  );
}
