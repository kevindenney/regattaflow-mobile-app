/**
 * WindOverlay Component
 *
 * Displays wind arrows on the map to show wind direction and speed
 */

import React from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/constants/designSystem';

// Conditional imports for native only
let Marker: any = null;
let mapsAvailable = false;

// Check if native module is registered BEFORE requiring react-native-maps
if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      const maps = require('react-native-maps');
      Marker = maps.Marker;
      mapsAvailable = true;
    }
  } catch (e) {
    console.warn('[WindOverlay] react-native-maps not available:', e);
  }
}

// Type definition compatible with both web and native
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface WindConditions {
  speed: number;
  direction: number;
  gusts?: number;
}

interface WindOverlayProps {
  conditions: WindConditions;
  region: Region;
}

// Generate a grid of wind arrows across the visible map area
const generateWindArrowGrid = (region: Region, windConditions: WindConditions) => {
  const arrows = [];
  const gridSize = 3; // 3x3 grid of arrows

  const latStep = region.latitudeDelta / (gridSize + 1);
  const lonStep = region.longitudeDelta / (gridSize + 1);

  for (let i = 1; i <= gridSize; i++) {
    for (let j = 1; j <= gridSize; j++) {
      arrows.push({
        coordinate: {
          latitude: region.latitude - region.latitudeDelta / 2 + i * latStep,
          longitude: region.longitude - region.longitudeDelta / 2 + j * lonStep,
        },
        direction: windConditions.direction,
        speed: windConditions.speed,
      });
    }
  }

  return arrows;
};

interface WindArrowProps {
  direction: number;
  speed: number;
}

const WindArrow: React.FC<WindArrowProps> = ({ direction, speed }) => {
  // Opacity based on wind speed (stronger wind = more opaque)
  const opacity = Math.min(speed / 20, 1);

  return (
    <Svg width={30} height={30}>
      <Path
        d="M15,5 L15,20 M15,5 L10,10 M15,5 L20,10"
        stroke={colors.wind}
        strokeWidth={2}
        strokeLinecap="round"
        transform={`rotate(${(direction + 180) % 360} 15 15)`}
        opacity={opacity}
      />
    </Svg>
  );
};

export const WindOverlay: React.FC<WindOverlayProps> = ({ conditions, region }) => {
  const windArrows = generateWindArrowGrid(region, conditions);

  return (
    <>
      {windArrows.map((arrow, index) => (
        <Marker
          key={`wind-${index}`}
          coordinate={arrow.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false} // Performance optimization
        >
          <WindArrow direction={arrow.direction} speed={arrow.speed} />
        </Marker>
      ))}
    </>
  );
};
