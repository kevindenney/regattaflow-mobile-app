import type { Href } from 'expo-router';
import { UserType } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

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
