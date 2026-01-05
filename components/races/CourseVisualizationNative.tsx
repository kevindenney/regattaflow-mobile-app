/**
 * CourseVisualizationNative Component
 *
 * Native implementation for iOS and Android using react-native-maps
 * Renders course marks and lines from GeoJSON data
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CourseOverlay } from '@/components/race-detail/map/CourseOverlay';
import type { CourseGeoJSON, CourseFeature, PointGeometry } from '@/types/raceEvents';

// Conditional imports for native only (requires development build)
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    mapsAvailable = true;
  } catch (e) {
    console.warn('[CourseVisualizationNative] react-native-maps not available:', e);
  }
}

interface CourseVisualizationNativeProps {
  geoJSON: CourseGeoJSON;
  bounds: any;
  interactive: boolean;
  onMarkPress?: (mark: any) => void;
}

/**
 * Convert GeoJSON features to Course format for CourseOverlay
 */
const convertGeoJSONToCourse = (geoJSON: CourseGeoJSON) => {
  const marks: Array<{
    id?: string;
    coordinate: { latitude: number; longitude: number };
    name?: string;
    type?: string;
    sequence?: number;
    rounding?: string;
  }> = [];

  const path: Array<{ latitude: number; longitude: number }> = [];
  const startLine: Array<{ latitude: number; longitude: number }> = [];
  const finishLine: Array<{ latitude: number; longitude: number }> = [];

  geoJSON.features.forEach((feature: CourseFeature) => {
    if (feature.geometry.type === 'Point') {
      const [lng, lat] = (feature.geometry as PointGeometry).coordinates;
      const props = feature.properties as any;

      marks.push({
        id: props.id,
        coordinate: { latitude: lat, longitude: lng },
        name: props.name,
        type: props.type,
        sequence: props.sequence,
        rounding: props.rounding,
      });

      // Also add to path for course line
      path.push({ latitude: lat, longitude: lng });

      // Build start/finish lines if we have the right marks
      if (props.type === 'committee_boat' || props.type === 'pin') {
        startLine.push({ latitude: lat, longitude: lng });
      }
      if (props.type === 'finish' || props.type === 'committee_boat') {
        finishLine.push({ latitude: lat, longitude: lng });
      }
    }
  });

  // Sort marks by sequence
  marks.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  return {
    marks,
    path,
    startLine: startLine.length === 2 ? startLine : [],
    finishLine: finishLine.length === 2 ? finishLine : undefined,
  };
};

/**
 * Calculate map region from GeoJSON bounds or features
 */
const calculateRegion = (geoJSON: CourseGeoJSON, bounds: any) => {
  // Default region
  const defaultRegion = {
    latitude: 22.265,
    longitude: 114.262,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Try to use provided bounds
  if (bounds?.center && bounds?.delta) {
    return {
      latitude: bounds.center[1],
      longitude: bounds.center[0],
      latitudeDelta: bounds.delta[1] || 0.02,
      longitudeDelta: bounds.delta[0] || 0.02,
    };
  }

  // Calculate from features
  if (geoJSON.features.length > 0) {
    const points: Array<{ lat: number; lng: number }> = [];

    geoJSON.features.forEach((feature: CourseFeature) => {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = (feature.geometry as PointGeometry).coordinates;
        points.push({ lat, lng });
      }
    });

    if (points.length > 0) {
      const lats = points.map(p => p.lat);
      const lngs = points.map(p => p.lng);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
      };
    }
  }

  return defaultRegion;
};

export default function CourseVisualizationNative({
  geoJSON,
  bounds,
  interactive,
  onMarkPress
}: CourseVisualizationNativeProps) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Convert GeoJSON to course format
  const course = useMemo(() => convertGeoJSONToCourse(geoJSON), [geoJSON]);

  // Calculate initial region
  const initialRegion = useMemo(() => calculateRegion(geoJSON, bounds), [geoJSON, bounds]);

  // Handle mark press
  const handleMarkPress = (mark: any) => {
    if (interactive && onMarkPress) {
      onMarkPress(mark);
    }
  };

  // Platform check
  if (Platform.OS === 'web' || !MapView) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType="hybrid"
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={false}
        showsCompass={false}
      >
        {mapReady && course.marks.length > 0 && (
          <CourseOverlay
            course={course}
            onMarkPress={handleMarkPress}
            showLabels={interactive}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: 200,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
});
