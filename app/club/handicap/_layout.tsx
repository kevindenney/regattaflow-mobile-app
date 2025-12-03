/**
 * Handicap Calculator Layout
 */

import { Stack } from 'expo-router';

export default function HandicapLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[regattaId]" />
    </Stack>
  );
}

