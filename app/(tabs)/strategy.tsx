/**
 * Strategy Tab - Animated Environmental Map
 *
 * Interactive map with animated environmental layers:
 * - 💨 White wind particles flowing with wind direction
 * - 🌊 Blue current arrows showing current direction
 * - 🎨 Depth overlays with color gradients
 * - ⚫ Wind shadow zones
 * - ⏱️ Time slider to scrub through 24-hour forecast
 *
 * All layers animate as you scrub the time slider.
 */

import React from 'react';
import { TimeBasedEnvironmentalMap } from '@/components/race-strategy';

export default function StrategyScreen() {
  // Mock venue data (Royal Hong Kong Yacht Club - Clearwater Bay)
  const mockVenue = {
    id: 'rhkyc-clearwater',
    name: 'Royal Hong Kong Yacht Club - Clearwater Bay',
    coordinates: {
      lat: 22.2650,
      lng: 114.2620
    },
    region: 'asia-pacific' as const,
    country: 'HK'
  };

  // Mock racing area (polygon around Clearwater Bay)
  const mockRacingArea: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[
      [114.2600, 22.2630], // Southwest
      [114.2640, 22.2630], // Southeast
      [114.2640, 22.2670], // Northeast
      [114.2600, 22.2670], // Northwest
      [114.2600, 22.2630], // Close polygon
    ]]
  };

  // Start time: 2 hours from now (typical race preparation window)
  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return (
    <TimeBasedEnvironmentalMap
      venue={mockVenue}
      racingArea={mockRacingArea}
      startTime={startTime}
      forecastDuration={24}
      onLayersUpdate={(layers) => {

      }}
    />
  );
}
