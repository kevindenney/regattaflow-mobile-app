/**
 * Layout for Protest Management routes
 */

import { Stack } from 'expo-router';

export default function ProtestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

