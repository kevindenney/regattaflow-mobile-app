import React, { useEffect } from 'react';
import { Stack, Redirect, router } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { roleHome } from '@/src/lib/gates';

export default function AuthLayout() {
  const { state, user } = useAuth();

  // Imperative redirect for signed_out to prevent any rendering
  useEffect(() => {
    if (state === 'signed_out') {
      router.replace('/');
    } else if (state === 'ready' && user?.user_type) {
      router.replace(roleHome(user.user_type));
    }
  }, [state, user?.user_type]);

  // Don't render anything while checking or if signed out
  if (state === 'checking' || state === 'signed_out') {
    return null;
  }

  // Don't render if user already has a role (will redirect above)
  if (state === 'ready' && user?.user_type) {
    return null;
  }

  // Only render Stack for authenticated users in onboarding (state === 'needs_role')
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    />
  );
}