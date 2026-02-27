/**
 * useStepAnnotations — per-step notes + confidence ratings for lesson interactives.
 *
 * Loads all annotations for a (user, lesson) pair, exposes upsert helpers,
 * and debounces note saves so typing doesn't spam the server.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/providers/AuthProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfidenceLevel = 'needs_practice' | 'developing' | 'proficient' | 'confident'

export interface StepAnnotation {
  id: string
  lessonId: string
  stepNumber: number
  note: string | null
  confidence: ConfidenceLevel | null
  practiceCount: number
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStepAnnotations(lessonId: string | undefined) {
  const { user } = useAuth()
  const [annotations, setAnnotations] = useState<Map<number, StepAnnotation>>(new Map())
  const [loading, setLoading] = useState(true)

  // Debounce timers for note saves
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // ── Fetch all annotations for this lesson ──
  useEffect(() => {
    if (!user?.id || !lessonId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('betterat_step_annotations')
        .select('*')
        .eq('user_id', user!.id)
        .eq('lesson_id', lessonId!)

      if (cancelled) return
      if (error) {
        console.warn('[useStepAnnotations] fetch error:', error.message)
        setLoading(false)
        return
      }

      const map = new Map<number, StepAnnotation>()
      for (const row of data ?? []) {
        map.set(row.step_number, {
          id: row.id,
          lessonId: row.lesson_id,
          stepNumber: row.step_number,
          note: row.note,
          confidence: row.confidence as ConfidenceLevel | null,
          practiceCount: row.practice_count,
          updatedAt: row.updated_at,
        })
      }
      setAnnotations(map)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user?.id, lessonId])

  // ── Upsert a single annotation field ──
  const upsert = useCallback(
    async (stepNumber: number, fields: Partial<Pick<StepAnnotation, 'note' | 'confidence' | 'practiceCount'>>) => {
      if (!user?.id || !lessonId) return

      // Optimistic update
      setAnnotations((prev) => {
        const next = new Map(prev)
        const existing = next.get(stepNumber)
        next.set(stepNumber, {
          id: existing?.id ?? '',
          lessonId,
          stepNumber,
          note: fields.note !== undefined ? fields.note : (existing?.note ?? null),
          confidence: fields.confidence !== undefined ? fields.confidence : (existing?.confidence ?? null),
          practiceCount: fields.practiceCount !== undefined ? fields.practiceCount : (existing?.practiceCount ?? 0),
          updatedAt: new Date().toISOString(),
        })
        return next
      })

      // Persist
      const { data, error } = await supabase
        .from('betterat_step_annotations')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            step_number: stepNumber,
            ...(fields.note !== undefined && { note: fields.note }),
            ...(fields.confidence !== undefined && { confidence: fields.confidence }),
            ...(fields.practiceCount !== undefined && { practice_count: fields.practiceCount }),
          },
          { onConflict: 'user_id,lesson_id,step_number' },
        )
        .select()
        .single()

      if (error) {
        console.warn('[useStepAnnotations] upsert error:', error.message)
        return
      }

      // Update with server-generated ID
      if (data) {
        setAnnotations((prev) => {
          const next = new Map(prev)
          next.set(stepNumber, {
            id: data.id,
            lessonId: data.lesson_id,
            stepNumber: data.step_number,
            note: data.note,
            confidence: data.confidence as ConfidenceLevel | null,
            practiceCount: data.practice_count,
            updatedAt: data.updated_at,
          })
          return next
        })
      }
    },
    [user?.id, lessonId],
  )

  // ── Debounced note save (300ms) ──
  const saveNote = useCallback(
    (stepNumber: number, note: string) => {
      // Clear previous timer
      const existing = debounceTimers.current.get(stepNumber)
      if (existing) clearTimeout(existing)

      // Optimistic local update immediately
      setAnnotations((prev) => {
        const next = new Map(prev)
        const ex = next.get(stepNumber)
        next.set(stepNumber, {
          id: ex?.id ?? '',
          lessonId: lessonId ?? '',
          stepNumber,
          note,
          confidence: ex?.confidence ?? null,
          practiceCount: ex?.practiceCount ?? 0,
          updatedAt: new Date().toISOString(),
        })
        return next
      })

      // Debounced persist
      debounceTimers.current.set(
        stepNumber,
        setTimeout(() => {
          upsert(stepNumber, { note })
          debounceTimers.current.delete(stepNumber)
        }, 800),
      )
    },
    [lessonId, upsert],
  )

  // ── Set confidence ──
  const setConfidence = useCallback(
    (stepNumber: number, confidence: ConfidenceLevel) => {
      upsert(stepNumber, { confidence })
    },
    [upsert],
  )

  // ── Get annotation for a step ──
  const getAnnotation = useCallback(
    (stepNumber: number): StepAnnotation | undefined => annotations.get(stepNumber),
    [annotations],
  )

  // ── Summary stats ──
  const stats = useMemo(() => {
    let notesCount = 0
    let ratedCount = 0
    const confidenceCounts: Record<ConfidenceLevel, number> = {
      needs_practice: 0,
      developing: 0,
      proficient: 0,
      confident: 0,
    }

    for (const a of annotations.values()) {
      if (a.note && a.note.trim().length > 0) notesCount++
      if (a.confidence) {
        ratedCount++
        confidenceCounts[a.confidence]++
      }
    }

    return { notesCount, ratedCount, confidenceCounts, totalAnnotated: annotations.size }
  }, [annotations])

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      for (const timer of debounceTimers.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  return {
    annotations,
    loading,
    getAnnotation,
    saveNote,
    setConfidence,
    stats,
  }
}
