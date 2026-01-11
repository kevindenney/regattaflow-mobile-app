/**
 * My Learning Dashboard
 *
 * Shows enrolled courses with progress tracking, continue learning,
 * and completion status.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { LearningService, type LearningCourse } from '@/services/LearningService';
import { LessonProgressService, type CourseProgressSummary } from '@/services/LessonProgressService';

interface EnrolledCourseWithProgress extends LearningCourse {
  progress: CourseProgressSummary | null;
  enrollment: {
    id: string;
    enrolled_at: string;
    progress_percent: number;
    started_at: string | null;
    completed_at: string | null;
    last_accessed_at: string | null;
  } | null;
}

export default function MyLearningScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'in_progress' | 'completed'>('in_progress');

  const loadEnrolledCourses = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Get enrolled courses with progress
      const enrolledCourses = await LearningService.getCoursesWithProgress(user.id);
      
      // Filter to only enrolled courses
      const enrolled = enrolledCourses.filter(c => c.is_enrolled);

      // Get detailed progress for each course
      const coursesWithProgress: EnrolledCourseWithProgress[] = await Promise.all(
        enrolled.map(async (course) => {
          const progress = await LessonProgressService.getCourseProgressSummary(
            user.id,
            course.id
          );
          return {
            ...course,
            progress,
          } as EnrolledCourseWithProgress;
        })
      );

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('[MyLearning] Failed to load courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  const handleContinueLearning = async (course: EnrolledCourseWithProgress) => {
    if (!user?.id) return;

    // Get next lesson
    const nextLesson = await LessonProgressService.getNextLesson(user.id, course.id);
    
    if (nextLesson) {
      router.push({
        pathname: '/(tabs)/learn/[courseId]/player',
        params: {
          courseId: course.id,
          lessonId: nextLesson.lessonId,
        },
      });
    } else {
      // No next lesson found, go to course page
      router.push({
        pathname: '/(tabs)/learn/[courseId]',
        params: { courseId: course.id },
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Filter courses based on active tab
  const inProgressCourses = courses.filter(
    c => (c.progress?.progress_percent || 0) > 0 && (c.progress?.progress_percent || 0) < 100
  );
  const completedCourses = courses.filter(c => (c.progress?.progress_percent || 0) === 100);
  const notStartedCourses = courses.filter(c => (c.progress?.progress_percent || 0) === 0);

  const displayedCourses = activeTab === 'in_progress' 
    ? [...inProgressCourses, ...notStartedCourses]
    : completedCourses;

  const renderCourseCard = (course: EnrolledCourseWithProgress) => {
    const progress = course.progress?.progress_percent || 0;
    const isCompleted = progress === 100;
    const isStarted = progress > 0;

    return (
      <TouchableOpacity
        key={course.id}
        style={styles.courseCard}
        onPress={() => handleContinueLearning(course)}
        activeOpacity={0.7}
      >
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <View style={styles.courseHeaderLeft}>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
            <Text style={styles.courseTitle}>{course.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </View>

        {/* Course Description */}
        <Text style={styles.courseDescription} numberOfLines={2}>
          {course.description}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%` },
                isCompleted && styles.progressBarCompleted,
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Course Meta */}
        <View style={styles.courseMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>
              {course.progress?.completed_lessons || 0}/{course.progress?.total_lessons || 0} lessons
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>{formatDuration(course.duration_minutes)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>
              {isStarted ? `Last: ${formatDate(course.progress?.last_accessed_at || null)}` : 'Not started'}
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isCompleted && styles.reviewButton]}
          onPress={() => handleContinueLearning(course)}
        >
          <Text style={[styles.continueButtonText, isCompleted && styles.reviewButtonText]}>
            {isCompleted ? 'Review Course' : isStarted ? 'Continue Learning' : 'Start Course'}
          </Text>
          <Ionicons
            name={isCompleted ? 'refresh' : 'play'}
            size={16}
            color={isCompleted ? '#3B82F6' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'My Learning', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'My Learning', headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view your enrolled courses and track your progress.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'My Learning', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Learning</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{courses.length}</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{inProgressCourses.length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCourses.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'in_progress' && styles.activeTab]}
          onPress={() => setActiveTab('in_progress')}
        >
          <Text style={[styles.tabText, activeTab === 'in_progress' && styles.activeTabText]}>
            In Progress ({inProgressCourses.length + notStartedCourses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedCourses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Course List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayedCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'completed' ? 'trophy-outline' : 'book-outline'}
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'completed' ? 'No Completed Courses' : 'No Courses Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'completed'
                ? 'Complete your courses to see them here!'
                : 'Browse our course catalog to start learning.'}
            </Text>
            {activeTab === 'in_progress' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/learn')}
              >
                <Text style={styles.browseButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayedCourses.map(renderCourseCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerRight: {
    width: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressBarCompleted: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 36,
    textAlign: 'right',
  },
  courseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  reviewButtonText: {
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
