/**
 * Lesson Progress Service
 * Tracks user progress through lessons and courses
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('LessonProgressService');

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  watch_time_seconds: number;
  last_position_seconds: number;
  interactions_count: number;
  interaction_data: Record<string, any>;
  quiz_score: number | null;
  quiz_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface CourseProgressSummary {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  last_lesson_id: string | null;
  last_accessed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface LessonProgressWithDetails extends LessonProgress {
  lesson?: {
    id: string;
    title: string;
    lesson_type: string;
    duration_seconds: number;
    module_id: string;
    order_index: number;
  };
}

export class LessonProgressService {
  /**
   * Get or create progress record for a lesson
   */
  static async getOrCreateProgress(
    userId: string,
    lessonId: string
  ): Promise<LessonProgress | null> {
    try {
      // Try to get existing progress
      const { data: existing, error: getError } = await supabase
        .from('learning_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (getError && getError.code !== 'PGRST116') {
        logger.error('Error getting lesson progress:', getError);
        return null;
      }

      if (existing) {
        return existing;
      }

      // Create new progress record
      const { data: created, error: createError } = await supabase
        .from('learning_lesson_progress')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        logger.error('Error creating lesson progress:', createError);
        return null;
      }

      return created;
    } catch (error) {
      logger.error('getOrCreateProgress error:', error);
      return null;
    }
  }

  /**
   * Mark a lesson as started
   */
  static async markLessonStarted(userId: string, lessonId: string): Promise<boolean> {
    try {
      const progress = await this.getOrCreateProgress(userId, lessonId);
      if (!progress) return false;

      // If already started, just update last_accessed
      if (progress.started_at) {
        return true;
      }

      const { error } = await supabase
        .from('learning_lesson_progress')
        .update({
          started_at: new Date().toISOString(),
        })
        .eq('id', progress.id);

      if (error) {
        logger.error('Error marking lesson started:', error);
        return false;
      }

      // Also update the enrollment's last_accessed_at and started_at
      await this.updateEnrollmentAccess(userId, lessonId);

      return true;
    } catch (error) {
      logger.error('markLessonStarted error:', error);
      return false;
    }
  }

  /**
   * Mark a lesson as completed
   */
  static async markLessonCompleted(
    userId: string,
    lessonId: string,
    options?: {
      quizScore?: number;
      watchTimeSeconds?: number;
      interactionsCount?: number;
    }
  ): Promise<boolean> {
    try {
      const progress = await this.getOrCreateProgress(userId, lessonId);
      if (!progress) return false;

      const updateData: Partial<LessonProgress> = {
        is_completed: true,
        completed_at: new Date().toISOString(),
      };

      if (options?.quizScore !== undefined) {
        updateData.quiz_score = options.quizScore;
        updateData.quiz_attempts = (progress.quiz_attempts || 0) + 1;
      }

      if (options?.watchTimeSeconds !== undefined) {
        updateData.watch_time_seconds = options.watchTimeSeconds;
      }

      if (options?.interactionsCount !== undefined) {
        updateData.interactions_count = options.interactionsCount;
      }

      const { error } = await supabase
        .from('learning_lesson_progress')
        .update(updateData)
        .eq('id', progress.id);

      if (error) {
        logger.error('Error marking lesson completed:', error);
        return false;
      }

      // Update course progress
      await this.updateCourseProgress(userId, lessonId);

      return true;
    } catch (error) {
      logger.error('markLessonCompleted error:', error);
      return false;
    }
  }

  /**
   * Update video watch position
   */
  static async updateVideoPosition(
    userId: string,
    lessonId: string,
    positionSeconds: number,
    watchTimeSeconds?: number
  ): Promise<boolean> {
    try {
      const progress = await this.getOrCreateProgress(userId, lessonId);
      if (!progress) return false;

      const updateData: Partial<LessonProgress> = {
        last_position_seconds: positionSeconds,
      };

      if (watchTimeSeconds !== undefined) {
        updateData.watch_time_seconds = watchTimeSeconds;
      }

      const { error } = await supabase
        .from('learning_lesson_progress')
        .update(updateData)
        .eq('id', progress.id);

      if (error) {
        logger.error('Error updating video position:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('updateVideoPosition error:', error);
      return false;
    }
  }

  /**
   * Record an interaction (for interactive lessons)
   */
  static async recordInteraction(
    userId: string,
    lessonId: string,
    interactionData: Record<string, any>
  ): Promise<boolean> {
    try {
      const progress = await this.getOrCreateProgress(userId, lessonId);
      if (!progress) return false;

      // Merge interaction data
      const existingData = progress.interaction_data || {};
      const newData = {
        ...existingData,
        ...interactionData,
        last_interaction_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('learning_lesson_progress')
        .update({
          interactions_count: (progress.interactions_count || 0) + 1,
          interaction_data: newData,
        })
        .eq('id', progress.id);

      if (error) {
        logger.error('Error recording interaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('recordInteraction error:', error);
      return false;
    }
  }

  /**
   * Get progress for a specific lesson
   */
  static async getLessonProgress(
    userId: string,
    lessonId: string
  ): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('learning_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) {
        logger.error('Error getting lesson progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('getLessonProgress error:', error);
      return null;
    }
  }

  /**
   * Get all lesson progress for a course
   */
  static async getCourseProgress(
    userId: string,
    courseId: string
  ): Promise<LessonProgressWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('learning_lesson_progress')
        .select(`
          *,
          lesson:learning_lessons!inner (
            id,
            title,
            lesson_type,
            duration_seconds,
            module_id,
            order_index,
            module:learning_modules!inner (
              course_id
            )
          )
        `)
        .eq('user_id', userId)
        .eq('lesson.module.course_id', courseId);

      if (error) {
        logger.error('Error getting course progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('getCourseProgress error:', error);
      return [];
    }
  }

  /**
   * Get course progress summary
   */
  static async getCourseProgressSummary(
    userId: string,
    courseId: string
  ): Promise<CourseProgressSummary | null> {
    try {
      // Get total lessons in course
      const { data: lessons, error: lessonsError } = await supabase
        .from('learning_lessons')
        .select(`
          id,
          module:learning_modules!inner (
            course_id
          )
        `)
        .eq('module.course_id', courseId);

      if (lessonsError) {
        logger.error('Error getting lessons:', lessonsError);
        return null;
      }

      const totalLessons = lessons?.length || 0;
      const lessonIds = lessons?.map(l => l.id) || [];

      // Get completed lessons
      const { data: progress, error: progressError } = await supabase
        .from('learning_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (progressError) {
        logger.error('Error getting progress:', progressError);
        return null;
      }

      const completedLessons = progress?.filter(p => p.is_completed).length || 0;
      const progressPercent = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      // Find last accessed lesson
      const sortedProgress = progress?.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      const lastProgress = sortedProgress?.[0];

      // Get first started timestamp
      const startedProgress = progress?.filter(p => p.started_at).sort((a, b) =>
        new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime()
      );
      const firstStarted = startedProgress?.[0]?.started_at || null;

      // Check if all completed
      const allCompleted = totalLessons > 0 && completedLessons === totalLessons;
      const lastCompleted = allCompleted 
        ? sortedProgress?.find(p => p.is_completed)?.completed_at 
        : null;

      return {
        course_id: courseId,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percent: progressPercent,
        last_lesson_id: lastProgress?.lesson_id || null,
        last_accessed_at: lastProgress?.updated_at || null,
        started_at: firstStarted,
        completed_at: lastCompleted || null,
      };
    } catch (error) {
      logger.error('getCourseProgressSummary error:', error);
      return null;
    }
  }

  /**
   * Update enrollment's course progress
   */
  private static async updateCourseProgress(
    userId: string,
    lessonId: string
  ): Promise<void> {
    try {
      // Get course ID from lesson
      const { data: lesson } = await supabase
        .from('learning_lessons')
        .select(`
          id,
          module:learning_modules!inner (
            course_id
          )
        `)
        .eq('id', lessonId)
        .single();

      if (!lesson?.module?.course_id) return;

      const courseId = lesson.module.course_id;

      // Get progress summary
      const summary = await this.getCourseProgressSummary(userId, courseId);
      if (!summary) return;

      // Update enrollment
      const updateData: Record<string, any> = {
        progress_percent: summary.progress_percent,
        last_accessed_at: new Date().toISOString(),
      };

      // Mark as completed if 100%
      if (summary.progress_percent === 100) {
        updateData.completed_at = new Date().toISOString();
      }

      await supabase
        .from('learning_enrollments')
        .update(updateData)
        .eq('user_id', userId)
        .eq('course_id', courseId);

    } catch (error) {
      logger.error('updateCourseProgress error:', error);
    }
  }

  /**
   * Update enrollment access timestamp
   */
  private static async updateEnrollmentAccess(
    userId: string,
    lessonId: string
  ): Promise<void> {
    try {
      // Get course ID from lesson
      const { data: lesson } = await supabase
        .from('learning_lessons')
        .select(`
          module:learning_modules!inner (
            course_id
          )
        `)
        .eq('id', lessonId)
        .single();

      if (!lesson?.module?.course_id) return;

      const courseId = lesson.module.course_id;

      await supabase
        .from('learning_enrollments')
        .update({
          last_accessed_at: new Date().toISOString(),
          started_at: supabase.sql`COALESCE(started_at, NOW())`,
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);

    } catch (error) {
      logger.error('updateEnrollmentAccess error:', error);
    }
  }

  /**
   * Get next lesson to continue
   */
  static async getNextLesson(
    userId: string,
    courseId: string
  ): Promise<{ lessonId: string; moduleId: string } | null> {
    try {
      // Get all lessons ordered by module and lesson order
      const { data: lessons } = await supabase
        .from('learning_lessons')
        .select(`
          id,
          order_index,
          module:learning_modules!inner (
            id,
            course_id,
            order_index
          )
        `)
        .eq('module.course_id', courseId)
        .order('module.order_index', { ascending: true })
        .order('order_index', { ascending: true });

      if (!lessons?.length) return null;

      // Get user's progress for this course
      const lessonIds = lessons.map(l => l.id);
      const { data: progress } = await supabase
        .from('learning_lesson_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      const completedSet = new Set(
        progress?.filter(p => p.is_completed).map(p => p.lesson_id) || []
      );

      // Find first incomplete lesson
      const nextLesson = lessons.find(l => !completedSet.has(l.id));

      if (nextLesson) {
        return {
          lessonId: nextLesson.id,
          moduleId: nextLesson.module.id,
        };
      }

      // All completed, return first lesson for review
      return {
        lessonId: lessons[0].id,
        moduleId: lessons[0].module.id,
      };
    } catch (error) {
      logger.error('getNextLesson error:', error);
      return null;
    }
  }
}

export const lessonProgressService = new LessonProgressService();

