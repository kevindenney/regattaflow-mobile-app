/**
 * WindOverlay Component - WEB VERSION
 *
 * Web stub for WindOverlay - not used on web since RaceMapCard.web.tsx
 * uses TacticalRaceMap which handles wind visualization internally
 */

import React from 'react';

interface WindOverlayProps {
  windDirection: number;
  windSpeed: number;
  visible?: boolean;
}

export const WindOverlay: React.FC<WindOverlayProps> = () => {
  // This component is not rendered on web
  // Wind visualization is handled by TacticalRaceMap in RaceMapCard.web.tsx
  return null;
};
