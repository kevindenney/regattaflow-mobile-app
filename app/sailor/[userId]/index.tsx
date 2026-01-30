/**
 * Sailor Profile Screen
 *
 * Strava-style profile with:
 * - Photo carousel
 * - Profile header with follow button
 * - Stats card
 * - Trophy case
 * - Boats list
 * - Race timeline
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SailorProfileScreen } from '@/components/sailor/profile/SailorProfileScreen';

export default function SailorProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  if (!userId) {
    return null;
  }

  return <SailorProfileScreen userId={userId} />;
}
