import { roleHome } from '@/lib/gates';
import { useAuth } from '@/providers/AuthProvider';
import { router, Stack, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

export default function AuthLayout() {
  const { state, userType } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  // Imperative redirect for signed_out to prevent any rendering
  // EXCEPT for login and signup pages
  useEffect(() => {
    const isAuthEntryPoint = currentRoute === 'login' || currentRoute === 'signup';

    if (state === 'signed_out' && !isAuthEntryPoint) {
      router.replace('/');
    } else if (state === 'ready' && userType) {
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
  const isAuthEntryPoint = currentRoute === 'login' || currentRoute === 'signup';

  // Don't render if signed out AND not on login/signup
  if (state === 'signed_out' && !isAuthEntryPoint) {
    return null;
  }

  // Don't render if user already has a role (will redirect above)
  if (state === 'ready') {
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
    </Stack>
  );
}
