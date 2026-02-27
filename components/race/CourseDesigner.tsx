import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../../../components/themed-text';
import { RaceCourse } from './RaceBuilder';
import { YachtClubCourseDesigner } from './yacht-club/YachtClubCourseDesigner';
import { useAuth } from '@/providers/AuthProvider';
// import Svg, { Circle, Line, Polygon, Text } from 'react-native-svg';

export interface CourseDesignerProps {
  course: RaceCourse | null;
  onCourseUpdate: (course: RaceCourse) => void;
  isPreviewMode?: boolean;
}

export function CourseDesigner({ course, onCourseUpdate }: CourseDesignerProps) {
  const { userType } = useAuth();
  // Keep yacht-club tooling as default while auth context is still loading.
  const useYachtClubDesigner = !userType || userType === 'club';

  // Route to appropriate designer based on user type
  if (useYachtClubDesigner) {
    return (
      <YachtClubCourseDesigner
        course={course}
        onCourseUpdate={onCourseUpdate}
        venueCoordinates={[114.19, 22.285]} // Hong Kong default
      />
    );
  }

  // Fallback to simple designer for other user types
  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>
          📍 {course?.name || 'Course Design Area'}
        </ThemedText>

        <View style={styles.svg}>
          <View style={styles.courseContent}>
            <ThemedText style={styles.courseContentText}>
              📍 Course visualization will be implemented with MapLibre GL JS
            </ThemedText>
            <ThemedText style={styles.courseContentSubtext}>
              {course?.marks?.length || 0} marks placed
            </ThemedText>
          </View>
        </View>

        {!course && (
          <View style={styles.emptyCourseContainer}>
            <ThemedText type="title" style={styles.emptyCourseTitle}>
              🎯 Start Building Your Course
            </ThemedText>
            <ThemedText style={styles.emptyCourseSubtitle}>
              Add marks using the toolbar below or select a template
            </ThemedText>
          </View>
        )}
      </View>

      {course && (
        <View style={styles.infoPanel}>
          <ThemedText style={styles.infoPanelTitle}>📊 Course Details</ThemedText>
          <ThemedText style={styles.infoPanelText}>
            Type: {course.type} | Marks: {course.marks.length} |
            {course.sequence.length > 0 ? ` Sequence: ${course.sequence.join(' → ')}` : ' No sequence set'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  chartContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    boxShadow: '0px 2px',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  svg: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  markContainer: {
    position: 'absolute',
  },
  mark: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px',
  },
  markLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  markNameLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  markNameText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  emptyCourseContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyCourseTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyCourseSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  toolbar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  markButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  markButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markButtonText: {
    fontSize: 12,
    color: '#0066CC',
  },
  infoPanel: {
    backgroundColor: '#fff',
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoPanelText: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  courseContentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  courseContentSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
