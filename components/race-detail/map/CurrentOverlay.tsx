/**
 * CurrentOverlay Component
 *
 * Displays current/tide flow arrows on the map
 */

import React from 'react';
import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/constants/designSystem';

// Conditional imports for native only
let Marker: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  Marker = maps.Marker;
}

// Type definition compatible with both web and native
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface CurrentConditions {
  speed: number;
  direction: number;
  strength: 'slack' | 'moderate' | 'strong';
}

interface CurrentOverlayProps {
  conditions: CurrentConditions;
  region: Region;
}

// Generate a grid of current arrows across the visible map area
const generateCurrentArrowGrid = (region: Region, currentConditions: CurrentConditions) => {
  const arrows = [];
  const gridSize = 2; // 2x2 grid (less dense than wind)

  const latStep = region.latitudeDelta / (gridSize + 1);
  const lonStep = region.longitudeDelta / (gridSize + 1);

  for (let i = 1; i <= gridSize; i++) {
    for (let j = 1; j <= gridSize; j++) {
      arrows.push({
        coordinate: {
          latitude: region.latitude - region.latitudeDelta / 2 + i * latStep,
          longitude: region.longitude - region.longitudeDelta / 2 + j * lonStep,
        },
        direction: currentConditions.direction,
        strength: currentConditions.strength,
      });
    }
  }

  return arrows;
};

interface CurrentArrowProps {
  direction: number;
  strength: 'slack' | 'moderate' | 'strong';
}

const CurrentArrow: React.FC<CurrentArrowProps> = ({ direction, strength }) => {
  // Color based on current strength
  const color =
    strength === 'slack'
      ? colors.neutral[400]
      : strength === 'moderate'
      ? colors.current
      : colors.danger[600];

  return (
    <Svg width={30} height={30}>
      <Path
        d="M15,8 L15,22 M15,22 L11,18 M15,22 L19,18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        transform={`rotate(${direction} 15 15)`}
      />
    </Svg>
  );
};

export const CurrentOverlay: React.FC<CurrentOverlayProps> = ({ conditions, region }) => {
  const currentArrows = generateCurrentArrowGrid(region, conditions);

  return (
    <>
      {currentArrows.map((arrow, index) => (
        <Marker
          key={`current-${index}`}
          coordinate={arrow.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false} // Performance optimization
        >
          <CurrentArrow direction={arrow.direction} strength={arrow.strength} />
        </Marker>
      ))}
    </>
  );
};
