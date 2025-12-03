/**
 * Layout for Scoring Dashboard routes
 */

import { Stack } from 'expo-router';

export default function ScoringLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

