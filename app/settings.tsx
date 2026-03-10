import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Legacy /settings route shim.
 *
 * Non-club users: route into unified account modal.
 * Club users: route into dedicated tab settings screen.
 */
export default function SettingsRedirect() {
  const { userProfile } = useAuth();
  const isClub = userProfile?.user_type === 'club';

  if (isClub) {
    return <Redirect href="/(tabs)/settings" />;
  }

  return <Redirect href="/account" />;
}
