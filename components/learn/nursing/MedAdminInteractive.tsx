/**
 * MedAdminInteractive -- 6 Rights of Medication Administration
 *
 * Two-phase interactive walkthrough:
 *
 * Phase 1: Learn the 6 Rights
 *   Vertical scrollable cards for each Right. Each card expands on tap to
 *   reveal a checklist, "Why this matters" section, patient communication
 *   example, and preceptor cue. Students must acknowledge each Right with
 *   an "I understand this Right" button before proceeding.
 *
 * Phase 2: Practice Scenarios
 *   Three medication error scenarios where the student identifies which
 *   Right(s) were violated. Multi-select from the 6 Rights, then check
 *   the answer for immediate feedback.
 *
 * Completion requires all 6 Rights reviewed + all 3 scenarios attempted.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NursingLessonData, NursingStep } from './NursingStepViewer'

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MedAdminInteractiveProps {
  lessonData: NursingLessonData
  accentColor?: string
  onComplete?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7'
const BG_COLOR = '#FAF8F5'
const CARD_BG = '#FFFFFF'
const COMPLETED_GREEN = '#15803D'
const COMPLETED_GREEN_BG = '#DCFCE7'
const ERROR_RED = '#DC2626'
const ERROR_RED_BG = '#FEF2F2'
const WARNING_AMBER = '#B45309'

// ---------------------------------------------------------------------------
// 6 Rights definitions
// ---------------------------------------------------------------------------

type RightIconName =
  | 'person-outline'
  | 'medical-outline'
  | 'calculator-outline'
  | 'navigate-outline'
  | 'time-outline'
  | 'document-text-outline'

interface RightDefinition {
  number: number
  title: string
  icon: RightIconName
  badgeColor: string
  checklist: string[]
  defaultDescription: string
  defaultRisks: string[]
  defaultPatientCommunication: string
  defaultPreceptorCue: string
}

const RIGHTS: RightDefinition[] = [
  {
    number: 1,
    title: 'Right Patient',
    icon: 'person-outline',
    badgeColor: '#0369A1',
    checklist: [
      'Verify identity using 2 identifiers (name + DOB, or name + MRN)',
      'Check patient armband against the MAR',
      'Ask patient to state their full name',
      'Do NOT use room or bed number as an identifier',
    ],
    defaultDescription:
      'Confirm the medication is intended for this specific patient by verifying at least two unique identifiers before every administration.',
    defaultRisks: [
      'Wrong patient receives medication, potentially causing adverse reactions',
      'Intended patient misses their scheduled dose',
      'Sentinel event requiring incident report and root cause analysis',
    ],
    defaultPatientCommunication:
      'Can you please tell me your full name and date of birth so I can verify your identity?',
    defaultPreceptorCue:
      'Watch for the student to check TWO identifiers on the armband. Name alone is never sufficient.',
  },
  {
    number: 2,
    title: 'Right Medication',
    icon: 'medical-outline',
    badgeColor: '#7C3AED',
    checklist: [
      'Compare MAR order to medication label',
      'Check generic vs brand name equivalency',
      'Verify the patient has no allergies to this drug',
      'Perform 3 label checks: from drawer, when preparing, at bedside',
    ],
    defaultDescription:
      'Verify the drug name on the label matches the medication ordered in the MAR. Check three times: when pulling from storage, during preparation, and at the bedside.',
    defaultRisks: [
      'Look-alike/sound-alike drug error (e.g., Losartan vs Lisinopril)',
      'Allergic reaction if allergy status is not verified',
      'Adverse drug interaction with current medications',
    ],
    defaultPatientCommunication:
      'I have your Lisinopril ready. Do you have any allergies I should know about before we proceed?',
    defaultPreceptorCue:
      'Ask the student to show you the medication label alongside the MAR. Watch for the 3-check habit.',
  },
  {
    number: 3,
    title: 'Right Dose',
    icon: 'calculator-outline',
    badgeColor: '#B45309',
    checklist: [
      'Verify ordered dose matches what you are preparing',
      'Perform dose calculation: Desired / Have x Volume',
      'Check if dose is within safe range for patient weight/age',
      'Have a second nurse verify high-alert medications',
    ],
    defaultDescription:
      'Calculate the correct amount of medication. Use the formula: Desired dose / Available dose x Volume. Always double-check math on high-alert drugs.',
    defaultRisks: [
      'Overdose leading to toxicity or organ damage',
      'Underdose resulting in therapeutic failure',
      'Narrow therapeutic index drugs are especially dangerous when mis-dosed',
    ],
    defaultPatientCommunication:
      'I am giving you 10 milligrams of Lisinopril, which is one tablet. Does that sound like your usual dose?',
    defaultPreceptorCue:
      'Ask the student to verbalize the dose calculation before drawing up or dispensing the medication.',
  },
  {
    number: 4,
    title: 'Right Route',
    icon: 'navigate-outline',
    badgeColor: '#DC2626',
    checklist: [
      'Confirm administration route: PO, IV, IM, SubQ, topical, etc.',
      'Verify medication formulation matches the route (tablet = PO)',
      'Check if patient can take by this route (NPO status, swallowing ability)',
      'Use correct technique for the route (e.g., Z-track for IM)',
    ],
    defaultDescription:
      'Confirm the ordered route of administration matches the drug formulation and the patient can safely receive medication by that route.',
    defaultRisks: [
      'Wrong route can cause rapid, uncontrollable absorption',
      'Oral medication given IV could cause fatal embolism',
      'Local tissue damage from inappropriate route',
    ],
    defaultPatientCommunication:
      'This medication is to be taken by mouth with a glass of water. Are you able to swallow pills right now?',
    defaultPreceptorCue:
      'Verify the student checks NPO status and swallowing ability before administering oral medications.',
  },
  {
    number: 5,
    title: 'Right Time',
    icon: 'time-outline',
    badgeColor: '#15803D',
    checklist: [
      'Check the scheduled administration time on the MAR',
      'Verify you are within the acceptable window (usually +/- 30 min)',
      'Check timing with food requirements or other medications',
      'Know which drugs are time-critical (antibiotics, insulin, anticoagulants)',
    ],
    defaultDescription:
      'Administer the medication within the acceptable time window of the scheduled time. Most facilities allow +/- 30 minutes unless the drug is time-critical.',
    defaultRisks: [
      'Sub-therapeutic troughs if given too late',
      'Toxic peaks if given too early or doubled up',
      'Disruption of medication schedule affecting subsequent doses',
    ],
    defaultPatientCommunication:
      'Your Lisinopril is scheduled for 9 AM. It is 8:52 right now, so we are within the administration window.',
    defaultPreceptorCue:
      'Ask the student what the acceptable time window is and whether this drug is considered time-critical.',
  },
  {
    number: 6,
    title: 'Right Documentation',
    icon: 'document-text-outline',
    badgeColor: '#6B21A8',
    checklist: [
      'Document IMMEDIATELY after administration (never pre-chart)',
      'Record: drug name, dose, route, time administered',
      'Record site for injections (e.g., left deltoid)',
      'Note patient response and any adverse reactions',
      'Sign with your credentials / initials',
    ],
    defaultDescription:
      'Document the medication administration in the MAR immediately after giving the drug. Include drug, dose, route, time, site (if applicable), and patient response.',
    defaultRisks: [
      'Another nurse may give a duplicate dose if not charted',
      'Missed documentation creates legal liability',
      'Inaccurate records affect ongoing care decisions and pharmacokinetics',
    ],
    defaultPatientCommunication:
      'I have administered your medication and I am documenting it in your chart now. Please let me know if you experience any unusual symptoms.',
    defaultPreceptorCue:
      'Ensure the student documents at the bedside immediately, not back at the nurses station from memory.',
  },
]

// ---------------------------------------------------------------------------
// Practice Scenarios (Phase 2)
// ---------------------------------------------------------------------------

interface Scenario {
  id: number
  title: string
  description: string
  violations: number[] // which Right numbers are violated (1-indexed)
  teachingPoint: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'The wrong patient',
    description:
      'You have Lisinopril 10mg for Room 412 Bed A (John Smith). You walk into Room 412 and hand the medication cup to the patient in Bed B without checking their armband.',
    violations: [1],
    teachingPoint:
      'Always verify 2 identifiers. Room and bed numbers are NOT identifiers. Even if you think you know the patient, always check the armband and ask them to state their name.',
  },
  {
    id: 2,
    title: 'The calculation error',
    description:
      'Order reads: Morphine 4mg IV push. Vial reads: Morphine 10mg/mL. You draw up 4mL.',
    violations: [3],
    teachingPoint:
      'Always calculate: Desired / Have x Volume. 4mg / 10mg x 1mL = 0.4mL, not 4mL. That would be a 10x overdose. Have a second nurse verify high-alert medications like opioids.',
  },
  {
    id: 3,
    title: 'The timing overlap',
    description:
      "Patient's MAR shows Metoprolol 25mg PO at 0900 and Diltiazem 30mg PO at 0900. Both are due now. Patient's HR is 52 and BP is 98/60.",
    violations: [5],
    teachingPoint:
      'Hold both medications. Notify provider. Document: "Metoprolol and Diltiazem held for HR 52, BP 98/60. Provider notified." Both are rate-slowing agents and the patient is already bradycardic and hypotensive. Clinical judgment overrides the scheduled time.',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MedAdminInteractive({
  lessonData,
  accentColor = DEFAULT_ACCENT,
  onComplete,
}: MedAdminInteractiveProps) {
  // Phase management
  const [phase, setPhase] = useState<'learn' | 'practice' | 'complete'>(
    'learn',
  )

  // Phase 1 state
  const [expandedRight, setExpandedRight] = useState<number | null>(null)
  const [acknowledgedRights, setAcknowledgedRights] = useState<Set<number>>(
    new Set(),
  )
  const [checkedItems, setCheckedItems] = useState<Record<number, Set<number>>>(
    {},
  )

  // Phase 2 state
  const [currentScenario, setCurrentScenario] = useState(0)
  const [selectedViolations, setSelectedViolations] = useState<Set<number>>(
    new Set(),
  )
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false)
  const [scenarioResults, setScenarioResults] = useState<
    { scenarioId: number; correct: boolean }[]
  >([])

  const scrollRef = useRef<ScrollView>(null)

  // Map lesson steps to Rights by stepNumber
  const stepsByNumber = useMemo(() => {
    const map: Record<number, NursingStep> = {}
    for (const step of lessonData.steps) {
      map[step.stepNumber] = step
    }
    return map
  }, [lessonData.steps])

  // Supplementary steps (stepNumber > 6)
  const supplementarySteps = useMemo(
    () => lessonData.steps.filter((s) => s.stepNumber > 6),
    [lessonData.steps],
  )

  const allRightsAcknowledged = acknowledgedRights.size >= 6

  // -----------------------------------------------------------------------
  // Phase 1 handlers
  // -----------------------------------------------------------------------

  const handleToggleExpand = useCallback(
    (rightNumber: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setExpandedRight((prev) => (prev === rightNumber ? null : rightNumber))
    },
    [],
  )

  const handleToggleCheckItem = useCallback(
    (rightNumber: number, itemIndex: number) => {
      setCheckedItems((prev) => {
        const current = prev[rightNumber] ?? new Set<number>()
        const next = new Set(current)
        if (next.has(itemIndex)) {
          next.delete(itemIndex)
        } else {
          next.add(itemIndex)
        }
        return { ...prev, [rightNumber]: next }
      })
    },
    [],
  )

  const handleAcknowledge = useCallback(
    (rightNumber: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setAcknowledgedRights((prev) => {
        const next = new Set(prev)
        next.add(rightNumber)
        return next
      })
      setExpandedRight(null)
    },
    [],
  )

  const handleStartPractice = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setPhase('practice')
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }, [])

  // -----------------------------------------------------------------------
  // Phase 2 handlers
  // -----------------------------------------------------------------------

  const handleToggleViolation = useCallback(
    (rightNumber: number) => {
      if (scenarioSubmitted) return
      setSelectedViolations((prev) => {
        const next = new Set(prev)
        if (next.has(rightNumber)) {
          next.delete(rightNumber)
        } else {
          next.add(rightNumber)
        }
        return next
      })
    },
    [scenarioSubmitted],
  )

  const handleCheckAnswer = useCallback(() => {
    const scenario = SCENARIOS[currentScenario]
    const violationSet = new Set(scenario.violations)
    const isCorrect =
      selectedViolations.size === violationSet.size &&
      [...selectedViolations].every((v) => violationSet.has(v))

    setScenarioSubmitted(true)
    setScenarioResults((prev) => [
      ...prev,
      { scenarioId: scenario.id, correct: isCorrect },
    ])
  }, [currentScenario, selectedViolations])

  const handleNextScenario = useCallback(() => {
    if (currentScenario < SCENARIOS.length - 1) {
      setCurrentScenario((prev) => prev + 1)
      setSelectedViolations(new Set())
      setScenarioSubmitted(false)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setPhase('complete')
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }
  }, [currentScenario])

  const handleFinish = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  // -----------------------------------------------------------------------
  // Progress ring helper
  // -----------------------------------------------------------------------

  const totalProgress = useMemo(() => {
    const learnProgress = acknowledgedRights.size
    const practiceProgress = scenarioResults.length
    return { learn: learnProgress, practice: practiceProgress, total: 9 }
  }, [acknowledgedRights.size, scenarioResults.length])

  // -----------------------------------------------------------------------
  // Render: Progress ring (6 segments for the Rights)
  // -----------------------------------------------------------------------

  const renderProgressRing = () => {
    const size = 140
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const segmentGap = 4
    const segmentLength = (circumference - segmentGap * 6) / 6

    return (
      <View style={styles.progressRingContainer}>
        <View style={{ width: size, height: size, position: 'relative' }}>
          {/* Background ring segments */}
          {RIGHTS.map((right, idx) => {
            const acknowledged = acknowledgedRights.has(right.number)
            const rotation = (idx * 360) / 6 - 90
            const color = acknowledged ? COMPLETED_GREEN : '#E5E7EB'

            return (
              <View
                key={right.number}
                style={[
                  styles.ringSegment,
                  {
                    width: size,
                    height: size,
                    transform: [{ rotate: `${rotation}deg` }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.ringSegmentBar,
                    {
                      width: strokeWidth,
                      height: segmentLength,
                      backgroundColor: color,
                      borderRadius: strokeWidth / 2,
                      top: 0,
                      left: size / 2 - strokeWidth / 2,
                    },
                  ]}
                />
              </View>
            )
          })}
          {/* Center text */}
          <View style={styles.ringCenter}>
            <Text style={[styles.ringCenterNumber, { color: accentColor }]}>
              {acknowledgedRights.size}
            </Text>
            <Text style={styles.ringCenterLabel}>of 6</Text>
          </View>
        </View>
        {/* Legend row */}
        <View style={styles.ringLegend}>
          {RIGHTS.map((right) => {
            const acknowledged = acknowledgedRights.has(right.number)
            return (
              <View key={right.number} style={styles.ringLegendItem}>
                <View
                  style={[
                    styles.ringLegendDot,
                    {
                      backgroundColor: acknowledged
                        ? COMPLETED_GREEN
                        : right.badgeColor,
                    },
                  ]}
                />
                <Ionicons
                  name={right.icon as any}
                  size={14}
                  color={acknowledged ? COMPLETED_GREEN : right.badgeColor}
                />
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Individual Right card (Phase 1)
  // -----------------------------------------------------------------------

  const renderRightCard = (right: RightDefinition) => {
    const isExpanded = expandedRight === right.number
    const isAcknowledged = acknowledgedRights.has(right.number)
    const step = stepsByNumber[right.number]
    const checked = checkedItems[right.number] ?? new Set<number>()

    // Pull data from lesson step if available, otherwise use defaults
    const description = step?.description ?? right.defaultDescription
    const risks =
      step?.risks && step.risks.length > 0
        ? step.risks
        : right.defaultRisks
    const patientComm =
      step?.patientCommunication ?? right.defaultPatientCommunication
    const preceptorCue = step?.preceptorCue ?? right.defaultPreceptorCue

    return (
      <View key={right.number} style={styles.rightCard}>
        {/* Collapsed header -- always visible */}
        <Pressable
          style={styles.rightCardHeader}
          onPress={() => handleToggleExpand(right.number)}
          accessibilityLabel={`${right.title}. ${isAcknowledged ? 'Completed.' : 'Tap to expand.'}`}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.rightBadge,
              {
                backgroundColor: isAcknowledged
                  ? COMPLETED_GREEN
                  : right.badgeColor,
              },
            ]}
          >
            {isAcknowledged ? (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            ) : (
              <Ionicons name={right.icon as any} size={18} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.rightCardTitleContainer}>
            <Text style={styles.rightCardNumber}>Right {right.number}</Text>
            <Text style={styles.rightCardTitle}>{right.title}</Text>
          </View>

          {isAcknowledged && (
            <View style={styles.acknowledgedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COMPLETED_GREEN} />
              <Text style={styles.acknowledgedText}>Reviewed</Text>
            </View>
          )}

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9CA3AF"
          />
        </Pressable>

        {/* Acknowledged summary (shown when collapsed and acknowledged) */}
        {isAcknowledged && !isExpanded && (
          <View style={styles.acknowledgedSummary}>
            <Text style={styles.acknowledgedSummaryText} numberOfLines={2}>
              {description}
            </Text>
          </View>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <View style={styles.rightCardBody}>
            {/* Description */}
            <Text style={styles.rightDescription}>{description}</Text>

            {/* Checklist */}
            <View style={styles.checklistContainer}>
              <Text style={styles.checklistTitle}>What to check:</Text>
              {right.checklist.map((item, idx) => {
                const isChecked = checked.has(idx)
                return (
                  <Pressable
                    key={idx}
                    style={styles.checklistRow}
                    onPress={() => handleToggleCheckItem(right.number, idx)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && {
                          backgroundColor: COMPLETED_GREEN,
                          borderColor: COMPLETED_GREEN,
                        },
                      ]}
                    >
                      {isChecked && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.checklistText,
                        isChecked && styles.checklistTextChecked,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {/* Why this matters (expandable) */}
            <WhyThisMattersSection
              risks={risks}
              accentColor={accentColor}
            />

            {/* Patient communication */}
            <View style={styles.communicationBox}>
              <View style={styles.communicationHeader}>
                <Ionicons name="chatbubble-outline" size={14} color="#0369A1" />
                <Text style={styles.communicationTitle}>
                  Patient Communication Example
                </Text>
              </View>
              <Text style={styles.communicationText}>
                &ldquo;{patientComm}&rdquo;
              </Text>
            </View>

            {/* Preceptor cue */}
            <View style={styles.preceptorBox}>
              <View style={styles.preceptorHeader}>
                <Ionicons name="school-outline" size={14} color="#7C3AED" />
                <Text style={styles.preceptorTitle}>Preceptor Cue</Text>
              </View>
              <Text style={styles.preceptorText}>{preceptorCue}</Text>
            </View>

            {/* Acknowledge button */}
            {!isAcknowledged && (
              <Pressable
                style={[
                  styles.acknowledgeButton,
                  { backgroundColor: accentColor },
                ]}
                onPress={() => handleAcknowledge(right.number)}
                accessibilityLabel={`I understand Right ${right.number}: ${right.title}`}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.acknowledgeButtonText}>
                  I understand this Right
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Phase 1 -- Learn
  // -----------------------------------------------------------------------

  const renderLearnPhase = () => (
    <ScrollView
      ref={scrollRef}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress ring */}
      {renderProgressRing()}

      {/* Phase label */}
      <View style={styles.phaseLabel}>
        <View style={[styles.phaseBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.phaseBadgeText}>PHASE 1</Text>
        </View>
        <Text style={styles.phaseTitle}>Learn the 6 Rights</Text>
      </View>
      <Text style={styles.phaseSubtitle}>
        Review each Right by tapping to expand. Check off each verification
        step, then tap &ldquo;I understand this Right&rdquo; to acknowledge.
      </Text>

      {/* Right cards */}
      {RIGHTS.map((right) => renderRightCard(right))}

      {/* Supplementary info cards */}
      {supplementarySteps.length > 0 && (
        <View style={styles.supplementarySection}>
          <Text style={styles.supplementarySectionTitle}>
            Additional Information
          </Text>
          {supplementarySteps.map((step) => (
            <View key={step.stepNumber} style={styles.supplementaryCard}>
              <Text style={styles.supplementaryLabel}>{step.label}</Text>
              <Text style={styles.supplementaryDescription}>
                {step.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Proceed to Practice button */}
      {allRightsAcknowledged && (
        <Pressable
          style={[styles.proceedButton, { backgroundColor: accentColor }]}
          onPress={handleStartPractice}
          accessibilityLabel="Proceed to practice scenarios"
        >
          <Text style={styles.proceedButtonText}>
            Proceed to Practice Scenarios
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      )}

      {!allRightsAcknowledged && (
        <View style={styles.remainingHint}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.remainingHintText}>
            {6 - acknowledgedRights.size} Right
            {6 - acknowledgedRights.size !== 1 ? 's' : ''} remaining to review
            before practice scenarios.
          </Text>
        </View>
      )}
    </ScrollView>
  )

  // -----------------------------------------------------------------------
  // Render: Phase 2 -- Practice Scenarios
  // -----------------------------------------------------------------------

  const renderPracticePhase = () => {
    const scenario = SCENARIOS[currentScenario]
    const violationSet = new Set(scenario.violations)

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase label */}
        <View style={styles.phaseLabel}>
          <View style={[styles.phaseBadge, { backgroundColor: WARNING_AMBER }]}>
            <Text style={styles.phaseBadgeText}>PHASE 2</Text>
          </View>
          <Text style={styles.phaseTitle}>Practice Scenarios</Text>
        </View>

        {/* Scenario progress */}
        <View style={styles.scenarioProgress}>
          {SCENARIOS.map((s, idx) => {
            const result = scenarioResults.find(
              (r) => r.scenarioId === s.id,
            )
            let dotColor = '#E5E7EB'
            if (result) {
              dotColor = result.correct ? COMPLETED_GREEN : ERROR_RED
            } else if (idx === currentScenario) {
              dotColor = accentColor
            }
            return (
              <View key={s.id} style={styles.scenarioProgressRow}>
                <View
                  style={[
                    styles.scenarioProgressDot,
                    { backgroundColor: dotColor },
                  ]}
                />
                <Text
                  style={[
                    styles.scenarioProgressLabel,
                    idx === currentScenario && { fontWeight: '700', color: '#1A1A1A' },
                  ]}
                >
                  Scenario {s.id}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Scenario card */}
        <View style={styles.scenarioCard}>
          <View style={styles.scenarioHeader}>
            <View
              style={[
                styles.scenarioNumberBadge,
                { backgroundColor: WARNING_AMBER },
              ]}
            >
              <Text style={styles.scenarioNumberText}>{scenario.id}</Text>
            </View>
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>
          </View>

          <Text style={styles.scenarioDescription}>
            {scenario.description}
          </Text>

          {/* Selection: which Right(s) violated? */}
          <Text style={styles.scenarioQuestion}>
            Which Right(s) were violated? Select all that apply:
          </Text>

          <View style={styles.violationOptions}>
            {RIGHTS.map((right) => {
              const isSelected = selectedViolations.has(right.number)
              const isViolation = violationSet.has(right.number)

              let optionBg = CARD_BG
              let optionBorder = '#E5E7EB'
              let iconColor = right.badgeColor

              if (isSelected && !scenarioSubmitted) {
                optionBg = '#E0F7FA'
                optionBorder = accentColor
              }
              if (scenarioSubmitted) {
                if (isSelected && isViolation) {
                  optionBg = COMPLETED_GREEN_BG
                  optionBorder = COMPLETED_GREEN
                  iconColor = COMPLETED_GREEN
                } else if (isSelected && !isViolation) {
                  optionBg = ERROR_RED_BG
                  optionBorder = ERROR_RED
                  iconColor = ERROR_RED
                } else if (!isSelected && isViolation) {
                  optionBg = '#FEF3C7'
                  optionBorder = WARNING_AMBER
                  iconColor = WARNING_AMBER
                }
              }

              return (
                <Pressable
                  key={right.number}
                  style={[
                    styles.violationOption,
                    { backgroundColor: optionBg, borderColor: optionBorder },
                  ]}
                  onPress={() => handleToggleViolation(right.number)}
                  disabled={scenarioSubmitted}
                  accessibilityLabel={`Right ${right.number}: ${right.title}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View
                    style={[
                      styles.violationOptionBadge,
                      { backgroundColor: isSelected ? (scenarioSubmitted ? (isViolation ? COMPLETED_GREEN : ERROR_RED) : accentColor) : right.badgeColor + '20' },
                    ]}
                  >
                    <Ionicons
                      name={right.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : iconColor}
                    />
                  </View>
                  <Text
                    style={[
                      styles.violationOptionText,
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {right.title}
                  </Text>
                  {scenarioSubmitted && isSelected && (
                    <Ionicons
                      name={isViolation ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={isViolation ? COMPLETED_GREEN : ERROR_RED}
                    />
                  )}
                  {scenarioSubmitted && !isSelected && isViolation && (
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={WARNING_AMBER}
                    />
                  )}
                </Pressable>
              )
            })}
          </View>

          {/* Check Answer button */}
          {!scenarioSubmitted && (
            <Pressable
              style={[
                styles.checkAnswerButton,
                {
                  backgroundColor:
                    selectedViolations.size > 0 ? accentColor : '#D1D5DB',
                },
              ]}
              onPress={handleCheckAnswer}
              disabled={selectedViolations.size === 0}
              accessibilityLabel="Check answer"
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.checkAnswerButtonText}>Check Answer</Text>
            </Pressable>
          )}

          {/* Feedback after submission */}
          {scenarioSubmitted && (
            <View style={styles.scenarioFeedback}>
              {/* Correct/Incorrect banner */}
              {(() => {
                const lastResult = scenarioResults[scenarioResults.length - 1]
                const correct = lastResult?.correct ?? false
                return (
                  <View
                    style={[
                      styles.feedbackBanner,
                      {
                        backgroundColor: correct
                          ? COMPLETED_GREEN_BG
                          : ERROR_RED_BG,
                        borderLeftColor: correct
                          ? COMPLETED_GREEN
                          : ERROR_RED,
                      },
                    ]}
                  >
                    <Ionicons
                      name={correct ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={correct ? COMPLETED_GREEN : ERROR_RED}
                    />
                    <Text
                      style={[
                        styles.feedbackBannerText,
                        { color: correct ? COMPLETED_GREEN : ERROR_RED },
                      ]}
                    >
                      {correct ? 'Correct!' : 'Not quite right'}
                    </Text>
                  </View>
                )
              })()}

              {/* Correct answer */}
              <View style={styles.correctAnswerBox}>
                <Text style={styles.correctAnswerTitle}>
                  Violated:{' '}
                  {scenario.violations
                    .map(
                      (v) => RIGHTS.find((r) => r.number === v)?.title ?? '',
                    )
                    .join(', ')}
                </Text>
              </View>

              {/* Teaching point */}
              <View
                style={[
                  styles.teachingPointBox,
                  { borderLeftColor: accentColor },
                ]}
              >
                <View style={styles.teachingPointHeader}>
                  <Ionicons name="bulb-outline" size={16} color={accentColor} />
                  <Text
                    style={[
                      styles.teachingPointTitle,
                      { color: accentColor },
                    ]}
                  >
                    Teaching Point
                  </Text>
                </View>
                <Text style={styles.teachingPointText}>
                  {scenario.teachingPoint}
                </Text>
              </View>

              {/* Next Scenario button */}
              <Pressable
                style={[
                  styles.nextScenarioButton,
                  { backgroundColor: accentColor },
                ]}
                onPress={handleNextScenario}
                accessibilityLabel={
                  currentScenario < SCENARIOS.length - 1
                    ? 'Next scenario'
                    : 'View results'
                }
              >
                <Text style={styles.nextScenarioButtonText}>
                  {currentScenario < SCENARIOS.length - 1
                    ? 'Next Scenario'
                    : 'View Results'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Completion summary
  // -----------------------------------------------------------------------

  const renderCompletionPhase = () => {
    const correctScenarios = scenarioResults.filter((r) => r.correct).length
    const totalScenarios = SCENARIOS.length
    const perfect = correctScenarios === totalScenarios

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score card */}
        <View
          style={[
            styles.completionScoreCard,
            { borderColor: perfect ? COMPLETED_GREEN : accentColor },
          ]}
        >
          <View
            style={[
              styles.completionScoreCircle,
              { borderColor: perfect ? COMPLETED_GREEN : accentColor },
            ]}
          >
            <Text
              style={[
                styles.completionScoreNumber,
                { color: perfect ? COMPLETED_GREEN : accentColor },
              ]}
            >
              {correctScenarios}
            </Text>
            <Text style={styles.completionScoreOf}>/ {totalScenarios}</Text>
          </View>
          <Text style={styles.completionScoreTitle}>
            {perfect
              ? 'Perfect Score!'
              : correctScenarios >= 2
                ? 'Good Effort!'
                : 'Keep Practicing'}
          </Text>
          <Text style={styles.completionScoreSubtitle}>
            You correctly identified violations in {correctScenarios} of{' '}
            {totalScenarios} scenarios
          </Text>
        </View>

        {/* Scenario results */}
        <Text style={styles.completionResultsTitle}>Scenario Results</Text>
        {SCENARIOS.map((scenario) => {
          const result = scenarioResults.find(
            (r) => r.scenarioId === scenario.id,
          )
          const correct = result?.correct ?? false
          return (
            <View key={scenario.id} style={styles.completionResultRow}>
              <View
                style={[
                  styles.completionResultIcon,
                  {
                    backgroundColor: correct
                      ? COMPLETED_GREEN_BG
                      : ERROR_RED_BG,
                  },
                ]}
              >
                <Ionicons
                  name={correct ? 'checkmark' : 'close'}
                  size={16}
                  color={correct ? COMPLETED_GREEN : ERROR_RED}
                />
              </View>
              <View style={styles.completionResultTextContainer}>
                <Text style={styles.completionResultTitle}>
                  Scenario {scenario.id}: {scenario.title}
                </Text>
                <Text style={styles.completionResultViolation}>
                  Violation:{' '}
                  {scenario.violations
                    .map(
                      (v) => RIGHTS.find((r) => r.number === v)?.title ?? '',
                    )
                    .join(', ')}
                </Text>
              </View>
            </View>
          )
        })}

        {/* 6 Rights reviewed confirmation */}
        <View
          style={[
            styles.completionRightsBox,
            { borderLeftColor: COMPLETED_GREEN },
          ]}
        >
          <View style={styles.completionRightsHeader}>
            <Ionicons name="shield-checkmark" size={18} color={COMPLETED_GREEN} />
            <Text style={styles.completionRightsTitle}>
              All 6 Rights Reviewed
            </Text>
          </View>
          <View style={styles.completionRightsGrid}>
            {RIGHTS.map((right) => (
              <View key={right.number} style={styles.completionRightItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={COMPLETED_GREEN}
                />
                <Text style={styles.completionRightItemText}>
                  {right.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key takeaway */}
        <View
          style={[styles.completionTakeaway, { borderLeftColor: accentColor }]}
        >
          <View style={styles.completionTakeawayHeader}>
            <Ionicons name="school-outline" size={18} color={accentColor} />
            <Text
              style={[
                styles.completionTakeawayTitle,
                { color: accentColor },
              ]}
            >
              Key Takeaway
            </Text>
          </View>
          <Text style={styles.completionTakeawayText}>
            The 6 Rights are your safety net for every medication pass. Verify
            the Right Patient, Right Medication, Right Dose, Right Route, Right
            Time, and Right Documentation before and after every administration.
            When in doubt, stop and verify. Never take shortcuts with medication
            safety.
          </Text>
        </View>

        {/* Finish button */}
        <Pressable
          style={[styles.finishButton, { backgroundColor: accentColor }]}
          onPress={handleFinish}
          accessibilityLabel="Finish lesson"
        >
          <Text style={styles.finishButtonText}>Complete Lesson</Text>
          <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    )
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  // Top-level progress bar
  const overallProgress = useMemo(() => {
    if (phase === 'complete') return 1
    if (phase === 'practice') {
      return 0.6 + (scenarioResults.length / SCENARIOS.length) * 0.4
    }
    return (acknowledgedRights.size / 6) * 0.6
  }, [phase, acknowledgedRights.size, scenarioResults.length])

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${overallProgress * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressBarText}>
          {phase === 'learn'
            ? `Rights: ${acknowledgedRights.size}/6`
            : phase === 'practice'
              ? `Scenario ${currentScenario + 1}/${SCENARIOS.length}`
              : 'Complete'}
        </Text>
      </View>

      {/* Phase content */}
      {phase === 'learn' && renderLearnPhase()}
      {phase === 'practice' && renderPracticePhase()}
      {phase === 'complete' && renderCompletionPhase()}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: "Why this matters" expandable section
// ---------------------------------------------------------------------------

function WhyThisMattersSection({
  risks,
  accentColor,
}: {
  risks: string[]
  accentColor: string
}) {
  const [expanded, setExpanded] = useState(false)

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((prev) => !prev)
  }, [])

  return (
    <View style={styles.whyContainer}>
      <Pressable
        style={styles.whyToggle}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel="Why this matters"
      >
        <Ionicons name="warning-outline" size={16} color={ERROR_RED} />
        <Text style={styles.whyToggleText}>Why this matters</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#9CA3AF"
          style={{ marginLeft: 'auto' }}
        />
      </Pressable>
      {expanded && (
        <View style={styles.whyBody}>
          <Text style={styles.whyBodyLabel}>
            Risk if skipped:
          </Text>
          {risks.map((risk, idx) => (
            <View key={idx} style={styles.whyRiskRow}>
              <View style={styles.whyRiskBullet} />
              <Text style={styles.whyRiskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' } as any,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },

  // Top progress bar
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Progress ring
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ringSegment: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringSegmentBar: {
    position: 'absolute',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenterNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  ringCenterLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: -4,
  },
  ringLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  ringLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ringLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Phase header
  phaseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  phaseSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Right card
  rightCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  rightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rightBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCardTitleContainer: {
    flex: 1,
  },
  rightCardNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COMPLETED_GREEN_BG,
    borderRadius: 6,
  },
  acknowledgedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COMPLETED_GREEN,
  },

  // Acknowledged summary
  acknowledgedSummary: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
  },
  acknowledgedSummaryText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Right card body (expanded)
  rightCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  rightDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 23,
  },

  // Checklist
  checklistContainer: {
    gap: 8,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checklistText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    flex: 1,
  },
  checklistTextChecked: {
    color: COMPLETED_GREEN,
    textDecorationLine: 'line-through',
  },

  // Why this matters
  whyContainer: {
    backgroundColor: ERROR_RED_BG,
    borderRadius: 12,
    overflow: 'hidden',
  },
  whyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  whyToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: ERROR_RED,
  },
  whyBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 6,
  },
  whyBodyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  whyRiskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  whyRiskBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ERROR_RED,
    marginTop: 7,
  },
  whyRiskText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    flex: 1,
  },

  // Communication box
  communicationBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
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

  // Preceptor box
  preceptorBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
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

  // Acknowledge button
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  acknowledgeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Supplementary
  supplementarySection: {
    marginTop: 8,
    gap: 8,
  },
  supplementarySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  supplementaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    ...cardShadow,
  },
  supplementaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  supplementaryDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Proceed button
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Remaining hint
  remainingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  remainingHintText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },

  // Scenario progress
  scenarioProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  scenarioProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scenarioProgressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scenarioProgressLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Scenario card
  scenarioCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    ...cardShadow,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  scenarioNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scenarioNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scenarioTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  scenarioDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 23,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  scenarioQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },

  // Violation options
  violationOptions: {
    gap: 8,
  },
  violationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  violationOptionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  violationOptionText: {
    fontSize: 15,
    color: '#1A1A1A',
    flex: 1,
  },

  // Check answer button
  checkAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  checkAnswerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scenario feedback
  scenarioFeedback: {
    gap: 12,
    marginTop: 16,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  feedbackBannerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  correctAnswerBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  correctAnswerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  teachingPointBox: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  teachingPointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  teachingPointTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teachingPointText: {
    fontSize: 13,
    color: '#004D56',
    lineHeight: 20,
  },
  nextScenarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextScenarioButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Completion
  completionScoreCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
    ...cardShadow,
  },
  completionScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionScoreNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  completionScoreOf: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: -4,
  },
  completionScoreTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  completionScoreSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Completion results
  completionResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  completionResultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    ...cardShadow,
  },
  completionResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  completionResultTextContainer: {
    flex: 1,
  },
  completionResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  completionResultViolation: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Completion 6 Rights box
  completionRightsBox: {
    backgroundColor: COMPLETED_GREEN_BG,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginTop: 16,
    marginBottom: 16,
  },
  completionRightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  completionRightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COMPLETED_GREEN,
  },
  completionRightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  completionRightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '45%',
  },
  completionRightItemText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },

  // Completion takeaway
  completionTakeaway: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  completionTakeawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completionTakeawayTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  completionTakeawayText: {
    fontSize: 13,
    color: '#004D56',
    lineHeight: 20,
  },

  // Finish button
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

export default MedAdminInteractive
