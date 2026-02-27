/**
 * BetterAt Course Service
 *
 * Database-backed course catalog for all interests.
 * Queries betterat_courses and betterat_lessons tables, filtered by interest_id.
 */

import { supabase } from '@/services/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BetterAtCourse {
  id: string
  interest_id: string
  title: string
  description: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  topic: string | null
  sort_order: number
  lesson_count: number
  published: boolean
  created_at: string
  updated_at: string
  lessons?: BetterAtLesson[]
}

export interface BetterAtLesson {
  id: string
  course_id: string
  title: string
  description: string | null
  lesson_data: Record<string, unknown>
  interactive_type: string | null
  sort_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface BetterAtLessonProgress {
  id: string
  user_id: string
  lesson_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  score: number | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all published courses for a given interest, with lesson counts.
 */
export async function getCoursesByInterest(
  interestId: string
): Promise<BetterAtCourse[]> {
  const { data, error } = await supabase
    .from('betterat_courses')
    .select('*')
    .eq('interest_id', interestId)
    .eq('published', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[BetterAtCourseService] Error fetching courses:', error.message)
    return []
  }

  return (data ?? []) as BetterAtCourse[]
}

/**
 * Fetch a single course with all its published lessons.
 */
export async function getCourseWithLessons(
  courseId: string
): Promise<BetterAtCourse | null> {
  const { data, error } = await supabase
    .from('betterat_courses')
    .select(`
      *,
      lessons:betterat_lessons(*)
    `)
    .eq('id', courseId)
    .eq('betterat_lessons.published', true)
    .order('sort_order', { referencedTable: 'betterat_lessons', ascending: true })
    .single()

  if (error) {
    console.error('[BetterAtCourseService] Error fetching course:', error.message)
    return null
  }

  return data as BetterAtCourse
}

/**
 * Fetch all lesson progress for a user within a given interest.
 */
export async function getLessonProgress(
  userId: string,
  interestId: string
): Promise<BetterAtLessonProgress[]> {
  const { data, error } = await supabase
    .from('betterat_lesson_progress')
    .select(`
      *,
      lesson:betterat_lessons!inner(
        course:betterat_courses!inner(interest_id)
      )
    `)
    .eq('user_id', userId)
    .eq('betterat_lessons.betterat_courses.interest_id', interestId)

  if (error) {
    // Fallback: just get all progress for the user (simpler query)
    const { data: fallback } = await supabase
      .from('betterat_lesson_progress')
      .select('*')
      .eq('user_id', userId)

    return (fallback ?? []) as BetterAtLessonProgress[]
  }

  return (data ?? []) as BetterAtLessonProgress[]
}

/**
 * Upsert lesson progress for a user.
 */
export async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  status: 'not_started' | 'in_progress' | 'completed',
  score?: number
): Promise<BetterAtLessonProgress | null> {
  const { data, error } = await supabase
    .from('betterat_lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status,
        score: score ?? null,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('[BetterAtCourseService] Error upserting progress:', error.message)
    return null
  }

  return data as BetterAtLessonProgress
}

/**
 * Get course completion stats for a user within an interest.
 */
export async function getCourseCompletionStats(
  userId: string,
  courseId: string
): Promise<{ total: number; completed: number; percentage: number }> {
  const course = await getCourseWithLessons(courseId)
  if (!course || !course.lessons) {
    return { total: 0, completed: 0, percentage: 0 }
  }

  const lessonIds = course.lessons.map((l) => l.id)
  const { data: progress } = await supabase
    .from('betterat_lesson_progress')
    .select('lesson_id, status')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
    .eq('status', 'completed')

  const completed = progress?.length ?? 0
  const total = lessonIds.length

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}
