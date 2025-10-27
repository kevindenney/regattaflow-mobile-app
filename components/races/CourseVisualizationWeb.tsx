/**
 * CourseVisualizationWeb Component
 *
 * Web-specific implementation using MapLibre GL JS
 * TODO: Integrate actual MapLibre GL JS for 3D race course visualization
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CourseGeoJSON } from '../../types/raceEvents';

interface CourseVisualizationWebProps {
  geoJSON: CourseGeoJSON;
  bounds: any;
  interactive: boolean;
  onMarkPress?: (mark: any) => void;
}

export default function CourseVisualizationWeb({
  geoJSON,
  bounds,
  interactive,
  onMarkPress
}: CourseVisualizationWebProps) {
  // TODO: Implement MapLibre GL JS integration
  // See: https://maplibre.org/maplibre-gl-js/docs/

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="map-marker-path"
        size={64}
        color="#CBD5E1"
      />
      <Text style={styles.placeholderTitle}>3D Course Map</Text>
      <Text style={styles.placeholderText}>
        MapLibre GL JS integration coming soon.{'\n'}
        {geoJSON.features.length} course features detected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
