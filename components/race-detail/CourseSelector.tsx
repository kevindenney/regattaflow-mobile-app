/**
 * Course Selector Component
 * Allows selecting a pre-defined course from the library to overlay on the race map
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CourseLibraryService } from '@/services/CourseLibraryService';
import type { RaceCourse, Mark } from '@/types/courses';

interface CourseSelectorProps {
  venueId?: string;
  venueName?: string;
  onCourseSelected: (marks: Mark[]) => void;
  currentWindDirection?: number;
  currentWindSpeed?: number;
}

export function CourseSelector({
  venueId,
  venueName,
  onCourseSelected,
  currentWindDirection,
  currentWindSpeed,
}: CourseSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<RaceCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<RaceCourse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showModal && venueId) {
      loadCourses();
    }
  }, [showModal, venueId]);

  const loadCourses = async () => {
    if (!venueId) return;

    try {
      setLoading(true);
      console.log('📚 [CourseSelector] Loading courses for venue:', venueName);

      // Fetch courses for this venue
      const fetchedCourses = await CourseLibraryService.fetchCourses({
        venueId,
        windDirection: currentWindDirection,
        windSpeed: currentWindSpeed,
      });

      setCourses(fetchedCourses);
      console.log(`✅ [CourseSelector] Loaded ${fetchedCourses.length} courses`);
    } catch (error) {
      console.error('[CourseSelector] Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (course: RaceCourse) => {
    console.log('📍 [CourseSelector] Selected course:', course.name);

    setSelectedCourse(course);

    // Convert course marks to the format expected by the map
    const marks: Mark[] = course.marks || [];

    // Record usage
    await CourseLibraryService.recordCourseUsage(course.id);

    // Pass marks to parent
    onCourseSelected(marks);

    setShowModal(false);
  };

  const formatWindRange = (course: RaceCourse) => {
    if (course.min_wind_direction !== null && course.max_wind_direction !== null) {
      return `${course.min_wind_direction}°-${course.max_wind_direction}°, ${course.min_wind_speed || 0}-${course.max_wind_speed || 999}kt`;
    }
    return 'Any conditions';
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="map-marker-path" size={20} color="#0066CC" />
        <Text style={styles.triggerText}>
          {selectedCourse ? selectedCourse.name : 'Select Course'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
      </TouchableOpacity>

      {/* Course Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Course</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Venue Info */}
          {venueName && (
            <View style={styles.venueInfo}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#64748B" />
              <Text style={styles.venueText}>{venueName}</Text>
            </View>
          )}

          {/* Current Conditions */}
          {currentWindDirection !== undefined && currentWindSpeed !== undefined && (
            <View style={styles.conditionsInfo}>
              <MaterialCommunityIcons name="weather-windy" size={16} color="#0066CC" />
              <Text style={styles.conditionsText}>
                Current: {currentWindSpeed}kt @ {currentWindDirection}°
              </Text>
            </View>
          )}

          {/* Course List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="map-marker-off" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Courses Available</Text>
              <Text style={styles.emptyText}>
                {venueId
                  ? 'No courses found for this venue. Create one in the Courses tab.'
                  : 'Please set a venue for this race to see available courses.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.courseList}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseCard,
                    selectedCourse?.id === course.id && styles.courseCardSelected,
                  ]}
                  onPress={() => handleCourseSelect(course)}
                >
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    {course.marks && (
                      <View style={styles.markCount}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#64748B" />
                        <Text style={styles.markCountText}>{course.marks.length}</Text>
                      </View>
                    )}
                  </View>

                  {course.description && (
                    <Text style={styles.courseDescription}>{course.description}</Text>
                  )}

                  <View style={styles.courseMetadata}>
                    <Text style={styles.courseType}>{course.course_type || 'Standard'}</Text>
                    <Text style={styles.courseWindRange}>{formatWindRange(course)}</Text>
                  </View>

                  {course.usage_count > 0 && (
                    <Text style={styles.courseUsage}>Used {course.usage_count} times</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  venueText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  conditionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  conditionsText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  courseList: {
    flex: 1,
    padding: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseCardSelected: {
    borderColor: '#0066CC',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  markCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  courseType: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  courseWindRange: {
    fontSize: 13,
    color: '#64748B',
  },
  courseUsage: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
