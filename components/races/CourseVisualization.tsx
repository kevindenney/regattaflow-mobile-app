/**
 * Course Visualization Component
 *
 * 3D race course visualization using MapLibre
 * Universal component (iOS, Android, Web)
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { CourseMark, CourseGeoJSON } from '../../types/raceEvents';
import CourseVisualizationService from '../../services/CourseVisualizationService';

// Platform-specific imports
const MapView = Platform.select({
  web: () => require('./CourseVisualizationWeb').default,
  default: () => require('./CourseVisualizationNative').default
})();

interface CourseVisualizationProps {
  marks: CourseMark[];
  racingAreaBoundary?: any;
  courseConfiguration?: string;
  height?: number;
  interactive?: boolean;
  onMarkPress?: (mark: CourseMark) => void;
}

export default function CourseVisualization({
  marks,
  racingAreaBoundary,
  courseConfiguration,
  height = 300,
  interactive = true,
  onMarkPress
}: CourseVisualizationProps) {
  const [geoJSON, setGeoJSON] = useState<CourseGeoJSON | null>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateVisualization();
  }, [marks, racingAreaBoundary, courseConfiguration]);

  const generateVisualization = () => {
    try {
      // Generate GeoJSON from marks
      const geojson = CourseVisualizationService.generateCourseGeoJSON({
        marks,
        racingAreaBoundary,
        courseConfiguration: courseConfiguration as any
      });

      setGeoJSON(geojson);

      // Calculate map bounds
      const bounds = CourseVisualizationService.calculateMapBounds(marks);
      setMapBounds(bounds);

      setLoading(false);
    } catch (error) {
      console.error('Error generating course visualization:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator size="large" color="#0080ff" />
        <Text style={styles.loadingText}>Generating course map...</Text>
      </View>
    );
  }

  if (!geoJSON || !mapBounds) {
    return (
      <View style={[styles.container, styles.errorContainer, { height }]}>
        <Text style={styles.errorText}>Unable to generate course map</Text>
        <Text style={styles.errorHint}>
          {marks.length === 0 ? 'No course marks available' : 'Invalid mark coordinates'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        geoJSON={geoJSON}
        bounds={mapBounds}
        interactive={interactive}
        onMarkPress={onMarkPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  errorContainer: {
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderStyle: 'dashed'
  },
  errorText: {
    fontSize: 16,
    color: '#cc6600',
    fontWeight: '600',
    marginBottom: 4
  },
  errorHint: {
    fontSize: 12,
    color: '#666'
  }
});
