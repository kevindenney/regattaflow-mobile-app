import { UserType } from '@/src/lib/contexts/AuthContext';

/**
 * Get the correct dashboard route based on user type
 */
export function getDashboardRoute(userType: UserType | null): string {
  console.log('🔍 [ROUTING] Getting dashboard route for user type:', userType);

  switch (userType) {
    case 'sailor':
      console.log('🔍 [ROUTING] Routing sailor to tabs dashboard');
      return '/(tabs)/dashboard';
    case 'club':
      console.log('🔍 [ROUTING] Routing club to club dashboard');
      return '/club/dashboard';
    case 'coach':
      console.log('🔍 [ROUTING] Routing coach to coach dashboard');
      return '/coach/dashboard';
    default:
      console.log('🔍 [ROUTING] Unknown user type, defaulting to sailor dashboard');
      return '/(tabs)/dashboard';
  }
}

/**
 * Check if user has completed onboarding and has a valid user type
 */
export function shouldCompleteOnboarding(userProfile: any): boolean {
  const needsOnboarding = !userProfile?.onboarding_completed || !userProfile?.user_type;
  console.log('🔍 [ROUTING] Checking onboarding status:', {
    onboardingCompleted: userProfile?.onboarding_completed,
    userType: userProfile?.user_type,
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