/**
 * Sailor Race Journey Route
 *
 * Full-screen view of another sailor's race journey including:
 * - Pre-race plan: strategy brief, checklist progress, rig/sail selections
 * - On-water: strategy notes, position tracking (if available)
 * - Post-race: results, learnings, AI coaching feedback
 *
 * Includes "Use as Template" functionality to copy setup to own races.
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SailorRaceJourneyScreen } from '@/components/discover/SailorRaceJourneyScreen';

export default function SailorRaceJourneyPage() {
  const { sailorId, raceId } = useLocalSearchParams<{
    sailorId: string;
    raceId: string;
  }>();

  if (!sailorId || !raceId) {
    return null;
  }

  return (
    <SailorRaceJourneyScreen
      sailorId={sailorId}
      raceId={raceId}
    />
  );
}
