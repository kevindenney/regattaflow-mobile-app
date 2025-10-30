/**
 * CourseOverlay Component
 *
 * Displays race course on map: start line, course marks, path, and finish line
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants/designSystem';

// Conditional imports for native only
let Polyline: any;
let Marker: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  Polyline = maps.Polyline;
  Marker = maps.Marker;
}

interface Course {
  startLine: Array<{ latitude: number; longitude: number }>;
  finishLine?: Array<{ latitude: number; longitude: number }>;
  marks: Array<{
    coordinate: { latitude: number; longitude: number };
    name?: string;
  }>;
  path: Array<{ latitude: number; longitude: number }>;
}

interface CourseOverlayProps {
  course: Course;
}

export const CourseOverlay: React.FC<CourseOverlayProps> = ({ course }) => {
  return (
    <>
      {/* Start line - GREEN */}
      <Polyline
        coordinates={course.startLine}
        strokeColor={colors.success[600]}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Course marks - NUMBERED CIRCLES */}
      {course.marks.map((mark, index) => (
        <Marker
          key={`mark-${index}`}
          coordinate={mark.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.courseMark}>
            <Text style={styles.courseMarkNumber}>{index + 1}</Text>
          </View>
        </Marker>
      ))}

      {/* Course path - RED DASHED */}
      {course.path.length > 0 && (
        <Polyline
          coordinates={course.path}
          strokeColor={colors.danger[600]}
          strokeWidth={2}
          lineDashPattern={[10, 5]}
          lineCap="round"
        />
      )}

      {/* Finish line - GOLD */}
      {course.finishLine && course.finishLine.length > 0 && (
        <Polyline
          coordinates={course.finishLine}
          strokeColor="#FFD700"
          strokeWidth={3}
          lineCap="round"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  courseMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  courseMarkNumber: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
