/**
 * Tactical Map Demo
 * Complete integration example showing TacticalRaceMap with real environmental data
 *
 * This demonstrates:
 * - Fetching race event data
 * - Getting environmental intelligence from WeatherAggregationService
 * - Rendering the tactical map with all layers
 * - Real-time weather updates
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import TacticalRaceMap from './TacticalRaceMap';
import { WeatherAggregationService } from '@/services/WeatherAggregationService';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type {
  RaceEventWithDetails,
  CourseMark,
  EnvironmentalIntelligence,
} from '@/types/raceEvents';

interface TacticalMapDemoProps {
  raceEventId: string;
}

export default function TacticalMapDemo({ raceEventId }: TacticalMapDemoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raceEvent, setRaceEvent] = useState<RaceEventWithDetails | null>(null);
  const [marks, setMarks] = useState<CourseMark[]>([]);
  const [environmental, setEnvironmental] = useState<EnvironmentalIntelligence | null>(null);

  useEffect(() => {
    loadRaceData();
  }, [raceEventId]);

  const loadRaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Load race event with venue details
      const { data: raceData, error: raceError } = await supabase
        .from('race_events')
        .select(`
          *,
          venue:sailing_venues(
            id,
            name,
            coordinates_lat,
            coordinates_lng,
            country,
            region
          )
        `)
        .eq('id', raceEventId)
        .single();

      if (raceError) throw raceError;
      if (!raceData) throw new Error('Race event not found');

      setRaceEvent(raceData as RaceEventWithDetails);

      // 2. Load course marks
      const { data: marksData, error: marksError } = await supabase
        .from('course_marks')
        .select('*')
        .eq('race_event_id', raceEventId)
        .order('sequence', { ascending: true });

      if (marksError) throw marksError;
      setMarks(marksData || []);

      // 3. Get environmental intelligence
      if (raceData.venue && raceData.start_time) {
        await loadEnvironmentalData(
          raceData.venue,
          raceData.start_time,
          raceData.duration_minutes || 120
        );
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading race data:', err);
      setError(err.message || 'Failed to load race data');
      setLoading(false);
    }
  };

  const loadEnvironmentalData = async (
    venue: any,
    startTime: string,
    durationMinutes: number
  ) => {
    try {
      // Initialize weather service for venue region
      const weatherService = new WeatherAggregationService({
        region: venue.region,
        country: venue.country,
      });

      // Get environmental intelligence for race window
      const envData = await weatherService.getEnvironmentalIntelligence({
        venue_id: venue.id,
        start_time: startTime,
        duration_minutes: durationMinutes,
      });

      setEnvironmental(envData);

    } catch (err) {
      console.error('Error loading environmental data:', err);
      // Non-fatal - map will still render without environmental overlays
    }
  };

  const handleMarkSelected = (mark: CourseMark) => {
    logger.debug('Mark selected:', mark);
    // You could show a modal with mark details here
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading race intelligence...</Text>
        <Text style={styles.loadingSubtext}>
          Fetching course, weather, and tactical data
        </Text>
      </View>
    );
  }

  if (error || !raceEvent) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error || 'Race not found'}</Text>
      </View>
    );
  }

  if (marks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No course marks found</Text>
        <Text style={styles.errorSubtext}>
          Upload sailing instructions to extract course
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{raceEvent.race_name}</Text>
        <Text style={styles.subtitle}>
          {raceEvent.venue?.name || 'Unknown Venue'} • {marks.length} marks
        </Text>
        {environmental && (
          <Text style={styles.weatherSummary}>{environmental.summary}</Text>
        )}
      </View>

      {/* Tactical Map */}
      <TacticalRaceMap
        raceEvent={raceEvent}
        marks={marks}
        environmental={environmental || undefined}
        onMarkSelected={handleMarkSelected}
        showControls={true}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Map Legend</Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Start</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Windward</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Leeward</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Finish</Text>
          </View>
        </View>
      </View>

      {/* Alerts */}
      {environmental?.alerts && environmental.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>⚠️ Tactical Alerts</Text>
          {environmental.alerts.map((alert, idx) => (
            <View key={idx} style={styles.alert}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Forecast Summary */}
      {environmental && (
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>Race Window Forecast</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.forecastScroll}
          >
            {environmental.forecast.slice(0, 6).map((forecast, idx) => {
              const time = new Date(forecast.time);
              return (
                <View key={idx} style={styles.forecastCard}>
                  <Text style={styles.forecastTime}>
                    {time.getHours()}:{time.getMinutes().toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.forecastWind}>
                    {forecast.wind.speed}kt
                  </Text>
                  <Text style={styles.forecastDir}>
                    {Math.round(forecast.wind.direction)}°
                  </Text>
                  {forecast.wave && (
                    <Text style={styles.forecastWave}>
                      {forecast.wave.height}m
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Usage Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Map Controls</Text>
        <Text style={styles.instructionsText}>
          • Drag to pan, scroll to zoom{'\n'}
          • Click marks for details{'\n'}
          • Toggle layers to show/hide overlays{'\n'}
          • Environmental data updates every 15 minutes
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const logger = createLogger('TacticalMapDemo');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  weatherSummary: {
    fontSize: 13,
    color: '#0066CC',
    marginTop: 8,
    fontWeight: '500',
  },
  legend: {
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  alertsContainer: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  alert: {
    marginTop: 8,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  alertMessage: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  forecastContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  forecastScroll: {
    marginHorizontal: -4,
  },
  forecastCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  forecastTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  forecastWind: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
    marginTop: 4,
  },
  forecastDir: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  forecastWave: {
    fontSize: 11,
    color: '#06b6d4',
    marginTop: 4,
  },
  instructions: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  instructionsText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
