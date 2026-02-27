/**
 * SBARBuilderInteractive -- SBAR Handoff Report Builder
 *
 * Students practice constructing structured SBAR (Situation, Background,
 * Assessment, Recommendation) communication using real patient chart data.
 * After filling in all four sections, the student's report is scored against
 * a 12-element rubric (keyword matching) and compared side-by-side with an
 * expert example.
 *
 * Self-contained: all patient data, expert text, hint chips, guided prompts,
 * and key-element checklists are defined within the file.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
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
import { Ionicons } from '@expo/vector-icons'
import type { NursingLessonData, NursingStep } from './NursingStepViewer'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SBARBuilderInteractiveProps {
  lessonData: NursingLessonData
  accentColor?: string
  onComplete?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7'
const BG_COLOR = '#FAF8F5'

type SBARKey = 'S' | 'B' | 'A' | 'R'

const SECTION_COLORS: Record<SBARKey, string> = {
  S: '#DC2626',
  B: '#0369A1',
  A: '#B45309',
  R: '#15803D',
}

const SECTION_BG: Record<SBARKey, string> = {
  S: '#FEF2F2',
  B: '#E0F2FE',
  A: '#FEF3C7',
  R: '#DCFCE7',
}

interface SectionMeta {
  key: SBARKey
  title: string
  fullTitle: string
  question: string
  icon: string
  prompts: string[]
  hints: string[]
}

const SECTION_META: SectionMeta[] = [
  {
    key: 'S',
    title: 'Situation',
    fullTitle: 'S -- Situation',
    question: "What's happening right now?",
    icon: 'megaphone-outline',
    prompts: [
      'I am calling about...',
      'The problem is...',
    ],
    hints: [
      'increasing respiratory distress',
      'change in mental status',
      'fever not responding to treatment',
    ],
  },
  {
    key: 'B',
    title: 'Background',
    fullTitle: 'B -- Background',
    question: "What's the clinical context?",
    icon: 'time-outline',
    prompts: [
      'The patient was admitted for...',
      'Relevant history includes...',
      'Current treatment is...',
    ],
    hints: [
      'admitted for pneumonia',
      'history of CHF and COPD',
      'on IV azithromycin',
      'allergic to PCN and sulfa',
    ],
  },
  {
    key: 'A',
    title: 'Assessment',
    fullTitle: 'A -- Assessment',
    question: 'What do I think is going on?',
    icon: 'analytics-outline',
    prompts: [
      'I think the problem is...',
      "The patient's condition is...",
      'I am concerned about...',
    ],
    hints: [
      'worsening infection',
      'possible sepsis',
      'decompensating CHF',
      'hypokalemia',
      'new-onset confusion',
    ],
  },
  {
    key: 'R',
    title: 'Recommendation',
    fullTitle: 'R -- Recommendation',
    question: 'What do I want done?',
    icon: 'arrow-forward-circle-outline',
    prompts: [
      'I recommend...',
      'I need you to...',
      'Would you like to...',
    ],
    hints: [
      'come evaluate the patient',
      'change antibiotics',
      'order blood cultures',
      'increase O2',
      'replace potassium',
      'order chest X-ray',
    ],
  },
]

// ---------------------------------------------------------------------------
// Patient scenario
// ---------------------------------------------------------------------------

const PATIENT = {
  name: 'Margaret Johnson',
  age: '72F',
  room: '4N-312, Bed A',
  admittingDx: 'Community-acquired pneumonia',
  pmh: 'CHF, Type 2 DM, HTN, COPD',
  allergies: 'PCN (rash), Sulfa (anaphylaxis)',
  codeStatus: 'Full Code',
  meds: [
    'Azithromycin 500mg IV daily',
    'Albuterol neb Q4H PRN',
    'Metformin 1000mg PO BID',
    'Lisinopril 20mg PO daily',
    'Furosemide 40mg PO daily',
  ],
  currentVitals: {
    time: '0600',
    temp: '101.8\u00B0F',
    hr: '104',
    rr: '24',
    bp: '138/88',
    spo2: '91% on 2L NC',
  },
  previousVitals: {
    time: '0200',
    temp: '100.2\u00B0F',
    hr: '92',
    rr: '20',
    bp: '142/86',
    spo2: '94% on 2L NC',
  },
  labs: [
    { label: 'WBC', value: '14.2', flag: '\u2191' },
    { label: 'BUN', value: '28', flag: '' },
    { label: 'Cr', value: '1.4', flag: '' },
    { label: 'K+', value: '3.2', flag: '\u2193' },
    { label: 'Glucose', value: '188', flag: '\u2191' },
    { label: 'Procalcitonin', value: '2.4', flag: '\u2191' },
  ],
  nurseNotes:
    'Patient increasingly SOB overnight. Productive cough with yellow-green sputum. Confused about date and location at 0400 assessment (oriented x1 -- person only). Was oriented x3 at admission.',
}

// ---------------------------------------------------------------------------
// Key elements per section (12 total, used for rubric scoring)
// ---------------------------------------------------------------------------

interface KeyElement {
  id: string
  label: string
  keywords: string[]
}

const KEY_ELEMENTS: Record<SBARKey, KeyElement[]> = {
  S: [
    {
      id: 's1',
      label: 'Patient identified',
      keywords: ['johnson', 'margaret', '312', 'room'],
    },
    {
      id: 's2',
      label: 'Chief concern stated',
      keywords: [
        'respiratory', 'breathing', 'sob', 'shortness of breath',
        'oxygen', 'worsened', 'worsening', 'distress', 'desatting',
        'desaturation', 'fever', 'mental status', 'confused', 'confusion',
      ],
    },
    {
      id: 's3',
      label: 'Key vital sign changes',
      keywords: [
        '91%', '91 %', 'spo2', 'oxygen sat', '101.8', 'temp',
        'heart rate', 'hr 104', '104', 'rr 24', 'respiratory rate',
        'dropped', 'increased', 'trending',
      ],
    },
  ],
  B: [
    {
      id: 'b1',
      label: 'Diagnosis mentioned',
      keywords: ['pneumonia', 'community-acquired', 'community acquired', 'cap'],
    },
    {
      id: 'b2',
      label: 'Relevant PMH',
      keywords: ['chf', 'copd', 'diabetes', 'dm', 'heart failure', 'hypertension', 'htn'],
    },
    {
      id: 'b3',
      label: 'Current treatment',
      keywords: ['azithromycin', 'antibiotic', 'iv', 'albuterol'],
    },
    {
      id: 'b4',
      label: 'Allergies',
      keywords: ['pcn', 'penicillin', 'sulfa', 'allerg'],
    },
    {
      id: 'b5',
      label: 'Lab trends',
      keywords: [
        'wbc', 'white blood', '14.2', 'procalcitonin', '2.4',
        'potassium', 'k+', '3.2', 'labs', 'glucose', '188',
      ],
    },
  ],
  A: [
    {
      id: 'a1',
      label: 'Clinical interpretation',
      keywords: [
        'sepsis', 'infection', 'worsening', 'decompensating', 'deteriorat',
        'not responding', 'failing', 'progressing',
      ],
    },
    {
      id: 'a2',
      label: 'Concern level stated',
      keywords: [
        'concern', 'worried', 'afraid', 'alarmed', 'think',
        'believe', 'suspect', 'may be', 'could be', 'possible',
      ],
    },
    {
      id: 'a3',
      label: 'Multiple concerns identified',
      keywords: [
        'confus', 'mental status', 'orient', 'hypokalemia', 'potassium',
        'cardiac', 'rhythm', 'perfusion', 'o2', 'oxygen',
      ],
    },
  ],
  R: [
    {
      id: 'r1',
      label: 'Specific action requested',
      keywords: [
        'evaluate', 'come see', 'assess', 'blood cultures', 'culture',
        'antibiotics', 'change', 'chest x-ray', 'cxr', 'x-ray',
        'increase oxygen', 'increase o2',
      ],
    },
    {
      id: 'r2',
      label: 'Anticipatory questions',
      keywords: [
        'would you like', 'should i', 'do you want', 'would you',
        'shall i', 'recommend', 'suggest',
      ],
    },
    {
      id: 'r3',
      label: 'Interim plan',
      keywords: [
        'meanwhile', 'meantime', 'in the interim', 'until',
        'potassium', 'replace', 'venturi', '4l', '4 l',
        'nasal cannula', 'nc', 'anything else',
      ],
    },
  ],
}

const TOTAL_KEY_ELEMENTS = Object.values(KEY_ELEMENTS).reduce(
  (sum, els) => sum + els.length,
  0,
)

// ---------------------------------------------------------------------------
// Expert SBAR text
// ---------------------------------------------------------------------------

const EXPERT_TEXT: Record<SBARKey, string> = {
  S: 'Dr. Patel, this is [student name], the student nurse caring for Margaret Johnson in Room 312. I\'m calling because her respiratory status has worsened overnight. Her oxygen saturation has dropped from 94% to 91% on 2L nasal cannula, her respiratory rate is 24, and she has a new fever of 101.8.',
  B: 'Mrs. Johnson was admitted two days ago for community-acquired pneumonia. She has a history of CHF, COPD, and type 2 diabetes. She\'s been on IV azithromycin 500mg daily. Her WBC this morning is 14.2 and procalcitonin is elevated at 2.4. She is allergic to penicillin and sulfa drugs. Notably, she was oriented times 3 on admission but is now only oriented to person.',
  A: 'I\'m concerned she may be developing sepsis. Her temperature is trending up despite antibiotics, her WBC and procalcitonin are elevated, and she has new-onset confusion which could indicate altered perfusion. Her potassium is also low at 3.2 which could affect her cardiac rhythm given her CHF history.',
  R: 'I\'d recommend you come evaluate her. Would you like me to obtain blood cultures before we consider changing antibiotics? She may also need her oxygen increased -- should I try 4L NC or a Venturi mask? I\'d also like to replace her potassium. Is there anything else you\'d like me to do in the meantime?',
}

// ---------------------------------------------------------------------------
// SBAR quick reference
// ---------------------------------------------------------------------------

const SBAR_REFERENCE = {
  acronym: [
    { letter: 'S', word: 'Situation', desc: 'What is happening right now?' },
    { letter: 'B', word: 'Background', desc: 'What is the clinical context?' },
    { letter: 'A', word: 'Assessment', desc: 'What do I think is going on?' },
    { letter: 'R', word: 'Recommendation', desc: 'What do I want done?' },
  ],
  whenToUse: [
    'Change in patient condition',
    'Requesting orders',
    'Shift handoff',
    'Transferring care',
  ],
  keyTip:
    'State your assessment and recommendation -- don\'t just report data.',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SectionResult = { matched: string[]; missed: string[] }

function evaluateSection(userText: string, sectionKey: SBARKey): SectionResult {
  const lower = userText.toLowerCase()
  const elements = KEY_ELEMENTS[sectionKey]
  const matched: string[] = []
  const missed: string[] = []

  for (const el of elements) {
    const found = el.keywords.some((kw) => lower.includes(kw.toLowerCase()))
    if (found) {
      matched.push(el.id)
    } else {
      missed.push(el.id)
    }
  }

  return { matched, missed }
}

function computeTotalMatched(
  results: Partial<Record<SBARKey, SectionResult>>,
): number {
  let total = 0
  for (const key of ['S', 'B', 'A', 'R'] as SBARKey[]) {
    if (results[key]) {
      total += results[key]!.matched.length
    }
  }
  return total
}

function getCheckColor(
  matched: string[],
  missed: string[],
  elementId: string,
): { icon: string; color: string } {
  if (matched.includes(elementId)) {
    return { icon: 'checkmark-circle', color: '#15803D' }
  }
  if (missed.includes(elementId)) {
    return { icon: 'close-circle', color: '#DC2626' }
  }
  return { icon: 'ellipse-outline', color: '#D1D5DB' }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Collapsible quick reference card */
function QuickReferenceCard({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <View style={refStyles.card}>
      <Pressable
        onPress={onToggle}
        style={refStyles.header}
        accessibilityLabel={
          collapsed ? 'Expand SBAR reference' : 'Collapse SBAR reference'
        }
      >
        <Ionicons name="book-outline" size={18} color="#0097A7" />
        <Text style={refStyles.headerText}>SBAR Quick Reference</Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={18}
          color="#0097A7"
        />
      </Pressable>

      {!collapsed && (
        <View style={refStyles.body}>
          {/* Acronym breakdown */}
          {SBAR_REFERENCE.acronym.map((item) => (
            <View key={item.letter} style={refStyles.acronymRow}>
              <View
                style={[
                  refStyles.letterBadge,
                  { backgroundColor: SECTION_COLORS[item.letter as SBARKey] },
                ]}
              >
                <Text style={refStyles.letterText}>{item.letter}</Text>
              </View>
              <View style={refStyles.acronymTextCol}>
                <Text style={refStyles.acronymWord}>{item.word}</Text>
                <Text style={refStyles.acronymDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}

          {/* When to use */}
          <View style={refStyles.whenBox}>
            <Text style={refStyles.whenTitle}>When to Use SBAR</Text>
            {SBAR_REFERENCE.whenToUse.map((item, i) => (
              <View key={i} style={refStyles.whenRow}>
                <View style={refStyles.whenBullet} />
                <Text style={refStyles.whenText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Key tip */}
          <View style={refStyles.tipBox}>
            <Ionicons name="bulb-outline" size={16} color="#B45309" />
            <Text style={refStyles.tipText}>{SBAR_REFERENCE.keyTip}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

/** Patient chart data card */
function PatientChart({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <View style={chartStyles.card}>
      <Pressable
        onPress={onToggle}
        style={chartStyles.header}
        accessibilityLabel={
          collapsed ? 'Expand patient chart' : 'Collapse patient chart'
        }
      >
        <Ionicons name="clipboard-outline" size={18} color="#FFFFFF" />
        <Text style={chartStyles.headerText}>
          Patient Chart -- {PATIENT.name}, {PATIENT.age}
        </Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color="#FFFFFF"
        />
      </Pressable>

      {!collapsed && (
        <View style={chartStyles.body}>
          {/* Demographics */}
          <ChartRow label="Patient" value={`${PATIENT.name}, ${PATIENT.age}`} />
          <ChartRow label="Room" value={PATIENT.room} />
          <ChartRow label="Admitting Dx" value={PATIENT.admittingDx} />
          <ChartRow label="PMH" value={PATIENT.pmh} />
          <ChartRow label="Allergies" value={PATIENT.allergies} />
          <ChartRow label="Code Status" value={PATIENT.codeStatus} />

          {/* Medications */}
          <ChartSectionHeader icon="medkit-outline" title="Current Medications" />
          {PATIENT.meds.map((med, i) => (
            <ChartBullet key={i} text={med} />
          ))}

          {/* Vitals comparison */}
          <ChartSectionHeader icon="pulse-outline" title="Vitals" />
          <View style={chartStyles.vitalsCompare}>
            <View style={chartStyles.vitalsColumn}>
              <Text style={chartStyles.vitalsTimeLabel}>
                Current ({PATIENT.currentVitals.time})
              </Text>
              <VitalPill label="T" value={PATIENT.currentVitals.temp} warn />
              <VitalPill label="HR" value={PATIENT.currentVitals.hr} warn />
              <VitalPill label="RR" value={PATIENT.currentVitals.rr} warn />
              <VitalPill label="BP" value={PATIENT.currentVitals.bp} />
              <VitalPill label="SpO2" value={PATIENT.currentVitals.spo2} warn />
            </View>
            <View style={chartStyles.vitalsColumn}>
              <Text style={chartStyles.vitalsTimeLabel}>
                Previous ({PATIENT.previousVitals.time})
              </Text>
              <VitalPill label="T" value={PATIENT.previousVitals.temp} />
              <VitalPill label="HR" value={PATIENT.previousVitals.hr} />
              <VitalPill label="RR" value={PATIENT.previousVitals.rr} />
              <VitalPill label="BP" value={PATIENT.previousVitals.bp} />
              <VitalPill label="SpO2" value={PATIENT.previousVitals.spo2} />
            </View>
          </View>

          {/* Labs */}
          <ChartSectionHeader icon="flask-outline" title="Labs (this morning)" />
          <View style={chartStyles.labsGrid}>
            {PATIENT.labs.map((lab) => (
              <View key={lab.label} style={chartStyles.labItem}>
                <Text style={chartStyles.labLabel}>{lab.label}</Text>
                <Text
                  style={[
                    chartStyles.labValue,
                    lab.flag ? chartStyles.labFlagged : null,
                  ]}
                >
                  {lab.value}
                  {lab.flag ? ` ${lab.flag}` : ''}
                </Text>
              </View>
            ))}
          </View>

          {/* Nurse Notes */}
          <ChartSectionHeader icon="document-text-outline" title="Nurse Notes" />
          <Text style={chartStyles.notesText}>{PATIENT.nurseNotes}</Text>
        </View>
      )}
    </View>
  )
}

function ChartRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={chartStyles.row}>
      <Text style={chartStyles.rowLabel}>{label}</Text>
      <Text style={chartStyles.rowValue}>{value}</Text>
    </View>
  )
}

function ChartSectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={chartStyles.sectionHeader}>
      <Ionicons name={icon as any} size={14} color="#0097A7" />
      <Text style={chartStyles.sectionTitle}>{title}</Text>
    </View>
  )
}

function ChartBullet({ text }: { text: string }) {
  return (
    <View style={chartStyles.bulletRow}>
      <View style={chartStyles.bullet} />
      <Text style={chartStyles.bulletText}>{text}</Text>
    </View>
  )
}

function VitalPill({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <View style={[chartStyles.vitalPill, warn && chartStyles.vitalPillWarn]}>
      <Text style={chartStyles.vitalPillLabel}>{label}</Text>
      <Text
        style={[chartStyles.vitalPillValue, warn && chartStyles.vitalPillValueWarn]}
      >
        {value}
      </Text>
    </View>
  )
}

/** Learning tips from step data */
function LearningTips({ step }: { step: NursingStep | undefined }) {
  const [expanded, setExpanded] = useState(false)
  if (!step) return null

  const hasContent =
    (step.evidence && step.evidence.length > 0) ||
    step.preceptorCue ||
    (step.details && step.details.length > 0)

  if (!hasContent) return null

  return (
    <View style={tipStyles.container}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={tipStyles.header}
        accessibilityLabel={expanded ? 'Collapse learning tips' : 'Expand learning tips'}
      >
        <Ionicons
          name="school-outline"
          size={14}
          color="#7C3AED"
        />
        <Text style={tipStyles.headerText}>Learning Tips</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#7C3AED"
        />
      </Pressable>

      {expanded && (
        <View style={tipStyles.body}>
          {step.details && step.details.length > 0 && (
            <View style={tipStyles.section}>
              {step.details.map((d, i) => (
                <View key={i} style={tipStyles.bulletRow}>
                  <View style={tipStyles.bullet} />
                  <Text style={tipStyles.bulletText}>{d}</Text>
                </View>
              ))}
            </View>
          )}
          {step.evidence && step.evidence.length > 0 && (
            <View style={tipStyles.section}>
              <Text style={tipStyles.sectionLabel}>Evidence</Text>
              {step.evidence.map((e, i) => (
                <Text key={i} style={tipStyles.evidenceText}>
                  {e}
                </Text>
              ))}
            </View>
          )}
          {step.preceptorCue && (
            <View style={tipStyles.cueBox}>
              <Ionicons name="chatbubble-outline" size={13} color="#7C3AED" />
              <Text style={tipStyles.cueText}>{step.preceptorCue}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

/** Comparison panel for a single section */
function ComparisonPanel({
  sectionKey,
  userText,
  result,
  isWide,
}: {
  sectionKey: SBARKey
  userText: string
  result: SectionResult
  isWide: boolean
}) {
  const color = SECTION_COLORS[sectionKey]
  const bg = SECTION_BG[sectionKey]
  const elements = KEY_ELEMENTS[sectionKey]
  const matchCount = result.matched.length
  const totalCount = elements.length

  return (
    <View style={compStyles.container}>
      {/* Score badge */}
      <View style={[compStyles.scoreBadge, { backgroundColor: color }]}>
        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        <Text style={compStyles.scoreText}>
          {matchCount}/{totalCount} elements
        </Text>
      </View>

      {/* Side-by-side or stacked */}
      <View style={isWide ? compStyles.sideBySide : compStyles.stacked}>
        {/* User version */}
        <View style={[compStyles.panel, isWide && compStyles.panelHalf]}>
          <View style={[compStyles.panelHeader, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={compStyles.panelHeaderText}>Your Version</Text>
          </View>
          <Text style={compStyles.panelBody}>{userText}</Text>
        </View>

        {/* Expert version */}
        <View style={[compStyles.panel, isWide && compStyles.panelHalf]}>
          <View style={[compStyles.panelHeader, { backgroundColor: bg }]}>
            <Ionicons name="school-outline" size={14} color={color} />
            <Text style={[compStyles.panelHeaderText, { color }]}>
              Expert Version
            </Text>
          </View>
          <Text style={compStyles.panelBody}>{EXPERT_TEXT[sectionKey]}</Text>
        </View>
      </View>

      {/* Key elements checklist */}
      <View style={compStyles.checklistContainer}>
        <Text style={compStyles.checklistTitle}>Key Elements</Text>
        {elements.map((el) => {
          const check = getCheckColor(result.matched, result.missed, el.id)
          return (
            <View key={el.id} style={compStyles.checkItem}>
              <Ionicons
                name={check.icon as any}
                size={18}
                color={check.color}
              />
              <Text
                style={[
                  compStyles.checkLabel,
                  check.color === '#15803D' && compStyles.checkLabelMatched,
                  check.color === '#DC2626' && compStyles.checkLabelMissed,
                ]}
              >
                {el.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

/** Final score panel */
function FinalScorePanel({
  totalMatched,
  results,
  accentColor,
  onTryAnother,
  onComplete,
}: {
  totalMatched: number
  results: Record<SBARKey, SectionResult>
  accentColor: string
  onTryAnother: () => void
  onComplete?: () => void
}) {
  const scoreColor =
    totalMatched >= 10
      ? '#15803D'
      : totalMatched >= 7
        ? '#B45309'
        : '#DC2626'

  return (
    <View style={finalStyles.container}>
      <View style={[finalStyles.card, { borderColor: scoreColor }]}>
        <Text style={finalStyles.title}>SBAR Report Score</Text>
        <View style={[finalStyles.scoreBubble, { backgroundColor: scoreColor }]}>
          <Text style={finalStyles.scoreNumber}>{totalMatched}</Text>
          <Text style={finalStyles.scoreOf}>of {TOTAL_KEY_ELEMENTS}</Text>
        </View>
        <Text style={[finalStyles.verdict, { color: scoreColor }]}>
          {totalMatched >= 11
            ? 'Excellent -- Comprehensive SBAR report'
            : totalMatched >= 9
              ? 'Good -- Most key elements included'
              : totalMatched >= 6
                ? 'Developing -- Several elements missing'
                : 'Needs Improvement -- Review the SBAR framework'}
        </Text>

        {/* Per-section breakdown */}
        <View style={finalStyles.breakdownContainer}>
          {SECTION_META.map(({ key, title }) => {
            const sectionTotal = KEY_ELEMENTS[key].length
            const matched = results[key]?.matched.length ?? 0
            const pct =
              sectionTotal > 0 ? Math.round((matched / sectionTotal) * 100) : 0
            return (
              <View key={key} style={finalStyles.breakdownRow}>
                <View
                  style={[
                    finalStyles.breakdownDot,
                    { backgroundColor: SECTION_COLORS[key] },
                  ]}
                />
                <Text style={finalStyles.breakdownLabel}>{title}</Text>
                <View style={finalStyles.breakdownBarTrack}>
                  <View
                    style={[
                      finalStyles.breakdownBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: SECTION_COLORS[key],
                      },
                    ]}
                  />
                </View>
                <Text style={finalStyles.breakdownPct}>
                  {matched}/{sectionTotal}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Actions */}
        <View style={finalStyles.actionsRow}>
          <Pressable
            style={finalStyles.retryButton}
            onPress={onTryAnother}
            accessibilityLabel="Try another scenario"
          >
            <Ionicons name="refresh-outline" size={18} color="#6B7280" />
            <Text style={finalStyles.retryButtonText}>Try Again</Text>
          </Pressable>

          {onComplete && (
            <Pressable
              style={[finalStyles.completeButton, { backgroundColor: accentColor }]}
              onPress={onComplete}
              accessibilityLabel="Complete lesson"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={finalStyles.completeButtonText}>Complete Lesson</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SBARBuilderInteractive({
  lessonData,
  accentColor = DEFAULT_ACCENT,
  onComplete,
}: SBARBuilderInteractiveProps) {
  const { width: screenWidth } = useWindowDimensions()
  const isWide = screenWidth >= 700
  const scrollRef = useRef<ScrollView>(null)

  // State
  const [inputs, setInputs] = useState<Record<SBARKey, string>>({
    S: '',
    B: '',
    A: '',
    R: '',
  })
  const [results, setResults] = useState<Partial<Record<SBARKey, SectionResult>>>({})
  const [expandedSection, setExpandedSection] = useState<SBARKey | null>('S')
  const [chartCollapsed, setChartCollapsed] = useState(false)
  const [refCollapsed, setRefCollapsed] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [hasReviewedComparison, setHasReviewedComparison] = useState(false)

  // Map lessonData steps to SBAR sections (steps 1-4 -> S, B, A, R)
  const sbarStepMap = useMemo(() => {
    const map: Partial<Record<SBARKey, NursingStep>> = {}
    const keys: SBARKey[] = ['S', 'B', 'A', 'R']
    if (lessonData?.steps) {
      keys.forEach((key, idx) => {
        if (lessonData.steps[idx]) {
          map[key] = lessonData.steps[idx]
        }
      })
    }
    return map
  }, [lessonData])

  // Check if all sections have minimum content
  const allFilled = useMemo(() => {
    return (['S', 'B', 'A', 'R'] as SBARKey[]).every(
      (key) => inputs[key].trim().length >= 10,
    )
  }, [inputs])

  const allCompared = useMemo(
    () =>
      results.S != null &&
      results.B != null &&
      results.A != null &&
      results.R != null,
    [results],
  )

  const totalMatched = useMemo(() => computeTotalMatched(results), [results])

  // Handlers
  const handleInputChange = useCallback((key: SBARKey, text: string) => {
    setInputs((prev) => ({ ...prev, [key]: text }))
  }, [])

  const handleHintTap = useCallback((key: SBARKey, hint: string) => {
    setInputs((prev) => {
      const current = prev[key]
      // Only add if not already present
      if (current.toLowerCase().includes(hint.toLowerCase())) return prev
      const separator = current.length > 0 && !current.endsWith(' ') ? ' ' : ''
      return { ...prev, [key]: current + separator + hint }
    })
  }, [])

  const handleSubmit = useCallback(() => {
    const newResults: Record<SBARKey, SectionResult> = {
      S: evaluateSection(inputs.S, 'S'),
      B: evaluateSection(inputs.B, 'B'),
      A: evaluateSection(inputs.A, 'A'),
      R: evaluateSection(inputs.R, 'R'),
    }
    setResults(newResults)
    setSubmitted(true)
    setExpandedSection('S')

    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }, 200)
  }, [inputs])

  const handleShowFinal = useCallback(() => {
    setShowFinal(true)
    setHasReviewedComparison(true)
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [])

  const handleTryAnother = useCallback(() => {
    setInputs({ S: '', B: '', A: '', R: '' })
    setResults({})
    setSubmitted(false)
    setShowFinal(false)
    setHasReviewedComparison(false)
    setExpandedSection('S')
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }, [])

  // Count sections with sufficient input
  const filledCount = useMemo(() => {
    return (['S', 'B', 'A', 'R'] as SBARKey[]).filter(
      (k) => inputs[k].trim().length >= 10,
    ).length
  }, [inputs])

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  submitted
                    ? showFinal
                      ? 100
                      : 75
                    : (filledCount / 4) * 50
                }%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {submitted
            ? showFinal
              ? 'Complete'
              : 'Review comparison'
            : `${filledCount}/4 sections`}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick reference card */}
        <QuickReferenceCard
          collapsed={refCollapsed}
          onToggle={() => setRefCollapsed((c) => !c)}
        />

        {/* Patient chart */}
        <PatientChart
          collapsed={chartCollapsed}
          onToggle={() => setChartCollapsed((c) => !c)}
        />

        {/* Instructions */}
        <View style={styles.instructionBox}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.instructionText}>
            {submitted
              ? 'Review your SBAR against the expert version. Check which key elements you included, then view your final score.'
              : 'Build your SBAR handoff report using the patient chart data. Fill in all four sections (min. 10 characters each), then submit to compare against an expert version.'}
          </Text>
        </View>

        {/* SBAR Sections */}
        {SECTION_META.map(({ key, title, fullTitle, question, icon, prompts, hints }) => {
          const isExpanded = expandedSection === key
          const color = SECTION_COLORS[key]
          const bg = SECTION_BG[key]
          const userText = inputs[key]
          const hasInput = userText.trim().length >= 10
          const hasResult = results[key] != null

          return (
            <View key={key} style={styles.sbarSection}>
              {/* Section header */}
              <Pressable
                onPress={() =>
                  setExpandedSection(isExpanded ? null : key)
                }
                accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
                style={[
                  styles.sbarHeader,
                  { borderLeftColor: color },
                  isExpanded && { backgroundColor: bg },
                ]}
              >
                <View
                  style={[styles.sbarLetterBadge, { backgroundColor: color }]}
                >
                  <Text style={styles.sbarLetter}>{key}</Text>
                </View>
                <View style={styles.sbarHeaderTextContainer}>
                  <Text
                    style={[
                      styles.sbarTitle,
                      { color: isExpanded ? color : '#1A1A1A' },
                    ]}
                  >
                    {title}
                  </Text>
                  {!isExpanded && hasResult && (
                    <View style={styles.sbarDoneBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#15803D"
                      />
                      <Text style={styles.sbarDoneText}>Compared</Text>
                    </View>
                  )}
                  {!isExpanded && !hasResult && hasInput && (
                    <View style={styles.sbarDraftBadge}>
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color="#B45309"
                      />
                      <Text style={styles.sbarDraftText}>Draft</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isExpanded ? color : '#9CA3AF'}
                />
              </Pressable>

              {/* Section body */}
              {isExpanded && (
                <View style={styles.sbarBody}>
                  {/* Question */}
                  <View style={styles.questionRow}>
                    <Ionicons name={icon as any} size={16} color={color} />
                    <Text style={[styles.questionText, { color }]}>
                      {question}
                    </Text>
                  </View>

                  {/* Guided prompts */}
                  {!submitted && (
                    <View style={styles.promptsContainer}>
                      {prompts.map((p, i) => (
                        <Text key={i} style={styles.promptText}>
                          {p}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Text input */}
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        borderColor: submitted ? '#D1D5DB' : color,
                      },
                    ]}
                    placeholder={`Write your ${title} here...`}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    value={userText}
                    onChangeText={(t) => handleInputChange(key, t)}
                    editable={!submitted}
                    accessibilityLabel={`${title} input`}
                  />

                  {/* Hint chips */}
                  {!submitted && (
                    <View style={styles.hintsContainer}>
                      <Text style={styles.hintsLabel}>Tap to add:</Text>
                      <View style={styles.hintsRow}>
                        {hints.map((hint, i) => {
                          const alreadyUsed = userText
                            .toLowerCase()
                            .includes(hint.toLowerCase())
                          return (
                            <Pressable
                              key={i}
                              style={[
                                styles.hintChip,
                                { borderColor: color },
                                alreadyUsed && styles.hintChipUsed,
                              ]}
                              onPress={() => handleHintTap(key, hint)}
                              disabled={alreadyUsed}
                              accessibilityLabel={`Add hint: ${hint}`}
                            >
                              <Text
                                style={[
                                  styles.hintChipText,
                                  { color: alreadyUsed ? '#9CA3AF' : color },
                                ]}
                              >
                                {hint}
                              </Text>
                              {alreadyUsed && (
                                <Ionicons
                                  name="checkmark"
                                  size={12}
                                  color="#9CA3AF"
                                />
                              )}
                            </Pressable>
                          )
                        })}
                      </View>
                    </View>
                  )}

                  {/* Comparison panel (after submit) */}
                  {submitted && hasResult && (
                    <ComparisonPanel
                      sectionKey={key}
                      userText={userText}
                      result={results[key]!}
                      isWide={isWide}
                    />
                  )}

                  {/* Learning tips from lesson steps */}
                  <LearningTips step={sbarStepMap[key]} />
                </View>
              )}
            </View>
          )
        })}

        {/* Submit button */}
        {!submitted && (
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: allFilled ? accentColor : '#D1D5DB',
              },
            ]}
            onPress={handleSubmit}
            disabled={!allFilled}
            accessibilityLabel="Submit SBAR"
          >
            <Ionicons
              name="paper-plane-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.submitButtonText}>Submit SBAR</Text>
          </Pressable>
        )}

        {/* View final score button */}
        {submitted && allCompared && !showFinal && (
          <Pressable
            style={[styles.finalButton, { backgroundColor: accentColor }]}
            onPress={handleShowFinal}
            accessibilityLabel="View final score"
          >
            <Ionicons name="trophy-outline" size={22} color="#FFFFFF" />
            <Text style={styles.finalButtonText}>
              View Final Score ({totalMatched}/{TOTAL_KEY_ELEMENTS} elements)
            </Text>
          </Pressable>
        )}

        {/* Final score */}
        {showFinal && allCompared && (
          <FinalScorePanel
            totalMatched={totalMatched}
            results={results as Record<SBARKey, SectionResult>}
            accentColor={accentColor}
            onTryAnother={handleTryAnother}
            onComplete={onComplete}
          />
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles -- main
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Instruction
  instructionBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // SBAR section
  sbarSection: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
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
  sbarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
  },
  sbarLetterBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sbarLetter: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sbarHeaderTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sbarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sbarDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sbarDoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  sbarDraftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sbarDraftText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },

  // Section body
  sbarBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // Guided prompts
  promptsContainer: {
    marginBottom: 10,
    gap: 4,
  },
  promptText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
    paddingLeft: 24,
  },

  // Text input
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    minHeight: 120,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },

  // Hint chips
  hintsContainer: {
    marginBottom: 10,
  },
  hintsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hintsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FAFAFA',
  },
  hintChipUsed: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  hintChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Submit button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Final score button
  finalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  finalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

// ---------------------------------------------------------------------------
// Styles -- quick reference
// ---------------------------------------------------------------------------

const refStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0097A7',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  acronymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  acronymTextCol: {
    flex: 1,
  },
  acronymWord: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  acronymDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  whenBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  whenTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  whenBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0369A1',
  },
  whenText: {
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
  },
})

// ---------------------------------------------------------------------------
// Styles -- patient chart
// ---------------------------------------------------------------------------

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0097A7',
  },
  headerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    width: 90,
    marginTop: 2,
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0097A7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
    marginBottom: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0097A7',
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },

  // Vitals comparison
  vitalsCompare: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  vitalsColumn: {
    flex: 1,
    gap: 4,
  },
  vitalsTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  vitalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vitalPillWarn: {
    backgroundColor: '#FEF2F2',
  },
  vitalPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  vitalPillValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  vitalPillValueWarn: {
    color: '#DC2626',
  },

  // Labs
  labsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  labItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
  },
  labLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  labValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  labFlagged: {
    color: '#DC2626',
  },

  // Notes
  notesText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
})

// ---------------------------------------------------------------------------
// Styles -- learning tips
// ---------------------------------------------------------------------------

const tipStyles = StyleSheet.create({
  container: {
    marginTop: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#7C3AED',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 17,
  },
  evidenceText: {
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 17,
    paddingLeft: 4,
  },
  cueBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 10,
  },
  cueText: {
    flex: 1,
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 17,
    fontStyle: 'italic',
  },
})

// ---------------------------------------------------------------------------
// Styles -- comparison
// ---------------------------------------------------------------------------

const compStyles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  sideBySide: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  stacked: {
    gap: 10,
    marginBottom: 10,
  },

  panel: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  panelHalf: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  panelHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  panelBody: {
    padding: 10,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },

  checklistContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  checkLabelMatched: {
    color: '#15803D',
  },
  checkLabelMissed: {
    color: '#DC2626',
  },
})

// ---------------------------------------------------------------------------
// Styles -- final score
// ---------------------------------------------------------------------------

const finalStyles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreOf: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  verdict: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },

  breakdownContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    width: 110,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownPct: {
    width: 30,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

export default SBARBuilderInteractive
