/**
 * CourseOverlay Component - WEB VERSION
 *
 * Web stub for CourseOverlay - not used on web since RaceMapCard.web.tsx
 * uses TacticalRaceMap which handles course visualization internally
 */

import React from 'react';

interface CourseOverlayProps {
  course: {
    startLine: Array<{ latitude: number; longitude: number }>;
    finishLine?: Array<{ latitude: number; longitude: number }>;
    marks: Array<{
      coordinate: { latitude: number; longitude: number };
      name?: string;
    }>;
    path: Array<{ latitude: number; longitude: number }>;
  };
  visible?: boolean;
}

export const CourseOverlay: React.FC<CourseOverlayProps> = () => {
  // This component is not rendered on web
  // Course visualization is handled by TacticalRaceMap in RaceMapCard.web.tsx
  return null;
};
