/**
 * Race Committee Layout
 * Routes for race committee functionality
 */

import { Stack } from 'expo-router';

export default function RaceCommitteeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="console" />
    </Stack>
  );
}

