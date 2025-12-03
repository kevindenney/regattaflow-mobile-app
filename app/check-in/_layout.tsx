/**
 * Layout for public Self Check-In routes
 */

import { Stack } from 'expo-router';

export default function SelfCheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

