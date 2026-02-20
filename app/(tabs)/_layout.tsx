import { EmojiTabIcon } from '@/components/icons/EmojiTabIcon';
import FloatingTabBar, { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { TourOverlay } from '@/components/onboarding/FeatureTour';
import { WelcomeCard } from '@/components/onboarding/WelcomeCard';
import { TourBackdrop } from '@/components/onboarding/TourBackdrop';
import { TabSweepCard } from '@/components/onboarding/TabSweepCard';
import { TourPricingCard } from '@/components/onboarding/TourPricingCard';
import { GuestUpgradeCard } from '@/components/onboarding/GuestUpgradeCard';
import { GlobalSearchProvider } from '@/providers/GlobalSearchProvider';
import { useWebDrawer, WebDrawerProvider } from '@/providers/WebDrawerProvider';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { useUnreadMessageCount } from '@/hooks/useMessaging';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { type TabConfig, getTabsForUserType } from '@/lib/navigation-config';
import { triggerHaptic } from '@/lib/haptics';
import { createLogger } from '@/lib/utils/logger';
import { saveLastTab } from '@/lib/utils/lastTab';
import { useAuth } from '@/providers/AuthProvider';
import { CoachWorkspaceProvider } from '@/providers/CoachWorkspaceProvider';
import { FeatureTourProvider, useFeatureTourContext } from '@/providers/FeatureTourProvider';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useNavigation, usePathname, useRouter } from 'expo-router';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Lazy import WebSidebarNav only on web to avoid bundling on native
const WebSidebarNav = Platform.OS === 'web'
  ? React.lazy(() => import('@/components/navigation/WebSidebarNav'))
  : null;

// Whether to use the web sidebar layout (web only, behind feature flag)
const useWebSidebar = Platform.OS === 'web' && FEATURE_FLAGS.USE_WEB_SIDEBAR_LAYOUT;

const logger = createLogger('_layout');
const TAB_SWEEP_REQUIRED_TABS = ['connect', 'learn', 'reflect'] as const;
const isTabSweepRequiredTab = (tabName: string) =>
  TAB_SWEEP_REQUIRED_TABS.some((requiredTab) => requiredTab === tabName);
const TAB_SWEEP_ROUTE_MAP: Record<(typeof TAB_SWEEP_REQUIRED_TABS)[number], string> = {
  connect: '/connect',
  learn: '/learn',
  reflect: '/reflect',
};
const TAB_SWEEP_META: Record<(typeof TAB_SWEEP_REQUIRED_TABS)[number], { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  connect: { label: 'Connect', icon: 'people-outline' },
  learn: { label: 'Learn', icon: 'school-outline' },
  reflect: { label: 'Reflect', icon: 'stats-chart-outline' },
};
const TAB_SWEEP_CONTEXT_COPY: Record<
  (typeof TAB_SWEEP_REQUIRED_TABS)[number],
  { description: string; emptyHint: string }
> = {
  connect: {
    description: 'Follow sailors, browse posts, and join community discussions.',
    emptyHint: 'Start by following a few sailors or joining a community.',
  },
  learn: {
    description: 'Browse tactical courses and continue training plans.',
    emptyHint: 'If a filter is empty, switch to All Courses.',
  },
  reflect: {
    description: 'Review race history, progress trends, and season metrics.',
    emptyHint: 'No history yet? Create your first race to start tracking.',
  },
};

function TabLayoutInner() {
  const { userType, user, clubProfile, personaLoading, isGuest, capabilities } = useAuth();
  const unreadMessageCount = useUnreadMessageCount(user?.id);
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const { isDrawerOpen, closeDrawer } = useWebDrawer();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    isTourActive,
    currentStep,
    shouldShowTour,
    isTourComplete,
    currentStepIndex,
    totalSteps,
    getStepConfig,
    skipTour,
    advanceStep,
    previousStep,
    goToStepIndex,
    resetTour,
    startTour,
    isFullscreenStep,
    showResumeHint,
    dismissResumeHint,
    stepReadinessIssue,
    retryAdvanceStep,
  } = useFeatureTourContext();
  const wasTourActiveRef = useRef(false);

  // iPad portrait: tab bar moves to top of screen
  const isIPadPortrait = Platform.OS === 'ios' && (Platform as any).isPad === true && windowHeight > windowWidth;
  const tourChipBottom = (isIPadPortrait ? 16 : 84) + insets.bottom;
  const readinessBottom = 116 + insets.bottom;
  const resumeTop = insets.top + 12;
  const floatingTabEdgeBottom = Math.max(Math.round(insets.bottom / 2), 8);
  const showTabSweepFocus = isTourActive && shouldShowTour && currentStep === 'tab_sweep' && !isIPadPortrait;

  // Get tabs based on user type and capabilities
  // Sailors with coaching capability will see both sailor and coach tabs
  const tabs = getTabsForUserType(userType ?? null, isGuest, capabilities);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [tabSweepVisitedTabs, setTabSweepVisitedTabs] = useState<Set<string>>(new Set());
  const tabSweepRemaining = Math.max(0, TAB_SWEEP_REQUIRED_TABS.length - tabSweepVisitedTabs.size);
  const markTabSweepVisited = React.useCallback((tabName: string) => {
    if (!isTabSweepRequiredTab(tabName)) {
      return;
    }
    setTabSweepVisitedTabs((previous) => {
      if (previous.has(tabName)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(tabName);
      return next;
    });
  }, []);
  const activeTabSweepTab = useMemo(
    () =>
      TAB_SWEEP_REQUIRED_TABS.find((tabId) => pathname === `/${tabId}` || pathname.startsWith(`/${tabId}/`)) ??
      null,
    [pathname]
  );

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

  // Persist the current tab for "remember last tab" on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      saveLastTab(pathname);
    }
  }, [pathname]);

  // Auto-open tabs for the tab tour steps and keep race steps on /races.
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      return;
    }

    const stepRouteMap: Record<string, string> = {
      welcome: '/races',
      race_timeline: '/races',
      prep_overview: '/races',
      add_your_race: '/races',
      pricing_trial: '/races',
    };

    const targetRoute = stepRouteMap[currentStep];
    if (!targetRoute || pathname === targetRoute) {
      return;
    }

    router.replace(targetRoute as Parameters<typeof router.replace>[0]);
  }, [isTourActive, currentStep, pathname, router]);

  useEffect(() => {
    if (!isTourActive || currentStep !== 'tab_sweep') {
      return;
    }
    setTabSweepVisitedTabs(new Set());
  }, [isTourActive, currentStep]);

  // When tour ends, return to /races so demo context + add-race CTA is the final destination.
  useEffect(() => {
    if (isTourActive) {
      wasTourActiveRef.current = true;
      return;
    }

    if (!wasTourActiveRef.current) {
      return;
    }

    if (isTourComplete && pathname !== '/races') {
      router.replace('/races' as Parameters<typeof router.replace>[0]);
    }

    wasTourActiveRef.current = false;
  }, [isTourActive, isTourComplete, pathname, router]);

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
      markTabSweepVisited(tabName);
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
  const reflectTab = findTab('reflect');
  const coursesTab = findTab('courses');
  const connectTab = findTab('connect');
  const searchTab = findTab('search');
  const followTab = findTab('follow');
  const communityTab = findTab('community');
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
    // Each tab screen handles its own scroll content bottom padding so content
    // flows underneath the floating tab bar (blur visible through).
    return {
      tabBar: isSailorUser ? (props: any) => (
        <FloatingTabBar
          {...props}
          visibleTabs={tabs}
          onOpenMenu={() => {}}
          pathname={pathname}
          onTabVisited={markTabSweepVisited}
          position={isIPadPortrait ? 'top' : 'bottom'}
          badgeCounts={unreadMessageCount > 0 ? { learn: unreadMessageCount } : undefined}
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
      sceneStyle: undefined,
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
        {/* Tab 1: Race */}
        <Tabs.Screen
          name="races"
          options={{
            title: racesTab?.title ?? 'Race',
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
                ? renderSailorTabButton('races', racesTab?.title ?? 'Race', racesTab)
                : undefined,
          }}
        />
        {/* Tab 2: Connect (merged Follow + Discuss) */}
        <Tabs.Screen
          name="connect"
          options={{
            title: connectTab?.title ?? 'Connect',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(connectTab, focused, connectTab?.iconFocused ?? 'people', connectTab?.icon ?? 'people-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('connect')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('connect', connectTab?.title ?? 'Connect', connectTab)
                : undefined,
          }}
        />
        {/* Hidden: Legacy follow route (redirects to connect) */}
        <Tabs.Screen
          name="follow"
          options={{
            href: null,
          }}
        />
        {/* Hidden: Legacy community route (redirects to connect) */}
        <Tabs.Screen
          name="community"
          options={{
            href: null,
          }}
        />
        {/* Hidden: Legacy discover route (redirects to community) */}
        <Tabs.Screen
          name="discover"
          options={{
            href: null,
          }}
        />
        {/* Hidden: Legacy discuss route (redirects to community) */}
        <Tabs.Screen
          name="discuss"
          options={{
            href: null,
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
        {/* Tab 5: Reflect (Progress/Stats) */}
        <Tabs.Screen
          name="reflect"
          options={{
            title: reflectTab?.title ?? 'Reflect',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(reflectTab, focused, reflectTab?.iconFocused ?? 'stats-chart', reflectTab?.icon ?? 'stats-chart-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('reflect')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('reflect', reflectTab?.title ?? 'Reflect', reflectTab)
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
        {/* Tab 5: Search */}
        <Tabs.Screen
          name="search"
          options={{
            title: searchTab?.title ?? 'Search',
            tabBarIcon: isSailorUser ? () => null : ({ color, size, focused }) => (
              <Ionicons
                name={getIconName(searchTab, focused, searchTab?.iconFocused ?? 'search', searchTab?.icon ?? 'search-outline') as any}
                size={size}
                color={color}
              />
            ),
            tabBarButton: !isTabVisible('search')
              ? () => null
              : isSailorUser
                ? renderSailorTabButton('search', searchTab?.title ?? 'Search', searchTab)
                : undefined,
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
      <TourBackdrop />
      <WelcomeCard
        visible={isTourActive && shouldShowTour && currentStep === 'welcome'}
        onStartTour={advanceStep}
        onSkip={skipTour}
      />
      <TabSweepCard
        visible={isTourActive && shouldShowTour && currentStep === 'tab_sweep'}
        onNext={advanceStep}
        onSkip={skipTour}
        canContinue={tabSweepRemaining === 0}
        activeTabLabel={activeTabSweepTab ? TAB_SWEEP_META[activeTabSweepTab].label : undefined}
        activeTabDescription={activeTabSweepTab ? TAB_SWEEP_CONTEXT_COPY[activeTabSweepTab].description : undefined}
        emptyStateHint={activeTabSweepTab ? TAB_SWEEP_CONTEXT_COPY[activeTabSweepTab].emptyHint : undefined}
      />
      {showTabSweepFocus && (
        <View
          pointerEvents="none"
          style={[
            styles.tabSweepFocusRing,
            {
              bottom: floatingTabEdgeBottom,
              height: FLOATING_TAB_BAR_HEIGHT,
            },
          ]}
        />
      )}
      {isTourActive && shouldShowTour && currentStep === 'tab_sweep' && (
        <View style={[styles.tabSweepProgressChip, { bottom: tourChipBottom }]}>
          <Text style={styles.tabSweepProgressText}>
            {tabSweepRemaining === 0
              ? 'All tabs explored'
              : `Explore ${tabSweepRemaining} more ${tabSweepRemaining === 1 ? 'tab' : 'tabs'}`}
          </Text>
          <View style={styles.tabSweepPillsRow}>
            {TAB_SWEEP_REQUIRED_TABS.map((tabId) => {
              const isVisited = tabSweepVisitedTabs.has(tabId);
              const tabMeta = TAB_SWEEP_META[tabId];
              return (
                <Pressable
                  key={tabId}
                  onPress={() => {
                    markTabSweepVisited(tabId);
                    const route = TAB_SWEEP_ROUTE_MAP[tabId];
                    if (route && pathname !== route) {
                      router.replace(route as Parameters<typeof router.replace>[0]);
                    }
                  }}
                  style={[styles.tabSweepPill, isVisited && styles.tabSweepPillVisited]}
                >
                  <Ionicons
                    name={isVisited ? 'checkmark-circle' : tabMeta.icon}
                    size={12}
                    color={isVisited ? '#22C55E' : '#BFDBFE'}
                  />
                  <Text style={[styles.tabSweepPillText, isVisited && styles.tabSweepPillTextVisited]}>
                    {tabMeta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      {showResumeHint && isTourActive && shouldShowTour && (
        <View style={[styles.resumeHintContainer, { top: resumeTop }]}>
          <Text style={styles.resumeHintText}>
            Tour resumed. Step {currentStepIndex} of {totalSteps}
          </Text>
          <TouchableOpacity onPress={dismissResumeHint} activeOpacity={0.75}>
            <Text style={styles.resumeHintDismiss}>Got it</Text>
          </TouchableOpacity>
        </View>
      )}
      {stepReadinessIssue && (
        <View style={[styles.readinessIssueContainer, { bottom: readinessBottom }]}>
          <Text style={styles.readinessIssueTitle}>Preparing this step</Text>
          <Text style={styles.readinessIssueBody}>
            "{getStepConfig(stepReadinessIssue).title}" is still loading. If this takes too long, retry.
          </Text>
          <TouchableOpacity
            style={styles.readinessIssueRetryButton}
            onPress={retryAdvanceStep}
            activeOpacity={0.8}
          >
            <Text style={styles.readinessIssueRetryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
      <TourPricingCard
        visible={isTourActive && shouldShowTour && currentStep === 'pricing_trial' && !isGuestUser}
        onStartTrial={() => {
          skipTour();
          router.push('/(auth)/signup' as any);
        }}
        onContinueFree={skipTour}
      />
      <GuestUpgradeCard
        visible={isTourActive && shouldShowTour && currentStep === 'pricing_trial' && isGuestUser}
        onCreateAccount={() => {
          skipTour();
          router.push('/(auth)/signup' as any);
        }}
        onContinueDemo={skipTour}
      />
      <TourOverlay
        visible={isTourActive && shouldShowTour && !isFullscreenStep}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onSkip={skipTour}
        onPrevious={__DEV__ ? previousStep : undefined}
        onNext={__DEV__ ? advanceStep : undefined}
        onGoToStep={__DEV__ ? goToStepIndex : undefined}
        onReset={__DEV__ ? async () => {
          await resetTour();
          await startTour();
        } : undefined}
        showProgressIndicator
        showSkipButton={!__DEV__}
      />

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
  tabSweepProgressChip: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#0F274D',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1150,
  },
  tabSweepProgressText: {
    color: '#EFF6FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabSweepPillsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  tabSweepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.4)',
  },
  tabSweepPillVisited: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  tabSweepPillText: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '700',
  },
  tabSweepPillTextVisited: {
    color: '#DCFCE7',
  },
  tabSweepFocusRing: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.95)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    zIndex: 1095,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  resumeHintContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#0A1E3B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    zIndex: 1160,
  },
  resumeHintText: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '700',
  },
  resumeHintDismiss: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '700',
  },
  readinessIssueContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: 310,
    backgroundColor: '#F8FBFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 1160,
  },
  readinessIssueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B2A52',
    marginBottom: 4,
  },
  readinessIssueBody: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 12,
    lineHeight: 18,
  },
  readinessIssueRetryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  readinessIssueRetryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

// Wrap with CoachWorkspaceProvider for coach users, GlobalSearchProvider for search,
// and FeatureTourProvider for first-time user tour
export default function TabLayout() {
  return (
    <WebDrawerProvider>
      <CoachWorkspaceProvider>
        <GlobalSearchProvider>
          <FeatureTourProvider autoStart={true}>
            <TabLayoutInner />
          </FeatureTourProvider>
        </GlobalSearchProvider>
      </CoachWorkspaceProvider>
    </WebDrawerProvider>
  );
}
