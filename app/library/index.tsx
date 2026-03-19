/**
 * Library Screen - Route wrapper
 *
 * Dedicated library screen for the current interest.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { LibraryManager } from '@/components/library/LibraryManager';

export default function LibraryScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Library',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <LibraryManager />
    </>
  );
}
