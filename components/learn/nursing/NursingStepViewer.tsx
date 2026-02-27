/**
 * NursingStepViewer — Generic step-through component for nursing lessons.
 *
 * Reads the JSONB `lesson_data.steps` array from a BetterAt lesson and renders
 * a swipeable, step-by-step interactive experience. Each step shows its label,
 * description, action type badge, details, and critical-action warnings.
 *
 * This single component handles all nursing interactive_types because all 24
 * nursing lessons share the same NursingStep schema. The `interactive_type`
 * field can be used in the future to add specialized visualizations (e.g.,
 * an SVG body diagram for 'body-assessment', audio playback for
 * 'auscultation-simulator', etc.).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStepAnnotations, type ConfidenceLevel } from '@/hooks/useStepAnnotations'
import {
  useCompetencyConnection,
  computeAggregateConfidence,
} from '@/hooks/useCompetencyConnection'
import { COMPETENCY_STATUS_CONFIG } from '@/types/competency'

// ---------------------------------------------------------------------------
// Types (matches the JSONB schema in betterat_lessons.lesson_data)
// ---------------------------------------------------------------------------

export interface NursingStep {
  stepNumber: number
  label: string
  description: string
  details: string[]
  action: 'OBSERVE' | 'PERFORM' | 'VERIFY' | 'DOCUMENT'
  criticalAction?: boolean
  competencyArea?: string
  patientCommunication?: string
  evidence?: string[]
  risks?: string[]
  preceptorCue?: string
}

export interface NursingLessonData {
  lessonId: string
  competencyIds?: number[]
  kolbPhase?: string
  steps: NursingStep[]
}

interface NursingStepViewerProps {
  lessonData: NursingLessonData
  lessonId?: string
  interactiveType?: string
  accentColor?: string
  onComplete?: () => void
}

const DEFAULT_ACCENT = '#0097A7'

// ---------------------------------------------------------------------------
// Confidence pills config
// ---------------------------------------------------------------------------

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string; icon: string; color: string }[] = [
  { value: 'needs_practice', label: 'Needs Practice', icon: 'alert-circle-outline', color: '#DC2626' },
  { value: 'developing', label: 'Developing', icon: 'trending-up-outline', color: '#D97706' },
  { value: 'proficient', label: 'Proficient', icon: 'thumbs-up-outline', color: '#0097A7' },
  { value: 'confident', label: 'Confident', icon: 'shield-checkmark-outline', color: '#15803D' },
]

// ---------------------------------------------------------------------------
// Action badge colors and icons
// ---------------------------------------------------------------------------

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  OBSERVE: { color: '#0369A1', bg: '#E0F2FE', icon: 'eye-outline', label: 'Observe' },
  PERFORM: { color: '#15803D', bg: '#DCFCE7', icon: 'hand-left-outline', label: 'Perform' },
  VERIFY: { color: '#B45309', bg: '#FEF3C7', icon: 'checkmark-circle-outline', label: 'Verify' },
  DOCUMENT: { color: '#7C3AED', bg: '#EDE9FE', icon: 'document-text-outline', label: 'Document' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NursingStepViewer({
  lessonData,
  lessonId,
  interactiveType,
  accentColor = DEFAULT_ACCENT,
  onComplete,
}: NursingStepViewerProps) {
  const { width: screenWidth } = useWindowDimensions()
  const [currentStep, setCurrentStep] = useState(0)
  const [expandedNote, setExpandedNote] = useState<number | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const steps = lessonData.steps
  const totalSteps = steps.length
  const isLastStep = currentStep === totalSteps - 1

  const cardWidth = useMemo(() => Math.min(screenWidth - 32, 600), [screenWidth])

  // Step annotations (notes + confidence ratings)
  const { annotations, getAnnotation, saveNote, setConfidence, stats } = useStepAnnotations(lessonId)

  // Competency connection
  const competencyNumbers = useMemo(
    () => (lessonData as any).competencyIds ?? [],
    [lessonData],
  )
  const { connections: competencyConnections } = useCompetencyConnection(
    lessonId,
    competencyNumbers,
    stats,
    totalSteps,
  )

  // Compute aggregate confidence from annotations
  const aggregateConfidence = useMemo(
    () => computeAggregateConfidence(annotations, totalSteps),
    [annotations, totalSteps],
  )

  // Navigation
  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSteps) return
      setCurrentStep(index)
      flatListRef.current?.scrollToIndex({ index, animated: true })
    },
    [totalSteps],
  )

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.()
    } else {
      goToStep(currentStep + 1)
    }
  }, [currentStep, isLastStep, goToStep, onComplete])

  const handlePrev = useCallback(() => {
    goToStep(currentStep - 1)
  }, [currentStep, goToStep])

  // Render a single step card
  const renderStep = useCallback(
    ({ item }: { item: NursingStep }) => {
      const actionCfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.OBSERVE

      return (
        <View style={[styles.stepCard, { width: cardWidth }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepCardContent}
          >
            {/* Step header */}
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumberBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.stepNumberText}>{item.stepNumber}</Text>
              </View>
              <Text style={styles.stepLabel}>{item.label}</Text>
            </View>

            {/* Action badge */}
            <View style={[styles.actionBadge, { backgroundColor: actionCfg.bg }]}>
              <Ionicons name={actionCfg.icon as any} size={14} color={actionCfg.color} />
              <Text style={[styles.actionBadgeText, { color: actionCfg.color }]}>
                {actionCfg.label}
              </Text>
              {item.criticalAction && (
                <View style={styles.criticalBadge}>
                  <Ionicons name="alert-circle" size={12} color="#DC2626" />
                  <Text style={styles.criticalBadgeText}>Critical</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={styles.stepDescription}>{item.description}</Text>

            {/* Details */}
            {item.details.length > 0 && (
              <View style={styles.detailsList}>
                {item.details.map((detail, idx) => (
                  <View key={idx} style={styles.detailItem}>
                    <View style={[styles.detailBullet, { backgroundColor: accentColor }]} />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Patient Communication */}
            {item.patientCommunication && (
              <View style={styles.communicationBox}>
                <View style={styles.communicationHeader}>
                  <Ionicons name="chatbubble-outline" size={14} color="#0369A1" />
                  <Text style={styles.communicationTitle}>Say to Patient</Text>
                </View>
                <Text style={styles.communicationText}>
                  "{item.patientCommunication}"
                </Text>
              </View>
            )}

            {/* Risks */}
            {item.risks && item.risks.length > 0 && (
              <View style={styles.risksBox}>
                <View style={styles.risksHeader}>
                  <Ionicons name="warning-outline" size={14} color="#DC2626" />
                  <Text style={styles.risksTitle}>Risks if Done Incorrectly</Text>
                </View>
                {item.risks.map((risk, idx) => (
                  <Text key={idx} style={styles.riskItem}>
                    • {risk}
                  </Text>
                ))}
              </View>
            )}

            {/* Preceptor Cue */}
            {item.preceptorCue && (
              <View style={styles.preceptorBox}>
                <View style={styles.preceptorHeader}>
                  <Ionicons name="school-outline" size={14} color="#7C3AED" />
                  <Text style={styles.preceptorTitle}>Preceptor Tip</Text>
                </View>
                <Text style={styles.preceptorText}>{item.preceptorCue}</Text>
              </View>
            )}

            {/* ── Self-Assessment: Confidence Rating ── */}
            {lessonId && (
              <View style={styles.confidenceSection}>
                <Text style={styles.confidenceLabel}>How confident are you?</Text>
                <View style={styles.confidencePills}>
                  {CONFIDENCE_OPTIONS.map((opt) => {
                    const annotation = getAnnotation(item.stepNumber)
                    const isActive = annotation?.confidence === opt.value
                    return (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.confidencePill,
                          { borderColor: isActive ? opt.color : '#E5E7EB' },
                          isActive && { backgroundColor: opt.color + '14' },
                        ]}
                        onPress={() => setConfidence(item.stepNumber, opt.value)}
                        accessibilityLabel={`Rate confidence: ${opt.label}`}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={14}
                          color={isActive ? opt.color : '#9CA3AF'}
                        />
                        <Text
                          style={[
                            styles.confidencePillText,
                            isActive && { color: opt.color, fontWeight: '600' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            {/* ── Clinical Notes ── */}
            {lessonId && (
              <View style={styles.noteSection}>
                <Pressable
                  style={styles.noteToggle}
                  onPress={() =>
                    setExpandedNote((prev) =>
                      prev === item.stepNumber ? null : item.stepNumber,
                    )
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={getAnnotation(item.stepNumber)?.note ? '#0369A1' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.noteToggleText,
                      getAnnotation(item.stepNumber)?.note && styles.noteToggleTextActive,
                    ]}
                  >
                    {getAnnotation(item.stepNumber)?.note
                      ? 'My Clinical Note'
                      : 'Add Clinical Note'}
                  </Text>
                  <Ionicons
                    name={expandedNote === item.stepNumber ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#9CA3AF"
                  />
                </Pressable>

                {expandedNote === item.stepNumber && (
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add your clinical observations, tips, or things to remember..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={getAnnotation(item.stepNumber)?.note ?? ''}
                    onChangeText={(text) => saveNote(item.stepNumber, text)}
                    textAlignVertical="top"
                  />
                )}

                {/* Show note preview when collapsed */}
                {expandedNote !== item.stepNumber &&
                  getAnnotation(item.stepNumber)?.note && (
                    <Text style={styles.notePreview} numberOfLines={2}>
                      {getAnnotation(item.stepNumber)!.note}
                    </Text>
                  )}
              </View>
            )}
          </ScrollView>
        </View>
      )
    },
    [cardWidth, lessonId, getAnnotation, setConfidence, saveNote, expandedNote, accentColor],
  )

  const keyExtractor = useCallback((item: NursingStep) => `step-${item.stepNumber}`, [])

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        {lessonId && stats.ratedCount > 0 && (
          <View style={styles.annotationStatsBadge}>
            <Ionicons name="shield-checkmark-outline" size={11} color="#16A34A" />
            <Text style={styles.annotationStatsText}>
              {stats.ratedCount} rated
            </Text>
          </View>
        )}
        {lessonId && stats.notesCount > 0 && (
          <View style={styles.annotationStatsBadge}>
            <Ionicons name="create-outline" size={11} color="#0369A1" />
            <Text style={styles.annotationStatsText}>
              {stats.notesCount} note{stats.notesCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Competency connection banner */}
      {competencyConnections.length > 0 && (
        <View style={styles.competencyBanner}>
          {competencyConnections.map((conn) => {
            const statusCfg = COMPETENCY_STATUS_CONFIG[
              conn.progress?.status ?? 'not_started'
            ]
            return (
              <View key={conn.competency.id} style={styles.competencyBannerRow}>
                <View style={styles.competencyBannerLeft}>
                  <Ionicons name="ribbon-outline" size={16} color={accentColor} />
                  <View style={styles.competencyBannerText}>
                    <Text style={styles.competencyBannerTitle} numberOfLines={1}>
                      {conn.competency.title}
                    </Text>
                    <Text style={styles.competencyBannerCategory}>
                      {conn.competency.category}
                    </Text>
                  </View>
                </View>
                <View style={styles.competencyBannerRight}>
                  <View style={[styles.competencyStatusPill, { backgroundColor: statusCfg.bg }]}>
                    <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                    <Text style={[styles.competencyStatusText, { color: statusCfg.color }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                  {aggregateConfidence && (
                    <Text style={styles.competencyConfidenceText}>
                      {aggregateConfidence.ratedCount}/{totalSteps} steps rated
                    </Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Step cards */}
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: cardWidth,
          offset: cardWidth * index,
          index,
        })}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />

      {/* Navigation buttons */}
      <View style={styles.navContainer}>
        <Pressable
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={handlePrev}
          disabled={currentStep === 0}
          accessibilityLabel="Previous step"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentStep === 0 ? '#D1D5DB' : '#1A1A1A'}
          />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Back
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: accentColor }]}
          onPress={handleNext}
          accessibilityLabel={isLastStep ? 'Complete lesson' : 'Next step'}
        >
          <Text style={styles.navButtonPrimaryText}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
          <Ionicons
            name={isLastStep ? 'checkmark' : 'chevron-forward'}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0097A7',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },

  // Step card
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 0,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  stepCardContent: {
    padding: 20,
    paddingBottom: 32,
  },

  // Step header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },

  // Action badge
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  criticalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
  },

  // Description
  stepDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },

  // Details
  detailsList: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0097A7',
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    flex: 1,
  },

  // Communication box
  communicationBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0369A1',
  },
  communicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  communicationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
  },
  communicationText: {
    fontSize: 14,
    color: '#0C4A6E',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Risks box
  risksBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  risksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  risksTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  riskItem: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginTop: 4,
  },

  // Preceptor box
  preceptorBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  preceptorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  preceptorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  preceptorText: {
    fontSize: 13,
    color: '#5B21B6',
    lineHeight: 18,
  },

  // Annotation stats badges (in progress bar area)
  annotationStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  annotationStatsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Competency connection banner
  competencyBanner: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  competencyBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  competencyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  competencyBannerText: {
    flex: 1,
  },
  competencyBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  competencyBannerCategory: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  competencyBannerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  competencyStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  competencyStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  competencyConfidenceText: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  // Confidence rating section
  confidenceSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  confidencePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  confidencePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Clinical notes section
  noteSection: {
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  noteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  noteToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    flex: 1,
  },
  noteToggleTextActive: {
    color: '#0369A1',
  },
  noteInput: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    minHeight: 80,
    maxHeight: 160,
  },
  notePreview: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Navigation
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  navButtonTextDisabled: {
    color: '#D1D5DB',
  },
  navButtonPrimary: {
    backgroundColor: '#0097A7',
    flex: 1,
    justifyContent: 'center',
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

export default NursingStepViewer
