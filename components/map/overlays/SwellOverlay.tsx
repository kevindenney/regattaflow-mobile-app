/**
 * SwellOverlay Component
 *
 * Displays swell direction arrows with primary and secondary swell systems
 * Uses Storm Glass multi-swell data for comprehensive visualization
 */

import React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

// Conditional imports for native only
let Marker: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  Marker = maps.Marker;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface SwellConditions {
  primarySwell: {
    height: number; // meters
    period: number; // seconds
    direction: number; // degrees
  };
  secondarySwell?: {
    height: number;
    period: number;
    direction: number;
  };
}

interface SwellOverlayProps {
  conditions: SwellConditions;
  region: Region;
  showSecondary?: boolean;
}

// Generate grid of swell arrows
const generateSwellArrowGrid = (region: Region, gridSize: number = 2) => {
  const positions = [];
  const latStep = region.latitudeDelta / (gridSize + 1);
  const lonStep = region.longitudeDelta / (gridSize + 1);

  for (let i = 1; i <= gridSize; i++) {
    for (let j = 1; j <= gridSize; j++) {
      positions.push({
        latitude: region.latitude - region.latitudeDelta / 2 + i * latStep,
        longitude: region.longitude - region.longitudeDelta / 2 + j * lonStep,
      });
    }
  }

  return positions;
};

interface SwellArrowProps {
  primarySwell: {
    height: number;
    period: number;
    direction: number;
  };
  secondarySwell?: {
    height: number;
    period: number;
    direction: number;
  };
  showSecondary: boolean;
}

const SwellArrow: React.FC<SwellArrowProps> = ({
  primarySwell,
  secondarySwell,
  showSecondary
}) => {
  // Color intensity based on swell height
  const getPrimaryColor = (height: number) => {
    if (height < 1) return '#4A90E2'; // Light blue - small swell
    if (height < 2) return '#2E7BCF'; // Medium blue
    if (height < 3) return '#1E5FA3'; // Dark blue
    return '#0D3D6B'; // Very dark blue - large swell
  };

  const getSecondaryColor = (height: number) => {
    if (height < 1) return '#8BC34A'; // Light green
    if (height < 2) return '#66BB6A'; // Medium green
    return '#43A047'; // Dark green
  };

  const primaryColor = getPrimaryColor(primarySwell.height);
  const primaryOpacity = Math.min(primarySwell.height / 3, 1);
  const primaryWidth = 2 + (primarySwell.height / 3) * 2; // 2-4px based on height

  return (
    <Svg width={50} height={50} viewBox="0 0 50 50">
      {/* Primary Swell Arrow */}
      <Path
        d="M25,10 L25,35 M25,35 L20,28 M25,35 L30,28"
        stroke={primaryColor}
        strokeWidth={primaryWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`rotate(${primarySwell.direction} 25 25)`}
        opacity={primaryOpacity}
      />

      {/* Primary swell height indicator */}
      <Circle
        cx="25"
        cy="8"
        r="5"
        fill={primaryColor}
        opacity={primaryOpacity * 0.8}
        transform={`rotate(${primarySwell.direction} 25 25)`}
      />
      <SvgText
        x="25"
        y="11"
        fontSize="7"
        fill="white"
        textAnchor="middle"
        fontWeight="bold"
        transform={`rotate(${primarySwell.direction} 25 25)`}
      >
        {primarySwell.height.toFixed(1)}
      </SvgText>

      {/* Secondary Swell Arrow (if present and visible) */}
      {showSecondary && secondarySwell && secondarySwell.height > 0.3 && (
        <>
          <Path
            d="M25,12 L25,32 M25,32 L21,26 M25,32 L29,26"
            stroke={getSecondaryColor(secondarySwell.height)}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3,2"
            transform={`rotate(${secondarySwell.direction} 25 25)`}
            opacity={0.7}
          />
          <Circle
            cx="25"
            cy="10"
            r="3"
            fill={getSecondaryColor(secondarySwell.height)}
            opacity={0.6}
            transform={`rotate(${secondarySwell.direction} 25 25)`}
          />
          <SvgText
            x="25"
            y="12"
            fontSize="5"
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
            transform={`rotate(${secondarySwell.direction} 25 25)`}
          >
            {secondarySwell.height.toFixed(1)}
          </SvgText>
        </>
      )}

      {/* Period indicator (bottom corner) */}
      <SvgText
        x="42"
        y="45"
        fontSize="6"
        fill={primaryColor}
        textAnchor="end"
        opacity={0.8}
      >
        {primarySwell.period}s
      </SvgText>
    </Svg>
  );
};

export const SwellOverlay: React.FC<SwellOverlayProps> = ({
  conditions,
  region,
  showSecondary = true
}) => {
  // Only show if swell is significant
  if (conditions.primarySwell.height < 0.2) {
    return null;
  }

  const positions = generateSwellArrowGrid(region);

  if (Platform.OS === 'web') {
    // Web version - TODO: Implement MapLibre layer
    return null;
  }

  return (
    <>
      {positions.map((coordinate, index) => (
        <Marker
          key={`swell-${index}`}
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <SwellArrow
            primarySwell={conditions.primarySwell}
            secondarySwell={conditions.secondarySwell}
            showSecondary={showSecondary}
          />
        </Marker>
      ))}
    </>
  );
};

/**
 * MapLibre layer spec for web
 */
export function getSwellLayerSpec(
  conditions: SwellConditions,
  region: Region
): any[] {
  // TODO: Implement MapLibre GL layer spec for web platform
  // This would use symbols with rotation and sizing based on swell data
  return [];
}
