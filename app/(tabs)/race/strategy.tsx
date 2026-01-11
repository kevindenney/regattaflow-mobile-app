/**
 * Race Strategy Screen - Tufte Style
 *
 * A complete race strategy planning interface following Edward Tufte's
 * principles of information design. Shows all 14 strategy sections
 * at once with typography-driven hierarchy and inline editing.
 */

import React from 'react';
import { TufteStrategyScreen } from '@/components/races/strategy';
import type { StrategySectionId } from '@/types/raceStrategy';

export default function RaceStrategyScreen() {
  // Mock race data - in production this would come from route params or context
  const raceName = 'Annual Regatta Challenge';
  const raceDate = new Date('2024-06-15');

  const handleUpdateSection = (sectionId: StrategySectionId, userPlan: string) => {
    // TODO: Persist to storage or sync with backend
    console.log('Strategy updated:', sectionId, userPlan);
  };

  return (
    <TufteStrategyScreen
      raceName={raceName}
      raceDate={raceDate}
      onUpdateSection={handleUpdateSection}
    />
  );
}
