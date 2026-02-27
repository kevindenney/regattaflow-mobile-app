/**
 * React Query hooks for BetterAt course data.
 * All queries are scoped to the current interest via InterestProvider.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInterest } from '@/providers/InterestProvider'
import { useAuth } from '@/providers/AuthProvider'
import {
  getCoursesByInterest,
  getCourseWithLessons,
  getLessonProgress,
  upsertLessonProgress,
  getCourseCompletionStats,
  type BetterAtCourse,
  type BetterAtLesson,
  type BetterAtLessonProgress,
} from '@/services/BetterAtCourseService'

// Re-export types for convenience
export type { BetterAtCourse, BetterAtLesson, BetterAtLessonProgress }

/**
 * Fetch all published courses for the current interest.
 */
export function useCourses() {
  const { currentInterest } = useInterest()

  return useQuery({
    queryKey: ['betterat-courses', currentInterest?.id],
    queryFn: () => getCoursesByInterest(currentInterest!.id),
    enabled: !!currentInterest,
    staleTime: 1000 * 60 * 10, // 10 min
  })
}

/**
 * Fetch a single course with its lessons.
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['betterat-course', courseId],
    queryFn: () => getCourseWithLessons(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Fetch lesson progress for the current user and interest.
 */
export function useLessonProgress() {
  const { currentInterest } = useInterest()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['betterat-progress', user?.id, currentInterest?.id],
    queryFn: () => getLessonProgress(user!.id, currentInterest!.id),
    enabled: !!user && !!currentInterest,
    staleTime: 1000 * 60 * 2, // 2 min
  })
}

/**
 * Fetch completion stats for a specific course.
 */
export function useCourseCompletion(courseId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['betterat-completion', user?.id, courseId],
    queryFn: () => getCourseCompletionStats(user!.id, courseId!),
    enabled: !!user && !!courseId,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Mutation to update lesson progress.
 * Invalidates relevant queries on success.
 */
export function useUpdateLessonProgress() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { currentInterest } = useInterest()

  return useMutation({
    mutationFn: ({
      lessonId,
      status,
      score,
    }: {
      lessonId: string
      status: 'not_started' | 'in_progress' | 'completed'
      score?: number
    }) => upsertLessonProgress(user!.id, lessonId, status, score),
    onSuccess: () => {
      // Invalidate progress queries
      queryClient.invalidateQueries({
        queryKey: ['betterat-progress', user?.id, currentInterest?.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['betterat-completion'],
      })
    },
  })
}
