/**
 * Multi-Class Start Scheduler Layout
 */

import { Stack } from 'expo-router';

export default function StartsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[scheduleId]" />
    </Stack>
  );
}

