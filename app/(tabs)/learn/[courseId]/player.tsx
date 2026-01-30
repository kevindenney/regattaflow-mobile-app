/**
 * Lesson Player Screen
 * Displays and plays individual lessons (video, interactive, or text)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LearningService, type LearningCourse, type LearningLesson } from '@/services/LearningService';
import { LessonProgressService } from '@/services/LessonProgressService';
import { useAuth } from '@/providers/AuthProvider';
import { LessonPlayer } from '@/components/learn';
import CourseCatalogService, { type Course as CatalogCourse } from '@/services/CourseCatalogService';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

export default function LessonPlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [lesson, setLesson] = useState<LearningLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [currentModule, setCurrentModule] = useState<{ id: string; title: string; orderIndex: number } | null>(null);
  const [lessonPosition, setLessonPosition] = useState<{ current: number; total: number } | null>(null);

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

      // Wrap ALL async operations in a single timeout to prevent indefinite hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );

      const loadAllData = async () => {
        // Load course with modules and lessons

        // First, try to load from JSON catalog (single source of truth)
        let catalogCourse: CatalogCourse | undefined;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
        
        if (isUUID) {
          catalogCourse = CourseCatalogService.getCourseById(courseId);
        } else {
          // Try by slug first (most common case from navigation)
          catalogCourse = CourseCatalogService.getCourseBySlug(courseId);
        }
        
        let courseData: LearningCourse | null = null;
        let courseExistsInDb = false; // Track if course exists in database (for access control)

        // If found in catalog, convert to LearningCourse format for compatibility
        if (catalogCourse) {
          // Try to get the database UUID by looking up the course by slug
          // This ensures we have the real UUID for enrollment operations
          let dbCourseId: string | null = null;
          try {
            const dbCourse = await Promise.race([
              LearningService.getCourseBySlug(catalogCourse.slug),
              new Promise<LearningCourse | null>((resolve) => 
                setTimeout(() => resolve(null), 5000)
              )
            ]) as LearningCourse | null;
            
            if (dbCourse && dbCourse.id) {
              dbCourseId = dbCourse.id; // Use the database UUID
              courseExistsInDb = true;
            } else {
              console.warn('[LessonPlayer] Course not found in database. Course needs to be seeded.');
              dbCourseId = null;
              courseExistsInDb = false;
            }
          } catch (err: any) {
            // Check if it's a 406 or other error indicating course doesn't exist
            const isNotFoundError = err?.code === 'PGRST116' || err?.status === 406 || err?.message?.includes('406');
            if (isNotFoundError) {
              console.warn('[LessonPlayer] Course not found in database (404/406). Course needs to be seeded.');
              dbCourseId = null;
              courseExistsInDb = false;
            } else {
              console.warn('[LessonPlayer] Error looking up course in database:', err);
              dbCourseId = null;
              courseExistsInDb = false;
            }
          }
          
          courseData = {
            id: dbCourseId || catalogCourse.id, // Use database UUID if available, otherwise catalog ID (for display only)
            slug: catalogCourse.slug,
            title: catalogCourse.title,
            description: catalogCourse.description,
            long_description: catalogCourse.longDescription || null,
            thumbnail_url: catalogCourse.thumbnailUrl || null,
            level: catalogCourse.level === 'level-1' ? 'beginner' : catalogCourse.level === 'level-2' ? 'intermediate' : 'advanced',
            duration_minutes: catalogCourse.duration.totalMinutes,
            price_cents: catalogCourse.price.cents,
            stripe_price_id: null,
            stripe_product_id: null,
            is_published: catalogCourse.status === 'available',
            is_featured: catalogCourse.slug === 'winning-starts-first-beats',
            order_index: 0,
            requires_subscription: false,
            min_subscription_tier: 'free',
            instructor_name: catalogCourse.instructor?.name || null,
            instructor_bio: catalogCourse.instructor?.bio || null,
            learning_objectives: catalogCourse.whatYouLearn || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            learning_modules: catalogCourse.modules?.map((mod) => ({
              id: mod.id,
              course_id: dbCourseId || catalogCourse.id, // Use database UUID for course_id reference
              title: mod.title,
              description: null,
              order_index: mod.orderIndex,
              duration_minutes: mod.durationMinutes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              learning_lessons: mod.lessons?.map((lesson) => ({
                id: lesson.id,
                module_id: mod.id,
                title: lesson.title,
                description: lesson.description || null,
                lesson_type: lesson.lessonType as 'video' | 'text' | 'interactive' | 'quiz',
                interactive_component: lesson.interactiveComponent || null,
                video_url: null,
                order_index: lesson.orderIndex,
                duration_seconds: lesson.durationSeconds,
                is_free_preview: lesson.isFreePreview || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })) || [],
            })) || [],
          };
        } else {
          // Fallback to Supabase (for backward compatibility)
          if (isUUID) {
            // It's a UUID - use getCourse
            courseData = await Promise.race([
              LearningService.getCourse(courseId),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 30000))
            ]) as LearningCourse | null;
          } else {
            // It's a slug - use getCourseBySlug
            courseData = await Promise.race([
              LearningService.getCourseBySlug(courseId),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 30000))
            ]) as LearningCourse | null;
          }
        }
        
        if (!courseData) {
          throw new Error('Course not found');
        }
        setCourse(courseData);

        // Find the lesson
        const foundLesson = courseData.learning_modules
          ?.flatMap((module) => module.learning_lessons || [])
          .find((l) => l.id === lessonId);

        if (!foundLesson) {
          throw new Error('Lesson not found');
        }
        setLesson(foundLesson);

        // Find current module and lesson position
        const module = courseData.learning_modules?.find(m => 
          m.learning_lessons?.some(l => l.id === lessonId)
        );
        if (module) {
          setCurrentModule({
            id: module.id,
            title: module.title,
            orderIndex: module.order_index || 0,
          });
          
          const moduleLessons = module.learning_lessons || [];
          const sortedLessons = [...moduleLessons].sort((a, b) => 
            (a.order_index || 0) - (b.order_index || 0)
          );
          const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
          if (currentIndex >= 0) {
            setLessonPosition({
              current: currentIndex + 1,
              total: sortedLessons.length,
            });
          }
        }

        // Check enrollment and access with individual timeouts
        // Use courseData.id (actual UUID) instead of courseId (might be slug)
        // But first validate it's a UUID, and if not, try to find the course in database
        let enrollmentCourseId = courseData.id;
        const isValidCourseIdUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enrollmentCourseId);
        
        if (!isValidCourseIdUUID) {
          console.warn('[LessonPlayer] Course ID is not a valid UUID, trying to find by slug...');
          // Try to find the course in database by slug
          const courseSlug = courseData.slug || courseId;
          try {
            const dbCourse = await Promise.race([
              LearningService.getCourseBySlug(courseSlug),
              new Promise<LearningCourse | null>((resolve) => 
                setTimeout(() => resolve(null), 5000)
              )
            ]) as LearningCourse | null;
            
            if (dbCourse?.id) {
              enrollmentCourseId = dbCourse.id;
            } else {
              console.warn('[LessonPlayer] Course not found in database, cannot check enrollment');
            }
          } catch (err) {
            console.warn('[LessonPlayer] Error looking up course:', err);
          }
        }
        
        const enrollmentPromise = Promise.race([
          LearningService.isEnrolled(user.id, enrollmentCourseId),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10000))
        ]);
        let isEnrolled = await enrollmentPromise;

        // Auto-enroll for Race Preparation Mastery course (accessed from checklist learning links)
        const isRacePrep = courseData.slug === 'race-preparation-mastery' ||
                           courseId === 'race-preparation-mastery' ||
                           catalogCourse?.slug === 'race-preparation-mastery';

        if (!isEnrolled && isRacePrep && enrollmentCourseId) {
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enrollmentCourseId);
          if (isValidUUID) {
            try {
              await LearningService.enrollInCourse(user.id, enrollmentCourseId);
              isEnrolled = true;
            } catch (enrollErr) {
              console.warn('[LessonPlayer] Auto-enrollment failed:', enrollErr);
              // Continue anyway - maybe they have Pro access
            }
          }
        }

        setEnrolled(isEnrolled);

        // Check subscription access
        const subscriptionPromise = Promise.race([
          LearningService.checkSubscriptionAccess(user.id),
          new Promise<{ hasProAccess: boolean }>((resolve) => 
            setTimeout(() => resolve({ hasProAccess: false }), 10000)
          )
        ]);
        const { hasProAccess } = await subscriptionPromise;

        // Check if this is a catalog-only course (not in database)
        // Race Preparation Mastery and similar courses from JSON catalog should be freely accessible
        const isCatalogOnlyCourse = !courseExistsInDb && catalogCourse !== undefined;
        const isRacePrepCourse = courseData.slug === 'race-preparation-mastery' ||
                                  courseId === 'race-preparation-mastery' ||
                                  catalogCourse?.slug === 'race-preparation-mastery';

        // Check if user can access (enrolled, has Pro subscription, free preview, or catalog-only course)
        // Catalog-only courses (like Race Preparation Mastery) are freely accessible since content comes from JSON
        const hasAccess = isEnrolled || hasProAccess || foundLesson.is_free_preview || isCatalogOnlyCourse || isRacePrepCourse;
        setCanAccess(hasAccess);

        if (!hasAccess) {
          throw new Error('This lesson requires enrollment. Please enroll in the course first.');
        }

        // Mark lesson as started - don't block on this
        LessonProgressService.markLessonStarted(user.id, lessonId).catch((err) => {
          console.warn('[LessonPlayer] Failed to mark lesson started:', err);
        });

        // Check completion status with timeout
        const progressPromise = Promise.race([
          LessonProgressService.getLessonProgress(user.id, lessonId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
        ]);
        const progress = await progressPromise;
        setIsCompleted(progress?.is_completed || false);
      };

      await Promise.race([loadAllData(), timeoutPromise]);
    } catch (err: any) {
      console.error('[LessonPlayer] Failed to load lesson:', err);
      setError(err?.message || 'Unable to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find the next lesson in the course
  const getNextLesson = useCallback(() => {
    if (!course || !lessonId) {
      return null;
    }
    
    const allLessons = course.learning_modules
      ?.flatMap((module) => module.learning_lessons || [])
      .sort((a, b) => {
        // Sort by module order, then lesson order
        const moduleA = course.learning_modules?.find(m => m.learning_lessons?.some(l => l.id === a.id));
        const moduleB = course.learning_modules?.find(m => m.learning_lessons?.some(l => l.id === b.id));
        if (moduleA?.order_index !== moduleB?.order_index) {
          return (moduleA?.order_index || 0) - (moduleB?.order_index || 0);
        }
        return (a.order_index || 0) - (b.order_index || 0);
      }) || [];

    const currentIndex = allLessons.findIndex(l => l.id === lessonId);

    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      return nextLesson;
    }

    return null;
  }, [course, lessonId]);

  const handleComplete = useCallback(async () => {
    if (!lessonId || !user?.id || marking) return;

    try {
      setMarking(true);

      // Try to save progress (may fail for catalog-only courses without DB records)
      let success = false;
      try {
        success = await LessonProgressService.markLessonCompleted(user.id, lessonId);
      } catch (err) {
        // For catalog-only courses, the lesson may not exist in DB - continue anyway
        console.warn('[LessonPlayer] Failed to mark complete (catalog-only?):', err);
        success = true; // Treat as success for UX
      }

      // Always show success for completed interactive lessons
      setIsCompleted(true);

      const nextLesson = getNextLesson();

      // On web, navigate directly to next lesson (Alert doesn't work well on web)
      if (Platform.OS === 'web') {
        if (nextLesson) {
          router.push(`/(tabs)/learn/${courseId}/player?lessonId=${nextLesson.id}`);
        } else {
          router.push(`/(tabs)/learn/${courseId}`);
        }
        return;
      }

      // On native, show alert with options
      const alertButtons: any[] = [];

      if (nextLesson) {
        alertButtons.push({
          text: 'Next Lesson →',
          onPress: () => {
            router.push(`/(tabs)/learn/${courseId}/player?lessonId=${nextLesson.id}`);
          },
        });
      }

      alertButtons.push({
        text: 'Back to Course',
        onPress: () => {
          if (courseId) {
            router.push(`/(tabs)/learn/${courseId}`);
          } else {
            router.back();
          }
        },
        style: nextLesson ? 'cancel' : 'default',
      });

      Alert.alert(
        '🎉 Lesson Complete!',
        nextLesson
          ? `Great job! Ready for "${nextLesson.title}"?`
          : 'Great job! You\'ve completed all lessons in this course!',
        alertButtons
      );
    } catch (err) {
      console.error('[LessonPlayer] Failed to mark complete:', err);
      // Still show success - the user completed the lesson even if we couldn't save
      setIsCompleted(true);
      Alert.alert(
        '🎉 Lesson Complete!',
        'Great job! (Progress may not be saved for this course)',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setMarking(false);
    }
  }, [lessonId, user?.id, courseId, marking, getNextLesson]);

  const handleProgress = useCallback(async (percent: number) => {
    // For interactive lessons, record interactions (fail silently for catalog-only courses)
    if (lesson?.lesson_type === 'interactive' && user?.id && lessonId) {
      try {
        await LessonProgressService.recordInteraction(user.id, lessonId, {
          progress_percent: percent,
        });
      } catch (err) {
        // Silently ignore - lesson may not exist in database (catalog-only course)
        console.warn('[LessonPlayer] Failed to record interaction:', err);
      }
    }
  }, [lesson?.lesson_type, user?.id, lessonId]);

  // Handle navigation to next lesson when interactive component completes
  const handleLessonComplete = useCallback(() => {
    const nextLesson = getNextLesson();

    if (nextLesson && nextLesson.id) {
      router.push(`/(tabs)/learn/${courseId}/player?lessonId=${nextLesson.id}`);
    } else {
      // No more lessons, go back to course
      router.push(`/(tabs)/learn/${courseId}`);
    }
  }, [courseId, getNextLesson, lessonId, course]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
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

      {/* Breadcrumb Navigation */}
      {course && currentModule && lessonPosition && (
        <View style={styles.breadcrumb}>
          <TouchableOpacity
            style={styles.breadcrumbItem}
            onPress={() => router.push(`/(tabs)/learn/${courseId}`)}
          >
            <Text style={styles.breadcrumbText}>{course.title}</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbItemText}>{currentModule.title}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbItemText}>
            Lesson {lessonPosition.current} of {lessonPosition.total}
          </Text>
        </View>
      )}

      {/* Lesson Content */}
      {canAccess && lesson ? (
        <View style={styles.content}>
          <LessonPlayer
            lesson={lesson}
            onComplete={handleLessonComplete}
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
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.completedBadgeText}>Lesson Completed</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.completeButton, marking && styles.completeButtonDisabled]} 
              onPress={handleComplete}
              disabled={marking}
            >
              {marking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Mark as Complete</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
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
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  breadcrumbItem: {
    paddingVertical: 2,
  },
  breadcrumbText: {
    fontSize: 12,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  breadcrumbItemText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
    backgroundColor: IOS_COLORS.systemBlue,
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
    backgroundColor: IOS_COLORS.systemBlue,
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
    ...(Platform.OS !== 'web' && { paddingBottom: FLOATING_TAB_BAR_HEIGHT + 16 }),
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
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 14,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
});

