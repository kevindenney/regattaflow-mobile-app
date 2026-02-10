import type { Href } from 'expo-router';
import { Platform } from 'react-native';
import { UserType } from '@/services/supabase';
import { getTabsForUserType } from '@/lib/navigation-config';
import { getLastTab } from '@/lib/utils/lastTab';
import { createLogger } from '@/lib/utils/logger';
import type { UserCapabilities } from '@/types/capabilities';

/**
 * Get the correct dashboard route based on user type
 * All user types now use the unified tab system with role-based tab filtering
 */

const logger = createLogger('userTypeRouting');

export function getDashboardRoute(userType: UserType | null): Href {
  // Sailor-first launch: Default to sailor experience if no user type
  if (!userType) {
    return '/(tabs)/races';
  }

  // All user types now use the unified tab system
  // The tab layout will automatically show/hide relevant tabs based on user type
  switch (userType) {
    case 'sailor':
      return '/(tabs)/races';
    case 'coach':
      return '/(tabs)/dashboard';
    case 'club':
      return '/(tabs)/dashboard';
    default:
      return '/(tabs)/races';
  }
}

/**
 * Get the dashboard route, preferring the user's last-visited tab on web.
 * Falls back to the role-based default if there is no saved tab or
 * the saved tab isn't part of the user's current tab set.
 */
export function getLastTabRoute(
  userType: UserType | null,
  isGuest: boolean = false,
  capabilities?: UserCapabilities,
): Href {
  if (Platform.OS === 'web') {
    const saved = getLastTab(); // e.g. "/learn"
    if (saved) {
      // Strip the leading "/" to get the tab name (e.g. "learn")
      const tabName = saved.replace(/^\//, '').replace(/\/index$/, '');
      const allowedTabs = getTabsForUserType(userType, isGuest, capabilities);
      const isAllowed = allowedTabs.some(t => t.name === tabName);
      if (isAllowed) {
        logger.debug('[getLastTabRoute] Restoring saved tab:', saved);
        return `/(tabs)${saved}` as Href;
      }
    }
  }

  return getDashboardRoute(userType);
}

/**
 * Check if user has completed onboarding and has a valid user type
 */
export function shouldCompleteOnboarding(userProfile: any): boolean {
  logger.debug('[shouldCompleteOnboarding] Onboarding disabled in current flow');
  return false;
}

/**
 * Get the onboarding route based on user profile
 */
export function getOnboardingRoute(userProfile?: any): Href {
  const destination = getDashboardRoute(userProfile?.user_type ?? null);
  logger.debug('[getOnboardingRoute] Routing directly to dashboard:', destination);
  return destination;
}
