/**
 * WindDirectionIndicator Component
 *
 * Compass-style overlay showing wind direction and speed
 * Positioned absolutely over the map corner
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Line, Text as SvgText } from 'react-native-svg';

interface WindDirectionIndicatorProps {
  direction: number; // Wind direction in degrees (where wind is FROM)
  speed: number; // Wind speed in knots
  gusts?: number; // Gust speed in knots
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
}

/**
 * Get wind description based on speed
 */
const getWindDescription = (speed: number): string => {
  if (speed < 5) return 'Light';
  if (speed < 10) return 'Gentle';
  if (speed < 16) return 'Moderate';
  if (speed < 22) return 'Fresh';
  if (speed < 28) return 'Strong';
  return 'Very Strong';
};

/**
 * Get wind color based on speed
 */
const getWindColor = (speed: number): string => {
  if (speed < 8) return '#22d3ee';  // Cyan - light
  if (speed < 12) return '#3b82f6'; // Blue - moderate
  if (speed < 18) return '#f59e0b'; // Amber - fresh
  return '#ef4444';                  // Red - strong
};

/**
 * Format direction as compass bearing (e.g., "NE", "SSW")
 */
const formatDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const WindDirectionIndicator: React.FC<WindDirectionIndicatorProps> = ({
  direction,
  speed,
  gusts,
  position = 'top-right',
  size = 80,
}) => {
  const windColor = getWindColor(speed);
  const compassDirection = formatDirection(direction);
  const windDescription = getWindDescription(speed);

  // Calculate arrow rotation (arrow points in direction wind is GOING, so add 180)
  const arrowRotation = (direction + 180) % 360;

  const positionStyle = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 },
  }[position];

  return (
    <View style={[styles.container, positionStyle]} pointerEvents="none">
      {/* Compass circle with wind arrow */}
      <View style={styles.compassContainer}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Outer circle */}
          <Circle
            cx="50"
            cy="50"
            r="45"
            fill="rgba(15, 23, 42, 0.85)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />

          {/* Cardinal direction marks */}
          <G>
            {/* N */}
            <Line x1="50" y1="8" x2="50" y2="15" stroke="#ffffff" strokeWidth="2" />
            <SvgText x="50" y="24" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">N</SvgText>
            {/* E */}
            <Line x1="92" y1="50" x2="85" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            {/* S */}
            <Line x1="50" y1="92" x2="50" y2="85" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            {/* W */}
            <Line x1="8" y1="50" x2="15" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          </G>

          {/* Wind arrow - points in direction wind is blowing TO */}
          <G rotation={arrowRotation} origin="50, 50">
            {/* Arrow body */}
            <Path
              d="M50,70 L50,30"
              stroke={windColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Arrow head */}
            <Path
              d="M50,30 L42,42 M50,30 L58,42"
              stroke={windColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>

          {/* Center dot */}
          <Circle cx="50" cy="50" r="4" fill={windColor} />
        </Svg>
      </View>

      {/* Wind info text */}
      <View style={styles.infoContainer}>
        <Text style={[styles.speedText, { color: windColor }]}>
          {Math.round(speed)} kt
        </Text>
        {gusts && gusts > speed && (
          <Text style={styles.gustText}>
            G{Math.round(gusts)}
          </Text>
        )}
        <Text style={styles.directionText}>
          {compassDirection} ({Math.round(direction)})
        </Text>
        <Text style={styles.descriptionText}>
          {windDescription}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1000,
  },
  compassContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainer: {
    marginTop: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gustText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  directionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 10,
    color: '#64748b',
  },
});
