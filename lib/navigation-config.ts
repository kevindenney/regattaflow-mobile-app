/**
 * Navigation Configuration - Single source of truth for navigation items
 *
 * Shared between:
 * - app/(tabs)/_layout.tsx (tab bar config)
 * - components/navigation/NavigationDrawer.tsx (mobile drawer)
 * - components/navigation/WebSidebarNav.tsx (web sidebar)
 */

import type { Ionicons } from '@expo/vector-icons';
import type { UserCapabilities } from '@/providers/AuthProvider';

// =============================================================================
// TYPES
// =============================================================================

export type TabConfig = {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  isMenuTrigger?: boolean;
  emoji?: string;
};

export interface NavItem {
  key: string;
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// =============================================================================
// TAB CONFIGURATION (for tab bar / bottom nav)
// =============================================================================

/**
 * Get tabs for a user based on their type and capabilities.
 * For sailors with coaching capability, adds coach tabs to sailor tabs.
 */
export const getTabsForUserType = (
  userType: string | null,
  isGuest: boolean = false,
  capabilities?: UserCapabilities
): TabConfig[] => {
  // Guests get limited sailor-style tabs (Races only for now)
  if (isGuest) {
    return [
      { name: 'races', title: 'Races', icon: '', iconFocused: '' },
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
    const tabs: TabConfig[] = [
      { name: 'races', title: 'Races', icon: 'flag-outline', iconFocused: 'flag' },
      { name: 'discover', title: 'Community', icon: 'people-outline', iconFocused: 'people' },
      { name: 'venue', title: 'Local', icon: 'compass-outline', iconFocused: 'compass' },
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

// =============================================================================
// SIDEBAR / DRAWER NAVIGATION ITEMS
// =============================================================================

// Navigation items by persona (used by NavigationDrawer and WebSidebarNav)
export const SAILOR_NAV_ITEMS: NavItem[] = [
  { key: 'races', label: 'Races', route: '/(tabs)/races', icon: 'flag-outline' },
  { key: 'learn', label: 'Learn', route: '/(tabs)/learn', icon: 'school-outline' },
  { key: 'venue', label: 'Local', route: '/(tabs)/venue', icon: 'compass-outline' },
];

export const SAILOR_SECONDARY_ITEMS: NavItem[] = [
  { key: 'courses', label: 'Courses', route: '/(tabs)/courses', icon: 'map-outline' },
  { key: 'sailors', label: 'Community', route: '/(tabs)/discover', icon: 'people-outline' },
  { key: 'crew', label: 'Crew', route: '/(tabs)/crew', icon: 'people-outline' },
  { key: 'coaches', label: 'Coaches', route: '/(tabs)/coaching', icon: 'school-outline' },
  { key: 'race-browser', label: 'Race Detail', route: '/(tabs)/race-browser', icon: 'flag-outline' },
];

export const COACH_NAV_ITEMS: NavItem[] = [
  { key: 'clients', label: 'Clients', route: '/(tabs)/clients', icon: 'people-outline' },
  { key: 'schedule', label: 'Schedule', route: '/(tabs)/schedule', icon: 'calendar-outline' },
  { key: 'earnings', label: 'Earnings', route: '/(tabs)/earnings', icon: 'cash-outline' },
];

export const CLUB_NAV_ITEMS: NavItem[] = [
  { key: 'events', label: 'Events', route: '/(tabs)/events', icon: 'calendar-outline' },
  { key: 'members', label: 'Members', route: '/(tabs)/members', icon: 'people-outline' },
  { key: 'racing', label: 'Racing', route: '/(tabs)/race-management', icon: 'flag-outline' },
  { key: 'club', label: 'Club', route: '/(tabs)/profile', icon: 'business-outline' },
];

export const COMMON_FOOTER_ITEMS: NavItem[] = [
  { key: 'account', label: 'Account', route: '/(tabs)/account', icon: 'person-outline' },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get primary and secondary nav items based on user type.
 * Used by both NavigationDrawer and WebSidebarNav.
 */
export function getNavItemsForUserType(userType: string | null): {
  primary: NavItem[];
  secondary: NavItem[];
} {
  switch (userType) {
    case 'coach':
      return { primary: COACH_NAV_ITEMS, secondary: [] };
    case 'club':
      return { primary: CLUB_NAV_ITEMS, secondary: [] };
    case 'sailor':
    default:
      return { primary: SAILOR_NAV_ITEMS, secondary: SAILOR_SECONDARY_ITEMS };
  }
}

/**
 * Check if a route is active based on the current pathname.
 */
export function isRouteActive(route: string, pathname: string): boolean {
  const normalizedRoute = route.replace('/(tabs)/', '/').replace('/index', '');
  return pathname === normalizedRoute || pathname.startsWith(normalizedRoute + '/');
}
