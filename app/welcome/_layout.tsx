/**
 * Welcome flow stack.
 *
 * Shown to first-time native users (no AsyncStorage interest slug, no guest race).
 * Three screens: hero → how it works → interest picker. After picking, the user
 * is dropped into /(tabs)/races as a guest.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function WelcomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    />
  );
}
