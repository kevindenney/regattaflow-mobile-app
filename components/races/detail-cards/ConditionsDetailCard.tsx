/**
 * Conditions Detail Card
 * Compact view of wind, tide, and wave conditions for the detail zone
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ConditionsDetailCardProps {
  raceId: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  tide?: {
    state: string;
    height?: number;
    direction?: string;
  } | null;
  waves?: {
    height: number;
    period?: number;
  } | null;
  temperature?: number;
  onPress?: () => void;
}

export function ConditionsDetailCard({
  raceId,
  wind,
  tide,
  waves,
  temperature,
  onPress,
}: ConditionsDetailCardProps) {
  const hasData = wind || tide || waves;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color="#3B82F6" />
        </View>
        <Text style={styles.headerTitle}>Conditions</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      </View>

      {hasData ? (
        <View style={styles.content}>
          {/* Wind */}
          {wind && (
            <View style={styles.metric}>
              <MaterialCommunityIcons name="weather-windy" size={16} color="#64748B" />
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>
                  {wind.direction} {wind.speedMin}–{wind.speedMax}
                </Text>
                <Text style={styles.unitText}>kts</Text>
              </View>
            </View>
          )}

          {/* Tide */}
          {tide && (
            <View style={styles.metric}>
              <MaterialCommunityIcons name="waves" size={16} color="#64748B" />
              <View style={styles.metricValue}>
                <Text style={[styles.valueText, styles.tideText]}>
                  {tide.state}
                </Text>
                {tide.height !== undefined && (
                  <Text style={styles.unitText}>{tide.height.toFixed(1)}m</Text>
                )}
              </View>
            </View>
          )}

          {/* Waves */}
          {waves && (
            <View style={styles.metric}>
              <MaterialCommunityIcons name="wave" size={16} color="#64748B" />
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>{waves.height.toFixed(1)}m</Text>
                {waves.period && (
                  <Text style={styles.unitText}>{waves.period}s</Text>
                )}
              </View>
            </View>
          )}

          {/* Temperature */}
          {temperature !== undefined && (
            <View style={styles.metric}>
              <MaterialCommunityIcons name="thermometer" size={16} color="#64748B" />
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>{temperature}°C</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>No conditions data available</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  tideText: {
    textTransform: 'capitalize',
  },
  unitText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyContent: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
