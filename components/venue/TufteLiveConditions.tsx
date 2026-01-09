/**
 * TufteLiveConditions
 *
 * Dense, typography-driven conditions display following Tufte principles:
 * - Maximum data-ink ratio
 * - No card chrome or shadows
 * - Hairline section separators
 * - Inline values with labels
 *
 * Target layout:
 * CONDITIONS NOW ───────────────────────────────────
 * Wind       12kt NE → 14kt (rising)
 * Gusts      18kt
 * Tide       +1.2m ▲ flooding
 * Current    0.4kt 045°
 * Temp       Water 22°C · Air 18°C
 * Visibility 8nm
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVenueLiveWeather } from '@/hooks/useVenueLiveWeather';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

interface TufteLiveConditionsProps {
  latitude?: number;
  longitude?: number;
  venueId?: string;
  venueName?: string;
  onRefresh?: () => void;
}

// Wind direction helpers
function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function getTideArrow(state?: string): string {
  switch (state) {
    case 'rising': return '▲';
    case 'falling': return '▼';
    case 'high': return '●';
    case 'low': return '○';
    default: return '~';
  }
}

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function TufteLiveConditions({
  latitude,
  longitude,
  venueId,
  venueName,
}: TufteLiveConditionsProps) {
  const { weather, isLoading, error, refresh, lastUpdated } = useVenueLiveWeather(
    latitude,
    longitude,
    venueId,
    venueName
  );

  if (!latitude || !longitude) {
    return null;
  }

  if (isLoading && !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CONDITIONS NOW</Text>
        </View>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={IOS_COLORS.secondaryLabel} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error && !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CONDITIONS NOW</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.refreshText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Conditions unavailable</Text>
      </View>
    );
  }

  if (!weather) return null;

  const windDir = getWindDirectionText(weather.windDirection);
  const tideArrow = getTideArrow(weather.tidalState);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CONDITIONS NOW</Text>
        <TouchableOpacity onPress={refresh} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={IOS_COLORS.secondaryLabel} />
          ) : (
            <Text style={styles.refreshText}>
              {lastUpdated ? formatTimeAgo(lastUpdated) : 'Refresh'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Data Rows */}
      <View style={styles.dataContainer}>
        {/* Wind */}
        <View style={styles.dataRow}>
          <Text style={styles.label}>Wind</Text>
          <Text style={styles.value}>
            {weather.windSpeed}kt {windDir}
          </Text>
        </View>

        {/* Gusts (only show if significant) */}
        {weather.windGusts && weather.windGusts > weather.windSpeed + 2 && (
          <View style={styles.dataRow}>
            <Text style={styles.label}>Gusts</Text>
            <Text style={[styles.value, styles.gustValue]}>{weather.windGusts}kt</Text>
          </View>
        )}

        {/* Tide */}
        {(weather.tidalHeight !== undefined || weather.tidalState) && (
          <View style={styles.dataRow}>
            <Text style={styles.label}>Tide</Text>
            <Text style={styles.value}>
              {weather.tidalHeight !== undefined && (
                <>{weather.tidalHeight >= 0 ? '+' : ''}{weather.tidalHeight.toFixed(1)}m </>
              )}
              {weather.tidalState && (
                <Text style={styles.tideState}>{tideArrow} {weather.tidalState}</Text>
              )}
            </Text>
          </View>
        )}

        {/* Current */}
        {weather.currentSpeed !== undefined && weather.currentSpeed > 0 && (
          <View style={styles.dataRow}>
            <Text style={styles.label}>Current</Text>
            <Text style={styles.value}>
              {weather.currentSpeed.toFixed(1)}kt
              {weather.currentDirection !== undefined && (
                <Text style={styles.direction}> {Math.round(weather.currentDirection)}°</Text>
              )}
            </Text>
          </View>
        )}

        {/* Temperature */}
        <View style={styles.dataRow}>
          <Text style={styles.label}>Temp</Text>
          <Text style={styles.value}>
            {weather.waterTemperature !== undefined && (
              <>Water {Math.round(weather.waterTemperature)}°C · </>
            )}
            Air {Math.round(weather.airTemperature)}°C
          </Text>
        </View>

        {/* Visibility */}
        {weather.visibility !== undefined && (
          <View style={styles.dataRow}>
            <Text style={styles.label}>Visibility</Text>
            <Text style={styles.value}>{weather.visibility.toFixed(0)}km</Text>
          </View>
        )}

        {/* Waves (if available) */}
        {weather.waveHeight !== undefined && weather.waveHeight > 0 && (
          <View style={styles.dataRow}>
            <Text style={styles.label}>Waves</Text>
            <Text style={styles.value}>
              {weather.waveHeight.toFixed(1)}m
              {weather.wavePeriod !== undefined && (
                <Text style={styles.period}> @ {weather.wavePeriod}s</Text>
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Source Attribution */}
      <View style={styles.footer}>
        <Text style={styles.sourceText}>
          {weather.source}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
  refreshText: {
    fontSize: 12,
    color: IOS_COLORS.blue,
    fontWeight: '500',
  },
  dataContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    width: 70,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
    textAlign: 'right',
  },
  gustValue: {
    color: '#D97706', // Warning orange for gusts
  },
  tideState: {
    color: IOS_COLORS.blue,
  },
  direction: {
    color: IOS_COLORS.secondaryLabel,
  },
  period: {
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sourceText: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  errorText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

export default TufteLiveConditions;
