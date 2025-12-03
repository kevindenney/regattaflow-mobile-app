/**
 * Layout for Protest Filing routes
 */

import { Stack } from 'expo-router';

export default function FileProtestLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
  );
}

