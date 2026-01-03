/**
 * VenueConditionsBar - Quick conditions strip at the top
 * Shows wind, tide, and AI summary at a glance
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueLiveWeather } from '@/hooks/useVenueLiveWeather';

interface VenueConditionsBarProps {
  venueId: string;
  venueName: string;
  latitude: number;
  longitude: number;
  tideHeight?: number;
  tidePhase?: 'rising' | 'falling' | 'high' | 'low';
  aiSummary?: string;
}

export function VenueConditionsBar({
  venueId,
  venueName,
  latitude,
  longitude,
  tideHeight,
  tidePhase,
  aiSummary,
}: VenueConditionsBarProps) {
  const { weather, loading } = useVenueLiveWeather(
    latitude,
    longitude,
    venueId,
    venueName
  );

  const getWindDirectionLabel = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getTideIcon = () => {
    switch (tidePhase) {
      case 'rising':
        return 'arrow-up';
      case 'falling':
        return 'arrow-down';
      case 'high':
        return 'remove';
      case 'low':
        return 'remove';
      default:
        return 'water';
    }
  };

  const getConditionsSummary = (): string => {
    if (aiSummary) return aiSummary;
    if (!weather) return 'Loading conditions...';

    const windSpeed = weather.windSpeed || 0;
    const windDir = weather.windDirection ? getWindDirectionLabel(weather.windDirection) : '';

    if (windSpeed < 5) {
      return `Light ${windDir} breeze - practice conditions`;
    } else if (windSpeed < 12) {
      return `Good ${windDir} sailing conditions`;
    } else if (windSpeed < 20) {
      return `Strong ${windDir} breeze - experienced sailors`;
    } else {
      return `Heavy weather warning - ${windDir} ${windSpeed}kt`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Wind Conditions */}
      <View style={styles.conditionItem}>
        <View style={styles.conditionIcon}>
          <Ionicons name="speedometer-outline" size={16} color="#2563EB" />
        </View>
        <View style={styles.conditionContent}>
          <ThemedText style={styles.conditionValue}>
            {loading ? '--' : `${weather?.windSpeed?.toFixed(0) || '--'} kt`}
          </ThemedText>
          <ThemedText style={styles.conditionLabel}>
            {loading ? 'Loading' : (weather?.windDirection ? `→ ${getWindDirectionLabel(weather.windDirection)}` : 'Wind')}
          </ThemedText>
        </View>
      </View>

      {/* Tide */}
      {tideHeight !== undefined && (
        <View style={styles.conditionItem}>
          <View style={[styles.conditionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name={getTideIcon() as any} size={16} color="#1D4ED8" />
          </View>
          <View style={styles.conditionContent}>
            <ThemedText style={styles.conditionValue}>
              {tideHeight.toFixed(1)}m
            </ThemedText>
            <ThemedText style={styles.conditionLabel}>
              Tide {tidePhase}
            </ThemedText>
          </View>
        </View>
      )}

      {/* AI Summary */}
      <View style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText} numberOfLines={1}>
          {getConditionsSummary()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionContent: {
    gap: 2,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  conditionLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
});
