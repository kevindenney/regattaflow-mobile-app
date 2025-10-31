// @ts-nocheck

/**
 * Tactical Map Standalone Demo
 * Works with mock data - no database required
 * Use this to test the TacticalRaceMap component immediately
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TacticalRaceMap from './TacticalRaceMap';
import { createLogger } from '@/lib/utils/logger';
import type {
  RaceEventWithDetails,
  CourseMark,
  EnvironmentalIntelligence,
} from '@/types/raceEvents';

export default function TacticalMapStandalone() {

  const [selectedMark, setSelectedMark] = useState<CourseMark | null>(null);
  const [racingAreaCoords, setRacingAreaCoords] = useState<[number, number][] | null>(null);

  // Mock race event data
  const mockRaceEvent: RaceEventWithDetails = {
    id: 'demo-race-1',
    user_id: 'demo-user',
    race_name: 'Dragon Worlds 2025 - Race 1',
    race_series: 'Dragon Worlds 2025',
    boat_class: 'Dragon',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    racing_area_name: 'Clear Water Bay',
    extraction_status: 'completed',
    extraction_method: 'manual',
    race_status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    venue: {
      id: 'hkyc',
      name: 'Royal Hong Kong Yacht Club - Clearwater Bay',
      coordinates_lat: 22.2650,
      coordinates_lng: 114.2620,
      country: 'Hong Kong',
      region: 'asia_pacific',
    },
  };

  // Mock course marks (Clearwater Bay Dragon course)
  const mockMarks: CourseMark[] = [
    {
      id: 'mark-1',
      race_event_id: 'demo-race-1',
      mark_name: 'Start Pin',
      mark_type: 'pin',
      position: null as any, // We'll use coordinates_lat/lng instead
      coordinates_lat: 22.2640,
      coordinates_lng: 114.2610,
      sequence_number: 1,
      rounding_direction: 'port',
      extracted_from: 'manual',
      confidence_score: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mark-2',
      race_event_id: 'demo-race-1',
      mark_name: 'Committee Boat',
      mark_type: 'committee_boat',
      position: null as any,
      coordinates_lat: 22.2640,
      coordinates_lng: 114.2620,
      sequence_number: 2,
      rounding_direction: null,
      extracted_from: 'manual',
      confidence_score: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mark-3',
      race_event_id: 'demo-race-1',
      mark_name: 'Mark 1',
      mark_type: 'windward',
      position: null as any,
      coordinates_lat: 22.2680,
      coordinates_lng: 114.2630,
      sequence_number: 3,
      rounding_direction: 'port',
      extracted_from: 'manual',
      confidence_score: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mark-4',
      race_event_id: 'demo-race-1',
      mark_name: 'Gate A',
      mark_type: 'gate_left',
      position: null as any,
      coordinates_lat: 22.2650,
      coordinates_lng: 114.2605,
      sequence_number: 4,
      rounding_direction: 'port',
      extracted_from: 'manual',
      confidence_score: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mark-5',
      race_event_id: 'demo-race-1',
      mark_name: 'Gate B',
      mark_type: 'gate_right',
      position: null as any,
      coordinates_lat: 22.2650,
      coordinates_lng: 114.2615,
      sequence_number: 5,
      rounding_direction: 'starboard',
      extracted_from: 'manual',
      confidence_score: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mark-6',
      race_event_id: 'demo-race-1',
      mark_name: 'Finish',
      mark_type: 'finish',
      position: null as any,
      coordinates_lat: 22.2642,
      coordinates_lng: 114.2615,
      sequence_number: 6,
      rounding_direction: null,
      extracted_from: 'manual',
      confidence_score: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Mock environmental data
  const mockEnvironmental: EnvironmentalIntelligence = {
    current: {
      wind: {
        speed: 12,
        direction: 135, // SE wind
        gust: 15,
      },
      tide: {
        height: 1.2,
        current_speed: 2,
        current_direction: 180,
        state: 'flood',
      },
      wave: {
        height: 0.8,
        direction: 135,
        period: 4,
      },
      temperature: 24,
      timestamp: new Date().toISOString(),
    },
    forecast: [
      {
        time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        wind: { speed: 13, direction: 140 },
        confidence: 'high',
        provider: 'HKO',
      },
      {
        time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        wind: { speed: 14, direction: 145 },
        confidence: 'high',
        provider: 'HKO',
      },
      {
        time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        wind: { speed: 15, direction: 145 },
        confidence: 'medium',
        provider: 'HKO',
      },
    ],
    summary: '12-15kt SE, building throughout race. Flood tide.',
    alerts: [
      {
        type: 'wind_shift',
        severity: 'info',
        title: 'Wind Veering',
        message: 'Wind expected to veer right by 10° during race',
        timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  const handleMarkSelected = (mark: CourseMark) => {
    setSelectedMark(mark);
    logger.debug('Mark selected:', mark.mark_name);
  };

  const handleRacingAreaSelected = (coordinates: [number, number][]) => {
    setRacingAreaCoords(coordinates);

  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Tactical Race Map Demo</Text>
        <Text style={styles.subtitle}>
          {mockRaceEvent.race_name} • {mockMarks.length} marks
        </Text>
        <Text style={styles.description}>
          Mock data - Hong Kong Dragon course with live weather
        </Text>
      </View>

      {/* Tactical Map */}
      <TacticalRaceMap
        raceEvent={mockRaceEvent}
        marks={mockMarks}
        environmental={mockEnvironmental}
        onMarkSelected={handleMarkSelected}
        onRacingAreaSelected={handleRacingAreaSelected}
        showControls={true}
        allowAreaSelection={true}
      />

      {/* Selected Mark Info */}
      {selectedMark && (
        <View style={styles.selectedMarkPanel}>
          <Text style={styles.selectedMarkTitle}>Selected Mark</Text>
          <Text style={styles.selectedMarkName}>{selectedMark.mark_name}</Text>
          <Text style={styles.selectedMarkType}>Type: {selectedMark.mark_type}</Text>
          <Text style={styles.selectedMarkCoords}>
            {selectedMark.coordinates_lat.toFixed(6)}, {selectedMark.coordinates_lng.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Racing Area Info */}
      {racingAreaCoords && (
        <View style={styles.racingAreaPanel}>
          <Text style={styles.racingAreaTitle}>✅ Racing Area Selected</Text>
          <Text style={styles.racingAreaInfo}>
            {racingAreaCoords.length} points defining the boundary
          </Text>
          <Text style={styles.racingAreaCoords}>
            {racingAreaCoords.map((coord, idx) =>
              `Point ${idx + 1}: [${coord[1].toFixed(4)}, ${coord[0].toFixed(4)}]`
            ).join('\n')}
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>✅ Component Working!</Text>
        <Text style={styles.instructionsText}>
          The TacticalRaceMap is now rendering with mock data.{'\n\n'}
          Try:
          • Click "Draw Racing Area" to define the race boundary{'\n'}
          • Toggle layers (Wind, Current, Waves, Depth){'\n'}
          • Click on marks to select them{'\n'}
          • Toggle 2D/3D view{'\n'}
          • Zoom and pan the map
        </Text>
      </View>
    </View>
  );
}

const logger = createLogger('TacticalMapStandalone');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  description: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedMarkPanel: {
    backgroundColor: '#EFF6FF',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  selectedMarkTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedMarkName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066CC',
  },
  selectedMarkType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  selectedMarkCoords: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  racingAreaPanel: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  racingAreaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 8,
  },
  racingAreaInfo: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  racingAreaCoords: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  instructions: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});
