/**
 * ConditionsCompactBar
 *
 * Single-row horizontal strip showing current conditions at a glance:
 * [wind] 12kt NE  |  [tide] 1.2m rising  |  [temp] 22°C
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import type { LiveWeatherData } from '@/hooks/useVenueLiveWeather';

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

interface ConditionsCompactBarProps {
  weather: LiveWeatherData | null;
  isLoading: boolean;
  onPress?: () => void;
}

export function ConditionsCompactBar({ weather, isLoading, onPress }: ConditionsCompactBarProps) {
  if (isLoading || !weather) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Loading conditions...</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={onPress} disabled={!onPress}>
      {/* Wind */}
      <View style={styles.item}>
        <Ionicons name="flag-outline" size={14} color={IOS_COLORS.secondaryLabel} />
        <Text style={styles.value}>
          {weather.windSpeed}kt {degToCompass(weather.windDirection)}
        </Text>
      </View>

      <View style={styles.separator} />

      {/* Tide */}
      <View style={styles.item}>
        <Ionicons name="water-outline" size={14} color={IOS_COLORS.secondaryLabel} />
        <Text style={styles.value}>
          {weather.tidalHeight != null ? `${weather.tidalHeight.toFixed(1)}m` : '--'}
          {weather.tidalState ? ` ${weather.tidalState}` : ''}
        </Text>
      </View>

      <View style={styles.separator} />

      {/* Temp */}
      <View style={styles.item}>
        <Ionicons name="thermometer-outline" size={14} color={IOS_COLORS.secondaryLabel} />
        <Text style={styles.value}>
          {Math.round(weather.airTemperature)}°C
        </Text>
      </View>

      {onPress && (
        <Ionicons name="chevron-forward" size={12} color={IOS_COLORS.tertiaryLabel} style={styles.chevron} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  placeholder: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.08,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: 12,
  },
  chevron: {
    marginLeft: 'auto',
  },
});

export default ConditionsCompactBar;
