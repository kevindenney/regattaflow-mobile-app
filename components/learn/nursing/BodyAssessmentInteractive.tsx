/**
 * BodyAssessmentInteractive -- Interactive head-to-toe nursing assessment.
 *
 * An SVG body diagram (front view) with 8 tappable anatomical regions.
 * Each region is drawn as a colored overlay zone on a simplified body outline.
 * Tapping a region reveals the corresponding assessment steps from the lesson
 * data (filtered by `competencyArea`). Includes progress tracking and a
 * completion summary.
 *
 * Uses the NursingStep / NursingLessonData types from NursingStepViewer for
 * compatibility with the lesson player infrastructure.
 */

import React, { useCallback, useMemo, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import type { NursingLessonData, NursingStep } from './NursingStepViewer'
import { useStepAnnotations, type ConfidenceLevel } from '@/hooks/useStepAnnotations'
import {
  useCompetencyConnection,
  computeAggregateConfidence,
} from '@/hooks/useCompetencyConnection'
import { COMPETENCY_STATUS_CONFIG } from '@/types/competency'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BodyAssessmentInteractiveProps {
  lessonData: NursingLessonData
  /** DB UUID for this lesson (used for persisting annotations) */
  lessonId?: string
  accentColor?: string
  onComplete?: () => void
}

interface BodyRegion {
  id: string
  label: string
  competencyAreas: string[]
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7'
const BG_COLOR = '#FAF8F5'
const CARD_BG = '#FFFFFF'

const BODY_REGIONS: BodyRegion[] = [
  { id: 'head_neuro', label: 'Head & Neuro', competencyAreas: ['Neurological Assessment', 'Head Assessment'], color: '#7C3AED' },
  { id: 'respiratory', label: 'Respiratory', competencyAreas: ['Respiratory Assessment'], color: '#0369A1' },
  { id: 'cardiac', label: 'Cardiac', competencyAreas: ['Cardiac Assessment'], color: '#DC2626' },
  { id: 'abdomen', label: 'Abdomen', competencyAreas: ['Abdominal Assessment'], color: '#B45309' },
  { id: 'upper_extremities', label: 'Upper Extremities', competencyAreas: ['Musculoskeletal', 'Upper Extremity'], color: '#15803D' },
  { id: 'lower_extremities', label: 'Lower Extremities', competencyAreas: ['Musculoskeletal', 'Lower Extremity'], color: '#0891B2' },
  { id: 'skin', label: 'Skin & Integumentary', competencyAreas: ['Skin Assessment', 'Wound Assessment'], color: '#D97706' },
  { id: 'general', label: 'General / Vitals', competencyAreas: ['General Assessment', 'Vital Signs', 'Pain Assessment'], color: '#6B7280' },
]

// Confidence levels — ordered from lowest to highest
const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; label: string; color: string; bg: string; icon: string }[] = [
  { level: 'needs_practice', label: 'Needs Practice', color: '#DC2626', bg: '#FEF2F2', icon: 'flame-outline' },
  { level: 'developing', label: 'Developing', color: '#D97706', bg: '#FFFBEB', icon: 'trending-up-outline' },
  { level: 'proficient', label: 'Proficient', color: '#0369A1', bg: '#EFF6FF', icon: 'thumbs-up-outline' },
  { level: 'confident', label: 'Confident', color: '#16A34A', bg: '#F0FDF4', icon: 'shield-checkmark-outline' },
]

// Action badge config — mirrors NursingStepViewer exactly
const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  OBSERVE: { color: '#0369A1', bg: '#E0F2FE', icon: 'eye-outline', label: 'Observe' },
  PERFORM: { color: '#15803D', bg: '#DCFCE7', icon: 'hand-left-outline', label: 'Perform' },
  VERIFY: { color: '#B45309', bg: '#FEF3C7', icon: 'checkmark-circle-outline', label: 'Verify' },
  DOCUMENT: { color: '#7C3AED', bg: '#EDE9FE', icon: 'document-text-outline', label: 'Document' },
}

// ---------------------------------------------------------------------------
// SVG hit-zone bounding boxes — coordinates in a 200x440 viewBox.
//
// The body-region "skin" and "general" are rendered as buttons below the SVG
// instead of SVG overlays, since they are whole-body concepts.
// ---------------------------------------------------------------------------

interface HitZone {
  regionId: string
  x: number
  y: number
  width: number
  height: number
}

const HIT_ZONES: HitZone[] = [
  { regionId: 'head_neuro', x: 65, y: 5, width: 70, height: 75 },
  { regionId: 'respiratory', x: 50, y: 88, width: 100, height: 60 },
  { regionId: 'cardiac', x: 70, y: 100, width: 40, height: 40 },
  { regionId: 'abdomen', x: 60, y: 150, width: 80, height: 60 },
  { regionId: 'upper_extremities', x: 20, y: 88, width: 160, height: 120 },
  { regionId: 'lower_extremities', x: 55, y: 215, width: 90, height: 180 },
]

// Regions that are shown as buttons below the SVG diagram
const BUTTON_REGION_IDS = ['skin', 'general']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BodyAssessmentInteractive({
  lessonData,
  lessonId,
  accentColor = DEFAULT_ACCENT,
  onComplete,
}: BodyAssessmentInteractiveProps) {
  const { width: screenWidth } = useWindowDimensions()

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [regionStepIndex, setRegionStepIndex] = useState(0)
  const [viewedSteps, setViewedSteps] = useState<Set<string>>(new Set())
  const [showCompletion, setShowCompletion] = useState(false)
  const [expandedNoteStep, setExpandedNoteStep] = useState<number | null>(null)

  // Step annotations (notes + confidence ratings)
  const { annotations, getAnnotation, saveNote, setConfidence, stats } = useStepAnnotations(lessonId)

  // Competency connection — links annotations to competency progress
  const competencyNumbers = useMemo(
    () => (lessonData as any).competencyIds ?? [],
    [lessonData],
  )
  const { connections: competencyConnections } = useCompetencyConnection(
    lessonId,
    competencyNumbers,
    stats,
    lessonData.steps.length,
  )

  // Compute real aggregate confidence from annotations
  const aggregateConfidence = useMemo(
    () => computeAggregateConfidence(annotations, lessonData.steps.length),
    [annotations, lessonData.steps.length],
  )

  const svgWidth = Math.min(screenWidth - 48, 280)
  const svgHeight = svgWidth * (440 / 200)

  // -----------------------------------------------------------------------
  // Filter lesson steps by region's competencyAreas
  // -----------------------------------------------------------------------

  const stepsForRegion = useMemo(() => {
    const map = new Map<string, NursingStep[]>()
    for (const region of BODY_REGIONS) {
      const filtered = lessonData.steps.filter(
        (step) =>
          step.competencyArea != null &&
          region.competencyAreas.some(
            (ca) => step.competencyArea!.toLowerCase().includes(ca.toLowerCase()),
          ),
      )
      map.set(region.id, filtered)
    }
    return map
  }, [lessonData.steps])

  // -----------------------------------------------------------------------
  // Completion tracking helpers
  // -----------------------------------------------------------------------

  /** A region is "completed" when every step in it has been viewed. */
  const completedRegions = useMemo(() => {
    const completed = new Set<string>()
    for (const region of BODY_REGIONS) {
      const steps = stepsForRegion.get(region.id) ?? []
      if (steps.length === 0) continue
      const allViewed = steps.every((s) => viewedSteps.has(`${region.id}:${s.stepNumber}`))
      if (allViewed) completed.add(region.id)
    }
    return completed
  }, [stepsForRegion, viewedSteps])

  /** Total regions that have at least one step. */
  const regionsWithSteps = useMemo(
    () => BODY_REGIONS.filter((r) => (stepsForRegion.get(r.id) ?? []).length > 0),
    [stepsForRegion],
  )

  const allComplete =
    regionsWithSteps.length > 0 && completedRegions.size === regionsWithSteps.length

  // Current region data
  const selectedRegion = useMemo(
    () => BODY_REGIONS.find((r) => r.id === selectedRegionId) ?? null,
    [selectedRegionId],
  )
  const selectedSteps = useMemo(
    () => (selectedRegionId ? stepsForRegion.get(selectedRegionId) ?? [] : []),
    [selectedRegionId, stepsForRegion],
  )

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleRegionTap = useCallback(
    (regionId: string) => {
      if (regionId === selectedRegionId) {
        // Toggle off
        setSelectedRegionId(null)
        setRegionStepIndex(0)
        return
      }
      setSelectedRegionId(regionId)
      setRegionStepIndex(0)
      setShowCompletion(false)

      // Mark the first step as viewed
      const steps = stepsForRegion.get(regionId) ?? []
      if (steps.length > 0) {
        setViewedSteps((prev) => {
          const next = new Set(prev)
          next.add(`${regionId}:${steps[0].stepNumber}`)
          return next
        })
      }
    },
    [selectedRegionId, stepsForRegion],
  )

  const handleNextStep = useCallback(() => {
    if (!selectedRegionId) return
    const steps = stepsForRegion.get(selectedRegionId) ?? []
    const nextIdx = regionStepIndex + 1
    if (nextIdx < steps.length) {
      setRegionStepIndex(nextIdx)
      setViewedSteps((prev) => {
        const next = new Set(prev)
        next.add(`${selectedRegionId}:${steps[nextIdx].stepNumber}`)
        return next
      })
    }
  }, [selectedRegionId, regionStepIndex, stepsForRegion])

  const handlePrevStep = useCallback(() => {
    if (regionStepIndex > 0) {
      setRegionStepIndex(regionStepIndex - 1)
    }
  }, [regionStepIndex])

  const handleFinish = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  const handleReset = useCallback(() => {
    setViewedSteps(new Set())
    setSelectedRegionId(null)
    setRegionStepIndex(0)
    setShowCompletion(false)
  }, [])

  // Check for all-complete after marking a step viewed
  // We do this reactively: when completedRegions changes and matches all
  useMemo(() => {
    if (allComplete && !showCompletion) {
      setShowCompletion(true)
      setSelectedRegionId(null)
    }
  }, [allComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // SVG body outline
  // -----------------------------------------------------------------------

  const renderBodySvg = () => {
    const scaleX = svgWidth / 200
    const scaleY = svgHeight / 440

    return (
      <View style={styles.svgContainer}>
        <Svg width={svgWidth} height={svgHeight} viewBox="0 0 200 440">
          {/* -- Body outline -- */}
          <G>
            {/* Head */}
            <Ellipse cx="100" cy="32" rx="26" ry="30" fill="#F5E6D3" stroke="#C4A882" strokeWidth="1.5" />
            {/* Neck */}
            <Rect x="90" y="60" width="20" height="20" rx="4" fill="#F5E6D3" stroke="#C4A882" strokeWidth="1" />
            {/* Torso */}
            <Path
              d="M60,82 Q55,82 52,90 L48,150 Q46,180 55,210 L60,215 L140,215 L145,210 Q154,180 152,150 L148,90 Q145,82 140,82 Z"
              fill="#F5E6D3"
              stroke="#C4A882"
              strokeWidth="1.5"
            />
            {/* Left arm */}
            <Path
              d="M52,90 Q42,92 35,105 L25,150 Q22,165 24,175 L28,195 Q30,200 34,200 Q38,200 38,195 L40,170 L45,145 Q48,130 50,120"
              fill="#F5E6D3"
              stroke="#C4A882"
              strokeWidth="1.5"
            />
            {/* Right arm */}
            <Path
              d="M148,90 Q158,92 165,105 L175,150 Q178,165 176,175 L172,195 Q170,200 166,200 Q162,200 162,195 L160,170 L155,145 Q152,130 150,120"
              fill="#F5E6D3"
              stroke="#C4A882"
              strokeWidth="1.5"
            />
            {/* Left hand */}
            <Ellipse cx="32" cy="204" rx="8" ry="10" fill="#F5E6D3" stroke="#C4A882" strokeWidth="1" />
            {/* Right hand */}
            <Ellipse cx="168" cy="204" rx="8" ry="10" fill="#F5E6D3" stroke="#C4A882" strokeWidth="1" />
            {/* Left leg */}
            <Path
              d="M65,215 L60,290 Q58,320 60,350 L62,390 Q62,410 58,420 Q56,430 60,432 L75,432 Q78,432 78,428 L76,420 L72,390 L75,350 Q77,320 78,290 L82,215"
              fill="#F5E6D3"
              stroke="#C4A882"
              strokeWidth="1.5"
            />
            {/* Right leg */}
            <Path
              d="M118,215 L122,290 Q123,320 125,350 L128,390 Q128,410 124,420 L122,428 Q122,432 125,432 L140,432 Q144,432 142,428 L138,420 L140,390 L138,350 Q142,320 140,290 L135,215"
              fill="#F5E6D3"
              stroke="#C4A882"
              strokeWidth="1.5"
            />
            {/* Eyes */}
            <Circle cx="90" cy="28" r="2.5" fill="#8B7355" />
            <Circle cx="110" cy="28" r="2.5" fill="#8B7355" />
            {/* Mouth */}
            <Path d="M94,40 Q100,46 106,40" fill="none" stroke="#8B7355" strokeWidth="1.2" />
            {/* Chest reference */}
            <Circle cx="82" cy="115" r="1.5" fill="#D4A983" />
            <Circle cx="118" cy="115" r="1.5" fill="#D4A983" />
            {/* Navel */}
            <Circle cx="100" cy="180" r="2" fill="#D4A983" />
          </G>

          {/* -- Region overlays (colored when selected or completed) -- */}
          {BODY_REGIONS.filter((r) => !BUTTON_REGION_IDS.includes(r.id)).map((region) => {
            const isSelected = selectedRegionId === region.id
            const isCompleted = completedRegions.has(region.id)

            let overlayOpacity = 0
            if (isSelected) overlayOpacity = 0.35
            else if (isCompleted) overlayOpacity = 0.2

            if (overlayOpacity === 0) return null

            // Head & Neuro — circle over the head
            if (region.id === 'head_neuro') {
              return (
                <Ellipse
                  key={region.id}
                  cx="100"
                  cy="35"
                  rx="32"
                  ry="35"
                  fill={region.color}
                  opacity={overlayOpacity}
                />
              )
            }

            // Respiratory — lungs area
            if (region.id === 'respiratory') {
              return (
                <G key={region.id}>
                  <Path
                    d="M58,95 Q55,95 54,100 L52,140 Q52,148 58,148 L75,148 Q78,148 78,142 L78,100 Q78,95 75,95 Z"
                    fill={region.color}
                    opacity={overlayOpacity}
                  />
                  <Path
                    d="M122,95 Q125,95 126,100 L128,140 Q128,148 122,148 L105,148 Q102,148 102,142 L102,100 Q102,95 105,95 Z"
                    fill={region.color}
                    opacity={overlayOpacity}
                  />
                </G>
              )
            }

            // Cardiac — left-center chest ellipse
            if (region.id === 'cardiac') {
              return (
                <Ellipse
                  key={region.id}
                  cx="88"
                  cy="118"
                  rx="16"
                  ry="18"
                  fill={region.color}
                  opacity={overlayOpacity}
                />
              )
            }

            // Abdomen
            if (region.id === 'abdomen') {
              const zone = HIT_ZONES.find((z) => z.regionId === region.id)!
              return (
                <Rect
                  key={region.id}
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  rx={8}
                  fill={region.color}
                  opacity={overlayOpacity}
                />
              )
            }

            // Upper extremities — arms
            if (region.id === 'upper_extremities') {
              return (
                <G key={region.id}>
                  <Path
                    d="M52,90 Q42,92 35,105 L25,150 Q22,165 24,175 L28,195 Q30,200 34,200 Q38,200 38,195 L40,170 L45,145 Q48,130 50,120 L52,90 Z"
                    fill={region.color}
                    opacity={overlayOpacity}
                  />
                  <Path
                    d="M148,90 Q158,92 165,105 L175,150 Q178,165 176,175 L172,195 Q170,200 166,200 Q162,200 162,195 L160,170 L155,145 Q152,130 150,120 L148,90 Z"
                    fill={region.color}
                    opacity={overlayOpacity}
                  />
                </G>
              )
            }

            // Lower extremities — legs
            if (region.id === 'lower_extremities') {
              return (
                <G key={region.id}>
                  <Path
                    d="M65,215 L60,290 Q58,320 60,350 L62,390 Q62,410 58,420 Q56,430 60,432 L75,432 Q78,432 78,428 L76,420 L72,390 L75,350 Q77,320 78,290 L82,215 Z"
                    fill={region.color}
                    opacity={overlayOpacity}
                  />
                  <Path
                    d="M118,215 L122,290 Q123,320 125,350 L128,390 Q128,410 124,420 L122,428 Q122,432 125,432 L140,432 Q144,432 142,428 L138,420 L140,390 L138,350 Q142,320 140,290 L135,215 Z"
                    fill={region.color}
                    opacity={overlayOpacity}
                  />
                </G>
              )
            }

            return null
          })}

          {/* -- Completion checkmarks on the body -- */}
          {BODY_REGIONS.filter(
            (r) => completedRegions.has(r.id) && !BUTTON_REGION_IDS.includes(r.id),
          ).map((region) => {
            const positions: Record<string, { x: number; y: number }> = {
              head_neuro: { x: 100, y: 32 },
              respiratory: { x: 115, y: 120 },
              cardiac: { x: 88, y: 118 },
              abdomen: { x: 100, y: 175 },
              upper_extremities: { x: 35, y: 150 },
              lower_extremities: { x: 75, y: 320 },
            }
            const pos = positions[region.id]
            if (!pos) return null
            return (
              <G key={`chk-${region.id}`}>
                <Circle cx={pos.x} cy={pos.y} r={9} fill="#16A34A" />
                <SvgText
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#FFFFFF"
                >
                  {'\u2713'}
                </SvgText>
              </G>
            )
          })}
        </Svg>

        {/* Invisible pressable tap-targets over the SVG */}
        {HIT_ZONES.map((zone) => {
          const region = BODY_REGIONS.find((r) => r.id === zone.regionId)
          if (!region) return null
          const isSelected = selectedRegionId === zone.regionId

          return (
            <Pressable
              key={`tap-${zone.regionId}`}
              onPress={() => handleRegionTap(zone.regionId)}
              style={[
                styles.hitZone,
                {
                  left: zone.x * scaleX,
                  top: zone.y * scaleY,
                  width: zone.width * scaleX,
                  height: zone.height * scaleY,
                  borderColor: isSelected ? region.color : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                  borderRadius: 8,
                  backgroundColor: isSelected ? `${region.color}15` : 'transparent',
                },
              ]}
              accessibilityLabel={`${region.label} region. Tap to assess.`}
              accessibilityRole="button"
            />
          )
        })}
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Buttons for whole-body regions (Skin and General/Vitals)
  // -----------------------------------------------------------------------

  const renderButtonRegions = () => (
    <View style={styles.buttonRegionRow}>
      {BODY_REGIONS.filter((r) => BUTTON_REGION_IDS.includes(r.id)).map((region) => {
        const isSelected = selectedRegionId === region.id
        const isCompleted = completedRegions.has(region.id)
        const stepCount = (stepsForRegion.get(region.id) ?? []).length

        return (
          <Pressable
            key={`btn-${region.id}`}
            onPress={() => handleRegionTap(region.id)}
            style={[
              styles.buttonRegion,
              isSelected && { backgroundColor: region.color, borderColor: region.color },
              isCompleted && !isSelected && styles.buttonRegionCompleted,
            ]}
            accessibilityLabel={`${region.label}. ${stepCount} steps.`}
            accessibilityRole="button"
          >
            {isCompleted && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isSelected ? '#FFFFFF' : '#16A34A'}
              />
            )}
            <Text
              style={[
                styles.buttonRegionText,
                isSelected && styles.buttonRegionTextSelected,
                isCompleted && !isSelected && styles.buttonRegionTextCompleted,
              ]}
            >
              {region.label}
            </Text>
            {stepCount > 0 && (
              <View
                style={[
                  styles.stepCountBadge,
                  isSelected && styles.stepCountBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.stepCountText,
                    isSelected && styles.stepCountTextSelected,
                  ]}
                >
                  {stepCount}
                </Text>
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )

  // -----------------------------------------------------------------------
  // Region chip labels (below diagram, for all SVG-overlay regions)
  // -----------------------------------------------------------------------

  const renderRegionChips = () => (
    <View style={styles.chipContainer}>
      {BODY_REGIONS.filter((r) => !BUTTON_REGION_IDS.includes(r.id)).map((region) => {
        const isSelected = selectedRegionId === region.id
        const isCompleted = completedRegions.has(region.id)
        const stepCount = (stepsForRegion.get(region.id) ?? []).length

        return (
          <Pressable
            key={`chip-${region.id}`}
            onPress={() => handleRegionTap(region.id)}
            style={[
              styles.chip,
              isSelected && { backgroundColor: region.color, borderColor: region.color },
              isCompleted && !isSelected && styles.chipCompleted,
            ]}
          >
            {isCompleted && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={isSelected ? '#FFFFFF' : '#16A34A'}
              />
            )}
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
                isCompleted && !isSelected && styles.chipTextCompleted,
              ]}
            >
              {region.label}
            </Text>
            {stepCount > 0 && (
              <View
                style={[
                  styles.chipStepCount,
                  isSelected && styles.chipStepCountSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipStepCountText,
                    isSelected && styles.chipStepCountTextSelected,
                  ]}
                >
                  {stepCount}
                </Text>
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )

  // -----------------------------------------------------------------------
  // Progress bar
  // -----------------------------------------------------------------------

  const renderProgress = () => {
    const total = regionsWithSteps.length
    const done = completedRegions.size

    return (
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Assessment Progress</Text>
          <Text style={[styles.progressCount, { color: accentColor }]}>
            {done}/{total} regions
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: total > 0 ? `${(done / total) * 100}%` : '0%',
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Step detail card (NursingStepViewer styling)
  // -----------------------------------------------------------------------

  const renderStepCard = (step: NursingStep) => {
    const actionCfg = ACTION_CONFIG[step.action] ?? ACTION_CONFIG.OBSERVE

    return (
      <View style={styles.stepCard}>
        {/* Step header */}
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumberBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
          </View>
          <Text style={styles.stepLabel}>{step.label}</Text>
        </View>

        {/* Action badge */}
        <View style={[styles.actionBadge, { backgroundColor: actionCfg.bg }]}>
          <Ionicons name={actionCfg.icon as any} size={14} color={actionCfg.color} />
          <Text style={[styles.actionBadgeText, { color: actionCfg.color }]}>
            {actionCfg.label}
          </Text>
          {step.criticalAction && (
            <View style={styles.criticalBadge}>
              <Ionicons name="alert-circle" size={12} color="#DC2626" />
              <Text style={styles.criticalBadgeText}>Critical</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.stepDescription}>{step.description}</Text>

        {/* Details list */}
        {step.details.length > 0 && (
          <View style={styles.detailsList}>
            {step.details.map((detail, idx) => (
              <View key={idx} style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: accentColor }]} />
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Patient Communication */}
        {step.patientCommunication != null && step.patientCommunication.length > 0 && (
          <View style={styles.communicationBox}>
            <View style={styles.communicationHeader}>
              <Ionicons name="chatbubble-outline" size={14} color="#0369A1" />
              <Text style={styles.communicationTitle}>Say to Patient</Text>
            </View>
            <Text style={styles.communicationText}>
              &ldquo;{step.patientCommunication}&rdquo;
            </Text>
          </View>
        )}

        {/* Risks */}
        {step.risks != null && step.risks.length > 0 && (
          <View style={styles.risksBox}>
            <View style={styles.risksHeader}>
              <Ionicons name="warning-outline" size={14} color="#DC2626" />
              <Text style={styles.risksTitle}>Risks if Done Incorrectly</Text>
            </View>
            {step.risks.map((risk, idx) => (
              <Text key={idx} style={styles.riskItem}>
                {'\u2022'} {risk}
              </Text>
            ))}
          </View>
        )}

        {/* Preceptor Cue */}
        {step.preceptorCue != null && step.preceptorCue.length > 0 && (
          <View style={styles.preceptorBox}>
            <View style={styles.preceptorHeader}>
              <Ionicons name="school-outline" size={14} color="#7C3AED" />
              <Text style={styles.preceptorTitle}>Preceptor Tip</Text>
            </View>
            <Text style={styles.preceptorText}>{step.preceptorCue}</Text>
          </View>
        )}

        {/* ── Self-Assessment: Confidence Rating ── */}
        {lessonId && (
          <View style={styles.confidenceSection}>
            <Text style={styles.confidenceLabel}>How confident are you?</Text>
            <View style={styles.confidencePills}>
              {CONFIDENCE_OPTIONS.map((opt) => {
                const annotation = getAnnotation(step.stepNumber)
                const isActive = annotation?.confidence === opt.level
                return (
                  <Pressable
                    key={opt.level}
                    style={[
                      styles.confidencePill,
                      { borderColor: opt.color },
                      isActive && { backgroundColor: opt.bg, borderColor: opt.color },
                    ]}
                    onPress={() => setConfidence(step.stepNumber, opt.level)}
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
                setExpandedNoteStep((prev) =>
                  prev === step.stepNumber ? null : step.stepNumber,
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={15}
                color={getAnnotation(step.stepNumber)?.note ? '#0369A1' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.noteToggleText,
                  getAnnotation(step.stepNumber)?.note && styles.noteToggleTextActive,
                ]}
              >
                {getAnnotation(step.stepNumber)?.note
                  ? 'My Clinical Note'
                  : 'Add Clinical Note'}
              </Text>
              <Ionicons
                name={expandedNoteStep === step.stepNumber ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#9CA3AF"
              />
            </Pressable>

            {expandedNoteStep === step.stepNumber && (
              <TextInput
                style={styles.noteInput}
                placeholder="Add your clinical observations, tips, or things to remember..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={getAnnotation(step.stepNumber)?.note ?? ''}
                onChangeText={(text) => saveNote(step.stepNumber, text)}
                textAlignVertical="top"
              />
            )}

            {/* Show note preview when collapsed */}
            {expandedNoteStep !== step.stepNumber &&
              getAnnotation(step.stepNumber)?.note && (
                <Text style={styles.notePreview} numberOfLines={2}>
                  {getAnnotation(step.stepNumber)!.note}
                </Text>
              )}
          </View>
        )}
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Detail panel with step navigation
  // -----------------------------------------------------------------------

  const renderDetailPanel = () => {
    if (!selectedRegion || !selectedRegionId) return null

    const steps = selectedSteps
    if (steps.length === 0) {
      return (
        <View style={styles.emptyPanel}>
          <Ionicons name="information-circle-outline" size={28} color="#9CA3AF" />
          <Text style={styles.emptyPanelText}>
            No assessment steps found for {selectedRegion.label}.
          </Text>
        </View>
      )
    }

    const currentStep = steps[regionStepIndex]
    if (!currentStep) return null

    const isFirst = regionStepIndex === 0
    const isLast = regionStepIndex === steps.length - 1
    const isRegionCompleted = completedRegions.has(selectedRegionId)

    return (
      <View style={styles.detailPanel}>
        {/* Region header bar */}
        <View style={styles.detailHeader}>
          <View style={[styles.detailColorBar, { backgroundColor: selectedRegion.color }]} />
          <View style={styles.detailHeaderContent}>
            <View style={styles.detailTitleRow}>
              <Text style={styles.detailTitle}>{selectedRegion.label}</Text>
              {isRegionCompleted && (
                <View style={styles.completedChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={styles.completedChipText}>Complete</Text>
                </View>
              )}
            </View>
            <View style={styles.detailSubtitleRow}>
              <Text style={styles.detailSubtitle}>
                Step {regionStepIndex + 1} of {steps.length}
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
          </View>
        </View>

        {/* Step card (same styling as NursingStepViewer) */}
        <ScrollView
          style={styles.detailScrollView}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {renderStepCard(currentStep)}
        </ScrollView>

        {/* Nav buttons */}
        <View style={styles.navContainer}>
          <Pressable
            style={[styles.navButton, isFirst && styles.navButtonDisabled]}
            onPress={handlePrevStep}
            disabled={isFirst}
            accessibilityLabel="Previous step"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isFirst ? '#D1D5DB' : '#1A1A1A'}
            />
            <Text style={[styles.navButtonText, isFirst && styles.navButtonTextDisabled]}>
              Back
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: accentColor }]}
            onPress={isLast ? () => handleRegionTap(selectedRegionId) : handleNextStep}
            accessibilityLabel={isLast ? 'Done with this region' : 'Next step'}
          >
            <Text style={styles.navButtonPrimaryText}>
              {isLast ? 'Done' : 'Next'}
            </Text>
            <Ionicons
              name={isLast ? 'checkmark' : 'chevron-forward'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Completion summary
  // -----------------------------------------------------------------------

  const renderCompletionSummary = () => {
    if (!showCompletion) return null

    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionCard}>
          <View style={[styles.completionIconCircle, { backgroundColor: accentColor }]}>
            <Ionicons name="trophy" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.completionTitle}>Assessment Complete!</Text>
          <Text style={styles.completionSubtitle}>
            You have reviewed all regions of the head-to-toe assessment.
          </Text>

          <View style={styles.completionChecklist}>
            {regionsWithSteps.map((region) => {
              const stepCount = (stepsForRegion.get(region.id) ?? []).length
              return (
                <View key={`summary-${region.id}`} style={styles.completionCheckItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.completionCheckText}>
                    {region.label}
                  </Text>
                  <Text style={styles.completionCheckCount}>
                    {stepCount} step{stepCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )
            })}
          </View>

          <View style={styles.completionActions}>
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={18} color="#6B7280" />
              <Text style={styles.resetBtnText}>Review Again</Text>
            </Pressable>
            <Pressable
              style={[styles.finishBtn, { backgroundColor: accentColor }]}
              onPress={handleFinish}
            >
              <Text style={styles.finishBtnText}>Continue</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Head-to-Toe Assessment</Text>
          <Text style={styles.subtitle}>
            Tap each body region to review the assessment steps. Complete all
            regions to finish.
          </Text>
        </View>

        {/* Progress */}
        {renderProgress()}

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
                        {aggregateConfidence.ratedCount}/{lessonData.steps.length} steps rated
                      </Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Body diagram */}
        <View style={styles.diagramSection}>
          {renderBodySvg()}
        </View>

        {/* Region chips (for SVG-overlay regions) */}
        {renderRegionChips()}

        {/* Button regions (Skin, General) */}
        {renderButtonRegions()}

        {/* Detail panel or completion summary */}
        {showCompletion ? renderCompletionSummary() : renderDetailPanel()}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bottomSpacer: {
    height: 40,
  },

  // Title
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Competency connection banner
  competencyBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 8,
  },
  competencyBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD_BG,
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

  // Progress
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // SVG diagram
  diagramSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  svgContainer: {
    position: 'relative',
  },
  hitZone: {
    position: 'absolute',
  },

  // Region chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(0,0,0,0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  chipCompleted: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipTextCompleted: {
    color: '#16A34A',
  },
  chipStepCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chipStepCountSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  chipStepCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  chipStepCountTextSelected: {
    color: '#FFFFFF',
  },

  // Button regions (Skin, General)
  buttonRegionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
    justifyContent: 'center',
  },
  buttonRegion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  buttonRegionCompleted: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  buttonRegionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  buttonRegionTextSelected: {
    color: '#FFFFFF',
  },
  buttonRegionTextCompleted: {
    color: '#16A34A',
  },
  stepCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  stepCountBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepCountTextSelected: {
    color: '#FFFFFF',
  },

  // Detail panel
  detailPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 2px 12px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  detailHeader: {
    flexDirection: 'row',
  },
  detailColorBar: {
    width: 5,
  },
  detailHeaderContent: {
    flex: 1,
    padding: 16,
  },
  detailTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  completedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
  },
  completedChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  detailScrollView: {
    maxHeight: 420,
  },
  detailScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Empty panel (no steps for a region)
  emptyPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
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
  emptyPanelText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Step card (NursingStepViewer style)
  stepCard: {
    paddingBottom: 8,
  },
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

  // Details list
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

  // Detail subtitle row (step counter + annotation stats)
  detailSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
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
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    flex: 1,
    justifyContent: 'center',
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Completion summary
  completionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  completionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
      },
    }),
  },
  completionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  completionChecklist: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  completionCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionCheckText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  completionCheckCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  completionActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

export default BodyAssessmentInteractive
