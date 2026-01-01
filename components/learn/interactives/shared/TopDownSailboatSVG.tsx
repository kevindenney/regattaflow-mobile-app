/**
 * TopDownSailboatSVG Component
 * Plan view (top-down) sailboat with realistic sailing dynamics
 * 
 * Features:
 * - Bow always points in direction of travel (rotation prop)
 * - Sail automatically positioned on leeward side (opposite to wind)
 * - Sail trim adjusts based on point of sail:
 *   - Close-hauled (45° off wind): sail sheeted in tight
 *   - Close reach: sail 1/4 way out
 *   - Beam reach (90° off wind): sail 1/2 way out
 *   - Broad reach: sail 3/4 way out
 *   - Run (180° off wind): sail all the way out (perpendicular)
 * 
 * Coordinate system:
 * - 0° = North (up), 90° = East (right), 180° = South (down), 270° = West (left)
 * - Wind default comes from North (0°)
 */

import React, { useMemo } from 'react';
import { G, Path, Ellipse, Line, Circle, Rect } from 'react-native-svg';

interface TopDownSailboatSVGProps {
  /** Hull color */
  hullColor?: string;
  /** Sail color */
  sailColor?: string;
  /** Boat heading in degrees (0 = North/up, 90 = East, 180 = South, 270 = West) */
  rotation?: number;
  /** Scale factor */
  scale?: number;
  /** Show wake trail */
  showWake?: boolean;
  /** Optional sail number or label */
  label?: string;
  /** Wind direction (where wind comes FROM), default 0 = from North */
  windDirection?: number;
  /** If true, render boat as outlined (stroke only, no fill) */
  outlined?: boolean;
  /** Show tack indicator labels (PORT/STARBOARD) */
  showTackIndicator?: boolean;
  /** Show boom position with highlight */
  highlightBoom?: boolean;
}

/**
 * Normalize an angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate sailing dynamics based on boat heading and wind direction
 */
function calculateSailDynamics(boatHeading: number, windDirection: number) {
  // Normalize both angles
  const heading = normalizeAngle(boatHeading);
  const windFrom = normalizeAngle(windDirection);
  
  // Calculate angle relative to wind (how many degrees off the wind direction)
  // Positive = heading to starboard of wind, Negative = heading to port of wind
  let relativeAngle = normalizeAngle(heading - windFrom);
  
  // Point of sail is the absolute angle off the wind (0-180°)
  // 0° = directly into wind (impossible), 180° = dead downwind
  const pointOfSail = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
  
  // Determine which tack we're on (which side the wind is coming from)
  // If relativeAngle is 1-179°, wind is on port side, so we're on STARBOARD tack (sail on starboard/right)
  // If relativeAngle is 181-359°, wind is on starboard side, so we're on PORT tack (sail on port/left)
  const isStarboardTack = relativeAngle > 0 && relativeAngle < 180;
  
  // Calculate sail trim angle based on point of sail
  // This is how far the sail is sheeted out from the centerline
  let sailTrimAngle: number;
  
  if (pointOfSail < 45) {
    // In the "no-go zone" - can't sail here, but we'll show close-hauled
    sailTrimAngle = 10;
  } else if (pointOfSail < 60) {
    // Close-hauled: sail in tight (10-20°)
    sailTrimAngle = 10 + ((pointOfSail - 45) / 15) * 10; // 10-20°
  } else if (pointOfSail < 80) {
    // Close reach: sail 1/4 out (20-40°)
    sailTrimAngle = 20 + ((pointOfSail - 60) / 20) * 20; // 20-40°
  } else if (pointOfSail < 110) {
    // Beam reach: sail 1/2 out (40-55°)
    sailTrimAngle = 40 + ((pointOfSail - 80) / 30) * 15; // 40-55°
  } else if (pointOfSail < 150) {
    // Broad reach: sail 3/4 out (55-75°)
    sailTrimAngle = 55 + ((pointOfSail - 110) / 40) * 20; // 55-75°
  } else {
    // Run: sail all the way out (75-90°)
    sailTrimAngle = 75 + ((pointOfSail - 150) / 30) * 15; // 75-90°
  }
  
  // Cap at 90 degrees (perpendicular to boat)
  sailTrimAngle = Math.min(sailTrimAngle, 90);
  
  return {
    pointOfSail,
    isStarboardTack,
    sailTrimAngle,
    isInNoGoZone: pointOfSail < 45,
  };
}

export function TopDownSailboatSVG({
  hullColor = '#3B82F6',
  sailColor = '#FFFFFF',
  rotation = 0,
  scale = 1,
  showWake = true,
  label,
  windDirection = 0,
  outlined = false,
  showTackIndicator = false,
  highlightBoom = false,
  /** If true, rotation is handled externally (by AnimatedG), so don't apply rotation transform */
  externalRotation = false,
}: TopDownSailboatSVGProps & { externalRotation?: boolean }) {
  
  // Calculate sailing dynamics based on boat heading
  const { isStarboardTack, sailTrimAngle, isInNoGoZone } = useMemo(
    () => calculateSailDynamics(rotation, windDirection),
    [rotation, windDirection]
  );
  
  // Sail side multiplier: +1 for starboard (right), -1 for port (left)
  const sailSide = isStarboardTack ? 1 : -1;
  
  // Calculate boom and sail positions based on trim angle
  // The mast is at (25, 32), boom swings to the side
  const boomLength = 26;
  const boomAngleRad = (sailTrimAngle * Math.PI) / 180;
  const boomEndX = 25 + sailSide * boomLength * Math.sin(boomAngleRad);
  const boomEndY = 32 + boomLength * Math.cos(boomAngleRad);
  
  // Mainsail shape - from mast head to boom end, with curve
  // Mast head (top of mast) at (25, 8)
  // Boom end calculated above
  // Control point for curve to give the sail draft (belly)
  const sailBelly = 8; // How much the sail curves out
  const sailCurveX = 25 + sailSide * sailBelly * Math.sin(boomAngleRad + 0.3);
  const sailCurveY = 25 + sailBelly * Math.cos(boomAngleRad + 0.3);
  
  // Hull path - teardrop shape with bow at top (y=0), stern at bottom (y=80)
  const hullPath = "M 25,0 C 10,12 8,55 18,78 L 32,78 C 42,55 40,12 25,0 Z";
  
  // No jib for simplicity - just mainsail as requested
  // Mainsail path: from mast head, curves to boom end
  const mainsailPath = `
    M 25,8 
    Q ${sailCurveX},${sailCurveY} ${boomEndX},${boomEndY}
    L 25,32
    Z
  `;
  
  // Sail draft line (shows the shape/curve of the sail)
  const draftLineX = 25 + sailSide * (sailBelly * 0.6) * Math.sin(boomAngleRad + 0.2);
  const draftLineY = 22 + (sailBelly * 0.6) * Math.cos(boomAngleRad + 0.2);
  
  // If externalRotation is true, parent handles rotation, so we only apply scale
  // Otherwise, we apply both rotation and scale
  const transformString = externalRotation 
    ? `scale(${scale})` 
    : `rotate(${rotation}, 25, 40) scale(${scale})`;

  return (
    <G transform={transformString}>
      {/* Wake trail behind boat */}
      {showWake && (
        <G>
          <Path
            d="M 20,78 Q 15,95 8,115"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity={0.4}
            strokeLinecap="round"
          />
          <Path
            d="M 30,78 Q 35,95 42,115"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity={0.35}
            strokeLinecap="round"
          />
          <Path
            d="M 25,78 Q 25,100 25,120"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            fill="none"
            opacity={0.25}
            strokeLinecap="round"
          />
        </G>
      )}

      {/* Hull shadow */}
      <Path
        d={hullPath}
        fill="#000000"
        opacity={0.15}
        transform="translate(2, 2)"
      />

      {/* Main hull */}
      <Path
        d={hullPath}
        fill={outlined ? 'none' : hullColor}
        stroke={hullColor}
        strokeWidth={outlined ? '2.5' : '1.5'}
      />

      {/* Deck (lighter area) */}
      {!outlined && (
        <Ellipse
          cx="25"
          cy="42"
          rx="12"
          ry="25"
          fill={hullColor}
          opacity={0.7}
        />
      )}

      {/* Cockpit */}
      {!outlined && (
        <Ellipse
          cx="25"
          cy="55"
          rx="8"
          ry="12"
          fill="#1E293B"
          opacity={0.4}
        />
      )}

      {/* Mast (circle at center) */}
      <Circle
        cx="25"
        cy="32"
        r="3"
        fill="#475569"
        stroke="#1E293B"
        strokeWidth="1"
      />

      {/* Boom - swings to leeward side based on sail trim */}
      <Line
        x1="25"
        y1="32"
        x2={boomEndX}
        y2={boomEndY}
        stroke="#64748B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Mainsail - single white sail on leeward side - made more prominent */}
      <Path
        d={mainsailPath}
        fill={sailColor}
        stroke="#1E293B"
        strokeWidth="2"
        opacity={isInNoGoZone ? 0.5 : 1.0} // Full opacity for visibility
      />
      {/* Sail highlight/shadow for depth */}
      <Path
        d={mainsailPath}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity={0.3}
      />

      {/* Sail draft line (shows belly of sail) */}
      <Path
        d={`M 25,10 Q ${draftLineX},${draftLineY} ${boomEndX * 0.7 + 25 * 0.3},${boomEndY * 0.7 + 32 * 0.3}`}
        stroke="#CBD5E1"
        strokeWidth="0.8"
        fill="none"
        opacity={0.6}
      />

      {/* Forestay (line from bow to mast top) */}
      <Line
        x1="25"
        y1="2"
        x2="25"
        y2="8"
        stroke="#94A3B8"
        strokeWidth="0.8"
        opacity={0.7}
        strokeDasharray="2,2"
      />

      {/* Bow wave effect */}
      <Path
        d="M 22,2 Q 25,-5 28,2"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        opacity={0.6}
        strokeLinecap="round"
      />

      {/* No-go zone indicator - luffing sail effect when in irons */}
      {isInNoGoZone && (
        <G>
          {/* Fluttering sail lines to indicate luffing */}
          <Path
            d={`M 25,12 Q ${25 + sailSide * 3},20 25,28`}
            stroke="#E2E8F0"
            strokeWidth="1"
            fill="none"
            opacity={0.8}
            strokeDasharray="3,2"
          />
          <Path
            d={`M 25,15 Q ${25 - sailSide * 2},22 25,30`}
            stroke="#E2E8F0"
            strokeWidth="1"
            fill="none"
            opacity={0.6}
            strokeDasharray="2,2"
          />
        </G>
      )}

      {/* Boom highlight - glowing effect to draw attention */}
      {highlightBoom && (
        <G>
          {/* Glow effect */}
          <Line
            x1="25"
            y1="32"
            x2={boomEndX}
            y2={boomEndY}
            stroke="#FCD34D"
            strokeWidth="6"
            strokeLinecap="round"
            opacity={0.4}
          />
          {/* Boom marker at end */}
          <Circle
            cx={boomEndX}
            cy={boomEndY}
            r="4"
            fill="#F59E0B"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </G>
      )}

      {/* Tack indicator - shows PORT or STARBOARD */}
      {showTackIndicator && (
        <G>
          {/* Badge background */}
          <Rect
            x="-15"
            y="20"
            width="40"
            height="16"
            rx="8"
            fill={isStarboardTack ? '#10B981' : '#EF4444'}
            opacity={0.9}
          />
          {/* Badge text would go here but SVG Text has font issues in RN */}
          {/* Instead we'll show a visual indicator */}
          {/* Port side marker (left) */}
          <Circle
            cx="-5"
            cy="28"
            r="4"
            fill={isStarboardTack ? '#FFFFFF40' : '#FFFFFF'}
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          {/* Starboard side marker (right) */}
          <Circle
            cx="15"
            cy="28"
            r="4"
            fill={isStarboardTack ? '#FFFFFF' : '#FFFFFF40'}
            stroke="#FFFFFF"
            strokeWidth="1"
          />
        </G>
      )}

      {/* Optional label/sail number */}
      {label && (
        <G>
          <Rect
            x="15"
            y="38"
            width="20"
            height="12"
            rx="2"
            fill="white"
            opacity={0.85}
          />
          <Rect
            x="15"
            y="38"
            width="20"
            height="12"
            rx="2"
            fill="none"
            stroke="#0F172A"
            strokeWidth="0.5"
          />
        </G>
      )}
    </G>
  );
}

export default TopDownSailboatSVG;
