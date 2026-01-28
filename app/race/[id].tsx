/**
 * Race Detail Screen - Route wrapper
 *
 * Thin wrapper around RaceDetailContent that reads route params
 * and configures the Stack header. The actual rendering logic
 * lives in components/races/RaceDetailContent.tsx for reuse
 * in the MasterDetailLayout on web.
 */

import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { RaceDetailContent } from '@/components/races/RaceDetailContent';

export default function RaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const actualId = Array.isArray(id) ? id[0] : id;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Race',
          headerShown: true,
          headerBackTitle: 'Races',
        }}
      />
      <RaceDetailContent raceId={actualId || ''} />
    </>
  );
}
