/**
 * Team Racing Read the Race Interactive
 * Quiz-style interactive where users assess race situations on an SVG course,
 * identify combinations, and choose the best tactical play.
 *
 * Features:
 * - SVG course view with 6 boats (3 blue, 3 red) using TopDownSailboatSVG
 * - Pulse animation on boats
 * - Multiple-choice answer cards with correct/incorrect feedback
 * - Combination display with blue positions and total
 * - Score tracking and progress through all scenarios
 * - Fires onComplete when all scenarios answered
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { runOnJS, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon } from 'react-native-svg';

import {
  RACE_READ_SCENARIOS,
  READ_THE_RACE_OVERVIEW,
  type RaceReadScenario,
} from './data/teamRacingReadTheRaceData';
import { TopDownSailboatSVG } from './shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_SCENARIOS = RACE_READ_SCENARIOS.length;

const DIFFICULTY_COLORS: Record<string, { bg: string; fg: string }> = {
  beginner: { bg: '#DCFCE7', fg: '#166534' },
  intermediate: { bg: '#FEF3C7', fg: '#92400E' },
  advanced: { bg: '#FEE2E2', fg: '#991B1B' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamRacingReadTheRaceInteractiveProps {
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamRacingReadTheRaceInteractive({
  onComplete,
}: TeamRacingReadTheRaceInteractiveProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [answeredScenarios, setAnsweredScenarios] = useState<Set<number>>(new Set());

  const scenario = RACE_READ_SCENARIOS[currentIndex];
  const selectedOption = scenario.options.find((o) => o.id === selectedOptionId);
  const correctOption = scenario.options.find((o) => o.isCorrect);
  const hasAnswered = selectedOptionId !== null;
  const isCorrect = selectedOption?.isCorrect ?? false;
  const diffColors = DIFFICULTY_COLORS[scenario.difficulty] ?? DIFFICULTY_COLORS.beginner;

  // Pulse animation for boats
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.12, { duration: 700 }), -1, true);
  }, [pulse]);
  const [pulseVal, setPulseVal] = useState(1);
  useDerivedValue(() => {
    runOnJS(setPulseVal)(pulse.value);
    return null;
  }, []);

  // Handle option selection
  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (hasAnswered) return;
      setSelectedOptionId(optionId);
      const option = scenario.options.find((o) => o.id === optionId);
      if (option) {
        if (option.isCorrect) setCorrectCount((p) => p + 1);
        setAttemptedCount((p) => p + 1);
        setAnsweredScenarios((prev) => {
          const next = new Set(prev);
          next.add(currentIndex);
          return next;
        });
      }
    },
    [hasAnswered, scenario, currentIndex],
  );

  // Navigate to next scenario
  const handleNext = useCallback(() => {
    if (currentIndex < TOTAL_SCENARIOS - 1) {
      setCurrentIndex((p) => p + 1);
      setSelectedOptionId(null);
    } else {
      // All scenarios completed
      onComplete?.();
    }
  }, [currentIndex, onComplete]);

  // Fire onComplete when all answered
  useEffect(() => {
    if (answeredScenarios.size >= TOTAL_SCENARIOS) {
      onComplete?.();
    }
  }, [answeredScenarios, onComplete]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            Scenario {currentIndex + 1} of {TOTAL_SCENARIOS}
          </Text>
          <View style={[styles.diffBadge, { backgroundColor: diffColors.bg }]}>
            <Text style={[styles.diffText, { color: diffColors.fg }]}>
              {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Ionicons name="trophy-outline" size={14} color="#3B82F6" />
          <Text style={styles.scoreText}>
            {correctCount}/{attemptedCount}
          </Text>
        </View>
      </View>

      {/* Scenario title */}
      <View style={styles.titleCard}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioDesc}>{scenario.description}</Text>
      </View>

      {/* SVG Course Canvas */}
      <View style={styles.svgWrap}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Water background */}
          <Rect width="400" height="600" fill="#E0EFFE" />

          {/* Subtle wave lines */}
          {[100, 200, 300, 400, 500].map((y) => (
            <Path
              key={`wave-${y}`}
              d={`M0 ${y} Q100 ${y - 5},200 ${y} T400 ${y}`}
              stroke="#B4D4F0"
              strokeWidth="0.8"
              fill="none"
              opacity={0.4}
            />
          ))}

          {/* Wind arrow at top */}
          <G>
            <Line
              x1="200"
              y1="15"
              x2="200"
              y2="50"
              stroke="#64748B"
              strokeWidth="2"
            />
            <Polygon points="194,50 200,62 206,50" fill="#64748B" />
            <SvgText
              x="200"
              y="12"
              textAnchor="middle"
              fontSize="10"
              fill="#64748B"
              fontWeight="600"
            >
              WIND
            </SvgText>
          </G>

          {/* Laylines (subtle boundary guides) */}
          <Line
            x1="60"
            y1="80"
            x2="60"
            y2="520"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeDasharray="6,6"
            opacity={0.4}
          />
          <Line
            x1="340"
            y1="80"
            x2="340"
            y2="520"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeDasharray="6,6"
            opacity={0.4}
          />

          {/* Course marks */}
          {scenario.marks.map((mark, i) => {
            const label = mark.type === 'windward' ? 'WM' : 'LM';
            return (
              <G key={`mark-${i}`}>
                {/* Zone circle */}
                <Circle
                  cx={mark.x}
                  cy={mark.y}
                  r={40}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  strokeDasharray="6,4"
                  opacity={0.35}
                />
                {/* Mark */}
                <Circle
                  cx={mark.x}
                  cy={mark.y}
                  r="8"
                  fill="#F97316"
                  stroke="#EA580C"
                  strokeWidth="2"
                />
                <SvgText
                  x={mark.x + 14}
                  y={mark.y + 4}
                  fontSize="9"
                  fill="#94A3B8"
                  fontWeight="500"
                >
                  {label}
                </SvgText>
              </G>
            );
          })}

          {/* Boats */}
          {scenario.boats.map((boat) => {
            const color = boat.team === 'blue' ? '#3B82F6' : '#EF4444';
            const sc = 0.35;
            return (
              <G key={boat.id}>
                {/* Pulse ring */}
                <Circle
                  cx={boat.x}
                  cy={boat.y}
                  r={18 * pulseVal}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={0.3}
                />
                {/* Boat */}
                <G transform={`translate(${boat.x - 25 * sc}, ${boat.y - 40 * sc})`}>
                  <TopDownSailboatSVG
                    hullColor={color}
                    rotation={boat.heading}
                    scale={sc}
                    showWake={false}
                    windDirection={scenario.windDirection}
                    label={boat.label}
                  />
                </G>
                {/* Position label */}
                <G>
                  <Rect
                    x={boat.x - 12}
                    y={boat.y + 16}
                    width={24}
                    height={16}
                    fill={color}
                    rx={4}
                    opacity={0.9}
                  />
                  <SvgText
                    x={boat.x}
                    y={boat.y + 28}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#FFFFFF"
                  >
                    {boat.label}
                  </SvgText>
                </G>
                {/* Race position number */}
                <G>
                  <Circle
                    cx={boat.x + 16}
                    cy={boat.y - 16}
                    r={9}
                    fill="#FFFFFF"
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <SvgText
                    x={boat.x + 16}
                    y={boat.y - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={color}
                  >
                    {boat.position}
                  </SvgText>
                </G>
              </G>
            );
          })}

          {/* Phase label */}
          <G>
            <Rect
              x="10"
              y="570"
              width={scenario.phase.length * 7 + 16}
              height={20}
              rx="6"
              fill="#FFFFFF"
              opacity={0.8}
            />
            <SvgText
              x="18"
              y="584"
              fontSize="10"
              fontWeight="600"
              fill="#475569"
            >
              {scenario.phase.toUpperCase()}
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* Combination display */}
      <View style={styles.comboCard}>
        <View style={styles.comboRow}>
          <Text style={styles.comboLabel}>Blue Positions</Text>
          <View style={styles.comboBadges}>
            {scenario.bluePositions.map((pos, i) => (
              <View key={i} style={styles.comboBadge}>
                <Text style={styles.comboBadgeText}>{ordinal(pos)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.comboTotalRow}>
          <Text style={styles.comboTotalLabel}>Total:</Text>
          <Text style={styles.comboTotalValue}>{scenario.blueTotal}</Text>
          <View
            style={[
              styles.winLoseBadge,
              scenario.isBlueWinning ? styles.winBadge : styles.loseBadge,
            ]}
          >
            <Ionicons
              name={scenario.isBlueWinning ? 'trophy' : 'close-circle'}
              size={13}
              color={scenario.isBlueWinning ? '#166534' : '#991B1B'}
            />
            <Text
              style={[
                styles.winLoseText,
                { color: scenario.isBlueWinning ? '#166534' : '#991B1B' },
              ]}
            >
              {scenario.isBlueWinning ? 'WINNING' : 'LOSING'}
            </Text>
          </View>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Ionicons name="help-circle" size={18} color="#3B82F6" />
        <Text style={styles.questionText}>{scenario.question}</Text>
      </View>

      {/* Answer options */}
      {scenario.options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const isThisCorrect = option.isCorrect;
        const showCorrectHighlight = hasAnswered && isThisCorrect;
        const showIncorrectHighlight = hasAnswered && isSelected && !isThisCorrect;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              showCorrectHighlight && styles.optionCorrect,
              showIncorrectHighlight && styles.optionIncorrect,
              isSelected && !hasAnswered && styles.optionSelected,
            ]}
            onPress={() => handleSelectOption(option.id)}
            disabled={hasAnswered}
            activeOpacity={0.7}
          >
            <View style={styles.optionHeader}>
              <View
                style={[
                  styles.optionLetter,
                  showCorrectHighlight && styles.optionLetterCorrect,
                  showIncorrectHighlight && styles.optionLetterIncorrect,
                ]}
              >
                {showCorrectHighlight ? (
                  <Ionicons name="checkmark" size={14} color="#166534" />
                ) : showIncorrectHighlight ? (
                  <Ionicons name="close" size={14} color="#991B1B" />
                ) : (
                  <Text style={styles.optionLetterText}>
                    {option.id.toUpperCase()}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  showCorrectHighlight && { color: '#166534' },
                  showIncorrectHighlight && { color: '#991B1B' },
                ]}
              >
                {option.text}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Feedback card */}
      {hasAnswered && (
        <View
          style={[
            styles.feedbackCard,
            isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
          ]}
        >
          <View style={styles.feedbackHeader}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={isCorrect ? '#166534' : '#991B1B'}
            />
            <Text
              style={[
                styles.feedbackTitle,
                { color: isCorrect ? '#166534' : '#991B1B' },
              ]}
            >
              {isCorrect ? 'Correct!' : 'Not quite'}
            </Text>
          </View>
          <Text
            style={[
              styles.feedbackText,
              { color: isCorrect ? '#166534' : '#991B1B' },
            ]}
          >
            {selectedOption?.explanation}
          </Text>
          {!isCorrect && correctOption && (
            <View style={styles.correctAnswerRow}>
              <Ionicons name="arrow-forward" size={14} color="#166534" />
              <Text style={styles.correctAnswerText}>
                Correct answer: {correctOption.text}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Next button */}
      {hasAnswered && (
        <View style={styles.navRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex < TOTAL_SCENARIOS - 1
                ? 'Next Scenario'
                : 'Complete Lesson'}
            </Text>
            <Ionicons
              name={
                currentIndex < TOTAL_SCENARIOS - 1
                  ? 'arrow-forward'
                  : 'checkmark-circle'
              }
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {RACE_READ_SCENARIOS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
              answeredScenarios.has(i) && styles.dotComplete,
            ]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const shadow = Platform.OS === 'web'
  ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' as any }
  : { elevation: 2 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 12, gap: 10, paddingBottom: 32 },

  // -- Header --
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadow,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  diffText: { fontSize: 11, fontWeight: '700' },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scoreText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  // -- Title card --
  titleCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 4,
    ...shadow,
  },
  scenarioTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scenarioDesc: { fontSize: 13, color: '#475569', lineHeight: 19 },

  // -- SVG --
  svgWrap: {
    width: '100%',
    aspectRatio: 400 / 600,
    backgroundColor: '#E0EFFE',
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow,
  },

  // -- Combination display --
  comboCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    ...shadow,
  },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comboLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  comboBadges: { flexDirection: 'row', gap: 6 },
  comboBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comboBadgeText: { fontSize: 13, fontWeight: '600', color: '#1E40AF' },
  comboTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comboTotalLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  comboTotalValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  winLoseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  winBadge: { backgroundColor: '#DCFCE7' },
  loseBadge: { backgroundColor: '#FEE2E2' },
  winLoseText: { fontSize: 12, fontWeight: '700' },

  // -- Question --
  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 20,
  },

  // -- Option cards --
  optionCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...shadow,
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  optionLetter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  optionLetterCorrect: {
    backgroundColor: '#DCFCE7',
  },
  optionLetterIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  optionLetterText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  optionText: { flex: 1, fontSize: 14, color: '#1E293B', lineHeight: 20 },

  // -- Feedback --
  feedbackCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  feedbackIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: { fontSize: 15, fontWeight: '700' },
  feedbackText: { fontSize: 13, lineHeight: 19 },
  correctAnswerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
  },
  correctAnswerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    lineHeight: 17,
  },

  // -- Navigation --
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // -- Progress dots --
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 16,
  },
  dotComplete: {
    backgroundColor: '#10B981',
  },
});

export default TeamRacingReadTheRaceInteractive;
