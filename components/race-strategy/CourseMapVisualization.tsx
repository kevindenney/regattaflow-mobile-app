// @ts-nocheck

/**
 * Course Map Visualization
 *
 * Displays race course marks on an interactive map
 * Uses simplified visualization for MVP (can be upgraded to MapLibre later)
 *
 * Part of vertical slice: Document Upload → AI Extraction → Visualization → Validation
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CourseMark } from '@/types/raceEvents';
import CourseVisualizationService from '@/services/CourseVisualizationService';

interface CourseMapVisualizationProps {
  marks: CourseMark[];
  racingAreaBoundary?: any;
  height?: number;
}

export function CourseMapVisualization({
  marks,
  racingAreaBoundary,
  height = 300
}: CourseMapVisualizationProps) {
  // Calculate map bounds
  const bounds = CourseVisualizationService.calculateMapBounds(marks);

  if (!bounds) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.errorText}>Unable to display course (no GPS coordinates)</Text>
      </View>
    );
  }

  // Calculate scale for positioning marks
  const latRange = bounds.north - bounds.south;
  const lngRange = bounds.east - bounds.west;
  const maxRange = Math.max(latRange, lngRange);

  const scale = (height - 40) / maxRange; // Leave margin

  /**
   * Convert GPS coordinates to canvas position
   */
  const coordsToPosition = (lat: number, lng: number): { x: number; y: number } => {
    const x = ((lng - bounds.west) / lngRange) * (height - 40) + 20;
    const y = ((bounds.north - lat) / latRange) * (height - 40) + 20; // Flip Y axis

    return { x, y };
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Simple 2D visualization */}
      <View style={styles.canvas}>
        {/* Render course line */}
        {marks
          .filter(mark => mark.position && mark.sequence_number)
          .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
          .map((mark, index, array) => {
            if (index === array.length - 1) return null;

            const startCoords = CourseVisualizationService['extractCoordinates'](mark.position);
            const nextMark = array[index + 1];
            const endCoords = CourseVisualizationService['extractCoordinates'](nextMark.position);

            if (!startCoords || !endCoords) return null;

            const start = coordsToPosition(startCoords.lat, startCoords.lng);
            const end = coordsToPosition(endCoords.lat, endCoords.lng);

            const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

            return (
              <View
                key={`line-${mark.id}`}
                style={[
                  styles.courseLine,
                  {
                    left: start.x,
                    top: start.y,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }]
                  }
                ]}
              />
            );
          })}

        {/* Render marks */}
        {marks.map((mark, index) => {
          const coords = CourseVisualizationService['extractCoordinates'](mark.position);
          if (!coords) return null;

          const position = coordsToPosition(coords.lat, coords.lng);
          const icon = CourseVisualizationService.getMarkIcon(mark.mark_type);
          const isStartOrFinish = mark.mark_type === 'start' || mark.mark_type === 'finish';

          return (
            <View
              key={mark.id}
              style={[
                styles.mark,
                {
                  left: position.x - 15,
                  top: position.y - 15
                }
              ]}
            >
              <View
                style={[
                  styles.markCircle,
                  isStartOrFinish && styles.markCircleLarge
                ]}
              >
                <Text style={styles.markIcon}>{icon}</Text>
              </View>
              <Text style={styles.markLabel}>{mark.mark_name}</Text>
            </View>
          );
        })}

        {/* Compass */}
        <View style={styles.compass}>
          <Text style={styles.compassText}>N</Text>
        </View>

        {/* Scale indicator */}
        <View style={styles.scaleContainer}>
          <View style={styles.scaleLine} />
          <Text style={styles.scaleText}>
            {latRange > 0.1 ? `${(latRange * 60).toFixed(1)} nm` : `${(latRange * 60 * 1852).toFixed(0)} m`}
          </Text>
        </View>
      </View>

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>
          {marks.length} marks • {bounds.zoom} zoom
        </Text>
        <Text style={styles.coordsText}>
          {bounds.center.lat.toFixed(4)}°, {bounds.center.lng.toFixed(4)}°
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  canvas: {
    flex: 1,
    position: 'relative'
  },
  courseLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#ff6b00',
    opacity: 0.6
  },
  mark: {
    position: 'absolute',
    alignItems: 'center'
  },
  markCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0080ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  markCircleLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3
  },
  markIcon: {
    fontSize: 16
  },
  markLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden'
  },
  compass: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  compassText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  scaleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    alignItems: 'center'
  },
  scaleLine: {
    width: 60,
    height: 2,
    backgroundColor: '#000',
    marginBottom: 4
  },
  scaleText: {
    fontSize: 10,
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 4
  },
  infoText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  coordsText: {
    fontSize: 10,
    color: '#999'
  },
  errorText: {
    fontSize: 14,
    color: '#cc0000',
    textAlign: 'center',
    padding: 20
  }
});

export default CourseMapVisualization;
