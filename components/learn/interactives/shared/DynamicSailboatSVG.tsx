/**
 * DynamicSailboatSVG Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Simple sailboat hull that rotates based on heading.
 * Used for showing boat orientation during animations.
 */

import React from 'react';
import { G, Path } from 'react-native-svg';

export type RotationMode = 'standard' | 'direct';

interface DynamicSailboatSVGProps {
  /** Hull color */
  hullColor?: string;
  /** Boat heading in degrees (0 = North, 90 = East, etc.) */
  boatHeading: number;
  /**
   * Controls how boatHeading is converted to SVG rotation
   * - 'standard': Uses boatHeading - 90 (default, correct for most cases)
   * - 'direct': Uses boatHeading directly (legacy behavior for backward compatibility)
   */
  rotationMode?: RotationMode;
  /** Scale factor */
  scale?: number;
}

/**
 * Rotation formula explanation:
 *
 * The boat SVG path has:
 * - Bow at y=0 (top of path)
 * - Stern at y=80 (bottom of path)
 * - So the boat is drawn pointing UP (North) in its natural state
 *
 * Coordinate systems:
 * - Our heading system: 0=North (up), 90=East (right), 180=South (down), 270=West (left)
 * - SVG rotation: 0° points right, 90° points down, -90° points up
 *
 * To map our heading to SVG rotation:
 * - heading 0° (North/up) needs SVG rotation -90°
 * - heading 90° (East/right) needs SVG rotation 0°
 * - heading 180° (South/down) needs SVG rotation 90°
 *
 * Formula: svgRotation = boatHeading - 90
 */
export function DynamicSailboatSVG({
  hullColor = '#D3D3D3',
  boatHeading,
  rotationMode = 'standard',
  scale = 1,
}: DynamicSailboatSVGProps) {
  const hullPath = "M 25,0 C 10,15 10,60 20,80 L 30,80 C 40,60 40,15 25,0 Z";

  const svgRotation = rotationMode === 'standard'
    ? boatHeading - 90  // Standard: Boat naturally points up, subtract 90 to align with SVG coords
    : boatHeading;       // Direct: Use heading directly (for backward compatibility)

  // Center of the hull for rotation (approximately middle of the path)
  const centerX = 25;
  const centerY = 40;

  return (
    <G transform={`rotate(${svgRotation}, ${centerX}, ${centerY}) scale(${scale})`}>
      {/* Hull */}
      <Path
        d={hullPath}
        fill={hullColor}
        stroke="#4A5568"
        strokeWidth="1.5"
      />
    </G>
  );
}

export default DynamicSailboatSVG;

