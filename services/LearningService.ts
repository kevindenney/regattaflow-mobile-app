/**
 * Learning Service
 *
 * Handles all learning platform operations:
 * - Course catalog
 * - Enrollments
 * - Progress tracking
 * - Access control
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('LearningService');

// ============================================
// TYPES
// ============================================

export interface LearningCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  long_description: string | null;
  thumbnail_url: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  price_cents: number | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  order_index: number;
  requires_subscription: boolean;
  min_subscription_tier: string;
  instructor_name: string | null;
  instructor_bio: string | null;
  learning_objectives: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  learning_modules?: LearningModule[];
}

export interface LearningModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  learning_lessons?: LearningLesson[];
}

export interface LearningLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  lesson_type: 'video' | 'interactive' | 'text' | 'quiz';
  video_url: string | null;
  video_thumbnail_url: string | null;
  duration_seconds: number;
  interactive_component: string | null;
  interactive_config: Record<string, unknown>;
  content_markdown: string | null;
  order_index: number;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  stripe_payment_id: string | null;
  stripe_checkout_session_id: string | null;
  amount_paid_cents: number | null;
  access_type: 'purchase' | 'subscription' | 'gift' | 'promo';
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percent: number;
  last_accessed_at: string | null;
  certificate_issued_at: string | null;
  certificate_url: string | null;
}

export interface LearningLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  watch_time_seconds: number;
  last_position_seconds: number;
  interactions_count: number;
  interaction_data: Record<string, unknown>;
  quiz_score: number | null;
  quiz_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface CourseWithProgress extends LearningCourse {
  enrollment?: LearningEnrollment | null;
  progress_percent?: number;
  is_enrolled?: boolean;
  can_access?: boolean;
}

export interface LessonWithProgress extends LearningLesson {
  progress?: LearningLessonProgress | null;
}

export interface CourseFilters {
  level?: 'beginner' | 'intermediate' | 'advanced';
  isFeatured?: boolean;
  searchQuery?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

export class LearningService {
  // ==========================================
  // COURSES
  // ==========================================

  /**
   * Get all published courses
   */
  static async getCourses(filters?: CourseFilters): Promise<LearningCourse[]> {
    try {
      logger.debug('getCourses: Starting query...');
      
      // Start with basic query to avoid nested query timeout issues
      // Note: Diagnostic shows query works in ~600ms, so timeout might be network/browser issue
      let basicQuery = supabase
        .from('learning_courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (filters?.level) {
        basicQuery = basicQuery.eq('level', filters.level);
      }

      if (filters?.isFeatured) {
        basicQuery = basicQuery.eq('is_featured', true);
      }

      if (filters?.searchQuery) {
        basicQuery = basicQuery.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Add timeout using Promise.race with better error handling
      logger.debug('getCourses: Executing query with 15s timeout...');
      const startTime = Date.now();
      
      const queryPromise = basicQuery.then(result => {
        const duration = Date.now() - startTime;
        logger.debug(`getCourses: Query completed in ${duration}ms`);
        return result;
      }).catch(err => {
        const duration = Date.now() - startTime;
        logger.error(`getCourses: Query failed after ${duration}ms:`, err);
        throw err;
      });
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          const duration = Date.now() - startTime;
          logger.error(`getCourses: Query timed out after ${duration}ms`);
          reject(new Error(`Supabase query timeout after 25 seconds`));
        }, 25000)
      );
      
      const result = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]);
      
      const { data: coursesData, error: coursesError } = result as { data: any; error: any };
      
      logger.debug('getCourses: Query completed', { 
        dataCount: coursesData?.length, 
        error: coursesError?.message 
      });

      if (coursesError) {
        logger.error('Error fetching courses:', coursesError);
        throw coursesError;
      }

      if (!coursesData || coursesData.length === 0) {
        return [];
      }

      // Try to fetch modules separately (more reliable than nested query)
      try {
        if (coursesData.length === 0) {
          logger.debug('getCourses: No courses found, skipping modules fetch');
          return [];
        }

        logger.debug('getCourses: Fetching modules for', coursesData.length, 'courses');
        const courseIds = coursesData.map(c => c.id);
        
        const modulesQueryPromise = supabase
          .from('learning_modules')
          .select('id, course_id, title, order_index')
          .in('course_id', courseIds)
          .order('order_index', { ascending: true });
        
        const modulesTimeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error('Modules query timeout after 10 seconds')), 10000)
        );
        
        const { data: modulesData, error: modulesError } = await Promise.race([
          modulesQueryPromise,
          modulesTimeoutPromise,
        ]) as { data: any; error: any };

        if (modulesError) {
          logger.warn('Error fetching modules (non-critical):', modulesError);
          // Continue without modules
        }

        // Group modules by course_id
        const modulesByCourse = new Map<string, LearningModule[]>();
        if (modulesData) {
          modulesData.forEach((module: any) => {
            if (!modulesByCourse.has(module.course_id)) {
              modulesByCourse.set(module.course_id, []);
            }
            modulesByCourse.get(module.course_id)!.push(module);
          });
        }

        // Combine courses with their modules
        return coursesData.map((course: any) => ({
          ...course,
          learning_modules: modulesByCourse.get(course.id) || [],
        }));
      } catch (modulesErr) {
        logger.warn('Failed to fetch modules, returning courses without modules:', modulesErr);
        // Return courses without modules
        return coursesData.map((course: any) => ({
          ...course,
          learning_modules: [],
        }));
      }
    } catch (error) {
      logger.error('getCourses error:', error);
      throw error;
    }
  }

  /**
   * Get a single course by ID with modules and lessons
   */
  static async getCourse(courseId: string): Promise<LearningCourse | null> {
    try {
      logger.debug('getCourse: Starting fetch for course:', courseId);
      
      // Fetch course first (simple query, no nesting)
      const coursePromise = supabase
        .from('learning_courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      const courseTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Course query timed out after 20 seconds')), 20000)
      );

      const { data: courseData, error: courseError } = await Promise.race([
        coursePromise,
        courseTimeoutPromise,
      ]);

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          logger.debug('getCourse: Course not found');
          return null;
        }
        logger.error('Error fetching course:', courseError);
        throw courseError;
      }

      if (!courseData) {
        logger.debug('getCourse: No course data returned');
        return null;
      }

      logger.debug('getCourse: Course fetched, now fetching modules...');

      // Fetch modules separately
      const modulesPromise = supabase
        .from('learning_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      const modulesTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Modules query timed out after 15 seconds')), 15000)
      );

      const { data: modulesData, error: modulesError } = await Promise.race([
        modulesPromise,
        modulesTimeoutPromise,
      ]);

      if (modulesError) {
        logger.warn('Error fetching modules (non-critical):', modulesError.message);
        // Return course without modules if modules fail
        return { ...courseData, learning_modules: [] } as LearningCourse;
      }

      logger.debug('getCourse: Modules fetched, now fetching lessons...', modulesData?.length || 0);

      // Fetch lessons separately for all modules
      const moduleIds = (modulesData || []).map(m => m.id);
      if (moduleIds.length === 0) {
        logger.debug('getCourse: No modules, returning course without lessons');
        return {
          ...courseData,
          learning_modules: [],
        } as LearningCourse;
      }

      const lessonsPromise = supabase
        .from('learning_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true });

      const lessonsTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Lessons query timed out after 15 seconds')), 15000)
      );

      const { data: lessonsData, error: lessonsError } = await Promise.race([
        lessonsPromise,
        lessonsTimeoutPromise,
      ]);

      if (lessonsError) {
        logger.warn('Error fetching lessons (non-critical):', lessonsError.message);
        // Return course with modules but no lessons
        return {
          ...courseData,
          learning_modules: (modulesData || []).map(m => ({ ...m, learning_lessons: [] })),
        } as LearningCourse;
      }

      // Combine modules and lessons
      const lessonsByModule = new Map<string, LearningLesson[]>();
      (lessonsData || []).forEach((lesson: any) => {
        if (!lessonsByModule.has(lesson.module_id)) {
          lessonsByModule.set(lesson.module_id, []);
        }
        lessonsByModule.get(lesson.module_id)!.push(lesson);
      });

      const modulesWithLessons = (modulesData || []).map((module: any) => ({
        ...module,
        learning_lessons: lessonsByModule.get(module.id) || [],
      }));

      logger.debug('getCourse: Successfully fetched course with', modulesWithLessons.length, 'modules');

      return {
        ...courseData,
        learning_modules: modulesWithLessons,
      } as LearningCourse;
    } catch (error: any) {
      logger.error('getCourse error:', error.message);
      throw error;
    }
  }

  /**
   * Get a course by slug
   */
  static async getCourseBySlug(slug: string): Promise<LearningCourse | null> {
    try {
      const { data, error } = await supabase
        .from('learning_courses')
        .select(`
          *,
          learning_modules (
            *,
            learning_lessons (
              *
            )
          )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Error fetching course by slug:', error);
        throw error;
      }

      // Sort modules and lessons
      if (data?.learning_modules) {
        data.learning_modules.sort((a: LearningModule, b: LearningModule) => a.order_index - b.order_index);
        data.learning_modules.forEach((m: LearningModule) => {
          if (m.learning_lessons) {
            m.learning_lessons.sort((a: LearningLesson, b: LearningLesson) => a.order_index - b.order_index);
          }
        });
      }

      return data;
    } catch (error) {
      logger.error('getCourseBySlug error:', error);
      throw error;
    }
  }

  /**
   * Get courses with user's enrollment and progress info
   */
  static async getCoursesWithProgress(userId: string): Promise<CourseWithProgress[]> {
    try {
      // Get all published courses
      const courses = await this.getCourses();

      // Get user's enrollments
      const { data: enrollments } = await supabase
        .from('learning_enrollments')
        .select('*')
        .eq('user_id', userId);

      // Get user's subscription tier
      const { data: user } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const userTier = user?.subscription_tier || 'free';
      const hasProAccess = ['sailor_pro', 'championship', 'professional'].includes(userTier);

      // Combine data
      return courses.map(course => {
        const enrollment = enrollments?.find(e => e.course_id === course.id) || null;
        const isEnrolled = !!enrollment;
        const canAccess = hasProAccess || isEnrolled || course.min_subscription_tier === 'free';

        return {
          ...course,
          enrollment,
          progress_percent: enrollment?.progress_percent || 0,
          is_enrolled: isEnrolled,
          can_access: canAccess,
        };
      });
    } catch (error) {
      logger.error('getCoursesWithProgress error:', error);
      throw error;
    }
  }

  // ==========================================
  // ENROLLMENTS
  // ==========================================

  /**
   * Enroll a user in a course
   */
  static async enrollInCourse(
    userId: string,
    courseId: string,
    options?: {
      stripePaymentId?: string;
      stripeCheckoutSessionId?: string;
      amountPaidCents?: number;
      accessType?: 'purchase' | 'subscription' | 'gift' | 'promo';
    }
  ): Promise<LearningEnrollment> {
    try {
      const { data, error } = await supabase
        .from('learning_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          stripe_payment_id: options?.stripePaymentId,
          stripe_checkout_session_id: options?.stripeCheckoutSessionId,
          amount_paid_cents: options?.amountPaidCents,
          access_type: options?.accessType || 'purchase',
          enrolled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error enrolling in course:', error);
        throw error;
      }

      logger.info(`User ${userId} enrolled in course ${courseId}`);
      return data;
    } catch (error) {
      logger.error('enrollInCourse error:', error);
      throw error;
    }
  }

  /**
   * Get a user's enrollments
   */
  static async getEnrollments(userId: string): Promise<LearningEnrollment[]> {
    try {
      const { data, error } = await supabase
        .from('learning_enrollments')
        .select('*')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        logger.error('Error fetching enrollments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('getEnrollments error:', error);
      throw error;
    }
  }

  /**
   * Check if a user is enrolled in a course
   */
  static async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('learning_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking enrollment:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('isEnrolled error:', error);
      return false;
    }
  }

  /**
   * Pro subscription tiers that get all courses included
   */
  static readonly PRO_TIERS = ['sailor_pro', 'championship', 'professional'];

  /**
   * Check user's subscription tier and if they have Pro access
   */
  static async checkSubscriptionAccess(userId: string): Promise<{
    tier: string;
    hasProAccess: boolean;
    subscriptionStatus: string;
  }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { tier: 'free', hasProAccess: false, subscriptionStatus: 'inactive' };
      }

      const tier = user.subscription_tier || 'free';
      const status = user.subscription_status || 'inactive';
      const hasProAccess = this.PRO_TIERS.includes(tier) && status === 'active';

      return {
        tier,
        hasProAccess,
        subscriptionStatus: status,
      };
    } catch (error) {
      logger.error('checkSubscriptionAccess error:', error);
      return { tier: 'free', hasProAccess: false, subscriptionStatus: 'inactive' };
    }
  }

  /**
   * Check if a user can access a course (enrolled OR has subscription)
   */
  static async canAccessCourse(userId: string, courseId: string): Promise<boolean> {
    try {
      // Check subscription access
      const { hasProAccess } = await this.checkSubscriptionAccess(userId);

      // Pro+ subscribers can access all courses
      if (hasProAccess) {
        return true;
      }

      // Check individual enrollment
      return this.isEnrolled(userId, courseId);
    } catch (error) {
      logger.error('canAccessCourse error:', error);
      return false;
    }
  }

  /**
   * Enroll a Pro subscriber in a course for free
   */
  static async enrollProSubscriber(userId: string, courseId: string): Promise<boolean> {
    try {
      const { hasProAccess } = await this.checkSubscriptionAccess(userId);
      
      if (!hasProAccess) {
        logger.error('User does not have Pro subscription');
        return false;
      }

      // Check if already enrolled
      const isAlreadyEnrolled = await this.isEnrolled(userId, courseId);
      if (isAlreadyEnrolled) {
        return true;
      }

      // Create enrollment with subscription access type
      const { error } = await supabase
        .from('learning_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          access_type: 'subscription',
          enrolled_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Failed to enroll Pro subscriber:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('enrollProSubscriber error:', error);
      return false;
    }
  }

  /**
   * Update enrollment with start/access time
   */
  static async markCourseStarted(userId: string, courseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_enrollments')
        .update({
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .is('started_at', null);

      if (error) {
        logger.error('Error marking course started:', error);
      }
    } catch (error) {
      logger.error('markCourseStarted error:', error);
    }
  }

  /**
   * Update last accessed time
   */
  static async updateLastAccessed(userId: string, courseId: string): Promise<void> {
    try {
      await supabase
        .from('learning_enrollments')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('course_id', courseId);
    } catch (error) {
      logger.error('updateLastAccessed error:', error);
    }
  }

  // ==========================================
  // LESSON PROGRESS
  // ==========================================

  /**
   * Get or create lesson progress record
   */
  static async getLessonProgress(userId: string, lessonId: string): Promise<LearningLessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('learning_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching lesson progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('getLessonProgress error:', error);
      return null;
    }
  }

  /**
   * Update lesson progress
   */
  static async updateLessonProgress(
    userId: string,
    lessonId: string,
    progress: Partial<{
      watch_time_seconds: number;
      last_position_seconds: number;
      interactions_count: number;
      interaction_data: Record<string, unknown>;
      is_completed: boolean;
    }>
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = { ...progress };

      if (progress.is_completed) {
        updates.completed_at = now;
      }

      // Upsert progress record
      const { error } = await supabase
        .from('learning_lesson_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            started_at: now,
            ...updates,
          },
          {
            onConflict: 'user_id,lesson_id',
          }
        );

      if (error) {
        logger.error('Error updating lesson progress:', error);
        throw error;
      }

      // If lesson completed, update course progress
      if (progress.is_completed) {
        await this.recalculateCourseProgress(userId, lessonId);
      }
    } catch (error) {
      logger.error('updateLessonProgress error:', error);
      throw error;
    }
  }

  /**
   * Mark a lesson as complete
   */
  static async markLessonComplete(userId: string, lessonId: string): Promise<void> {
    await this.updateLessonProgress(userId, lessonId, { is_completed: true });
  }

  /**
   * Recalculate and update course progress after lesson completion
   */
  private static async recalculateCourseProgress(userId: string, lessonId: string): Promise<void> {
    try {
      // Get the course ID for this lesson
      const { data: lesson } = await supabase
        .from('learning_lessons')
        .select('module_id, learning_modules!inner(course_id)')
        .eq('id', lessonId)
        .single();

      if (!lesson) return;

      const courseId = (lesson as any).learning_modules.course_id;

      // Count total and completed lessons
      const { data: totalData } = await supabase
        .from('learning_lessons')
        .select('id, learning_modules!inner(course_id)')
        .eq('learning_modules.course_id', courseId);

      const totalLessons = totalData?.length || 0;

      const { data: completedData } = await supabase
        .from('learning_lesson_progress')
        .select('lesson_id, learning_lessons!inner(module_id, learning_modules!inner(course_id))')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .eq('learning_lessons.learning_modules.course_id', courseId);

      const completedLessons = completedData?.length || 0;

      // Calculate progress percentage
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Update enrollment
      const updates: Record<string, unknown> = { progress_percent: progressPercent };

      if (progressPercent === 100) {
        updates.completed_at = new Date().toISOString();
      }

      await supabase
        .from('learning_enrollments')
        .update(updates)
        .eq('user_id', userId)
        .eq('course_id', courseId);

      logger.debug(`Updated course ${courseId} progress for user ${userId}: ${progressPercent}%`);
    } catch (error) {
      logger.error('recalculateCourseProgress error:', error);
    }
  }

  /**
   * Get all lesson progress for a course
   */
  static async getCourseProgress(
    userId: string,
    courseId: string
  ): Promise<{
    enrollment: LearningEnrollment | null;
    lessonProgress: LearningLessonProgress[];
    completedCount: number;
    totalCount: number;
    progressPercent: number;
  }> {
    try {
      // Get enrollment
      const { data: enrollment } = await supabase
        .from('learning_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      // Get all lessons for the course
      const { data: lessons } = await supabase
        .from('learning_lessons')
        .select('id, learning_modules!inner(course_id)')
        .eq('learning_modules.course_id', courseId);

      const lessonIds = lessons?.map(l => l.id) || [];
      const totalCount = lessonIds.length;

      // Get progress for all lessons
      const { data: progress } = await supabase
        .from('learning_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      const lessonProgress = progress || [];
      const completedCount = lessonProgress.filter(p => p.is_completed).length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        enrollment,
        lessonProgress,
        completedCount,
        totalCount,
        progressPercent,
      };
    } catch (error) {
      logger.error('getCourseProgress error:', error);
      return {
        enrollment: null,
        lessonProgress: [],
        completedCount: 0,
        totalCount: 0,
        progressPercent: 0,
      };
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Get the next lesson to continue from
   */
  static async getNextLesson(
    userId: string,
    courseId: string
  ): Promise<LearningLesson | null> {
    try {
      // Get course with all lessons
      const course = await this.getCourse(courseId);
      if (!course?.learning_modules) return null;

      // Flatten lessons
      const allLessons: LearningLesson[] = [];
      for (const module of course.learning_modules) {
        if (module.learning_lessons) {
          allLessons.push(...module.learning_lessons);
        }
      }

      if (allLessons.length === 0) return null;

      // Get user's progress
      const { lessonProgress } = await this.getCourseProgress(userId, courseId);
      const completedIds = new Set(lessonProgress.filter(p => p.is_completed).map(p => p.lesson_id));

      // Find first incomplete lesson
      for (const lesson of allLessons) {
        if (!completedIds.has(lesson.id)) {
          return lesson;
        }
      }

      // All complete, return first lesson
      return allLessons[0];
    } catch (error) {
      logger.error('getNextLesson error:', error);
      return null;
    }
  }

  /**
   * Get featured courses for homepage
   */
  static async getFeaturedCourses(): Promise<LearningCourse[]> {
    return this.getCourses({ isFeatured: true });
  }
}

export default LearningService;
