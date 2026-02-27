/**
 * AuscultationSimulator -- Interactive chest auscultation trainer for nursing
 * lessons covering Respiratory Assessment and Cardiac Assessment.
 *
 * The learner taps auscultation points on an SVG chest diagram to explore
 * normal and abnormal findings at each site. Two tab-switchable modes:
 *   - Respiratory: anterior (6 pts) + posterior (6 pts) lung sounds
 *   - Cardiac: anterior chest with the classic 5 cardiac landmarks
 *
 * Each point expands an info card showing anatomical landmarks, normal/abnormal
 * findings, sound indicators, step data (action badge, patient communication,
 * preceptor cue), and a "Mark as Reviewed" button.
 *
 * A collapsible technique reminder panel stays visible at the top.
 * Progress is tracked per-point; a completion callback fires once every point
 * in both modes has been reviewed.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native'
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg'
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
// Public interface
// ---------------------------------------------------------------------------

export interface AuscultationSimulatorProps {
  lessonData: NursingLessonData
  accentColor?: string
  onComplete?: () => void
}

// ---------------------------------------------------------------------------
// Internal data types
// ---------------------------------------------------------------------------

type AuscultationMode = 'respiratory' | 'cardiac'
type ChestView = 'anterior' | 'posterior'

interface AuscultationPoint {
  id: string
  name: string
  shortName: string
  /** x / y expressed as fractions of the SVG viewBox (0-1) so layout is resolution-independent */
  x: number
  y: number
  anatomicalLandmark: string
  normalSound: string
  abnormalSounds: string[]
  soundIndicator: string
  clinicalNote: string
}

interface RespiratoryPointData extends AuscultationPoint {
  view: ChestView
}

interface CardiacPointData extends AuscultationPoint {
  valveAssociation: string
}

// ---------------------------------------------------------------------------
// Action badge config (matching NursingStepViewer)
// ---------------------------------------------------------------------------

const ACTION_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  OBSERVE: {
    color: '#0369A1',
    bg: '#E0F2FE',
    icon: 'eye-outline',
    label: 'Observe',
  },
  PERFORM: {
    color: '#15803D',
    bg: '#DCFCE7',
    icon: 'hand-left-outline',
    label: 'Perform',
  },
  VERIFY: {
    color: '#B45309',
    bg: '#FEF3C7',
    icon: 'checkmark-circle-outline',
    label: 'Verify',
  },
  DOCUMENT: {
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: 'document-text-outline',
    label: 'Document',
  },
}

// ---------------------------------------------------------------------------
// Technique reminders
// ---------------------------------------------------------------------------

const TECHNIQUE_REMINDERS = [
  {
    icon: 'disc-outline' as const,
    text: 'Use diaphragm for high-pitched sounds (breath sounds, S1/S2)',
  },
  {
    icon: 'ellipse-outline' as const,
    text: 'Use bell for low-pitched sounds (S3, S4, murmurs)',
  },
  {
    icon: 'time-outline' as const,
    text: 'Listen for a full respiratory cycle at each point',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    text: 'Compare bilaterally \u2014 right to left at same level',
  },
]

// ---------------------------------------------------------------------------
// Static auscultation data
// ---------------------------------------------------------------------------

const RESPIRATORY_POINTS: RespiratoryPointData[] = [
  // ---- Anterior ----
  {
    id: 'resp-ant-1',
    name: 'Right Apex (Anterior)',
    shortName: 'R Apex',
    view: 'anterior',
    x: 0.38,
    y: 0.18,
    anatomicalLandmark: 'Above the clavicle, right supraclavicular fossa',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Diminished sounds'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Auscultate above the clavicle in the supraclavicular fossa. Vesicular sounds are soft and low-pitched with a long inspiratory phase.',
  },
  {
    id: 'resp-ant-2',
    name: 'Left Apex (Anterior)',
    shortName: 'L Apex',
    view: 'anterior',
    x: 0.62,
    y: 0.18,
    anatomicalLandmark: 'Above the clavicle, left supraclavicular fossa',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Diminished sounds'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Mirror of right apex. Always compare symmetrically. Note any asymmetry in breath sound intensity or quality.',
  },
  {
    id: 'resp-ant-3',
    name: 'Right Upper Lobe (Anterior)',
    shortName: 'R Upper',
    view: 'anterior',
    x: 0.37,
    y: 0.28,
    anatomicalLandmark: '2nd intercostal space, right midclavicular line',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Rhonchi'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Located at the 2nd intercostal space. Compare side to side at the same level before moving inferiorly.',
  },
  {
    id: 'resp-ant-4',
    name: 'Left Upper Lobe (Anterior)',
    shortName: 'L Upper',
    view: 'anterior',
    x: 0.63,
    y: 0.28,
    anatomicalLandmark: '2nd intercostal space, left midclavicular line',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Rhonchi'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Symmetric with the right upper lobe. Note that cardiac sounds may be faintly audible here on the left side.',
  },
  {
    id: 'resp-ant-5',
    name: 'Right Middle Lobe',
    shortName: 'R Middle',
    view: 'anterior',
    x: 0.36,
    y: 0.40,
    anatomicalLandmark: '4th intercostal space, right anterior axillary line',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Rhonchi'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Only the right lung has a distinct middle lobe. The left equivalent is the lingula, assessed at the same level.',
  },
  {
    id: 'resp-ant-6',
    name: 'Left Lingula',
    shortName: 'L Lingula',
    view: 'anterior',
    x: 0.64,
    y: 0.40,
    anatomicalLandmark: '4th intercostal space, left anterior axillary line',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Rhonchi'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'The lingula is the anatomical equivalent of the right middle lobe on the left side. Assess at the 4th-5th intercostal space.',
  },
  {
    id: 'resp-ant-7',
    name: 'Right Lower Lobe (Anterior)',
    shortName: 'R Lower',
    view: 'anterior',
    x: 0.37,
    y: 0.54,
    anatomicalLandmark: '6th intercostal space, right midclavicular line',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Pleural rub'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Crackles here may suggest fluid accumulation or early pneumonia. Ask the patient to take a deep breath and listen through a full cycle.',
  },
  {
    id: 'resp-ant-8',
    name: 'Left Lower Lobe (Anterior)',
    shortName: 'L Lower',
    view: 'anterior',
    x: 0.63,
    y: 0.54,
    anatomicalLandmark: '6th intercostal space, left midclavicular line',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Pleural rub'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Mirror of right lower lobe. Base crackles bilaterally may indicate heart failure or bilateral pneumonia.',
  },
  {
    id: 'resp-ant-9',
    name: 'Right Lateral Base',
    shortName: 'R Lat Base',
    view: 'anterior',
    x: 0.30,
    y: 0.48,
    anatomicalLandmark: 'Right lateral chest wall, 6th-8th intercostal space',
    normalSound: 'Vesicular',
    abnormalSounds: ['Diminished sounds', 'Crackles', 'Pleural rub'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Lateral base assessment captures the lower lobe periphery. Diminished sounds here may indicate pleural effusion.',
  },
  {
    id: 'resp-ant-10',
    name: 'Left Lateral Base',
    shortName: 'L Lat Base',
    view: 'anterior',
    x: 0.70,
    y: 0.48,
    anatomicalLandmark: 'Left lateral chest wall, 6th-8th intercostal space',
    normalSound: 'Vesicular',
    abnormalSounds: ['Diminished sounds', 'Crackles', 'Pleural rub'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Compare with the right lateral base. Asymmetry suggests unilateral pathology such as effusion or consolidation.',
  },
  // ---- Posterior ----
  {
    id: 'resp-post-1',
    name: 'Right Posterior Apex',
    shortName: 'R Apex',
    view: 'posterior',
    x: 0.38,
    y: 0.18,
    anatomicalLandmark: 'Above the scapular spine, right side',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Stridor'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Auscultate above the scapular spine. Ask the patient to cross arms to separate the scapulae for better access.',
  },
  {
    id: 'resp-post-2',
    name: 'Left Posterior Apex',
    shortName: 'L Apex',
    view: 'posterior',
    x: 0.62,
    y: 0.18,
    anatomicalLandmark: 'Above the scapular spine, left side',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Stridor'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Symmetric with right posterior apex. Apical tuberculosis classically presents with abnormal sounds in this location.',
  },
  {
    id: 'resp-post-3',
    name: 'Right Upper Lobe (Posterior)',
    shortName: 'R Upper',
    view: 'posterior',
    x: 0.37,
    y: 0.30,
    anatomicalLandmark: '2nd intercostal space, right paraspinal area',
    normalSound: 'Bronchovesicular',
    abnormalSounds: ['Crackles', 'Rhonchi', 'Diminished sounds'],
    soundIndicator: 'Normal Bronchovesicular',
    clinicalNote:
      'Between the scapulae. Bronchovesicular sounds are normal here due to proximity to major bronchi.',
  },
  {
    id: 'resp-post-4',
    name: 'Left Upper Lobe (Posterior)',
    shortName: 'L Upper',
    view: 'posterior',
    x: 0.63,
    y: 0.30,
    anatomicalLandmark: '2nd intercostal space, left paraspinal area',
    normalSound: 'Bronchovesicular',
    abnormalSounds: ['Crackles', 'Rhonchi', 'Diminished sounds'],
    soundIndicator: 'Normal Bronchovesicular',
    clinicalNote:
      'Symmetric with right upper posterior. Bronchovesicular sounds heard peripherally may indicate consolidation.',
  },
  {
    id: 'resp-post-5',
    name: 'Right Lower Lobe (Posterior)',
    shortName: 'R Lower',
    view: 'posterior',
    x: 0.37,
    y: 0.48,
    anatomicalLandmark: 'Below the inferior scapular border, right side',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Pleural rub', 'Diminished sounds'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Below the inferior border of the scapula. Gravity-dependent crackles suggest fluid; ask the patient to cough and re-listen.',
  },
  {
    id: 'resp-post-6',
    name: 'Left Lower Lobe (Posterior)',
    shortName: 'L Lower',
    view: 'posterior',
    x: 0.63,
    y: 0.48,
    anatomicalLandmark: 'Below the inferior scapular border, left side',
    normalSound: 'Vesicular',
    abnormalSounds: ['Crackles', 'Wheezes', 'Pleural rub', 'Diminished sounds'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Mirror of right lower posterior. Bilateral base crackles that clear with coughing are common in immobile patients.',
  },
  {
    id: 'resp-post-7',
    name: 'Right Posterior Base',
    shortName: 'R Base',
    view: 'posterior',
    x: 0.35,
    y: 0.60,
    anatomicalLandmark: 'Right costophrenic angle, posterior',
    normalSound: 'Vesicular',
    abnormalSounds: ['Diminished sounds', 'Crackles', 'Absent sounds'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'The posterior bases are gravity-dependent and the first place fluid accumulates. Percuss before auscultating to check for dullness.',
  },
  {
    id: 'resp-post-8',
    name: 'Left Posterior Base',
    shortName: 'L Base',
    view: 'posterior',
    x: 0.65,
    y: 0.60,
    anatomicalLandmark: 'Left costophrenic angle, posterior',
    normalSound: 'Vesicular',
    abnormalSounds: ['Diminished sounds', 'Crackles', 'Absent sounds'],
    soundIndicator: 'Normal Vesicular',
    clinicalNote:
      'Compare bilaterally with right posterior base. Unilateral dullness with absent breath sounds strongly suggests pleural effusion.',
  },
]

const CARDIAC_POINTS: CardiacPointData[] = [
  {
    id: 'card-1',
    name: 'Aortic Area',
    shortName: 'Aortic',
    x: 0.44,
    y: 0.22,
    anatomicalLandmark: '2nd Intercostal Space, right sternal border',
    valveAssociation: 'Aortic valve',
    normalSound: 'S2 > S1. Crisp A2 component of S2.',
    abnormalSounds: [
      'Systolic ejection murmur (aortic stenosis)',
      'Early diastolic murmur (aortic regurgitation)',
      'Radiating murmur to carotids',
    ],
    soundIndicator: 'S1/S2 (S2 loudest)',
    clinicalNote:
      'Use the diaphragm of the stethoscope. S2 is normally louder than S1 here. A crescendo-decrescendo systolic murmur suggests aortic stenosis.',
  },
  {
    id: 'card-2',
    name: 'Pulmonic Area',
    shortName: 'Pulmonic',
    x: 0.56,
    y: 0.22,
    anatomicalLandmark: '2nd Intercostal Space, left sternal border',
    valveAssociation: 'Pulmonic valve',
    normalSound: 'S2 > S1. Physiological splitting of S2 may be heard.',
    abnormalSounds: [
      'Systolic ejection murmur (pulmonic stenosis)',
      'Wide or fixed splitting of S2 (ASD)',
      'Early diastolic murmur (pulmonic regurgitation)',
    ],
    soundIndicator: 'S1/S2 (splitting)',
    clinicalNote:
      'Listen for splitting of S2 during inspiration. Fixed splitting suggests atrial septal defect. Best heard with the diaphragm.',
  },
  {
    id: 'card-3',
    name: "Erb's Point",
    shortName: "Erb's",
    x: 0.54,
    y: 0.32,
    anatomicalLandmark: '3rd Intercostal Space, left sternal border',
    valveAssociation: 'Aortic and Pulmonic (overlap)',
    normalSound: 'S1 and S2 roughly equal intensity.',
    abnormalSounds: [
      'Early diastolic murmur of aortic regurgitation',
      'Murmurs from either aortic or pulmonic valves',
      'Systolic murmurs',
    ],
    soundIndicator: 'S1/S2 (equal)',
    clinicalNote:
      'A key listening post where aortic regurgitation murmurs are often best detected. Use the diaphragm with the patient sitting up and leaning forward.',
  },
  {
    id: 'card-4',
    name: 'Tricuspid Area',
    shortName: 'Tricuspid',
    x: 0.52,
    y: 0.42,
    anatomicalLandmark: '4th Intercostal Space, left lower sternal border',
    valveAssociation: 'Tricuspid valve',
    normalSound: 'S1 > S2. Normal S1 intensity.',
    abnormalSounds: [
      'Pansystolic murmur (tricuspid regurgitation)',
      'Diastolic rumble (tricuspid stenosis)',
      'S3 or S4 gallop (right-sided)',
      'Pericardial friction rub',
    ],
    soundIndicator: 'S1/S2 (S1 loudest)',
    clinicalNote:
      'Murmurs here increase with inspiration (Carvallo sign). Use the bell of the stethoscope for low-pitched sounds like S3 gallop.',
  },
  {
    id: 'card-5',
    name: 'Mitral / Apical Area',
    shortName: 'Mitral',
    x: 0.62,
    y: 0.52,
    anatomicalLandmark: '5th Intercostal Space, midclavicular line',
    valveAssociation: 'Mitral valve',
    normalSound: 'S1 > S2. Loudest S1 on the precordium.',
    abnormalSounds: [
      'Pansystolic murmur (mitral regurgitation)',
      'Low-pitched diastolic rumble (mitral stenosis)',
      'S3 gallop (volume overload / heart failure)',
      'S4 gallop (stiff ventricle / hypertension)',
      'Midsystolic click (mitral valve prolapse)',
    ],
    soundIndicator: 'S1/S2 (S1 loudest, PMI)',
    clinicalNote:
      'Also called the PMI (Point of Maximum Impulse). Use the bell for S3/S4 and the diaphragm for high-pitched murmurs. Position the patient in the left lateral decubitus position to accentuate mitral sounds.',
  },
]

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const COLORS = {
  background: '#FAF8F5',
  card: '#FFFFFF',
  nursingAccent: '#0097A7',
  respiratory: '#0369A1',
  respiratoryLight: '#E0F2FE',
  respiratoryMid: '#0284C7',
  respiratoryDark: '#0C4A6E',
  cardiac: '#DC2626',
  cardiacLight: '#FEF2F2',
  cardiacWarm: '#EA580C',
  cardiacDark: '#7F1D1D',
  textPrimary: '#1A1A1A',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  success: '#16A34A',
  successLight: '#DCFCE7',
  chestSkin: '#F5D6BA',
  chestOutline: '#C9A88C',
  posteriorSkin: '#ECC9A8',
}

// ---------------------------------------------------------------------------
// Animated pulsing circle wrapper
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

function PulsingDot({
  cx,
  cy,
  baseRadius,
  color,
  isSelected,
  isVisited,
}: {
  cx: number
  cy: number
  baseRadius: number
  color: string
  isSelected: boolean
  isVisited: boolean
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isSelected) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulseAnim.setValue(0)
    }
  }, [isSelected, pulseAnim])

  const outerRadius = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [baseRadius + 2, baseRadius + 8],
  })

  const outerOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.1],
  })

  const fillColor = isVisited
    ? COLORS.success
    : isSelected
      ? color
      : '#FFFFFF'

  const strokeColor = isVisited ? COLORS.success : color

  return (
    <G>
      {isSelected && (
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={outerRadius}
          fill={color}
          opacity={outerOpacity}
        />
      )}
      <Circle
        cx={cx}
        cy={cy}
        r={baseRadius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.8}
        opacity={isVisited && !isSelected ? 0.85 : 1}
      />
      {isVisited && (
        <SvgText
          x={cx}
          y={cy + 1.5}
          fontSize={7}
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
          alignmentBaseline="central"
        >
          {'\u2713'}
        </SvgText>
      )}
    </G>
  )
}

// ---------------------------------------------------------------------------
// SVG chest diagrams
// ---------------------------------------------------------------------------

function AnteriorChestSvg({
  mode,
  points,
  selectedId,
  visitedIds,
  onPointPress,
}: {
  mode: AuscultationMode
  points: (RespiratoryPointData | CardiacPointData)[]
  selectedId: string | null
  visitedIds: Set<string>
  onPointPress: (id: string) => void
}) {
  const dotColor = mode === 'respiratory' ? COLORS.respiratory : COLORS.cardiac

  return (
    <Svg viewBox="0 0 200 160" style={svgStyles.svgContainer}>
      {/* Torso outline */}
      <Path
        d="M60,15 Q65,5 80,3 Q90,1 100,2 Q110,1 120,3 Q135,5 140,15
           L148,30 Q155,50 152,70 L150,90 Q148,120 145,140
           Q140,155 130,158 L70,158 Q60,155 55,140
           Q52,120 50,90 L48,70 Q45,50 52,30 Z"
        fill={COLORS.chestSkin}
        stroke={COLORS.chestOutline}
        strokeWidth={1.2}
      />

      {/* Neck */}
      <Path
        d="M88,3 Q90,-2 100,0 Q110,-2 112,3"
        fill="none"
        stroke={COLORS.chestOutline}
        strokeWidth={0.8}
      />

      {/* Clavicles */}
      <Path
        d="M55,22 Q70,16 88,18"
        fill="none"
        stroke={COLORS.chestOutline}
        strokeWidth={0.7}
        opacity={0.6}
      />
      <Path
        d="M112,18 Q130,16 145,22"
        fill="none"
        stroke={COLORS.chestOutline}
        strokeWidth={0.7}
        opacity={0.6}
      />

      {/* Sternum center line */}
      <Line
        x1={100}
        y1={18}
        x2={100}
        y2={95}
        stroke={COLORS.chestOutline}
        strokeWidth={0.5}
        opacity={0.3}
        strokeDasharray="3,3"
      />

      {/* Rib guidelines (intercostal space references) */}
      {[30, 42, 54, 66, 78, 90].map((yVal, idx) => (
        <G key={`rib-${idx}`}>
          <Path
            d={`M${60 + idx * 0.5},${yVal} Q80,${yVal - 2} 100,${yVal}`}
            fill="none"
            stroke={COLORS.chestOutline}
            strokeWidth={0.3}
            opacity={0.25}
          />
          <Path
            d={`M100,${yVal} Q120,${yVal - 2} ${140 - idx * 0.5},${yVal}`}
            fill="none"
            stroke={COLORS.chestOutline}
            strokeWidth={0.3}
            opacity={0.25}
          />
        </G>
      ))}

      {/* Lung field outlines (anterior projection) */}
      <Path
        d="M62,22 Q65,20 78,18 L88,18 Q92,18 92,24
           L90,45 Q88,65 86,85 Q84,95 80,100
           Q72,105 65,95 Q58,80 56,60 Q54,40 58,28 Z"
        fill={mode === 'respiratory' ? COLORS.respiratoryLight : 'transparent'}
        stroke={mode === 'respiratory' ? COLORS.respiratory : 'transparent'}
        strokeWidth={0.6}
        opacity={0.35}
      />
      <Path
        d="M138,22 Q135,20 122,18 L112,18 Q108,18 108,24
           L110,45 Q112,65 114,85 Q116,95 120,100
           Q128,105 135,95 Q142,80 144,60 Q146,40 142,28 Z"
        fill={mode === 'respiratory' ? COLORS.respiratoryLight : 'transparent'}
        stroke={mode === 'respiratory' ? COLORS.respiratory : 'transparent'}
        strokeWidth={0.6}
        opacity={0.35}
      />

      {/* Heart silhouette (cardiac mode) */}
      {mode === 'cardiac' && (
        <Path
          d="M92,35 Q88,30 90,25 Q93,20 98,22
             L100,24 L102,22 Q107,20 110,25 Q112,30 108,35
             L100,55 Z"
          fill={COLORS.cardiacLight}
          stroke={COLORS.cardiac}
          strokeWidth={0.6}
          opacity={0.4}
          transform="translate(2, 18) scale(1.6)"
        />
      )}

      {/* Label */}
      <SvgText
        x={100}
        y={153}
        fontSize={8}
        fill={COLORS.textTertiary}
        textAnchor="middle"
        fontWeight="600"
      >
        ANTERIOR VIEW
      </SvgText>

      {/* Auscultation points */}
      {points.map((pt, idx) => {
        const cx = pt.x * 200
        const cy = pt.y * 160
        return (
          <G key={pt.id} onPress={() => onPointPress(pt.id)}>
            {/* Invisible larger hit area */}
            <Circle cx={cx} cy={cy} r={12} fill="transparent" />
            <PulsingDot
              cx={cx}
              cy={cy}
              baseRadius={6}
              color={dotColor}
              isSelected={selectedId === pt.id}
              isVisited={visitedIds.has(pt.id)}
            />
            {/* Tiny label */}
            <SvgText
              x={cx}
              y={cy - 9}
              fontSize={4.5}
              fill={visitedIds.has(pt.id) ? COLORS.success : dotColor}
              textAnchor="middle"
              fontWeight="600"
              opacity={selectedId === pt.id ? 1 : 0.7}
            >
              {pt.shortName}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

function PosteriorChestSvg({
  points,
  selectedId,
  visitedIds,
  onPointPress,
}: {
  points: RespiratoryPointData[]
  selectedId: string | null
  visitedIds: Set<string>
  onPointPress: (id: string) => void
}) {
  const dotColor = COLORS.respiratory

  return (
    <Svg viewBox="0 0 200 160" style={svgStyles.svgContainer}>
      {/* Torso outline (posterior) */}
      <Path
        d="M60,15 Q65,5 80,3 Q90,1 100,2 Q110,1 120,3 Q135,5 140,15
           L148,30 Q155,50 152,70 L150,90 Q148,120 145,140
           Q140,155 130,158 L70,158 Q60,155 55,140
           Q52,120 50,90 L48,70 Q45,50 52,30 Z"
        fill={COLORS.posteriorSkin}
        stroke={COLORS.chestOutline}
        strokeWidth={1.2}
      />

      {/* Spine */}
      <Line
        x1={100}
        y1={5}
        x2={100}
        y2={145}
        stroke={COLORS.chestOutline}
        strokeWidth={0.7}
        opacity={0.4}
      />

      {/* Vertebral bumps */}
      {[15, 28, 41, 54, 67, 80, 93, 106, 119].map((yv, i) => (
        <Circle
          key={`vert-${i}`}
          cx={100}
          cy={yv}
          r={1.8}
          fill={COLORS.chestOutline}
          opacity={0.25}
        />
      ))}

      {/* Scapulae */}
      <Path
        d="M65,28 L62,70 Q63,82 70,84 L85,80 Q90,75 88,40 Q87,30 80,25 Z"
        fill="none"
        stroke={COLORS.chestOutline}
        strokeWidth={0.6}
        opacity={0.3}
      />
      <Path
        d="M135,28 L138,70 Q137,82 130,84 L115,80 Q110,75 112,40 Q113,30 120,25 Z"
        fill="none"
        stroke={COLORS.chestOutline}
        strokeWidth={0.6}
        opacity={0.3}
      />

      {/* Lung fields (posterior) */}
      <Path
        d="M62,20 Q70,16 88,18 L95,20
           Q96,30 95,50 L92,75 Q90,90 85,100
           Q75,108 65,98 Q58,85 55,65 Q52,45 56,28 Z"
        fill={COLORS.respiratoryLight}
        stroke={COLORS.respiratory}
        strokeWidth={0.6}
        opacity={0.35}
      />
      <Path
        d="M138,20 Q130,16 112,18 L105,20
           Q104,30 105,50 L108,75 Q110,90 115,100
           Q125,108 135,98 Q142,85 145,65 Q148,45 144,28 Z"
        fill={COLORS.respiratoryLight}
        stroke={COLORS.respiratory}
        strokeWidth={0.6}
        opacity={0.35}
      />

      {/* Label */}
      <SvgText
        x={100}
        y={153}
        fontSize={8}
        fill={COLORS.textTertiary}
        textAnchor="middle"
        fontWeight="600"
      >
        POSTERIOR VIEW
      </SvgText>

      {/* Points */}
      {points.map((pt) => {
        const cx = pt.x * 200
        const cy = pt.y * 160
        return (
          <G key={pt.id} onPress={() => onPointPress(pt.id)}>
            <Circle cx={cx} cy={cy} r={12} fill="transparent" />
            <PulsingDot
              cx={cx}
              cy={cy}
              baseRadius={6}
              color={dotColor}
              isSelected={selectedId === pt.id}
              isVisited={visitedIds.has(pt.id)}
            />
            <SvgText
              x={cx}
              y={cy - 9}
              fontSize={4.5}
              fill={visitedIds.has(pt.id) ? COLORS.success : dotColor}
              textAnchor="middle"
              fontWeight="600"
              opacity={selectedId === pt.id ? 1 : 0.7}
            >
              {pt.shortName}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

const svgStyles = StyleSheet.create({
  svgContainer: {
    width: '100%',
    aspectRatio: 200 / 160,
  },
})

// ---------------------------------------------------------------------------
// Step mapping helper
// ---------------------------------------------------------------------------

/**
 * Maps lesson steps to auscultation points. Steps are distributed across
 * respiratory (anterior + posterior) and cardiac points based on stepNumber
 * ordering. The component is flexible: if fewer steps exist than points,
 * remaining points use default data only. If more steps exist, extras are
 * ignored gracefully.
 */
function getStepForPoint(
  steps: NursingStep[],
  pointIndex: number,
  mode: AuscultationMode,
): NursingStep | null {
  if (!steps || steps.length === 0) return null

  // Respiratory points occupy the first portion of steps,
  // cardiac points occupy the latter portion.
  const anteriorCount = RESPIRATORY_POINTS.filter(
    (p) => p.view === 'anterior',
  ).length
  const posteriorCount = RESPIRATORY_POINTS.filter(
    (p) => p.view === 'posterior',
  ).length
  const totalRespPoints = anteriorCount + posteriorCount
  const totalCardiacPoints = CARDIAC_POINTS.length

  let stepIndex: number
  if (mode === 'respiratory') {
    stepIndex = pointIndex
  } else {
    stepIndex = totalRespPoints + pointIndex
  }

  if (stepIndex >= 0 && stepIndex < steps.length) {
    return steps[stepIndex]
  }
  return null
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

function PointDetailPanel({
  point,
  mode,
  step,
  isReviewed,
  onMarkReviewed,
  recommendedOrder,
  currentOrderIndex,
}: {
  point: RespiratoryPointData | CardiacPointData
  mode: AuscultationMode
  step: NursingStep | null
  isReviewed: boolean
  onMarkReviewed: () => void
  recommendedOrder: number
  currentOrderIndex: number
}) {
  const modeColor = mode === 'respiratory' ? COLORS.respiratory : COLORS.cardiac
  const modeLightColor =
    mode === 'respiratory' ? COLORS.respiratoryLight : COLORS.cardiacLight

  const isCardiac = mode === 'cardiac'
  const cardiacPoint = isCardiac ? (point as CardiacPointData) : null

  const actionCfg = step
    ? ACTION_CONFIG[step.action] || ACTION_CONFIG.OBSERVE
    : null

  return (
    <View>
      {/* Point name and landmark */}
      <Text style={detailStyles.pointName}>{point.name}</Text>
      <Text style={[detailStyles.landmarkLabel, { color: modeColor }]}>
        {point.anatomicalLandmark}
      </Text>

      {/* Recommended order badge */}
      <View style={[detailStyles.orderBadge, { backgroundColor: modeLightColor }]}>
        <Ionicons name="navigate-outline" size={12} color={modeColor} />
        <Text style={[detailStyles.orderBadgeText, { color: modeColor }]}>
          Point {recommendedOrder} of{' '}
          {mode === 'respiratory'
            ? RESPIRATORY_POINTS.length
            : CARDIAC_POINTS.length}
        </Text>
      </View>

      {/* Valve association (cardiac only) */}
      {cardiacPoint && (
        <View style={detailStyles.valveRow}>
          <Ionicons name="heart" size={14} color={COLORS.cardiac} />
          <Text style={detailStyles.valveText}>
            Valve: {cardiacPoint.valveAssociation}
          </Text>
        </View>
      )}

      {/* Sound indicator */}
      <View style={[detailStyles.soundIndicator, { borderColor: modeColor }]}>
        <View style={detailStyles.soundIndicatorHeader}>
          <Ionicons name="musical-notes-outline" size={16} color={modeColor} />
          <Text style={[detailStyles.soundIndicatorLabel, { color: modeColor }]}>
            Sound
          </Text>
        </View>
        <Text style={detailStyles.soundIndicatorValue}>
          {point.soundIndicator}
        </Text>
      </View>

      {/* Normal findings */}
      <View
        style={[detailStyles.findingsCard, { borderLeftColor: COLORS.success }]}
      >
        <View style={detailStyles.findingsCardHeader}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={detailStyles.findingsCardTitle}>Normal Findings</Text>
        </View>
        <Text style={detailStyles.findingsCardValue}>{point.normalSound}</Text>
      </View>

      {/* Abnormal findings */}
      <View
        style={[
          detailStyles.findingsCard,
          { borderLeftColor: COLORS.cardiacWarm },
        ]}
      >
        <View style={detailStyles.findingsCardHeader}>
          <Ionicons name="warning" size={16} color={COLORS.cardiacWarm} />
          <Text style={detailStyles.findingsCardTitle}>
            Abnormal Findings to Watch For
          </Text>
        </View>
        {point.abnormalSounds.map((sound, idx) => (
          <View key={idx} style={detailStyles.abnormalItem}>
            <View
              style={[
                detailStyles.abnormalBullet,
                { backgroundColor: COLORS.cardiacWarm },
              ]}
            />
            <Text style={detailStyles.abnormalText}>{sound}</Text>
          </View>
        ))}
      </View>

      {/* Step data: what to listen for */}
      {step && step.description && (
        <View style={detailStyles.listenForCard}>
          <View style={detailStyles.listenForHeader}>
            <Ionicons name="ear-outline" size={14} color={modeColor} />
            <Text style={[detailStyles.listenForTitle, { color: modeColor }]}>
              What to Listen For
            </Text>
          </View>
          <Text style={detailStyles.listenForText}>{step.description}</Text>
        </View>
      )}

      {/* Step data: details */}
      {step && step.details && step.details.length > 0 && (
        <View style={detailStyles.detailsList}>
          {step.details.map((detail, idx) => (
            <View key={idx} style={detailStyles.detailItem}>
              <View
                style={[detailStyles.detailBullet, { backgroundColor: modeColor }]}
              />
              <Text style={detailStyles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action badge (matching NursingStepViewer style) */}
      {step && actionCfg && (
        <View style={[detailStyles.actionBadge, { backgroundColor: actionCfg.bg }]}>
          <Ionicons name={actionCfg.icon as any} size={14} color={actionCfg.color} />
          <Text style={[detailStyles.actionBadgeText, { color: actionCfg.color }]}>
            {actionCfg.label}
          </Text>
          {step.criticalAction && (
            <View style={detailStyles.criticalBadge}>
              <Ionicons name="alert-circle" size={12} color="#DC2626" />
              <Text style={detailStyles.criticalBadgeText}>Critical</Text>
            </View>
          )}
        </View>
      )}

      {/* Patient communication */}
      {step?.patientCommunication && (
        <View style={detailStyles.communicationBox}>
          <View style={detailStyles.communicationHeader}>
            <Ionicons name="chatbubble-outline" size={14} color="#0369A1" />
            <Text style={detailStyles.communicationTitle}>Say to Patient</Text>
          </View>
          <Text style={detailStyles.communicationText}>
            &ldquo;{step.patientCommunication}&rdquo;
          </Text>
        </View>
      )}

      {/* Risks */}
      {step?.risks && step.risks.length > 0 && (
        <View style={detailStyles.risksBox}>
          <View style={detailStyles.risksHeader}>
            <Ionicons name="warning-outline" size={14} color="#DC2626" />
            <Text style={detailStyles.risksTitle}>
              Risks if Done Incorrectly
            </Text>
          </View>
          {step.risks.map((risk, idx) => (
            <Text key={idx} style={detailStyles.riskItem}>
              {'\u2022'} {risk}
            </Text>
          ))}
        </View>
      )}

      {/* Preceptor cue */}
      {step?.preceptorCue && (
        <View style={detailStyles.preceptorBox}>
          <View style={detailStyles.preceptorHeader}>
            <Ionicons name="school-outline" size={14} color="#7C3AED" />
            <Text style={detailStyles.preceptorTitle}>Preceptor Tip</Text>
          </View>
          <Text style={detailStyles.preceptorText}>{step.preceptorCue}</Text>
        </View>
      )}

      {/* Clinical note */}
      <View style={detailStyles.noteCard}>
        <View style={detailStyles.noteHeader}>
          <Ionicons name="medkit" size={14} color={modeColor} />
          <Text style={[detailStyles.noteTitle, { color: modeColor }]}>
            Clinical Note
          </Text>
        </View>
        <Text style={detailStyles.noteText}>{point.clinicalNote}</Text>
      </View>

      {/* Mark as reviewed button */}
      {!isReviewed ? (
        <Pressable
          style={[detailStyles.reviewButton, { backgroundColor: modeColor }]}
          onPress={onMarkReviewed}
          accessibilityLabel={`Mark ${point.name} as reviewed`}
          accessibilityRole="button"
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={detailStyles.reviewButtonText}>Mark as Reviewed</Text>
        </Pressable>
      ) : (
        <View style={detailStyles.reviewedBadge}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={detailStyles.reviewedBadgeText}>Reviewed</Text>
        </View>
      )}
    </View>
  )
}

const detailStyles = StyleSheet.create({
  pointName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  landmarkLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  valveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.cardiacLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  valveText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cardiacDark,
  },
  soundIndicator: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  soundIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  soundIndicatorLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soundIndicatorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  findingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  findingsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  findingsCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  findingsCardValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  abnormalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  abnormalBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  abnormalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  listenForCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  listenForHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  listenForTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  listenForText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  detailsList: {
    gap: 8,
    marginBottom: 12,
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
    marginTop: 7,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
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
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  reviewedBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
  },
})

// ---------------------------------------------------------------------------
// Technique reminder panel
// ---------------------------------------------------------------------------

function TechniqueReminderPanel({ modeColor }: { modeColor: string }) {
  const [expanded, setExpanded] = useState(true)

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((prev) => !prev)
  }, [])

  return (
    <View style={techniqueStyles.container}>
      <Pressable
        style={techniqueStyles.header}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? 'Collapse technique reminders'
            : 'Expand technique reminders'
        }
      >
        <View style={techniqueStyles.headerLeft}>
          <Ionicons name="bulb-outline" size={16} color={modeColor} />
          <Text style={[techniqueStyles.headerTitle, { color: modeColor }]}>
            Stethoscope Technique
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textTertiary}
        />
      </Pressable>
      {expanded && (
        <View style={techniqueStyles.body}>
          {TECHNIQUE_REMINDERS.map((reminder, idx) => (
            <View key={idx} style={techniqueStyles.reminderRow}>
              <Ionicons
                name={reminder.icon as any}
                size={14}
                color={COLORS.textTertiary}
              />
              <Text style={techniqueStyles.reminderText}>{reminder.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const techniqueStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reminderText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
})

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AuscultationSimulator({
  lessonData,
  accentColor = COLORS.nursingAccent,
  onComplete,
}: AuscultationSimulatorProps) {
  const { width: screenWidth } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)

  const [mode, setMode] = useState<AuscultationMode>('respiratory')
  const [chestView, setChestView] = useState<ChestView>('anterior')
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [reviewedRespIds, setReviewedRespIds] = useState<Set<string>>(
    new Set(),
  )
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(
    new Set(),
  )
  const [completedModes, setCompletedModes] = useState<Set<AuscultationMode>>(
    new Set(),
  )

  const steps = lessonData.steps

  // Derived data
  const anteriorRespPoints = useMemo(
    () => RESPIRATORY_POINTS.filter((p) => p.view === 'anterior'),
    [],
  )
  const posteriorRespPoints = useMemo(
    () => RESPIRATORY_POINTS.filter((p) => p.view === 'posterior'),
    [],
  )

  const currentReviewed =
    mode === 'respiratory' ? reviewedRespIds : reviewedCardIds
  const totalPoints =
    mode === 'respiratory' ? RESPIRATORY_POINTS.length : CARDIAC_POINTS.length
  const reviewedCount = currentReviewed.size

  const selectedPoint = useMemo(() => {
    if (!selectedPointId) return null
    if (mode === 'respiratory') {
      return RESPIRATORY_POINTS.find((p) => p.id === selectedPointId) ?? null
    }
    return CARDIAC_POINTS.find((p) => p.id === selectedPointId) ?? null
  }, [selectedPointId, mode])

  // Compute the index of the selected point within its mode's point array
  const selectedPointIndex = useMemo(() => {
    if (!selectedPointId) return -1
    if (mode === 'respiratory') {
      return RESPIRATORY_POINTS.findIndex((p) => p.id === selectedPointId)
    }
    return CARDIAC_POINTS.findIndex((p) => p.id === selectedPointId)
  }, [selectedPointId, mode])

  // Get the mapped step for the selected point
  const mappedStep = useMemo(() => {
    if (selectedPointIndex < 0) return null
    return getStepForPoint(steps, selectedPointIndex, mode)
  }, [steps, selectedPointIndex, mode])

  // Check completion
  useEffect(() => {
    if (
      mode === 'respiratory' &&
      reviewedRespIds.size === RESPIRATORY_POINTS.length
    ) {
      if (!completedModes.has('respiratory')) {
        setCompletedModes((prev) => new Set(prev).add('respiratory'))
      }
    }
    if (mode === 'cardiac' && reviewedCardIds.size === CARDIAC_POINTS.length) {
      if (!completedModes.has('cardiac')) {
        setCompletedModes((prev) => new Set(prev).add('cardiac'))
      }
    }
  }, [reviewedRespIds, reviewedCardIds, mode, completedModes])

  // Fire onComplete when both modes are done
  const hasFiredComplete = useRef(false)
  useEffect(() => {
    if (
      completedModes.has('respiratory') &&
      completedModes.has('cardiac') &&
      !hasFiredComplete.current
    ) {
      hasFiredComplete.current = true
      onComplete?.()
    }
  }, [completedModes, onComplete])

  const handlePointPress = useCallback(
    (id: string) => {
      setSelectedPointId(id)
      // Scroll detail panel into view
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }, 150)
    },
    [],
  )

  const handleMarkReviewed = useCallback(() => {
    if (!selectedPointId) return

    if (mode === 'respiratory') {
      setReviewedRespIds((prev) => {
        const next = new Set(prev)
        next.add(selectedPointId)
        return next
      })
    } else {
      setReviewedCardIds((prev) => {
        const next = new Set(prev)
        next.add(selectedPointId)
        return next
      })
    }

    // Auto-advance to next unreviewed point
    const allPoints =
      mode === 'respiratory' ? RESPIRATORY_POINTS : CARDIAC_POINTS
    const currentIdx = allPoints.findIndex((p) => p.id === selectedPointId)
    const reviewed =
      mode === 'respiratory' ? reviewedRespIds : reviewedCardIds

    // Find next unreviewed point after current
    let nextPoint: (typeof allPoints)[number] | null = null
    for (let i = 1; i < allPoints.length; i++) {
      const idx = (currentIdx + i) % allPoints.length
      if (!reviewed.has(allPoints[idx].id) && allPoints[idx].id !== selectedPointId) {
        nextPoint = allPoints[idx]
        break
      }
    }

    if (nextPoint) {
      // Switch chest view if needed (respiratory mode only)
      if (mode === 'respiratory') {
        const nextResp = nextPoint as RespiratoryPointData
        if (nextResp.view !== chestView) {
          setChestView(nextResp.view)
        }
      }
      setTimeout(() => {
        setSelectedPointId(nextPoint!.id)
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true })
        }, 150)
      }, 300)
    }
  }, [selectedPointId, mode, reviewedRespIds, reviewedCardIds, chestView])

  const handleModeSwitch = useCallback(
    (newMode: AuscultationMode) => {
      if (newMode === mode) return
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setMode(newMode)
      setSelectedPointId(null)
      if (newMode === 'respiratory') {
        setChestView('anterior')
      }
    },
    [mode],
  )

  const modeColor =
    mode === 'respiratory' ? COLORS.respiratory : COLORS.cardiac
  const isModeComplete = completedModes.has(mode)
  const progressPct = totalPoints > 0 ? (reviewedCount / totalPoints) * 100 : 0
  const cardMaxWidth = Math.min(screenWidth - 32, 600)

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[styles.headerIconCircle, { backgroundColor: accentColor }]}
          >
            <Ionicons name="fitness" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Auscultation Simulator</Text>
            <Text style={styles.headerSubtitle}>
              Tap each point to learn normal and abnormal findings
            </Text>
          </View>
        </View>

        {/* Technique reminder panel (always visible / collapsible) */}
        <TechniqueReminderPanel modeColor={modeColor} />

        {/* Mode tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[
              styles.tab,
              mode === 'respiratory' && styles.tabActive,
              mode === 'respiratory' && {
                backgroundColor: COLORS.respiratoryLight,
                borderColor: COLORS.respiratory,
              },
            ]}
            onPress={() => handleModeSwitch('respiratory')}
            accessibilityLabel="Respiratory mode"
            accessibilityRole="tab"
          >
            <Ionicons
              name="cloud-outline"
              size={16}
              color={
                mode === 'respiratory'
                  ? COLORS.respiratory
                  : COLORS.textTertiary
              }
            />
            <Text
              style={[
                styles.tabText,
                mode === 'respiratory' && {
                  color: COLORS.respiratory,
                  fontWeight: '700',
                },
              ]}
            >
              Respiratory
            </Text>
            {completedModes.has('respiratory') && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={COLORS.success}
              />
            )}
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              mode === 'cardiac' && styles.tabActive,
              mode === 'cardiac' && {
                backgroundColor: COLORS.cardiacLight,
                borderColor: COLORS.cardiac,
              },
            ]}
            onPress={() => handleModeSwitch('cardiac')}
            accessibilityLabel="Cardiac mode"
            accessibilityRole="tab"
          >
            <Ionicons
              name="heart-outline"
              size={16}
              color={
                mode === 'cardiac' ? COLORS.cardiac : COLORS.textTertiary
              }
            />
            <Text
              style={[
                styles.tabText,
                mode === 'cardiac' && {
                  color: COLORS.cardiac,
                  fontWeight: '700',
                },
              ]}
            >
              Cardiac
            </Text>
            {completedModes.has('cardiac') && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={COLORS.success}
              />
            )}
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: modeColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {reviewedCount}/{totalPoints} points reviewed
          </Text>
        </View>

        {/* View toggle for respiratory mode */}
        {mode === 'respiratory' && (
          <View style={styles.viewToggleContainer}>
            <Pressable
              style={[
                styles.viewToggle,
                chestView === 'anterior' && styles.viewToggleActive,
                chestView === 'anterior' && {
                  backgroundColor: COLORS.respiratoryLight,
                },
              ]}
              onPress={() => {
                setChestView('anterior')
                setSelectedPointId(null)
              }}
              accessibilityLabel="Anterior view"
            >
              <Text
                style={[
                  styles.viewToggleText,
                  chestView === 'anterior' && {
                    color: COLORS.respiratory,
                    fontWeight: '700',
                  },
                ]}
              >
                Anterior (
                {
                  anteriorRespPoints.filter((p) => reviewedRespIds.has(p.id))
                    .length
                }
                /{anteriorRespPoints.length})
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.viewToggle,
                chestView === 'posterior' && styles.viewToggleActive,
                chestView === 'posterior' && {
                  backgroundColor: COLORS.respiratoryLight,
                },
              ]}
              onPress={() => {
                setChestView('posterior')
                setSelectedPointId(null)
              }}
              accessibilityLabel="Posterior view"
            >
              <Text
                style={[
                  styles.viewToggleText,
                  chestView === 'posterior' && {
                    color: COLORS.respiratory,
                    fontWeight: '700',
                  },
                ]}
              >
                Posterior (
                {
                  posteriorRespPoints.filter((p) => reviewedRespIds.has(p.id))
                    .length
                }
                /{posteriorRespPoints.length})
              </Text>
            </Pressable>
          </View>
        )}

        {/* SVG diagram card */}
        <View style={[styles.diagramCard, { maxWidth: cardMaxWidth }]}>
          {mode === 'respiratory' ? (
            chestView === 'anterior' ? (
              <AnteriorChestSvg
                mode="respiratory"
                points={anteriorRespPoints}
                selectedId={selectedPointId}
                visitedIds={reviewedRespIds}
                onPointPress={handlePointPress}
              />
            ) : (
              <PosteriorChestSvg
                points={posteriorRespPoints}
                selectedId={selectedPointId}
                visitedIds={reviewedRespIds}
                onPointPress={handlePointPress}
              />
            )
          ) : (
            <AnteriorChestSvg
              mode="cardiac"
              points={CARDIAC_POINTS}
              selectedId={selectedPointId}
              visitedIds={reviewedCardIds}
              onPointPress={handlePointPress}
            />
          )}

          {/* Instruction overlay when no point selected */}
          {!selectedPointId && (
            <View style={styles.instructionOverlay}>
              <Ionicons name="hand-left-outline" size={18} color={modeColor} />
              <Text
                style={[styles.instructionText, { color: modeColor }]}
              >
                Tap a point to examine
              </Text>
            </View>
          )}
        </View>

        {/* Detail panel */}
        {selectedPoint && (
          <View style={[styles.detailCard, { maxWidth: cardMaxWidth }]}>
            <View style={styles.detailHeader}>
              <View
                style={[
                  styles.stethoscopeIcon,
                  {
                    backgroundColor:
                      mode === 'respiratory'
                        ? COLORS.respiratoryLight
                        : COLORS.cardiacLight,
                  },
                ]}
              >
                <Ionicons
                  name="fitness"
                  size={16}
                  color={modeColor}
                />
              </View>
              <Text style={styles.detailHeaderText}>Findings</Text>
            </View>

            <PointDetailPanel
              point={selectedPoint}
              mode={mode}
              step={mappedStep}
              isReviewed={currentReviewed.has(selectedPoint.id)}
              onMarkReviewed={handleMarkReviewed}
              recommendedOrder={selectedPointIndex + 1}
              currentOrderIndex={selectedPointIndex}
            />
          </View>
        )}

        {/* Completion banner for current mode */}
        {isModeComplete && (
          <View style={[styles.completionBanner, { maxWidth: cardMaxWidth }]}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={COLORS.success}
            />
            <View style={styles.completionTextContainer}>
              <Text style={styles.completionTitle}>
                {mode === 'respiratory' ? 'Respiratory' : 'Cardiac'} Assessment
                Complete
              </Text>
              <Text style={styles.completionSubtitle}>
                {mode === 'respiratory'
                  ? `All ${RESPIRATORY_POINTS.length} lung auscultation points reviewed. Switch to Cardiac mode to continue.`
                  : `All ${CARDIAC_POINTS.length} cardiac auscultation points reviewed.`}
              </Text>
            </View>
          </View>
        )}

        {/* Both modes complete — final summary */}
        {completedModes.has('respiratory') &&
          completedModes.has('cardiac') && (
            <View style={[styles.finalBanner, { maxWidth: cardMaxWidth }]}>
              <View style={styles.finalBannerTop}>
                <Ionicons name="trophy" size={28} color="#F59E0B" />
                <Text style={styles.finalBannerTitle}>
                  All Points Reviewed!
                </Text>
              </View>
              <Text style={styles.finalBannerText}>
                You have reviewed all respiratory and cardiac auscultation
                points. In clinical practice, always compare side-to-side and
                document your findings systematically.
              </Text>

              {/* Point summary */}
              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryItem,
                    { backgroundColor: COLORS.respiratoryLight },
                  ]}
                >
                  <Ionicons
                    name="cloud-outline"
                    size={16}
                    color={COLORS.respiratory}
                  />
                  <Text
                    style={[
                      styles.summaryItemText,
                      { color: COLORS.respiratoryDark },
                    ]}
                  >
                    {RESPIRATORY_POINTS.length}/{RESPIRATORY_POINTS.length}{' '}
                    Respiratory
                  </Text>
                </View>
                <View
                  style={[
                    styles.summaryItem,
                    { backgroundColor: COLORS.cardiacLight },
                  ]}
                >
                  <Ionicons
                    name="heart-outline"
                    size={16}
                    color={COLORS.cardiac}
                  />
                  <Text
                    style={[
                      styles.summaryItemText,
                      { color: COLORS.cardiacDark },
                    ]}
                  >
                    {CARDIAC_POINTS.length}/{CARDIAC_POINTS.length} Cardiac
                  </Text>
                </View>
              </View>
            </View>
          )}

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
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabActive: {
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },

  // View toggle (anterior/posterior)
  viewToggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  viewToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  viewToggleActive: {
    borderColor: COLORS.respiratory,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },

  // Diagram card
  diagramCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    alignSelf: 'center',
    width: '100%',
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

  // Instruction overlay
  instructionOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Detail card
  detailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    alignSelf: 'center',
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.07)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stethoscopeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Completion banner
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.successLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completionTextContainer: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  completionSubtitle: {
    fontSize: 13,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 18,
  },

  // Final banner
  finalBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  finalBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  finalBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  finalBannerText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  summaryItemText: {
    fontSize: 13,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 40,
  },
})

export default AuscultationSimulator
