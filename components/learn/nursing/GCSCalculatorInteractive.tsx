/**
 * GCSCalculatorInteractive -- Interactive Glasgow Coma Scale calculator
 * with pupil assessment and patient scenario practice.
 *
 * Nursing students learn to assess and score neurological status through:
 *   - Three interactive GCS category sections (Eye, Verbal, Motor)
 *   - Running GCS total with severity colour-coding
 *   - Pupil size and reactivity assessment with PERRL reminder
 *   - Three built-in practice scenarios with per-category feedback
 *   - Learning Notes cards drawn from lessonData.steps
 *   - Completion tracking with accuracy summary
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import type { NursingLessonData, NursingStep } from './NursingStepViewer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GCSCalculatorInteractiveProps {
  lessonData: NursingLessonData
  accentColor?: string
  onComplete?: () => void
}

interface GCSSelection {
  eye: number
  verbal: number
  motor: number
}

type PupilReactivity = 'reactive' | 'sluggish' | 'fixed'

interface PupilState {
  leftSize: number
  rightSize: number
  leftReactivity: PupilReactivity
  rightReactivity: PupilReactivity
}

interface GCSOption {
  score: number
  label: string
  description: string
}

interface PracticeScenario {
  id: number
  title: string
  patientDescription: string
  findings: string
  correctGCS: GCSSelection
  categoryExplanations: {
    eye: string
    verbal: string
    motor: string
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7'
const BG_COLOR = '#FAF8F5'

const SEVERITY_COLORS = {
  mild: '#15803D',
  moderate: '#B45309',
  severe: '#DC2626',
} as const

const EYE_OPTIONS: GCSOption[] = [
  { score: 4, label: 'Spontaneous', description: 'Opens eyes without stimulation' },
  { score: 3, label: 'To voice', description: 'Opens eyes to verbal command' },
  { score: 2, label: 'To pressure', description: 'Opens eyes to pain/pressure' },
  { score: 1, label: 'None', description: 'No eye opening' },
]

const VERBAL_OPTIONS: GCSOption[] = [
  { score: 5, label: 'Oriented', description: 'Knows who, where, when' },
  { score: 4, label: 'Confused', description: 'Speaks in sentences but disoriented' },
  { score: 3, label: 'Inappropriate words', description: 'Random words, no conversation' },
  { score: 2, label: 'Incomprehensible', description: 'Moaning, no words' },
  { score: 1, label: 'None', description: 'No verbal response' },
]

const MOTOR_OPTIONS: GCSOption[] = [
  { score: 6, label: 'Obeys commands', description: 'Performs requested movements' },
  { score: 5, label: 'Localizing pain', description: 'Reaches toward stimulus' },
  { score: 4, label: 'Flexion withdrawal', description: 'Pulls away from pain' },
  { score: 3, label: 'Abnormal flexion', description: 'Decorticate posturing' },
  { score: 2, label: 'Extension', description: 'Decerebrate posturing' },
  { score: 1, label: 'None', description: 'No motor response' },
]

const PUPIL_SIZES = [1, 2, 3, 4, 5, 6, 7, 8]
const REACTIVITY_OPTIONS: { value: PupilReactivity; label: string }[] = [
  { value: 'reactive', label: 'Reactive' },
  { value: 'sluggish', label: 'Sluggish' },
  { value: 'fixed', label: 'Fixed' },
]

const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    id: 1,
    title: 'Post-op confusion',
    patientDescription: '68-year-old male, post hip replacement, day 2.',
    findings:
      'Opens eyes when you call his name. Tells you he\'s in a restaurant and it\'s 1985. Reaches up and grabs your hand when you apply trapezius squeeze.',
    correctGCS: { eye: 3, verbal: 4, motor: 5 },
    categoryExplanations: {
      eye: 'E3 - To voice: The patient opens eyes when called by name, which is a verbal stimulus, not spontaneous opening.',
      verbal: 'V4 - Confused: He speaks in sentences but is disoriented to place and time (thinks he is in a restaurant and it is 1985).',
      motor: 'M5 - Localizing pain: He reaches toward and grabs the source of the trapezius squeeze, demonstrating purposeful movement toward the stimulus.',
    },
  },
  {
    id: 2,
    title: 'Stroke assessment',
    patientDescription: '54-year-old female, found unresponsive at home.',
    findings:
      'Eyes remain closed even when you shout. Makes groaning sounds but no words. Pulls arm away when you pinch her nail bed.',
    correctGCS: { eye: 1, verbal: 2, motor: 4 },
    categoryExplanations: {
      eye: 'E1 - None: Eyes remain closed despite shouting (verbal) and pain stimuli, indicating no eye opening response.',
      verbal: 'V2 - Incomprehensible: Groaning sounds without recognizable words represent incomprehensible vocalizations.',
      motor: 'M4 - Flexion withdrawal: Pulling the arm away from nail bed pinch is a withdrawal response, not purposeful reaching toward the stimulus.',
    },
  },
  {
    id: 3,
    title: 'Head trauma',
    patientDescription: '22-year-old male, motorcycle accident, ED arrival.',
    findings:
      'Eyes are open, looking around the room. Answers your questions correctly \u2014 knows his name, the hospital, today\'s date. Follows all your instructions to move hands and feet.',
    correctGCS: { eye: 4, verbal: 5, motor: 6 },
    categoryExplanations: {
      eye: 'E4 - Spontaneous: Eyes are already open and looking around without any stimulation needed.',
      verbal: 'V5 - Oriented: Correctly identifies self, location (hospital), and date, demonstrating full orientation.',
      motor: 'M6 - Obeys commands: Follows all verbal instructions to move hands and feet, demonstrating purposeful movement on command.',
    },
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSeverity(total: number): {
  label: string
  color: string
  range: string
} {
  if (total >= 13) return { label: 'Mild', color: SEVERITY_COLORS.mild, range: '13-15' }
  if (total >= 9) return { label: 'Moderate', color: SEVERITY_COLORS.moderate, range: '9-12' }
  return { label: 'Severe', color: SEVERITY_COLORS.severe, range: '3-8' }
}

function getClinicalImplication(total: number): string {
  if (total >= 13) return 'Mild injury. Monitor with serial neurological assessments.'
  if (total >= 9)
    return 'Moderate injury. Close monitoring required. Consider CT imaging and neurosurgery consult.'
  return 'Severe injury. Score \u22648: Consider intubation for airway protection. Immediate neurosurgical evaluation.'
}

function getReactivityColor(r: PupilReactivity): string {
  switch (r) {
    case 'reactive':
      return SEVERITY_COLORS.mild
    case 'sluggish':
      return SEVERITY_COLORS.moderate
    case 'fixed':
      return SEVERITY_COLORS.severe
  }
}

function getReactivityLabel(r: PupilReactivity): string {
  switch (r) {
    case 'reactive':
      return 'Reactive'
    case 'sluggish':
      return 'Sluggish'
    case 'fixed':
      return 'Fixed'
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GCSOptionRow({
  option,
  isSelected,
  accentColor,
  onPress,
  feedbackColor,
}: {
  option: GCSOption
  isSelected: boolean
  accentColor: string
  onPress: () => void
  feedbackColor?: string
}) {
  const borderColor = feedbackColor
    ? feedbackColor
    : isSelected
      ? accentColor
      : '#E5E7EB'
  const backgroundColor = feedbackColor
    ? feedbackColor + '12'
    : isSelected
      ? accentColor + '10'
      : '#FFFFFF'

  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionRow, { borderColor, backgroundColor }]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Score ${option.score}: ${option.label}. ${option.description}`}
    >
      <View
        style={[
          styles.optionScoreCircle,
          {
            backgroundColor: isSelected ? accentColor : '#F3F4F6',
            borderColor: isSelected ? accentColor : '#E5E7EB',
          },
        ]}
      >
        <Text
          style={[
            styles.optionScoreNumber,
            { color: isSelected ? '#FFFFFF' : '#6B7280' },
          ]}
        >
          {option.score}
        </Text>
      </View>
      <View style={styles.optionTextContainer}>
        <Text
          style={[
            styles.optionLabel,
            isSelected && { color: '#1A1A1A', fontWeight: '700' },
          ]}
        >
          {option.label}
        </Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={22} color={accentColor} />
      )}
    </Pressable>
  )
}

function GCSCategory({
  title,
  code,
  options,
  selectedScore,
  accentColor,
  onSelect,
  correctScore,
  showFeedback,
}: {
  title: string
  code: string
  options: GCSOption[]
  selectedScore: number
  accentColor: string
  onSelect: (score: number) => void
  correctScore?: number
  showFeedback?: boolean
}) {
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryCodeBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.categoryCodeText}>{code}</Text>
        </View>
        <Text style={styles.categoryTitle}>{title}</Text>
        {selectedScore > 0 && (
          <View style={styles.categoryScoreTag}>
            <Text style={[styles.categoryScoreTagText, { color: accentColor }]}>
              {code}{selectedScore}
            </Text>
          </View>
        )}
      </View>
      {options.map((opt) => {
        let feedbackColor: string | undefined
        if (showFeedback && correctScore !== undefined && selectedScore > 0) {
          if (opt.score === selectedScore && selectedScore === correctScore) {
            feedbackColor = SEVERITY_COLORS.mild
          } else if (opt.score === selectedScore && selectedScore !== correctScore) {
            feedbackColor = SEVERITY_COLORS.severe
          } else if (opt.score === correctScore) {
            feedbackColor = SEVERITY_COLORS.mild
          }
        }
        return (
          <GCSOptionRow
            key={opt.score}
            option={opt}
            isSelected={selectedScore === opt.score}
            accentColor={accentColor}
            onPress={() => onSelect(opt.score)}
            feedbackColor={feedbackColor}
          />
        )
      })}
    </View>
  )
}

function LearningNoteCard({
  step,
  accentColor,
}: {
  step: NursingStep
  accentColor: string
}) {
  return (
    <View style={styles.learningNoteCard}>
      <View style={styles.learningNoteHeader}>
        <Ionicons name="book-outline" size={16} color={accentColor} />
        <Text style={[styles.learningNoteTitle, { color: accentColor }]}>
          Learning Note
        </Text>
      </View>
      <Text style={styles.learningNoteLabel}>{step.label}</Text>
      <Text style={styles.learningNoteDescription}>{step.description}</Text>
      {step.details.length > 0 && (
        <View style={styles.learningNoteDetails}>
          {step.details.map((detail, idx) => (
            <View key={idx} style={styles.learningNoteDetailRow}>
              <View style={[styles.learningNoteBullet, { backgroundColor: accentColor }]} />
              <Text style={styles.learningNoteDetailText}>{detail}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function PupilCircle({
  size,
  reactivity,
  label,
}: {
  size: number
  reactivity: PupilReactivity
  label: string
}) {
  // Map 1-8mm to visual diameter 8-48px
  const visualDiameter = Math.max(8, size * 6)
  const color = getReactivityColor(reactivity)

  return (
    <View style={styles.pupilColumn}>
      <Text style={styles.pupilLabel}>{label}</Text>
      <View style={styles.pupilOuter}>
        <View
          style={[
            styles.pupilInner,
            {
              width: visualDiameter,
              height: visualDiameter,
              borderRadius: visualDiameter / 2,
              borderColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.pupilSizeText}>{size}mm</Text>
      <Text style={[styles.pupilReactivityText, { color }]}>
        {getReactivityLabel(reactivity)}
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function GCSCalculatorInteractive({
  lessonData,
  accentColor = DEFAULT_ACCENT,
  onComplete,
}: GCSCalculatorInteractiveProps) {
  // -- Calculator state
  const [gcs, setGCS] = useState<GCSSelection>({ eye: 0, verbal: 0, motor: 0 })
  const calculatorUsed = useRef(false)

  // -- Pupil state
  const [pupils, setPupils] = useState<PupilState>({
    leftSize: 4,
    rightSize: 4,
    leftReactivity: 'reactive',
    rightReactivity: 'reactive',
  })

  // -- Scenario state
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null)
  const [scenarioGCS, setScenarioGCS] = useState<GCSSelection>({ eye: 0, verbal: 0, motor: 0 })
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false)
  const [completedScenarios, setCompletedScenarios] = useState<
    Map<number, { eye: boolean; verbal: boolean; motor: boolean }>
  >(new Map())
  const [showCompletionSummary, setShowCompletionSummary] = useState(false)

  // -- Derived
  const totalGCS = useMemo(() => {
    if (gcs.eye === 0 || gcs.verbal === 0 || gcs.motor === 0) return 0
    return gcs.eye + gcs.verbal + gcs.motor
  }, [gcs])

  const severity = useMemo(() => (totalGCS > 0 ? getSeverity(totalGCS) : null), [totalGCS])

  const scenarioTotal = useMemo(() => {
    if (scenarioGCS.eye === 0 || scenarioGCS.verbal === 0 || scenarioGCS.motor === 0) return 0
    return scenarioGCS.eye + scenarioGCS.verbal + scenarioGCS.motor
  }, [scenarioGCS])

  const activeScenario = useMemo(
    () => PRACTICE_SCENARIOS.find((s) => s.id === activeScenarioId) ?? null,
    [activeScenarioId],
  )

  const allScenariosAttempted = completedScenarios.size === PRACTICE_SCENARIOS.length

  const accuracyStats = useMemo(() => {
    if (completedScenarios.size === 0) return { correct: 0, total: 0, percentage: 0 }
    let correct = 0
    let total = 0
    completedScenarios.forEach((result) => {
      if (result.eye) correct++
      if (result.verbal) correct++
      if (result.motor) correct++
      total += 3
    })
    return { correct, total, percentage: Math.round((correct / total) * 100) }
  }, [completedScenarios])

  // -- Map lessonData steps to sections
  const eyeStep = lessonData.steps.find((s) => s.stepNumber === 1)
  const verbalStep = lessonData.steps.find((s) => s.stepNumber === 2)
  const motorStep = lessonData.steps.find((s) => s.stepNumber === 3)
  const scenarioSteps = lessonData.steps.filter((s) => s.stepNumber > 3)

  // -- Calculator handlers
  const selectEye = useCallback((score: number) => {
    setGCS((p) => ({ ...p, eye: score }))
  }, [])
  const selectVerbal = useCallback((score: number) => {
    setGCS((p) => ({ ...p, verbal: score }))
  }, [])
  const selectMotor = useCallback((score: number) => {
    setGCS((p) => ({ ...p, motor: score }))
  }, [])

  // Mark calculator used when all three have a value
  if (gcs.eye > 0 && gcs.verbal > 0 && gcs.motor > 0) {
    calculatorUsed.current = true
  }

  // -- Scenario handlers
  const startScenario = useCallback((id: number) => {
    setActiveScenarioId(id)
    setScenarioGCS({ eye: 0, verbal: 0, motor: 0 })
    setScenarioSubmitted(false)
  }, [])

  const submitAssessment = useCallback(() => {
    if (!activeScenario) return
    if (scenarioGCS.eye === 0 || scenarioGCS.verbal === 0 || scenarioGCS.motor === 0) return

    setScenarioSubmitted(true)

    const result = {
      eye: scenarioGCS.eye === activeScenario.correctGCS.eye,
      verbal: scenarioGCS.verbal === activeScenario.correctGCS.verbal,
      motor: scenarioGCS.motor === activeScenario.correctGCS.motor,
    }

    setCompletedScenarios((prev) => {
      const next = new Map(prev)
      next.set(activeScenario.id, result)

      // Check if all scenarios now attempted
      if (next.size === PRACTICE_SCENARIOS.length && calculatorUsed.current) {
        setTimeout(() => {
          setShowCompletionSummary(true)
          onComplete?.()
        }, 800)
      }
      return next
    })
  }, [activeScenario, scenarioGCS, onComplete])

  const goToNextScenario = useCallback(() => {
    setActiveScenarioId(null)
    setScenarioGCS({ eye: 0, verbal: 0, motor: 0 })
    setScenarioSubmitted(false)
  }, [])

  const scenarioAnswerReady =
    scenarioGCS.eye > 0 && scenarioGCS.verbal > 0 && scenarioGCS.motor > 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* PANEL 1: GCS CALCULATOR                                           */}
        {/* ================================================================= */}

        {/* Score Display */}
        <View style={styles.scoreDisplayCard}>
          <Text style={styles.scoreDisplayHeading}>Glasgow Coma Scale</Text>

          <View style={styles.scoreDisplayRow}>
            <View style={styles.scoreComponentsContainer}>
              <View style={styles.scoreComponent}>
                <Text style={styles.scoreComponentLabel}>E</Text>
                <Text style={styles.scoreComponentValue}>{gcs.eye || '-'}</Text>
              </View>
              <Text style={styles.scorePlus}>+</Text>
              <View style={styles.scoreComponent}>
                <Text style={styles.scoreComponentLabel}>V</Text>
                <Text style={styles.scoreComponentValue}>{gcs.verbal || '-'}</Text>
              </View>
              <Text style={styles.scorePlus}>+</Text>
              <View style={styles.scoreComponent}>
                <Text style={styles.scoreComponentLabel}>M</Text>
                <Text style={styles.scoreComponentValue}>{gcs.motor || '-'}</Text>
              </View>
              <Text style={styles.scoreEquals}>=</Text>
            </View>

            <View
              style={[
                styles.totalScoreBox,
                severity
                  ? { borderColor: severity.color, backgroundColor: severity.color + '12' }
                  : { borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' },
              ]}
            >
              <Text
                style={[
                  styles.totalScoreNumber,
                  severity ? { color: severity.color } : { color: '#9CA3AF' },
                ]}
              >
                {totalGCS > 0 ? totalGCS : '--'}
              </Text>
            </View>
          </View>

          {severity && (
            <>
              <View style={[styles.severityBadge, { backgroundColor: severity.color + '14' }]}>
                <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
                <Text style={[styles.severityLabel, { color: severity.color }]}>
                  {severity.label} ({severity.range})
                </Text>
              </View>
              <View style={styles.clinicalImplicationBox}>
                <Ionicons name="medical-outline" size={14} color="#6B7280" />
                <Text style={styles.clinicalImplicationText}>
                  {getClinicalImplication(totalGCS)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Eye Opening */}
        {eyeStep && <LearningNoteCard step={eyeStep} accentColor={accentColor} />}
        <GCSCategory
          title="Eye Opening"
          code="E"
          options={EYE_OPTIONS}
          selectedScore={gcs.eye}
          accentColor={accentColor}
          onSelect={selectEye}
        />

        {/* Verbal Response */}
        {verbalStep && <LearningNoteCard step={verbalStep} accentColor={accentColor} />}
        <GCSCategory
          title="Verbal Response"
          code="V"
          options={VERBAL_OPTIONS}
          selectedScore={gcs.verbal}
          accentColor={accentColor}
          onSelect={selectVerbal}
        />

        {/* Motor Response */}
        {motorStep && <LearningNoteCard step={motorStep} accentColor={accentColor} />}
        <GCSCategory
          title="Motor Response"
          code="M"
          options={MOTOR_OPTIONS}
          selectedScore={gcs.motor}
          accentColor={accentColor}
          onSelect={selectMotor}
        />

        {/* ================================================================= */}
        {/* PUPIL ASSESSMENT                                                  */}
        {/* ================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="eye-outline" size={20} color={accentColor} />
            <Text style={styles.sectionTitle}>Pupil Assessment</Text>
          </View>

          {/* Visual pupils */}
          <View style={styles.pupilVisualRow}>
            <PupilCircle
              size={pupils.leftSize}
              reactivity={pupils.leftReactivity}
              label="Left"
            />
            <PupilCircle
              size={pupils.rightSize}
              reactivity={pupils.rightReactivity}
              label="Right"
            />
          </View>

          {/* Equality check */}
          <View style={styles.pupilEqualityRow}>
            {pupils.leftSize === pupils.rightSize ? (
              <View style={[styles.equalityBadge, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={16} color={SEVERITY_COLORS.mild} />
                <Text style={[styles.equalityText, { color: SEVERITY_COLORS.mild }]}>
                  Pupils Equal
                </Text>
              </View>
            ) : (
              <View style={[styles.equalityBadge, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle" size={16} color={SEVERITY_COLORS.severe} />
                <Text style={[styles.equalityText, { color: SEVERITY_COLORS.severe }]}>
                  Unequal ({Math.abs(pupils.leftSize - pupils.rightSize)}mm diff)
                </Text>
              </View>
            )}
          </View>

          {/* PERRL reminder */}
          <View style={styles.perrlBox}>
            <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
            <Text style={styles.perrlText}>
              <Text style={styles.perrlAcronym}>PERRL</Text> — Pupils Equal, Round, Reactive to Light
            </Text>
          </View>

          {/* Left pupil controls */}
          <Text style={styles.pupilSectionLabel}>Left Pupil</Text>
          <Text style={styles.pupilControlLabel}>Size (mm)</Text>
          <View style={styles.pupilSizeRow}>
            {PUPIL_SIZES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setPupils((p) => ({ ...p, leftSize: s }))}
                style={[
                  styles.pupilSizeChip,
                  pupils.leftSize === s && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
                accessibilityLabel={`Left pupil ${s} millimeters`}
                accessibilityState={{ selected: pupils.leftSize === s }}
              >
                <Text
                  style={[
                    styles.pupilSizeChipText,
                    pupils.leftSize === s && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.pupilControlLabel}>Reactivity</Text>
          <View style={styles.reactivityRow}>
            {REACTIVITY_OPTIONS.map((opt) => {
              const selected = pupils.leftReactivity === opt.value
              const color = getReactivityColor(opt.value)
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPupils((p) => ({ ...p, leftReactivity: opt.value }))}
                  style={[
                    styles.reactivityChip,
                    selected && { backgroundColor: color + '18', borderColor: color },
                  ]}
                  accessibilityLabel={`Left ${opt.label}`}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.reactivityChipText,
                      selected && { color, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* Right pupil controls */}
          <Text style={[styles.pupilSectionLabel, { marginTop: 16 }]}>Right Pupil</Text>
          <Text style={styles.pupilControlLabel}>Size (mm)</Text>
          <View style={styles.pupilSizeRow}>
            {PUPIL_SIZES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setPupils((p) => ({ ...p, rightSize: s }))}
                style={[
                  styles.pupilSizeChip,
                  pupils.rightSize === s && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
                accessibilityLabel={`Right pupil ${s} millimeters`}
                accessibilityState={{ selected: pupils.rightSize === s }}
              >
                <Text
                  style={[
                    styles.pupilSizeChipText,
                    pupils.rightSize === s && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.pupilControlLabel}>Reactivity</Text>
          <View style={styles.reactivityRow}>
            {REACTIVITY_OPTIONS.map((opt) => {
              const selected = pupils.rightReactivity === opt.value
              const color = getReactivityColor(opt.value)
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPupils((p) => ({ ...p, rightReactivity: opt.value }))}
                  style={[
                    styles.reactivityChip,
                    selected && { backgroundColor: color + '18', borderColor: color },
                  ]}
                  accessibilityLabel={`Right ${opt.label}`}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.reactivityChipText,
                      selected && { color, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* ================================================================= */}
        {/* PANEL 2: PRACTICE SCENARIOS                                       */}
        {/* ================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="clipboard-outline" size={20} color={accentColor} />
            <Text style={styles.sectionTitle}>Practice Scenarios</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Read each patient scenario and select the correct E, V, M scores.
          </Text>

          {/* Progress dots */}
          <View style={styles.scenarioProgressRow}>
            {PRACTICE_SCENARIOS.map((s) => {
              const done = completedScenarios.has(s.id)
              return (
                <View
                  key={s.id}
                  style={[
                    styles.scenarioProgressDot,
                    done
                      ? { backgroundColor: SEVERITY_COLORS.mild }
                      : { backgroundColor: '#D1D5DB' },
                  ]}
                >
                  {done && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              )
            })}
            <Text style={styles.scenarioProgressText}>
              {completedScenarios.size}/{PRACTICE_SCENARIOS.length} Complete
            </Text>
          </View>

          {/* Learning notes for scenarios */}
          {scenarioSteps.length > 0 && activeScenarioId === null && (
            <View style={styles.scenarioNotesContainer}>
              {scenarioSteps.map((step) => (
                <LearningNoteCard key={step.stepNumber} step={step} accentColor={accentColor} />
              ))}
            </View>
          )}

          {/* Scenario list or active scenario */}
          {activeScenarioId === null ? (
            <View style={styles.scenarioList}>
              {PRACTICE_SCENARIOS.map((scenario) => {
                const done = completedScenarios.has(scenario.id)
                const result = completedScenarios.get(scenario.id)
                const allCorrect = result
                  ? result.eye && result.verbal && result.motor
                  : false
                return (
                  <Pressable
                    key={scenario.id}
                    style={[styles.scenarioCard, done && styles.scenarioCardDone]}
                    onPress={() => startScenario(scenario.id)}
                    accessibilityLabel={`Scenario ${scenario.id}: ${scenario.title}${done ? ', completed' : ''}`}
                  >
                    <View style={styles.scenarioCardLeft}>
                      <View
                        style={[
                          styles.scenarioNumberBadge,
                          done
                            ? { backgroundColor: allCorrect ? SEVERITY_COLORS.mild : SEVERITY_COLORS.moderate }
                            : { backgroundColor: accentColor },
                        ]}
                      >
                        {done ? (
                          <Ionicons
                            name={allCorrect ? 'checkmark' : 'refresh'}
                            size={16}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text style={styles.scenarioNumberText}>{scenario.id}</Text>
                        )}
                      </View>
                      <View style={styles.scenarioCardTextContainer}>
                        <Text style={styles.scenarioCardTitle}>{scenario.title}</Text>
                        <Text style={styles.scenarioCardSubtext} numberOfLines={1}>
                          {scenario.patientDescription}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={done ? 'eye-outline' : 'chevron-forward'}
                      size={20}
                      color={done ? '#9CA3AF' : accentColor}
                    />
                  </Pressable>
                )
              })}
            </View>
          ) : activeScenario ? (
            <View style={styles.activeScenarioContainer}>
              {/* Header */}
              <View style={styles.activeScenarioHeader}>
                <View style={styles.activeScenarioTitleRow}>
                  <View style={[styles.scenarioNumberBadge, { backgroundColor: accentColor }]}>
                    <Text style={styles.scenarioNumberText}>{activeScenario.id}</Text>
                  </View>
                  <Text style={styles.activeScenarioTitle}>{activeScenario.title}</Text>
                </View>
                <Pressable
                  onPress={goToNextScenario}
                  style={styles.closeButton}
                  accessibilityLabel="Close scenario"
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Patient description */}
              <View style={styles.patientDescriptionCard}>
                <View style={styles.patientDescriptionHeader}>
                  <Ionicons name="person-outline" size={16} color={accentColor} />
                  <Text style={[styles.patientDescriptionLabel, { color: accentColor }]}>
                    Patient
                  </Text>
                </View>
                <Text style={styles.patientDescriptionText}>
                  {activeScenario.patientDescription}
                </Text>
              </View>

              {/* Observable findings */}
              <View style={styles.findingsCard}>
                <View style={styles.findingsHeader}>
                  <Ionicons name="search-outline" size={16} color="#7C3AED" />
                  <Text style={styles.findingsLabel}>Observable Findings</Text>
                </View>
                <Text style={styles.findingsText}>{activeScenario.findings}</Text>
              </View>

              {/* Scenario GCS selectors */}
              <GCSCategory
                title="Eye Opening"
                code="E"
                options={EYE_OPTIONS}
                selectedScore={scenarioGCS.eye}
                accentColor={accentColor}
                onSelect={(s) => !scenarioSubmitted && setScenarioGCS((p) => ({ ...p, eye: s }))}
                correctScore={activeScenario.correctGCS.eye}
                showFeedback={scenarioSubmitted}
              />
              <GCSCategory
                title="Verbal Response"
                code="V"
                options={VERBAL_OPTIONS}
                selectedScore={scenarioGCS.verbal}
                accentColor={accentColor}
                onSelect={(s) => !scenarioSubmitted && setScenarioGCS((p) => ({ ...p, verbal: s }))}
                correctScore={activeScenario.correctGCS.verbal}
                showFeedback={scenarioSubmitted}
              />
              <GCSCategory
                title="Motor Response"
                code="M"
                options={MOTOR_OPTIONS}
                selectedScore={scenarioGCS.motor}
                accentColor={accentColor}
                onSelect={(s) => !scenarioSubmitted && setScenarioGCS((p) => ({ ...p, motor: s }))}
                correctScore={activeScenario.correctGCS.motor}
                showFeedback={scenarioSubmitted}
              />

              {/* Submit button */}
              {!scenarioSubmitted && (
                <Pressable
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: scenarioAnswerReady ? accentColor : '#D1D5DB',
                    },
                  ]}
                  onPress={submitAssessment}
                  disabled={!scenarioAnswerReady}
                  accessibilityLabel="Submit Assessment"
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Assessment</Text>
                </Pressable>
              )}

              {/* Feedback after submission */}
              {scenarioSubmitted && activeScenario && (
                <View style={styles.feedbackContainer}>
                  {/* Per-category results */}
                  {(['eye', 'verbal', 'motor'] as const).map((cat) => {
                    const isCorrect = scenarioGCS[cat] === activeScenario.correctGCS[cat]
                    const catLabel = cat === 'eye' ? 'Eye Opening' : cat === 'verbal' ? 'Verbal Response' : 'Motor Response'
                    const catCode = cat === 'eye' ? 'E' : cat === 'verbal' ? 'V' : 'M'
                    return (
                      <View
                        key={cat}
                        style={[
                          styles.feedbackCategoryRow,
                          {
                            backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
                            borderLeftColor: isCorrect ? SEVERITY_COLORS.mild : SEVERITY_COLORS.severe,
                          },
                        ]}
                      >
                        <View style={styles.feedbackCategoryHeader}>
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={isCorrect ? SEVERITY_COLORS.mild : SEVERITY_COLORS.severe}
                          />
                          <Text
                            style={[
                              styles.feedbackCategoryTitle,
                              { color: isCorrect ? SEVERITY_COLORS.mild : SEVERITY_COLORS.severe },
                            ]}
                          >
                            {catLabel} ({catCode})
                          </Text>
                          {!isCorrect && (
                            <Text style={styles.feedbackScoreComparison}>
                              Your: {catCode}{scenarioGCS[cat]} | Correct: {catCode}{activeScenario.correctGCS[cat]}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.feedbackExplanation}>
                          {activeScenario.categoryExplanations[cat]}
                        </Text>
                      </View>
                    )
                  })}

                  {/* Overall result */}
                  {(() => {
                    const allCorrect =
                      scenarioGCS.eye === activeScenario.correctGCS.eye &&
                      scenarioGCS.verbal === activeScenario.correctGCS.verbal &&
                      scenarioGCS.motor === activeScenario.correctGCS.motor
                    const correctTotal =
                      activeScenario.correctGCS.eye +
                      activeScenario.correctGCS.verbal +
                      activeScenario.correctGCS.motor
                    const correctSeverity = getSeverity(correctTotal)
                    return (
                      <View style={styles.feedbackOverallCard}>
                        <Text style={styles.feedbackOverallLabel}>
                          Correct Score: {correctTotal}/15 — {correctSeverity.label}
                        </Text>
                        <Text
                          style={[
                            styles.feedbackOverallStatus,
                            {
                              color: allCorrect ? SEVERITY_COLORS.mild : SEVERITY_COLORS.severe,
                            },
                          ]}
                        >
                          {allCorrect
                            ? 'All categories correct!'
                            : `${[
                                scenarioGCS.eye === activeScenario.correctGCS.eye,
                                scenarioGCS.verbal === activeScenario.correctGCS.verbal,
                                scenarioGCS.motor === activeScenario.correctGCS.motor,
                              ].filter(Boolean).length}/3 categories correct`}
                        </Text>
                      </View>
                    )
                  })()}

                  {/* Next Scenario button */}
                  <Pressable
                    style={[styles.nextScenarioButton, { backgroundColor: accentColor }]}
                    onPress={goToNextScenario}
                  >
                    <Text style={styles.nextScenarioButtonText}>
                      {allScenariosAttempted ? 'View Results' : 'Next Scenario'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* ================================================================= */}
        {/* COMPLETION SUMMARY                                                */}
        {/* ================================================================= */}
        {showCompletionSummary && (
          <View style={styles.completionCard}>
            <View style={styles.completionIconContainer}>
              <Ionicons name="trophy" size={36} color={SEVERITY_COLORS.mild} />
            </View>
            <Text style={styles.completionTitle}>GCS Assessment Complete</Text>
            <Text style={styles.completionSubtitle}>
              You completed all 3 patient scenarios.
            </Text>

            <View style={styles.accuracyContainer}>
              <Text style={styles.accuracyNumber}>{accuracyStats.percentage}%</Text>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
              <Text style={styles.accuracyDetail}>
                {accuracyStats.correct}/{accuracyStats.total} categories scored correctly
              </Text>
            </View>

            <View style={styles.completionScenarioSummary}>
              {PRACTICE_SCENARIOS.map((scenario) => {
                const result = completedScenarios.get(scenario.id)
                const correct = result
                  ? [result.eye, result.verbal, result.motor].filter(Boolean).length
                  : 0
                return (
                  <View key={scenario.id} style={styles.completionScenarioRow}>
                    <View
                      style={[
                        styles.completionScenarioDot,
                        {
                          backgroundColor:
                            correct === 3
                              ? SEVERITY_COLORS.mild
                              : correct >= 2
                                ? SEVERITY_COLORS.moderate
                                : SEVERITY_COLORS.severe,
                        },
                      ]}
                    >
                      <Text style={styles.completionScenarioDotText}>{correct}/3</Text>
                    </View>
                    <Text style={styles.completionScenarioName}>{scenario.title}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 48 }} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // -- Score Display
  scoreDisplayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  scoreDisplayHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  scoreDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scoreComponentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreComponent: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
  },
  scoreComponentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  scoreComponentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    fontVariant: ['tabular-nums'],
  },
  scorePlus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  scoreEquals: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  totalScoreBox: {
    borderRadius: 14,
    borderWidth: 2.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalScoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  clinicalImplicationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
  },
  clinicalImplicationText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    flex: 1,
  },

  // -- Category Card
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryCodeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  categoryScoreTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryScoreTagText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // -- Option Row
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  optionScoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  optionScoreNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  // -- Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 14,
    marginTop: 4,
    lineHeight: 20,
  },

  // -- Pupil Assessment
  pupilVisualRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginTop: 16,
    marginBottom: 16,
  },
  pupilColumn: {
    alignItems: 'center',
    gap: 6,
  },
  pupilLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pupilOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupilInner: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
  },
  pupilSizeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  pupilReactivityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pupilEqualityRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  equalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  equalityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  perrlBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0369A1',
  },
  perrlText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    flex: 1,
  },
  perrlAcronym: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pupilSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  pupilControlLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    marginTop: 4,
  },
  pupilSizeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pupilSizeChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pupilSizeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  reactivityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reactivityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  reactivityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // -- Learning Note Card
  learningNoteCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: DEFAULT_ACCENT,
  },
  learningNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  learningNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  learningNoteLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  learningNoteDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    marginBottom: 8,
  },
  learningNoteDetails: {
    gap: 6,
  },
  learningNoteDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  learningNoteBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  learningNoteDetailText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    flex: 1,
  },

  // -- Scenario Progress
  scenarioProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  scenarioProgressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scenarioProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  scenarioNotesContainer: {
    marginBottom: 12,
  },

  // -- Scenario List
  scenarioList: {
    gap: 10,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scenarioCardDone: {
    borderColor: '#D1D5DB',
  },
  scenarioCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scenarioNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scenarioNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scenarioCardTextContainer: {
    flex: 1,
  },
  scenarioCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  scenarioCardSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  // -- Active Scenario
  activeScenarioContainer: {
    gap: 12,
  },
  activeScenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeScenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeScenarioTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientDescriptionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  patientDescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  patientDescriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientDescriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  findingsCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  findingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  findingsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  findingsText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 21,
    fontStyle: 'italic',
  },

  // -- Submit button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // -- Feedback
  feedbackContainer: {
    gap: 10,
    marginTop: 4,
  },
  feedbackCategoryRow: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  feedbackCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  feedbackCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackScoreComparison: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  feedbackExplanation: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  feedbackOverallCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  feedbackOverallLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  feedbackOverallStatus: {
    fontSize: 13,
    fontWeight: '600',
  },

  // -- Next Scenario button
  nextScenarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextScenarioButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // -- Completion
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  completionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: SEVERITY_COLORS.mild,
    marginBottom: 4,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  accuracyContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  accuracyNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    fontVariant: ['tabular-nums'],
  },
  accuracyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  accuracyDetail: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  completionScenarioSummary: {
    width: '100%',
    gap: 8,
  },
  completionScenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completionScenarioDot: {
    width: 36,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionScenarioDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completionScenarioName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
})

export default GCSCalculatorInteractive
