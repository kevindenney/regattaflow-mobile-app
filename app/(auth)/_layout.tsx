import { roleHome } from '@/lib/gates';
import { useAuth } from '@/providers/AuthProvider';
import { router, Stack, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

const ONBOARDING_ROUTES = new Set([
  // New wizard-based club onboarding
  'club-onboarding',
  'step-1-basics',
  'step-2-details',
  'step-3-contact',
  'step-4-launch',
  // Legacy club onboarding (keep for backwards compatibility)
  'club-onboarding-chat',
  'club-onboarding-enhanced',
  'club-onboarding-simple',
  'club-onboarding-payment',
  'club-onboarding-payment-confirmation',
  'club-onboarding-website-verification',
  'club-onboarding-complete',
  'coach-onboarding-welcome',
  'coach-onboarding-expertise',
  'coach-onboarding-pricing',
  'coach-onboarding-availability',
  'coach-onboarding-profile-preview',
  'coach-onboarding-stripe-callback',
  'coach-onboarding-complete',
  'sailor-onboarding-chat',
  'sailor-onboarding-comprehensive',
  'onboarding',
  'onboarding-redesign',
]);

// Routes that should be accessible while signed out (OAuth callback needs to run)
const AUTH_ENTRY_ROUTES = new Set(['login', 'signup', 'callback']);

export default function AuthLayout() {
  const { state, userType } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const onboardingRoutes = ONBOARDING_ROUTES;

  // Imperative redirect for signed_out to prevent any rendering
  // EXCEPT for login and signup pages
  useEffect(() => {
    const isAuthEntryPoint = AUTH_ENTRY_ROUTES.has(currentRoute ?? '');

    if (state === 'signed_out' && !isAuthEntryPoint) {
      router.replace('/');
    } else if (
      state === 'ready' &&
      userType &&
      !onboardingRoutes.has(currentRoute ?? '')
    ) {
      const destination = roleHome(userType);
      const destinationSegment = destination.split('/').pop();

      if (destinationSegment && destinationSegment === currentRoute) {
        return;
      }

      router.replace(destination);
    }
  }, [state, userType, currentRoute]);

  // Don't render anything while checking
  if (state === 'checking') {
    return null;
  }

  // Allow rendering for login/signup pages even when signed out
  const isAuthEntryPoint = AUTH_ENTRY_ROUTES.has(currentRoute ?? '');

  // Don't render if signed out AND not on login/signup
  if (state === 'signed_out' && !isAuthEntryPoint) {
    return null;
  }

  // Don't render if user already has a role (will redirect above)
  const isOnboardingRoute = onboardingRoutes.has(currentRoute ?? '');

  if (state === 'ready' && !isOnboardingRoute) {
    return null;
  }

  // Render Stack for signed-out users on login/signup pages
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
      <Stack.Screen name="callback" />
      <Stack.Screen name="club-onboarding-chat" />
      <Stack.Screen name="club-onboarding-enhanced" />
      <Stack.Screen name="club-onboarding-simple" />
      <Stack.Screen name="club-onboarding-payment" />
      <Stack.Screen name="club-onboarding-payment-confirmation" />
      <Stack.Screen name="club-onboarding-website-verification" />
      <Stack.Screen name="club-onboarding-complete" />
      <Stack.Screen name="coach-onboarding-welcome" />
      <Stack.Screen name="coach-onboarding-expertise" />
      <Stack.Screen name="coach-onboarding-pricing" />
      <Stack.Screen name="coach-onboarding-availability" />
      <Stack.Screen name="coach-onboarding-payment-setup" />
      <Stack.Screen name="coach-onboarding-profile-preview" />
      <Stack.Screen name="coach-onboarding-stripe-callback" />
      <Stack.Screen name="coach-onboarding-complete" />
      <Stack.Screen name="sailor-onboarding-chat" />
      <Stack.Screen name="sailor-onboarding-comprehensive" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="onboarding-redesign" />
  </Stack>
  );
}
