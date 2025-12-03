/**
 * Committee Boat Log Layout
 */

import { Stack } from 'expo-router';

export default function LogLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[regattaId]" />
    </Stack>
  );
}

