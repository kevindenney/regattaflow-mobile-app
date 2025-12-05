/**
 * Course Detail Screen
 * Shows full course information, modules, and lessons
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LearningService, type LearningCourse, type LearningModule, type LearningLesson } from '@/services/LearningService';
import { useAuth } from '@/providers/AuthProvider';

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      checkEnrollment();
    }
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      setError(null);
      const courseData = await LearningService.getCourse(courseId);
      setCourse(courseData);
    } catch (err) {
      console.error('[CourseDetail] Failed to load course:', err);
      setError('Unable to load course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!courseId || !user?.id) return;
    
    try {
      const isEnrolled = await LearningService.isEnrolled(user.id, courseId);
      setEnrolled(isEnrolled);
    } catch (err) {
      console.error('[CourseDetail] Failed to check enrollment:', err);
    }
  };

  const handleLessonPress = (lesson: LearningLesson) => {
    router.push({
      pathname: '/(tabs)/learn/[courseId]/player',
      params: { 
        courseId: courseId!,
        lessonId: lesson.id,
      },
    });
  };

  const handleEnroll = async () => {
    if (!courseId || !user?.id) return;
    
    try {
      // Check if course requires payment
      if (course?.price_cents && course.price_cents > 0) {
        // TODO: Navigate to checkout when Stripe integration is ready
        // For now, show an alert
        Alert.alert(
          'Payment Required',
          `This course costs ${formatPrice(course.price_cents)}. Checkout integration coming soon!`
        );
      } else {
        // Free course - enroll directly
        await LearningService.enrollInCourse(user.id, courseId);
        setEnrolled(true);
      }
    } catch (err) {
      console.error('[CourseDetail] Failed to enroll:', err);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const renderModule = ({ item: module }: { item: LearningModule }) => {
    const lessons = module.learning_lessons || [];
    
    return (
      <View style={styles.moduleCard}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleHeaderLeft}>
            <View style={styles.moduleIcon}>
              <Ionicons name="book-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.moduleHeaderText}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              {module.description && (
                <Text style={styles.moduleDescription}>{module.description}</Text>
              )}
            </View>
          </View>
          <Text style={styles.moduleLessonCount}>
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          </Text>
        </View>

        {lessons.length > 0 && (
          <View style={styles.lessonsList}>
            {lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonItem,
                  index < lessons.length - 1 && styles.lessonItemBorder,
                ]}
                onPress={() => handleLessonPress(lesson)}
                disabled={!enrolled && !lesson.is_free_preview}
              >
                <View style={styles.lessonItemLeft}>
                  <View style={[
                    styles.lessonNumber,
                    lesson.is_free_preview && styles.lessonNumberFree,
                  ]}>
                    <Text style={styles.lessonNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.lessonItemText}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    {lesson.description && (
                      <Text style={styles.lessonDescription} numberOfLines={1}>
                        {lesson.description}
                      </Text>
                    )}
                    <View style={styles.lessonMeta}>
                      <Ionicons name="time-outline" size={12} color="#64748B" />
                      <Text style={styles.lessonMetaText}>
                        {Math.floor((lesson.duration_seconds || 0) / 60)} min
                      </Text>
                      {lesson.is_free_preview && (
                        <>
                          <Text style={styles.lessonMetaSeparator}>•</Text>
                          <Text style={styles.lessonFreeBadge}>Free Preview</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Ionicons 
                  name={enrolled || lesson.is_free_preview ? "play-circle-outline" : "lock-closed-outline"} 
                  size={24} 
                  color={enrolled || lesson.is_free_preview ? "#3B82F6" : "#94A3B8"} 
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Course not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCourse}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const modules = course.learning_modules || [];
  const levelColors: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#3B82F6',
    advanced: '#8B5CF6',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Course Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          
          {course.is_featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Course Info */}
        <View style={styles.courseInfo}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={[styles.levelBadge, { backgroundColor: levelColors[course.level] || '#64748B' }]}>
              <Text style={styles.levelText}>{course.level}</Text>
            </View>
          </View>

          {course.description && (
            <Text style={styles.courseDescription}>{course.description}</Text>
          )}

          {course.long_description && (
            <Text style={styles.courseLongDescription}>{course.long_description}</Text>
          )}

          {/* Course Meta */}
          <View style={styles.courseMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{formatDuration(course.duration_minutes)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{modules.length} modules</Text>
            </View>
            {course.instructor_name && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <Text style={styles.metaText}>{course.instructor_name}</Text>
              </View>
            )}
          </View>

          {/* Learning Objectives */}
          {course.learning_objectives && course.learning_objectives.length > 0 && (
            <View style={styles.objectivesSection}>
              <Text style={styles.sectionTitle}>What you'll learn</Text>
              {course.learning_objectives.map((objective, index) => (
                <View key={index} style={styles.objectiveItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.objectiveText}>{objective}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Instructor Bio */}
          {course.instructor_bio && (
            <View style={styles.instructorSection}>
              <Text style={styles.sectionTitle}>About the instructor</Text>
              <Text style={styles.instructorBio}>{course.instructor_bio}</Text>
            </View>
          )}
        </View>

        {/* Modules and Lessons */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          {modules.length > 0 ? (
            <FlatList
              data={modules}
              renderItem={renderModule}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyModules}>
              <Text style={styles.emptyModulesText}>No modules available yet</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for CTA button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Enroll CTA */}
      <View style={styles.ctaContainer}>
        {enrolled ? (
          <View style={styles.enrolledBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.enrolledText}>Enrolled</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
            <Text style={styles.enrollButtonText}>
              {course.price_cents && course.price_cents > 0 
                ? `Enroll for ${formatPrice(course.price_cents)}`
                : 'Enroll for Free'
              }
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  courseInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 12,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  courseDescription: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 12,
  },
  courseLongDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  courseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#64748B',
  },
  objectivesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  instructorSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  instructorBio: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  modulesSection: {
    padding: 16,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleHeaderText: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  moduleLessonCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  lessonsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  lessonItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  lessonItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberFree: {
    backgroundColor: '#DBEAFE',
  },
  lessonNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  lessonItemText: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  lessonMetaSeparator: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  lessonFreeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyModules: {
    padding: 32,
    alignItems: 'center',
  },
  emptyModulesText: {
    fontSize: 14,
    color: '#64748B',
  },
  bottomSpacing: {
    height: 20,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...(Platform.OS === 'ios' && { paddingBottom: 34 }),
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
  },
  enrollButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 14,
    borderRadius: 10,
  },
  enrolledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
});

