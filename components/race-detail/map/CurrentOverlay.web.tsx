/**
 * CurrentOverlay Component - WEB VERSION
 *
 * Web stub for CurrentOverlay - not used on web since RaceMapCard.web.tsx
 * uses TacticalRaceMap which handles current visualization internally
 */

import React from 'react';

interface CurrentOverlayProps {
  currentDirection: number;
  currentSpeed: number;
  visible?: boolean;
}

export const CurrentOverlay: React.FC<CurrentOverlayProps> = () => {
  // This component is not rendered on web
  // Current visualization is handled by TacticalRaceMap in RaceMapCard.web.tsx
  return null;
};
