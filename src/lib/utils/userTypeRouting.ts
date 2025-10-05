import { UserType } from '@/src/services/supabase';

/**
 * Get the correct dashboard route based on user type
 * All user types now use the unified tab system with role-based tab filtering
 */
export function getDashboardRoute(userType: UserType | null): string {

  // All user types now use the unified tab system
  // The tab layout will automatically show/hide relevant tabs based on user type
  switch (userType) {
    case 'sailor':
      return '/(tabs)/dashboard';
    case 'coach':
      return '/(tabs)/dashboard';
    case 'club':
      return '/(tabs)/dashboard';
    default:
      return '/(tabs)/dashboard';
  }
}

/**
 * Check if user has completed onboarding and has a valid user type
 */
export function shouldCompleteOnboarding(userProfile: any): boolean {
  // Legacy support: if user has user_type but no onboarding_completed flag, consider them completed
  const hasUserType = !!userProfile?.user_type;
  const onboardingCompleted = userProfile?.onboarding_completed || hasUserType; // Legacy fallback

  const needsOnboarding = !onboardingCompleted || !hasUserType;

  return needsOnboarding;
}

/**
 * Get the onboarding route - now routes to persona selection
 */
export function getOnboardingRoute(): string {
  return '/(auth)/persona-selection';
}