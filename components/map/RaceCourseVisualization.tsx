/**
 * Race Course Visualization Component
 * Connects AI-extracted race course data with 3D map visualization
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Map3DView } from './Map3DView';
import type { RaceCourseExtraction } from '@/lib/types/ai-knowledge';
import type { RaceMark, WeatherConditions, GeoLocation, Map3DConfig } from '@/lib/types/map';
import {
  convertCourseToMarks,
  calculateCourseCenter,
  calculateOptimalZoom,
  extractCourseSummary,
  type ExtractedRaceMark
} from '@/lib/utils/courseConverter';

interface RaceCourseVisualizationProps {
  courseExtraction?: RaceCourseExtraction | null;
  weather?: WeatherConditions;
  onMarkPress?: (mark: RaceMark) => void;
  initialConfig?: Partial<Map3DConfig>;
}

export const RaceCourseVisualization: React.FC<RaceCourseVisualizationProps> = ({
  courseExtraction,
  weather,
  onMarkPress,
  initialConfig
}) => {

  const [marks, setMarks] = useState<ExtractedRaceMark[]>([]);
  const [mapConfig, setMapConfig] = useState<Partial<Map3DConfig>>({});
  const [courseCenter, setCourseCenter] = useState<GeoLocation | null>(null);
  const [courseSummary, setCourseSummary] = useState<any>(null);
  const [showCourseInfo, setShowCourseInfo] = useState(false);

  // Process course extraction when it changes
  useEffect(() => {
    if (courseExtraction) {

      // Convert extracted course to map marks
      const convertedMarks = convertCourseToMarks(courseExtraction);
      setMarks(convertedMarks);

      // Calculate course center and optimal zoom
      const center = calculateCourseCenter(courseExtraction);
      if (center) {
        setCourseCenter(center);

        const optimalZoom = calculateOptimalZoom(courseExtraction);

        // Update map config to center on course
        setMapConfig({
          ...initialConfig,
          camera: {
            pitch: 45, // 3D view for better course visualization
            bearing: 0,
            zoom: optimalZoom,
            animation: 'smooth',
            followMode: 'off'
          }
        });

      }

      // Extract course summary
      const summary = extractCourseSummary(courseExtraction);
      setCourseSummary(summary);

    } else {
      // Clear course data when no extraction available
      setMarks([]);
      setCourseCenter(null);
      setCourseSummary(null);

    }
  }, [courseExtraction, initialConfig]);

  const handleMarkPress = (mark: RaceMark) => {

    onMarkPress?.(mark);
  };

  const handleMapPress = (coordinates: { latitude: number; longitude: number }) => {

  };

  return (
    <View style={styles.container}>
      {/* 3D Map with extracted course marks */}
      <Map3DView
        config={mapConfig}
        marks={marks}
        weather={weather}
        onMarkPress={handleMarkPress}
        onMapPress={handleMapPress}
      />

      {/* Course Information Overlay */}
      {courseSummary && (
        <View style={styles.courseInfoContainer}>
          <TouchableOpacity
            style={styles.courseInfoToggle}
            onPress={() => setShowCourseInfo(!showCourseInfo)}
          >
            <Text style={styles.courseInfoTitle}>
              🏁 {courseSummary.courseType.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.courseInfoSubtitle}>
              {courseSummary.markCount} marks • {Math.round(courseSummary.confidence * 100)}% confidence
            </Text>
          </TouchableOpacity>

          {showCourseInfo && (
            <View style={styles.courseDetails}>
              <ScrollView style={styles.courseDetailsScroll}>
                <Text style={styles.detailsTitle}>📋 Course Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Course Type:</Text>
                  <Text style={styles.detailValue}>{courseSummary.courseType.replace('_', ' ')}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Marks:</Text>
                  <Text style={styles.detailValue}>{courseSummary.markCount}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>With GPS:</Text>
                  <Text style={styles.detailValue}>
                    {marks.length} {marks.length === courseSummary.markCount ? '✅' : '⚠️'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Extraction Confidence:</Text>
                  <Text style={[styles.detailValue, styles.confidenceValue]}>
                    {Math.round(courseSummary.confidence * 100)}%
                  </Text>
                </View>

                {courseExtraction && (
                  <>
                    <Text style={styles.markListTitle}>🎯 Course Marks</Text>
                    {marks.map((mark, index) => (
                      <TouchableOpacity
                        key={mark.id}
                        style={styles.markItem}
                        onPress={() => handleMarkPress(mark)}
                      >
                        <View style={styles.markHeader}>
                          <Text style={styles.markName}>{mark.name}</Text>
                          <Text style={styles.markType}>{mark.type}</Text>
                        </View>
                        <Text style={styles.markCoordinates}>
                          {mark.position.latitude.toFixed(6)}, {mark.position.longitude.toFixed(6)}
                        </Text>
                        {mark.extractionMetadata && (
                          <Text style={styles.markConfidence}>
                            Confidence: {Math.round(mark.extractionMetadata.confidence * 100)}%
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}

                    {courseExtraction.schedule.warningSignal && (
                      <>
                        <Text style={styles.scheduleTitle}>⏰ Race Schedule</Text>
                        <View style={styles.scheduleContainer}>
                          {courseExtraction.schedule.warningSignal && (
                            <Text style={styles.scheduleItem}>
                              Warning: {courseExtraction.schedule.warningSignal.toLocaleTimeString()}
                            </Text>
                          )}
                          {courseExtraction.schedule.startingSignal && (
                            <Text style={styles.scheduleItem}>
                              Start: {courseExtraction.schedule.startingSignal.toLocaleTimeString()}
                            </Text>
                          )}
                        </View>
                      </>
                    )}

                    {courseExtraction.startLine && (
                      <>
                        <Text style={styles.startLineTitle}>🚩 Start Line</Text>
                        <Text style={styles.startLineDetail}>
                          Type: {courseExtraction.startLine.type}
                        </Text>
                        <Text style={styles.startLineDetail}>
                          Description: {courseExtraction.startLine.description}
                        </Text>
                        {courseExtraction.startLine.bias && (
                          <Text style={styles.startLineDetail}>
                            Bias: {courseExtraction.startLine.bias}
                          </Text>
                        )}
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* No Course Data Message */}
      {!courseExtraction && (
        <View style={styles.noCourseContainer}>
          <Text style={styles.noCourseTitle}>📄 Upload Sailing Instructions</Text>
          <Text style={styles.noCourseDescription}>
            Upload sailing instructions to automatically extract and visualize the race course in 3D
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  courseInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 5,
    zIndex: 100,
  },
  courseInfoToggle: {
    padding: 16,
  },
  courseInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  courseInfoSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  courseDetails: {
    maxHeight: 400,
  },
  courseDetailsScroll: {
    padding: 16,
    paddingTop: 0,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  confidenceValue: {
    color: '#007AFF',
  },
  markListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  markItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  markHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  markName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  markType: {
    fontSize: 10,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  markCoordinates: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  markConfidence: {
    fontSize: 9,
    color: '#4CAF50',
    marginTop: 2,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  scheduleContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  startLineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  startLineDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  noCourseContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 50,
  },
  noCourseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  noCourseDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RaceCourseVisualization;