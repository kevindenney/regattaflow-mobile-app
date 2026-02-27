/**
 * BetterAtLessonPlayer — Renders a lesson from the betterat_lessons table.
 *
 * Unlike the legacy InteractivePlayer (which maps component names to statically
 * imported sailing components), this player reads the JSONB `lesson_data` from
 * the database and renders it using the appropriate step viewer.
 *
 * Currently supports:
 *   - All nursing interactive_types → NursingStepViewer
 *   - Drawing/Fitness step-based lessons → generic StepViewer (same component)
 *
 * In the future, specialized renderers can be added per interactive_type
 * (e.g., 'auscultation-simulator' could include audio playback).
 */

import React from 'react'
import { View, StyleSheet, Text, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  NursingStepViewer,
  BodyAssessmentInteractive,
  AuscultationSimulator,
  GCSCalculatorInteractive,
  MedAdminInteractive,
  SBARBuilderInteractive,
  type NursingLessonData,
} from './nursing'
import type { BetterAtLesson } from '@/services/BetterAtCourseService'
import { useInterest } from '@/providers/InterestProvider'

interface BetterAtLessonPlayerProps {
  lesson: BetterAtLesson
  onComplete?: () => void
}

/**
 * Check whether lesson_data contains a valid steps array.
 */
function hasSteps(data: Record<string, unknown>): data is NursingLessonData {
  return Array.isArray((data as any)?.steps) && (data as any).steps.length > 0
}

/**
 * Map of interactive_type values to specialized components.
 * Falls through to generic NursingStepViewer for any unrecognized type.
 */
const SPECIALIZED_VIEWERS: Record<
  string,
  React.ComponentType<{ lessonData: NursingLessonData; lessonId?: string; accentColor?: string; onComplete?: () => void }>
> = {
  'body-assessment': BodyAssessmentInteractive,
  'auscultation-simulator': AuscultationSimulator,
  'gcs-calculator': GCSCalculatorInteractive,
  'med-admin': MedAdminInteractive,
  'sbar-builder': SBARBuilderInteractive,
}

export function BetterAtLessonPlayer({ lesson, onComplete }: BetterAtLessonPlayerProps) {
  const { currentInterest } = useInterest()
  const data = lesson.lesson_data
  const accentColor = currentInterest?.accent_color

  // Route to a specialized viewer if one exists for this interactive_type
  if (hasSteps(data) && lesson.interactive_type) {
    const Specialized = SPECIALIZED_VIEWERS[lesson.interactive_type]
    if (Specialized) {
      return (
        <Specialized
          lessonData={data}
          lessonId={lesson.id}
          accentColor={accentColor}
          onComplete={onComplete}
        />
      )
    }
  }

  // All other step-based lessons use the generic step viewer
  if (hasSteps(data)) {
    return (
      <NursingStepViewer
        lessonData={data}
        lessonId={lesson.id}
        interactiveType={lesson.interactive_type ?? undefined}
        accentColor={accentColor}
        onComplete={onComplete}
      />
    )
  }

  // Fallback for lessons without step data
  return (
    <View style={styles.fallback}>
      <Ionicons name="book-outline" size={48} color="#9CA3AF" />
      <Text style={styles.fallbackTitle}>{lesson.title}</Text>
      <Text style={styles.fallbackText}>
        {lesson.description || 'This lesson does not have interactive content yet.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#FAF8F5',
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
})

export default BetterAtLessonPlayer
