import { UserType } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

/**
 * Get the correct dashboard route based on user type
 * All user types now use the unified tab system with role-based tab filtering
 */

const logger = createLogger('userTypeRouting');
export function getDashboardRoute(userType: UserType | null): string {
  // Sailor-first launch: Default to sailor experience if no user type
  if (!userType) {
    return '/(tabs)/races'; // Default to sailor experience
  }

  // All user types now use the unified tab system
  // The tab layout will automatically show/hide relevant tabs based on user type
  switch (userType) {
    case 'sailor':
      return '/(tabs)/races'; // Sailors see "Races" tab instead of "Dashboard"
    case 'coach':
      return '/(tabs)/dashboard'; // TODO: Create coach-specific dashboard
    case 'club':
      return '/(tabs)/dashboard'; // TODO: Create club-specific dashboard
    default:
      return '/(tabs)/races'; // Default to sailor experience
  }
}

/**
 * Check if user has completed onboarding and has a valid user type
 */
export function shouldCompleteOnboarding(userProfile: any): boolean {
  // If no profile loaded yet, assume onboarding is needed (safe default)
  if (!userProfile) {
    return true;
  }

  // Check if user has a user_type
  const hasUserType = !!userProfile.user_type;

  // Legacy support: if user has user_type but no onboarding_completed flag, consider them completed
  const onboardingCompleted = userProfile.onboarding_completed === true ||
                               (hasUserType && userProfile.onboarding_completed !== false);

  // User needs onboarding if they don't have both a user_type AND completed onboarding
  const needsOnboarding = !hasUserType || !onboardingCompleted;

  logger.debug('[shouldCompleteOnboarding]', { hasUserType, onboardingCompleted, needsOnboarding });

  return needsOnboarding;
}

/**
 * Get the onboarding route based on user profile
 */
export function getOnboardingRoute(userProfile?: any): string {
  // If user has a type but hasn't completed onboarding, go to type-specific onboarding
  if (userProfile?.user_type) {
    switch (userProfile.user_type) {
      case 'sailor':
        return '/(auth)/sailor-onboarding-chat';
      case 'coach':
        return '/(auth)/coach-onboarding-welcome';
      case 'club':
        return '/(auth)/club-onboarding-chat';
    }
  }

  // Sailor-first launch: Default to unified onboarding (will create sailor profile)
  return '/(auth)/onboarding-redesign';
}