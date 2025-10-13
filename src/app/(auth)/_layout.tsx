import { roleHome } from '@/src/lib/gates';
import { useAuth } from '@/src/providers/AuthProvider';
import { router, Stack, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

export default function AuthLayout() {
  const { state, user, userType, userProfile } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  // Imperative redirect for signed_out to prevent any rendering
  // EXCEPT for login and signup pages
  useEffect(() => {
    const isAuthEntryPoint = currentRoute === 'login' || currentRoute === 'signup';
    const isOnboardingRoute =
      currentRoute === 'sailor-onboarding-chat' ||
      currentRoute === 'sailor-onboarding-comprehensive' ||
      currentRoute === 'club-onboarding-chat' ||
      currentRoute === 'onboarding-redesign'; // NEW UNIFIED ONBOARDING
    const needsOnboarding = userProfile && !userProfile.onboarding_completed;

    console.log('🔍 [AUTH_LAYOUT] Navigation check:', {
      state,
      userType,
      currentRoute,
      isAuthEntryPoint,
      isOnboardingRoute,
      needsOnboarding,
      onboardingCompleted: userProfile?.onboarding_completed
    });

    if (state === 'signed_out' && !isAuthEntryPoint) {
      console.log('🔍 [AUTH_LAYOUT] Redirecting to / (signed out)');
      router.replace('/');
    } else if (state === 'needs_role' && currentRoute !== 'persona-selection' && currentRoute !== 'signup' && currentRoute !== 'onboarding-redesign') {
      // Don't redirect from signup or new onboarding - let user see error messages
      console.log('🔍 [AUTH_LAYOUT] Redirecting to persona selection');
      router.replace('/(auth)/persona-selection');
    } else if (state === 'ready' && userType) {
      // Don't redirect if currently on sailor onboarding route
      if (isOnboardingRoute) {
        console.log('🔍 [AUTH_LAYOUT] On sailor onboarding route, allowing render');
        return;
      }

      // Don't redirect if user needs onboarding
      if (needsOnboarding) {
        console.log('🔍 [AUTH_LAYOUT] User needs onboarding, redirecting to unified onboarding');
        router.replace('/(auth)/onboarding-redesign');
        return;
      }

      // Redirect to role home
      const destination = roleHome(userType);
      console.log('🔍 [AUTH_LAYOUT] Redirecting to role home:', destination);
      router.replace(destination);
    }
  }, [state, userType, userProfile, currentRoute]);

  // Don't render anything while checking
  if (state === 'checking') {
    return null;
  }

  // Allow rendering for login/signup pages even when signed out
  const isAuthEntryPoint = currentRoute === 'login' || currentRoute === 'signup';

  // Don't render if signed out AND not on login/signup
  if (state === 'signed_out' && !isAuthEntryPoint) {
    return null;
  }

  // Don't render if user already has a role (will redirect above)
  // UNLESS they're on any sailor onboarding screen
  const isOnboardingRoute =
    currentRoute === 'sailor-onboarding-chat' ||
    currentRoute === 'sailor-onboarding-comprehensive' ||
    currentRoute === 'club-onboarding-chat' ||
    currentRoute === 'onboarding-redesign'; // NEW UNIFIED ONBOARDING
  if (state === 'ready' && userType && !isOnboardingRoute) {
    return null;
  }

  // Render Stack for:
  // - authenticated users in onboarding (state === 'needs_role')
  // - signed-out users on login/signup pages
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="persona-selection" />
      <Stack.Screen name="onboarding-redesign" />
      <Stack.Screen name="sailor-onboarding-chat" />
      <Stack.Screen name="sailor-onboarding-comprehensive" />
      <Stack.Screen name="club-onboarding-chat" />
    </Stack>
  );
}