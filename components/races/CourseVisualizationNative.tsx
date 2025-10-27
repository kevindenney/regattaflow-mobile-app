/**
 * CourseVisualizationNative Component
 *
 * Native implementation for iOS and Android using react-native-maps
 * TODO: Integrate react-native-maps for mobile race course visualization
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CourseGeoJSON } from '../../types/raceEvents';

interface CourseVisualizationNativeProps {
  geoJSON: CourseGeoJSON;
  bounds: any;
  interactive: boolean;
  onMarkPress?: (mark: any) => void;
}

export default function CourseVisualizationNative({
  geoJSON,
  bounds,
  interactive,
  onMarkPress
}: CourseVisualizationNativeProps) {
  // TODO: Implement react-native-maps integration
  // See: https://github.com/react-native-maps/react-native-maps

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="map-marker-path"
        size={64}
        color="#CBD5E1"
      />
      <Text style={styles.placeholderTitle}>Course Map</Text>
      <Text style={styles.placeholderText}>
        Native map visualization coming soon.{'\n'}
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
