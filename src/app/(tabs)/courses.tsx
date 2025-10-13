/**
 * Courses Tab - Race Course Library
 * OnX Maps-style course builder with saved courses
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CourseBuilder } from '@/src/components/courses';
import { MOCK_COURSES, MockCourse } from '@/src/constants/mockData';
import { MapPin, Plus, Navigation, Ruler } from 'lucide-react-native';

export default function CoursesScreen() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MockCourse | undefined>(undefined);
  const [savedCourses, setSavedCourses] = useState<MockCourse[]>(MOCK_COURSES);

  const handleSaveCourse = (course: MockCourse) => {
    const existingIndex = savedCourses.findIndex((c) => c.id === course.id);
    if (existingIndex >= 0) {
      // Update existing course
      const updated = [...savedCourses];
      updated[existingIndex] = course;
      setSavedCourses(updated);
    } else {
      // Add new course
      setSavedCourses([...savedCourses, course]);
    }
    setIsBuilding(false);
    setEditingCourse(undefined);
  };

  const handleEditCourse = (course: MockCourse) => {
    setEditingCourse(course);
    setIsBuilding(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    setSavedCourses(savedCourses.filter((c) => c.id !== courseId));
  };

  if (isBuilding) {
    return (
      <SafeAreaView style={styles.container}>
        <CourseBuilder
          initialCourse={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => {
            setIsBuilding(false);
            setEditingCourse(undefined);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Race Courses</Text>
          <Text style={styles.headerSubtitle}>
            {savedCourses.length} saved course{savedCourses.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingCourse(undefined);
            setIsBuilding(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Course</Text>
        </TouchableOpacity>
      </View>

      {/* Course Library */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {savedCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No courses yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first race course with the OnX Maps-style builder
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setIsBuilding(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Create Course</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.courseGrid}>
            {savedCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => handleEditCourse(course)}
              >
                {/* Course Header */}
                <View style={styles.courseCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseCardTitle}>{course.name}</Text>
                    <Text style={styles.courseCardVenue}>{course.venue}</Text>
                  </View>
                  <View style={styles.courseTypeBadge}>
                    <Text style={styles.courseTypeBadgeText}>
                      {course.courseType.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Course Preview */}
                <View style={styles.coursePreview}>
                  <MapPin size={48} color="#3B82F6" />
                  <Text style={styles.coursePreviewText}>
                    {course.marks.length} marks
                  </Text>
                </View>

                {/* Course Stats */}
                <View style={styles.courseStats}>
                  <View style={styles.courseStat}>
                    <Ruler size={14} color="#64748B" />
                    <Text style={styles.courseStatLabel}>Length</Text>
                    <Text style={styles.courseStatValue}>{course.length.toFixed(2)} NM</Text>
                  </View>
                  <View style={styles.courseStat}>
                    <Navigation size={14} color="#64748B" />
                    <Text style={styles.courseStatLabel}>Wind</Text>
                    <Text style={styles.courseStatValue}>
                      {course.windRange.min}-{course.windRange.max}kt
                    </Text>
                  </View>
                  <View style={styles.courseStat}>
                    <MapPin size={14} color="#64748B" />
                    <Text style={styles.courseStatLabel}>Marks</Text>
                    <Text style={styles.courseStatValue}>{course.marks.length}</Text>
                  </View>
                </View>

                {/* Last Used */}
                {course.lastUsed && (
                  <View style={styles.courseFooter}>
                    <Text style={styles.courseLastUsed}>
                      Last used: {new Date(course.lastUsed).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.courseActions}>
                  <TouchableOpacity
                    style={styles.courseActionButton}
                    onPress={() => handleEditCourse(course)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                    <Text style={styles.courseActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.courseActionButton}
                    onPress={() => handleDeleteCourse(course.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.courseActionText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {savedCourses.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setEditingCourse(undefined);
            setIsBuilding(true);
          }}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseCard: {
    width: '100%',
    maxWidth: 375,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  courseCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  courseCardVenue: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  courseTypeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  coursePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F0F9FF',
  },
  coursePreviewText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  courseStats: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  courseStat: {
    flex: 1,
    alignItems: 'center',
  },
  courseStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  courseStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  courseFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  courseLastUsed: {
    fontSize: 12,
    color: '#94A3B8',
  },
  courseActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  courseActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  courseActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
