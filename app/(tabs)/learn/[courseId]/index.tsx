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
import { Linking } from 'react-native';
import { LearningService, type LearningCourse, type LearningModule, type LearningLesson } from '@/services/LearningService';
import { LessonProgressService, type LessonProgress } from '@/services/LessonProgressService';
import { coursePaymentService } from '@/services/CoursePaymentService';
import CourseCatalogService, { type Course as CatalogCourse } from '@/services/CourseCatalogService';
import { useAuth } from '@/providers/AuthProvider';

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [courseProgress, setCourseProgress] = useState(0);
  const [hasProSubscription, setHasProSubscription] = useState(false);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string>('free');

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  // Check enrollment when user, courseId, or course data changes
  useEffect(() => {
    if (courseId && user?.id && course?.id) {
      console.log('[CourseDetail] Checking enrollment for user:', user.id, 'course:', course.id);
      checkEnrollment();
    }
  }, [courseId, user?.id, course?.id]);

  const loadCourse = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First, try to load from JSON catalog (single source of truth)
      let catalogCourse: CatalogCourse | undefined;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
      
      if (isUUID) {
        catalogCourse = CourseCatalogService.getCourseById(courseId);
      } else {
        // Try by slug first (most common case from navigation)
        catalogCourse = CourseCatalogService.getCourseBySlug(courseId);
      }
      
      // If found in catalog, convert to LearningCourse format for compatibility
      if (catalogCourse) {
        // Try to get the database UUID by looking up the course by slug
        // This ensures we have the real UUID for enrollment operations
        let dbCourseId: string | null = null;
        let courseExistsInDb = false;
        try {
          const dbCourse = await Promise.race([
            LearningService.getCourseBySlugForEnrollment(catalogCourse.slug),
            new Promise<LearningCourse | null>((resolve) => 
              setTimeout(() => resolve(null), 10000)
            )
          ]) as LearningCourse | null;
          
          if (dbCourse && dbCourse.id) {
            dbCourseId = dbCourse.id; // Use the database UUID
            courseExistsInDb = true;
            console.log('[CourseDetail] Found course in database with UUID:', dbCourseId);
          } else {
            console.warn('[CourseDetail] Course not found in database. Course needs to be seeded.');
            // Course doesn't exist in database yet - we'll use null to indicate this
            // and skip enrollment operations
            dbCourseId = null;
            courseExistsInDb = false;
          }
        } catch (err: any) {
          // Check if it's a 406 or other error indicating course doesn't exist
          const isNotFoundError = err?.code === 'PGRST116' || err?.status === 406 || err?.message?.includes('406');
          if (isNotFoundError) {
            console.warn('[CourseDetail] Course not found in database (404/406). Course needs to be seeded.');
            dbCourseId = null;
            courseExistsInDb = false;
          } else {
            console.warn('[CourseDetail] Error looking up course in database:', err);
            // For other errors, we'll still try to proceed but mark as not in DB
            dbCourseId = null;
            courseExistsInDb = false;
          }
        }
        
        const convertedCourse: LearningCourse = {
          id: dbCourseId || catalogCourse.id, // Use database UUID if available, otherwise catalog ID (for display only)
          // Store metadata about whether course exists in DB
          ...(courseExistsInDb ? {} : { _catalogOnly: true } as any),
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
        
        setCourse(convertedCourse);
        setLoading(false);
        return;
      }
      
      // Fallback to Supabase (for backward compatibility)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 45000)
      );
      
      let courseData: LearningCourse | null = null;
      
      if (isUUID) {
        // It's a UUID - use getCourse
        courseData = await Promise.race([
          LearningService.getCourse(courseId),
          timeoutPromise,
        ]) as LearningCourse | null;
      } else {
        // It's a slug - use getCourseBySlug
        courseData = await Promise.race([
          LearningService.getCourseBySlug(courseId),
          timeoutPromise,
        ]) as LearningCourse | null;
      }
      
      setCourse(courseData);
    } catch (err: any) {
      console.error('[CourseDetail] Failed to load course:', err);
      const errorMessage = err?.message?.includes('timeout') 
        ? 'Request timed out. Please check your connection.'
        : 'Unable to load course. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!courseId || !user?.id) {
      console.log('[CourseDetail] Cannot check enrollment - missing courseId or user');
      return;
    }
    
    // Wait for course to load so we have the actual UUID
    if (!course?.id) {
      console.log('[CourseDetail] Course not loaded yet, waiting...');
      return;
    }
    
    // Use course.id (UUID) instead of courseId (might be slug)
    let actualCourseId = course.id;
    
    // Check if course is catalog-only (not in database)
    // Even if marked as catalog-only, the course might exist in DB (previous lookup may have timed out)
    // So we should try to find it by slug and check enrollment
    if ((course as any)._catalogOnly) {
      console.log('[CourseDetail] Course marked as catalog-only, but checking database by slug for enrollment...');
      
        // Try to find the course in database by slug (maybe previous lookup timed out)
        const courseSlug = course.slug || courseId;
        try {
          const dbCourse = await Promise.race([
            LearningService.getCourseBySlugForEnrollment(courseSlug),
            new Promise<LearningCourse | null>((resolve) => 
              setTimeout(() => resolve(null), 10000)
            )
          ]) as LearningCourse | null;
        
        if (dbCourse?.id) {
          console.log('[CourseDetail] Found course in database with UUID:', dbCourse.id);
          actualCourseId = dbCourse.id;
          // Update course state to remove catalog-only flag
          setCourse({ ...course, id: dbCourse.id, _catalogOnly: false } as any);
        } else {
          // Course not found, but check if user is enrolled by slug (enrollment might exist even if course lookup fails)
          console.log('[CourseDetail] Course not found in database, checking enrollment by slug...');
          const isEnrolledBySlug = await Promise.race([
            LearningService.isEnrolledBySlug(user.id, courseSlug),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
          ]);
          
          if (isEnrolledBySlug) {
            console.log('[CourseDetail] User is enrolled (found by slug), but course not in database');
            setEnrolled(true);
            // Still try to load subscription status
            try {
              const { hasProAccess, tier } = await LearningService.checkSubscriptionAccess(user.id);
              setHasProSubscription(hasProAccess);
              setUserSubscriptionTier(tier);
            } catch (err) {
              console.warn('[CourseDetail] Failed to check subscription:', err);
            }
            return;
          } else {
            console.log('[CourseDetail] Course truly not in database and user not enrolled');
            setEnrolled(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[CourseDetail] Error looking up course in database:', err);
        setEnrolled(false);
        return;
      }
    }
    
    // Validate that we have a UUID (not a catalog string ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualCourseId);
    if (!isUUID) {
      console.warn('[CourseDetail] Course ID is not a valid UUID, trying to find by slug...');
      
      // Last resort: try to find course by slug
      const courseSlug = course.slug || courseId;
      try {
        const dbCourse = await Promise.race([
          LearningService.getCourseBySlug(courseSlug),
          new Promise<LearningCourse | null>((resolve) => 
            setTimeout(() => resolve(null), 5000)
          )
        ]) as LearningCourse | null;
        
        if (dbCourse?.id) {
          console.log('[CourseDetail] Found course in database with UUID:', dbCourse.id);
          actualCourseId = dbCourse.id;
        } else {
          console.warn('[CourseDetail] Course ID is not a valid UUID and course not found in database');
          setEnrolled(false);
          return;
        }
      } catch (err) {
        console.warn('[CourseDetail] Error looking up course:', err);
        setEnrolled(false);
        return;
      }
    }
    
    try {
      console.log('[CourseDetail] Checking enrollment with course ID:', actualCourseId);
      
      // Run both queries in PARALLEL with 30-second timeout (was 10s, too short for slow connections)
      const QUERY_TIMEOUT = 30000;
      
      const subscriptionPromise = Promise.race([
        LearningService.checkSubscriptionAccess(user.id),
        new Promise<{ hasProAccess: boolean; tier: string; timedOut?: boolean }>((resolve) => 
          setTimeout(() => {
            console.warn('[CourseDetail] Subscription check timed out after 30s');
            resolve({ hasProAccess: false, tier: 'free', timedOut: true });
          }, QUERY_TIMEOUT)
        )
      ]);
      
      const enrollmentPromise = Promise.race([
        LearningService.isEnrolled(user.id, actualCourseId).then(result => ({ isEnrolled: result, timedOut: false })),
        new Promise<{ isEnrolled: boolean; timedOut: boolean }>((resolve) => 
          setTimeout(() => {
            console.warn('[CourseDetail] Enrollment check timed out after 30s');
            resolve({ isEnrolled: false, timedOut: true });
          }, QUERY_TIMEOUT)
        )
      ]);
      
      // Wait for BOTH queries in parallel
      const [subscriptionResult, enrollmentResult] = await Promise.all([
        subscriptionPromise,
        enrollmentPromise
      ]);
      
      const { hasProAccess, tier } = subscriptionResult;
      setHasProSubscription(hasProAccess);
      setUserSubscriptionTier(tier);
      console.log('[CourseDetail] Subscription status - tier:', tier, 'hasProAccess:', hasProAccess, 
        'timedOut' in subscriptionResult ? `(timedOut: ${subscriptionResult.timedOut})` : '');
      
      const { isEnrolled, timedOut } = enrollmentResult;
      console.log('[CourseDetail] Enrollment status:', isEnrolled, timedOut ? '(TIMED OUT - may have access)' : '');
      setEnrolled(isEnrolled);
      
      // If enrolled or has Pro access, load progress (non-blocking)
      if (isEnrolled || hasProAccess) {
        loadLessonProgress().catch((err) => {
          console.warn('[CourseDetail] Failed to load progress:', err);
        });
      }
    } catch (err) {
      console.error('[CourseDetail] Failed to check enrollment:', err);
    }
  };

  const loadLessonProgress = async () => {
    if (!courseId || !user?.id || !course?.id) return;
    
    // Use course.id (UUID) instead of courseId (might be slug)
    const actualCourseId = course.id;
    
    // Validate that we have a UUID (not a catalog string ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualCourseId);
    if (!isUUID) {
      console.warn('[CourseDetail] Course ID is not a valid UUID, skipping progress load');
      return;
    }
    
    try {
      // Get course progress summary
      const summary = await LessonProgressService.getCourseProgressSummary(user.id, actualCourseId);
      if (summary) {
        setCourseProgress(summary.progress_percent);
      }
      
      // Get individual lesson progress
      const progress = await LessonProgressService.getCourseProgress(user.id, actualCourseId);
      const progressMap = new Map<string, LessonProgress>();
      progress.forEach(p => {
        progressMap.set(p.lesson_id, p);
      });
      setLessonProgress(progressMap);
    } catch (err) {
      console.error('[CourseDetail] Failed to load lesson progress:', err);
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

  const [purchasing, setPurchasing] = useState(false);

  const handleEnroll = async () => {
    console.log('[CourseDetail] handleEnroll called', { courseId, course: course?.id, userId: user?.id, hasProSubscription });

    // Check if user is authenticated - redirect to sign-in if not
    if (!user?.id) {
      console.log('[CourseDetail] User not authenticated - redirecting to sign-in');
      if (Platform.OS === 'web') {
        // On web, navigate to login page
        router.push('/login');
      } else {
        // On native, show alert then navigate
        Alert.alert(
          'Sign In Required',
          'Please sign in to enroll in this course.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/login') }
          ]
        );
      }
      return;
    }

    if (!courseId || !course?.id) {
      console.log('[CourseDetail] Missing courseId or course.id');
      Alert.alert('Error', 'Course information is missing. Please try refreshing the page.');
      return;
    }
    
    // Use course.id (UUID) instead of courseId (might be slug)
    let actualCourseId = course.id;
    
    // Check if course is catalog-only (not in database)
    // Even if marked as catalog-only, try to find it in database (maybe previous lookup timed out)
    if ((course as any)._catalogOnly) {
      console.log('[CourseDetail] Course marked as catalog-only, but trying to find in database for enrollment...');
      
          // Try to find the course in database by slug (maybe previous lookup timed out)
          const courseSlug = course.slug || courseId;
          try {
            const dbCourse = await Promise.race([
              LearningService.getCourseBySlugForEnrollment(courseSlug),
              new Promise<LearningCourse | null>((resolve) => 
                setTimeout(() => resolve(null), 10000)
              )
            ]) as LearningCourse | null;
        
        if (dbCourse?.id) {
          console.log('[CourseDetail] Found course in database with UUID:', dbCourse.id);
          actualCourseId = dbCourse.id;
          // Update course state to remove catalog-only flag
          setCourse({ ...course, id: dbCourse.id, _catalogOnly: false } as any);
        } else {
          // Course not found, but check if user is already enrolled (enrollment might exist even if course lookup fails)
          console.log('[CourseDetail] Course not found in database, checking if user is already enrolled by slug...');
          const isAlreadyEnrolled = await Promise.race([
            LearningService.isEnrolledBySlug(user.id, courseSlug),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
          ]);
          
          if (isAlreadyEnrolled) {
            console.log('[CourseDetail] User is already enrolled (found by slug), updating enrollment status');
            setEnrolled(true);
            await loadLessonProgress();
            Alert.alert('Success', 'You are already enrolled in this course!');
            return;
          } else {
            console.error('[CourseDetail] Course truly not in database and user not enrolled, cannot enroll');
            Alert.alert(
              'Course Not Available', 
              'This course has not been set up in the database yet. Please contact support or try again later.'
            );
            return;
          }
        }
      } catch (err) {
        console.error('[CourseDetail] Error looking up course in database:', err);
        Alert.alert(
          'Error', 
          'Unable to verify course. Please try again later.'
        );
        return;
      }
    }
    
    // Validate that we have a UUID (not a catalog string ID)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualCourseId);
    if (!isValidUUID) {
      console.error('[CourseDetail] Course ID is not a valid UUID, trying to find by slug...');
      
      // Last resort: try to find course by slug
      const courseSlug = course.slug || courseId;
      try {
        const dbCourse = await Promise.race([
          LearningService.getCourseBySlug(courseSlug),
          new Promise<LearningCourse | null>((resolve) => 
            setTimeout(() => resolve(null), 10000)
          )
        ]) as LearningCourse | null;
        
        if (dbCourse?.id) {
          console.log('[CourseDetail] Found course in database with UUID:', dbCourse.id);
          actualCourseId = dbCourse.id;
        } else {
          console.error('[CourseDetail] Course ID is not a valid UUID and course not found in database');
          Alert.alert(
            'Course Not Available', 
            'This course has not been set up in the database yet. Please contact support or try again later.'
          );
          return;
        }
      } catch (err) {
        console.error('[CourseDetail] Error looking up course:', err);
        Alert.alert(
          'Error', 
          'Unable to verify course. Please try again later.'
        );
        return;
      }
    }
    
    try {
      setPurchasing(true);
      
      // Pro subscribers get free access
      if (hasProSubscription) {
        console.log('[CourseDetail] Pro subscriber - enrolling for free');
        const success = await LearningService.enrollProSubscriber(user.id, actualCourseId);
        if (success) {
          setEnrolled(true);
          await loadLessonProgress();
          Alert.alert('Success!', 'You now have access to this course with your Pro subscription.');
        } else {
          Alert.alert('Error', 'Failed to enroll. Please try again.');
        }
        return;
      }
      
      console.log('[CourseDetail] Starting purchase flow', { price_cents: course?.price_cents });
      
      // Check if course requires payment
      if (course?.price_cents && course.price_cents > 0) {
        console.log('[CourseDetail] Initiating Stripe checkout...');
        // Initiate Stripe checkout
        const result = await coursePaymentService.purchaseCourse(
          user.id,
          actualCourseId
        );
        console.log('[CourseDetail] Purchase result:', result);

        if (result.error) {
          Alert.alert('Error', result.error);
          return;
        }

        if (result.free) {
          // Free course enrollment succeeded
          setEnrolled(true);
          Alert.alert('Success', 'You are now enrolled in this course!');
          return;
        }

        if (result.url) {
          // Redirect to Stripe checkout
          if (Platform.OS === 'web') {
            window.location.href = result.url;
          } else {
            // On native, open in browser
            const supported = await Linking.canOpenURL(result.url);
            if (supported) {
              await Linking.openURL(result.url);
            } else {
              Alert.alert('Error', 'Unable to open checkout page');
            }
          }
        }
      } else {
        // Free course - enroll directly using the actual UUID
        console.log('[CourseDetail] Enrolling in free course with ID:', actualCourseId);
        await LearningService.enrollInCourse(user.id, actualCourseId);
        setEnrolled(true);
        await loadLessonProgress();
        Alert.alert('Success', 'You are now enrolled in this free course!');
      }
    } catch (err) {
      console.error('[CourseDetail] Failed to enroll:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to process enrollment. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // Check for purchase success from URL params (after Stripe redirect)
  useEffect(() => {
    const checkPurchaseSuccess = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const purchaseStatus = urlParams.get('purchase');
        
        if (sessionId && courseId) {
          const verified = await coursePaymentService.verifyPurchase(sessionId, courseId);
          if (verified) {
            setEnrolled(true);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            Alert.alert('Success', 'Your purchase is complete! You now have access to this course.');
          }
        } else if (purchaseStatus === 'cancelled') {
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };
    
    checkPurchaseSuccess();
  }, [courseId]);

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
            {lessons.map((lesson, index) => {
              const progress = lessonProgress.get(lesson.id);
              const isLessonCompleted = progress?.is_completed || false;
              
              return (
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
                      isLessonCompleted && styles.lessonNumberCompleted,
                    ]}>
                      {isLessonCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Text style={[
                          styles.lessonNumberText,
                          isLessonCompleted && styles.lessonNumberTextCompleted,
                        ]}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <View style={styles.lessonItemText}>
                      <Text style={[
                        styles.lessonTitle,
                        isLessonCompleted && styles.lessonTitleCompleted,
                      ]}>
                        {lesson.title}
                      </Text>
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
                        {isLessonCompleted && (
                          <>
                            <Text style={styles.lessonMetaSeparator}>•</Text>
                            <Text style={styles.lessonCompletedBadge}>Completed</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <Ionicons 
                    name={isLessonCompleted ? "checkmark-circle" : (enrolled || lesson.is_free_preview ? "play-circle-outline" : "lock-closed-outline")} 
                    size={24} 
                    color={isLessonCompleted ? "#10B981" : (enrolled || lesson.is_free_preview ? "#3B82F6" : "#94A3B8")} 
                  />
                </TouchableOpacity>
              );
            })}
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
          <View style={styles.enrolledContainer}>
            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.enrolledText}>Enrolled</Text>
              {courseProgress > 0 && (
                <Text style={styles.progressBadge}>{courseProgress}% complete</Text>
              )}
            </View>
            {courseProgress > 0 && courseProgress < 100 && (
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressBarFill, { width: `${courseProgress}%` }]} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.ctaButtonContainer}>
            {/* Show Pro badge if user has Pro subscription */}
            {hasProSubscription && course.price_cents && course.price_cents > 0 && (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={14} color="#8B5CF6" />
                <Text style={styles.proBadgeText}>Included with your Pro subscription</Text>
              </View>
            )}
            <TouchableOpacity 
              style={[
                styles.enrollButton, 
                purchasing && styles.enrollButtonDisabled,
                hasProSubscription && styles.enrollButtonPro,
              ]} 
              onPress={handleEnroll}
              disabled={purchasing}
              accessibilityRole="button"
              accessibilityLabel={hasProSubscription 
                ? 'Start Course - Included with Pro'
                : course.price_cents && course.price_cents > 0 
                  ? `Enroll for ${formatPrice(course.price_cents)}`
                  : 'Enroll for Free'
              }
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.enrollButtonText}>
                    {hasProSubscription
                      ? 'Start Course'
                      : course.price_cents && course.price_cents > 0 
                        ? `Enroll for ${formatPrice(course.price_cents)}`
                        : 'Enroll for Free'
                    }
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
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
    paddingBottom: 120,
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
  lessonCompletedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  lessonNumberCompleted: {
    backgroundColor: '#10B981',
  },
  lessonNumberTextCompleted: {
    color: '#FFFFFF',
  },
  lessonTitleCompleted: {
    color: '#64748B',
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
    bottom: Platform.OS === 'web' ? 70 : 0, // Account for tab bar on web
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    zIndex: 100,
    ...(Platform.OS === 'ios' && { paddingBottom: 34 }),
    ...(Platform.OS === 'web' && { 
      boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
    }),
  },
  ctaButtonContainer: {
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  proBadgeText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
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
  enrollButtonPro: {
    backgroundColor: '#8B5CF6',
  },
  enrollButtonDisabled: {
    opacity: 0.7,
  },
  enrollButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enrolledContainer: {
    flex: 1,
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
  progressBadge: {
    fontSize: 12,
    color: '#047857',
    marginLeft: 4,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#A7F3D0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
});

