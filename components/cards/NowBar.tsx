/**
 * NowBar - Vertical "NOW" marker for the race timeline
 *
 * Positioned between the last past race card and the first future race card.
 * Shows current conditions (wind, waves, tide) in a vertically centered pill.
 * Purely informational — not tappable.
 *
 * Two modes:
 * - Native (left prop provided): absolute positioning within the grid container
 * - Web (no left prop): regular flex element in the horizontal scroll row
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IOS_COLORS } from './constants';

interface NowBarWeather {
  windDirection: string;
  windSpeed: number;
  waveHeight?: number;
  tideState?: string;
  locationLabel?: string;
}

interface NowBarProps {
  /** Height of the bar (should match card height) */
  height: number;
  /** Left position for absolute placement (native only) */
  left?: number;
  /** Current weather to display in the pill */
  weather?: NowBarWeather | null;
}

const BAR_WIDTH = 3;

export function NowBar({ height, left, weather }: NowBarProps) {
  const isAbsolute = left != null;

  return (
    <View
      pointerEvents="none"
      style={[
        isAbsolute ? styles.containerAbsolute : styles.containerFlow,
        { height },
        isAbsolute && { left: left - BAR_WIDTH / 2 },
      ]}
    >
      {/* Line: top half (above pill) */}
      <View style={styles.line} />

      {/* Centered pill */}
      <View style={styles.pillWrapper}>
        <View style={styles.pill}>
          <Text style={styles.nowText}>NOW</Text>

          {weather && (
            <View style={styles.weatherSection}>
              {/* Wind */}
              <View style={styles.dataRow}>
                <Text style={styles.dataIcon}>💨</Text>
                <Text style={styles.dataText}>
                  {weather.windDirection} {Math.round(weather.windSpeed)}kt
                </Text>
              </View>

              {/* Waves */}
              {weather.waveHeight != null && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataIcon}>🌊</Text>
                  <Text style={styles.dataText}>
                    {weather.waveHeight.toFixed(1)}m
                  </Text>
                </View>
              )}

              {/* Tide */}
              {weather.tideState && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataIcon}>↕</Text>
                  <Text style={styles.dataText}>{weather.tideState}</Text>
                </View>
              )}

              {/* Location source */}
              {weather.locationLabel && (
                <Text style={styles.locationText}>
                  {weather.locationLabel}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Line: bottom half (below pill) */}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  /** Native: absolute within the gesture-driven grid */
  containerAbsolute: {
    position: 'absolute',
    width: BAR_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  /** Web: regular flex child in the horizontal scroll row */
  containerFlow: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  line: {
    flex: 1,
    width: BAR_WIDTH,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 1.5,
  },
  pillWrapper: {
    marginVertical: 4,
  },
  pill: {
    backgroundColor: IOS_COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 56,
  },
  nowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  weatherSection: {
    marginTop: 4,
    gap: 2,
    alignItems: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dataIcon: {
    fontSize: 9,
  },
  dataText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 9,
    fontWeight: '600',
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 7,
    fontWeight: '500',
    marginTop: 2,
  },
});
