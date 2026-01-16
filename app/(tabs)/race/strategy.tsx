/**
 * Race Strategy Screen - Tufte Style
 *
 * A complete race strategy planning interface following Edward Tufte's
 * principles of information design. Shows all strategy sections
 * at once with typography-driven hierarchy and inline editing.
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TufteStrategyScreen } from '@/components/races/strategy';

export default function RaceStrategyScreen() {
  // Get race ID from route params (e.g., /race/strategy?raceId=xxx)
  const { raceId, raceName, raceDate } = useLocalSearchParams<{
    raceId?: string;
    raceName?: string;
    raceDate?: string;
  }>();

  // Use provided values or fallback to demo data
  const displayName = raceName || 'Annual Regatta Challenge';
  const displayDate = raceDate ? new Date(raceDate) : new Date('2024-06-15');

  // Fallback race ID for demo/testing
  const effectiveRaceId = raceId || 'eaa69b1e-b7fa-4f80-a8ab-83b9501d3454';

  return (
    <TufteStrategyScreen
      raceId={effectiveRaceId}
      raceName={displayName}
      raceDate={displayDate}
    />
  );
}
