import { UserType } from '@/src/providers/AuthProvider';

/**
 * Get the correct dashboard route based on user type
 * All user types now use the unified tab system with role-based tab filtering
 */
export function getDashboardRoute(userType: UserType | null): string {
  console.log('🔍 [ROUTING] Getting dashboard route for user type:', userType);

  // All user types now use the unified tab system
  // The tab layout will automatically show/hide relevant tabs based on user type
  switch (userType) {
    case 'sailor':
      console.log('🔍 [ROUTING] Routing sailor to unified tabs dashboard');
      return '/(tabs)/dashboard';
    case 'coach':
      console.log('🔍 [ROUTING] Routing coach to unified tabs dashboard');
      return '/(tabs)/dashboard';
    case 'club':
      console.log('🔍 [ROUTING] Routing club to unified tabs dashboard');
      return '/(tabs)/dashboard';
    default:
      console.log('🔍 [ROUTING] Unknown user type, defaulting to tabs dashboard');
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

  console.log('🔍 [ROUTING] Checking onboarding status:', {
    onboardingCompleted: userProfile?.onboarding_completed,
    userType: userProfile?.user_type,
    hasUserType,
    legacyFallback: hasUserType && !userProfile?.onboarding_completed,
    finalOnboardingCompleted: onboardingCompleted,
    needsOnboarding
  });
  return needsOnboarding;
}

/**
 * Get the onboarding route
 */
export function getOnboardingRoute(): string {
  return '/(auth)/onboarding';
}