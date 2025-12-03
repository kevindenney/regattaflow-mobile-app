/**
 * Layout for Hearing Room routes
 */

import { Stack } from 'expo-router';

export default function HearingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

