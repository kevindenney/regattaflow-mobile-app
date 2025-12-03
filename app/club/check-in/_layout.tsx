/**
 * Layout for Check-In routes
 */

import { Stack } from 'expo-router';

export default function CheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

