/**
 * LaylinesOverlay Component
 *
 * Displays port and starboard laylines from the windward mark
 * Laylines show the optimal approach angles to round the mark
 */

import React, { useMemo } from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';
import type { CourseMark } from '@/types/raceEvents';

// Conditional imports for native only
let Polyline: any = null;
let mapsAvailable = false;

// Check if native module is registered BEFORE requiring react-native-maps
if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      const maps = require('react-native-maps');
      Polyline = maps.Polyline;
      mapsAvailable = true;
    }
  } catch (e) {
    console.warn('[LaylinesOverlay] react-native-maps not available:', e);
  }
}

// Colors matching web TacticalRaceMap
const LAYLINE_COLORS = {
  port: '#ef4444',      // Red for port
  starboard: '#22c55e', // Green for starboard
};

interface LaylinesOverlayProps {
  marks: CourseMark[];
  windDirection: number; // Direction wind is FROM (degrees)
  pointingAngle?: number; // Typical boat pointing angle (default 45)
  laylineLength?: number; // Length in degrees (default 0.015 ~= 1.5km)
}

/**
 * Calculate a layline endpoint from a mark position
 */
const calculateLaylineEndpoint = (
  mark: CourseMark,
  bearing: number,
  length: number
): { latitude: number; longitude: number } => {
  const lat = mark.latitude;
  const lng = mark.longitude;
  const bearingRad = (bearing * Math.PI) / 180;

  return {
    latitude: lat + length * Math.cos(bearingRad),
    longitude: lng + length * Math.sin(bearingRad),
  };
};

/**
 * Find the windward mark from a list of marks
 */
const findWindwardMark = (marks: CourseMark[]): CourseMark | undefined => {
  return marks.find(m => {
    const type = m.mark_type;
    return type === 'windward';
  });
};

export const LaylinesOverlay: React.FC<LaylinesOverlayProps> = ({
  marks,
  windDirection,
  pointingAngle = 45,
  laylineLength = 0.015,
}) => {
  const laylines = useMemo(() => {
    const windwardMark = findWindwardMark(marks);
    if (!windwardMark) return null;

    // Laylines show the optimal angle to approach the mark
    // Port tack layline: sailing at wind - pointingAngle (left of wind direction)
    // Starboard tack layline: sailing at wind + pointingAngle (right of wind direction)
    // These lines extend DOWNWIND from the mark (add 180 to reverse direction)

    const portTackBearing = (windDirection - pointingAngle + 180) % 360;
    const starboardTackBearing = (windDirection + pointingAngle + 180) % 360;

    const markCoord = {
      latitude: windwardMark.latitude,
      longitude: windwardMark.longitude,
    };

    const portEnd = calculateLaylineEndpoint(windwardMark, portTackBearing, laylineLength);
    const starboardEnd = calculateLaylineEndpoint(windwardMark, starboardTackBearing, laylineLength);

    return {
      port: [markCoord, portEnd],
      starboard: [markCoord, starboardEnd],
    };
  }, [marks, windDirection, pointingAngle, laylineLength]);

  if (!laylines) return null;

  return (
    <>
      {/* Port layline - RED */}
      <Polyline
        coordinates={laylines.port}
        strokeColor={LAYLINE_COLORS.port}
        strokeWidth={3}
        lineDashPattern={[10, 6]}
        lineCap="round"
      />

      {/* Starboard layline - GREEN */}
      <Polyline
        coordinates={laylines.starboard}
        strokeColor={LAYLINE_COLORS.starboard}
        strokeWidth={3}
        lineDashPattern={[10, 6]}
        lineCap="round"
      />
    </>
  );
};
