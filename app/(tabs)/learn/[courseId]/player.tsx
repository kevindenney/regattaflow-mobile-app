/**
 * Lesson Player Screen
 * Displays and plays individual lessons (video, interactive, or text)
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LearningService, type LearningCourse, type LearningLesson } from '@/services/LearningService';
import { useAuth } from '@/providers/AuthProvider';
import { LessonPlayer } from '@/components/learn';

export default function LessonPlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [lesson, setLesson] = useState<LearningLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (courseId && lessonId && user?.id) {
      loadData();
    }
  }, [courseId, lessonId, user?.id]);

  const loadData = async () => {
    if (!courseId || !lessonId || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load course with modules and lessons
      const courseData = await LearningService.getCourse(courseId);
      if (!courseData) {
        setError('Course not found');
        return;
      }
      setCourse(courseData);

      // Find the lesson
      const foundLesson = courseData.learning_modules
        ?.flatMap((module) => module.learning_lessons || [])
        .find((l) => l.id === lessonId);

      console.log('[LessonPlayer] Found lesson:', foundLesson?.title, 'is_free_preview:', foundLesson?.is_free_preview);

      if (!foundLesson) {
        setError('Lesson not found');
        return;
      }
      setLesson(foundLesson);

      // Check enrollment and access
      const isEnrolled = await LearningService.isEnrolled(user.id, courseId);
      setEnrolled(isEnrolled);

      // Check if user can access (enrolled or free preview)
      const hasAccess = isEnrolled || foundLesson.is_free_preview;
      console.log('[LessonPlayer] Access check - isEnrolled:', isEnrolled, 'is_free_preview:', foundLesson.is_free_preview, 'hasAccess:', hasAccess);
      setCanAccess(hasAccess);

      if (!hasAccess) {
        setError('This lesson requires enrollment. Please enroll in the course first.');
      }
    } catch (err) {
      console.error('[LessonPlayer] Failed to load lesson:', err);
      setError('Unable to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!lessonId || !user?.id) return;

    try {
      await LearningService.markLessonComplete(user.id, lessonId);
      Alert.alert('Lesson Complete!', 'Great job completing this lesson.');
      // Navigate back to course detail page
      if (courseId) {
        router.push(`/(tabs)/learn/${courseId}`);
      } else {
        router.back();
      }
    } catch (err) {
      console.error('[LessonPlayer] Failed to mark complete:', err);
    }
  };

  const handleProgress = (percent: number) => {
    // TODO: Update lesson progress in real-time
    console.log('[LessonPlayer] Progress:', percent);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course || !lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (courseId) {
                router.push(`/(tabs)/learn/${courseId}`);
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Lesson not found'}</Text>
          {!canAccess && enrolled === false && (
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={() => router.push(`/(tabs)/learn/${courseId}`)}
            >
              <Text style={styles.enrollButtonText}>Enroll in Course</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (courseId) {
              router.push(`/(tabs)/learn/${courseId}`);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          {course && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {course.title}
            </Text>
          )}
        </View>
      </View>

      {/* Lesson Content */}
      {canAccess && lesson ? (
        <View style={styles.content}>
          <LessonPlayer
            lesson={lesson}
            onComplete={handleComplete}
            onProgress={handleProgress}
          />
        </View>
      ) : (
        <View style={styles.lockedState}>
          <Ionicons name="lock-closed" size={64} color="#94A3B8" />
          <Text style={styles.lockedTitle}>Lesson Locked</Text>
          <Text style={styles.lockedText}>
            {enrolled
              ? 'You need to enroll in this course to access this lesson.'
              : 'This lesson requires enrollment. Please enroll in the course first.'}
          </Text>
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => router.push(`/(tabs)/learn/${courseId}`)}
          >
            <Text style={styles.enrollButtonText}>Enroll in Course</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Actions */}
      {canAccess && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    flex: 1,
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
  lockedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  lockedText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  enrollButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...(Platform.OS === 'ios' && { paddingBottom: 34 }),
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

