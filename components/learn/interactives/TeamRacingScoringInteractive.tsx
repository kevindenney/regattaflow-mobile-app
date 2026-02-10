/**
 * Team Racing Scoring Interactive Component
 * Teaches 3v3 team racing combination scoring through animated
 * finish-line scenarios and a quiz mode.
 *
 * Features:
 * - Step-by-step scoring scenarios with animated boats
 * - Visual finish line with position labels
 * - Score display with win/lose result
 * - Quiz mode after all scenarios are viewed
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  runOnJS,
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import {
  ALL_COMBINATIONS,
  SCORING_SCENARIOS,
  type CombinationEntry,
} from './data/teamRacingScoringData';
import { TopDownSailboatSVG } from './shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_SCENARIOS = SCORING_SCENARIOS.length;
const QUIZ_COUNT = 4;
const SVG_WIDTH = 400;
const SVG_HEIGHT = 350;
const FINISH_Y = 60;
const BOAT_START_Y = 320;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickQuizCombinations(): CombinationEntry[] {
  const wins = ALL_COMBINATIONS.filter((c) => c.result === 'win');
  const losses = ALL_COMBINATIONS.filter((c) => c.result === 'lose');
  const picked: CombinationEntry[] = [];
  const shuffledWins = shuffleArray(wins);
  const shuffledLosses = shuffleArray(losses);
  picked.push(shuffledWins[0], shuffledWins[1]);
  picked.push(shuffledLosses[0], shuffledLosses[1]);
  return shuffleArray(picked);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamRacingScoringInteractiveProps {
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamRacingScoringInteractive({
  onComplete,
}: TeamRacingScoringInteractiveProps) {
  // -- Scenario state -------------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [boatYPositions, setBoatYPositions] = useState<number[]>([]);

  // -- Quiz state -----------------------------------------------------------
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCombos, setQuizCombos] = useState<CombinationEntry[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(boolean | null)[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const scenario = SCORING_SCENARIOS[currentIndex];

  // -- Animation ------------------------------------------------------------
  const animProgress = useSharedValue(0);

  const updateBoatPositions = useCallback(
    (progress: number) => {
      const boats = scenario.boatAnimations;
      const positions = boats.map((boat) => {
        // Earlier finish order -> reaches the finish line sooner
        const delay = (boat.finishOrder - 1) * 0.12;
        const adjusted = Math.max(0, Math.min(1, (progress - delay) / (1 - delay * 0.5)));
        return BOAT_START_Y - adjusted * (BOAT_START_Y - FINISH_Y - 10 + boat.finishOrder * 18);
      });
      setBoatYPositions(positions);
    },
    [scenario],
  );

  useDerivedValue(() => {
    runOnJS(updateBoatPositions)(animProgress.value);
  });

  // Reset animation when scenario changes
  useEffect(() => {
    animProgress.value = 0;
    setBoatYPositions(scenario.boatAnimations.map(() => BOAT_START_Y));
    // Small delay then animate
    const timer = setTimeout(() => {
      animProgress.value = withTiming(1, { duration: 1200 });
    }, 200);
    return () => clearTimeout(timer);
  }, [currentIndex, scenario]);

  // -- Navigation handlers --------------------------------------------------
  const handleNext = useCallback(() => {
    if (currentIndex < TOTAL_SCENARIOS - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Enter quiz mode
      setQuizCombos(pickQuizCombinations());
      setQuizStep(0);
      setQuizAnswers([]);
      setQuizFeedback(null);
      setShowQuiz(true);
    }
  }, [currentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // -- Quiz handlers --------------------------------------------------------
  const handleQuizAnswer = useCallback(
    (answer: 'win' | 'lose') => {
      if (quizFeedback) return; // already answered
      const combo = quizCombos[quizStep];
      const correct = answer === combo.result;
      setQuizFeedback(correct ? 'correct' : 'incorrect');
      setQuizAnswers((prev) => [...prev, correct]);
    },
    [quizCombos, quizStep, quizFeedback],
  );

  const handleQuizNext = useCallback(() => {
    if (quizStep < QUIZ_COUNT - 1) {
      setQuizStep((prev) => prev + 1);
      setQuizFeedback(null);
    } else {
      // Quiz complete
      onComplete?.();
    }
  }, [quizStep, onComplete]);

  // -- Derived values -------------------------------------------------------
  const quizScore = useMemo(
    () => quizAnswers.filter((a) => a === true).length,
    [quizAnswers],
  );

  const quizFinished = quizAnswers.length === QUIZ_COUNT;

  // -------------------------------------------------------------------------
  // Render - Quiz Mode
  // -------------------------------------------------------------------------
  if (showQuiz) {
    const combo = quizCombos[quizStep];
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scoring Quiz</Text>
          <Text style={styles.headerStep}>
            {quizStep + 1} of {QUIZ_COUNT}
          </Text>
        </View>

        {/* Combination display */}
        <View style={styles.quizCard}>
          <Text style={styles.quizLabel}>Blue Team Positions</Text>
          <View style={styles.badgeRow}>
            {combo.positions.map((pos, i) => (
              <View key={i} style={[styles.badge, styles.badgeBlue]}>
                <Text style={styles.badgeText}>{ordinal(pos)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.quizTotal}>
            Total: {combo.total}
          </Text>

          <Text style={styles.quizQuestion}>Does Blue win or lose?</Text>

          {/* Answer buttons */}
          <View style={styles.quizButtonRow}>
            <TouchableOpacity
              style={[
                styles.quizButton,
                styles.quizButtonWin,
                quizFeedback && combo.result === 'win' && styles.quizButtonCorrect,
                quizFeedback === 'incorrect' && combo.result !== 'win' && styles.quizButtonWrong,
              ]}
              onPress={() => handleQuizAnswer('win')}
              disabled={quizFeedback !== null}
            >
              <Ionicons name="trophy" size={18} color="#166534" />
              <Text style={styles.quizButtonWinText}>Win</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quizButton,
                styles.quizButtonLose,
                quizFeedback && combo.result === 'lose' && styles.quizButtonCorrect,
                quizFeedback === 'incorrect' && combo.result !== 'lose' && styles.quizButtonWrong,
              ]}
              onPress={() => handleQuizAnswer('lose')}
              disabled={quizFeedback !== null}
            >
              <Ionicons name="close-circle" size={18} color="#991B1B" />
              <Text style={styles.quizButtonLoseText}>Lose</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback */}
          {quizFeedback && (
            <View
              style={[
                styles.feedbackBox,
                quizFeedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect,
              ]}
            >
              <View style={styles.feedbackHeader}>
                <Ionicons
                  name={quizFeedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={quizFeedback === 'correct' ? '#166534' : '#991B1B'}
                />
                <Text
                  style={[
                    styles.feedbackTitle,
                    quizFeedback === 'correct'
                      ? styles.feedbackTitleCorrect
                      : styles.feedbackTitleIncorrect,
                  ]}
                >
                  {quizFeedback === 'correct' ? 'Correct!' : 'Not quite'}
                </Text>
              </View>
              <Text
                style={[
                  styles.feedbackText,
                  quizFeedback === 'correct'
                    ? styles.feedbackTextCorrect
                    : styles.feedbackTextIncorrect,
                ]}
              >
                {combo.label} = {combo.total}.{' '}
                {combo.result === 'win'
                  ? `Opponent scores ${21 - combo.total}. Blue wins by ${Math.abs(combo.margin)}.`
                  : `Opponent scores ${21 - combo.total}. Blue loses by ${Math.abs(combo.margin)}.`}
              </Text>
            </View>
          )}
        </View>

        {/* Quiz progress / next */}
        {quizFeedback && !quizFinished && (
          <View style={styles.navRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.nextButton} onPress={handleQuizNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quiz complete */}
        {quizFinished && (
          <View style={styles.quizResults}>
            <Ionicons name="ribbon" size={32} color="#3B82F6" />
            <Text style={styles.quizResultsTitle}>Quiz Complete!</Text>
            <Text style={styles.quizResultsScore}>
              {quizScore} of {QUIZ_COUNT} correct
            </Text>
            <View style={styles.quizResultsButtons}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setQuizCombos(pickQuizCombinations());
                  setQuizStep(0);
                  setQuizAnswers([]);
                  setQuizFeedback(null);
                }}
              >
                <Ionicons name="refresh" size={16} color="#3B82F6" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeButton} onPress={() => onComplete?.()}>
                <Text style={styles.completeButtonText}>Complete Lesson</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // -------------------------------------------------------------------------
  // Render - Scenario Mode
  // -------------------------------------------------------------------------
  const boats = scenario.boatAnimations;
  const margin = Math.abs(scenario.teamTotal - scenario.opponentTotal);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Racing Scoring</Text>
        <Text style={styles.headerStep}>
          {currentIndex + 1} of {TOTAL_SCENARIOS}
        </Text>
      </View>

      {/* SVG Canvas */}
      <View style={styles.svgWrapper}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Water background */}
          <Rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#BFDBFE" />
          <Defs>
            <Path id="wave" d="M 0 8 Q 10 0, 20 8 T 40 8" />
          </Defs>
          {/* Subtle wave pattern */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Path
              key={`wave-${i}`}
              d={`M 0 ${50 * i + 30} Q 20 ${50 * i + 20}, 40 ${50 * i + 30} T 80 ${50 * i + 30} T 120 ${50 * i + 30} T 160 ${50 * i + 30} T 200 ${50 * i + 30} T 240 ${50 * i + 30} T 280 ${50 * i + 30} T 320 ${50 * i + 30} T 360 ${50 * i + 30} T 400 ${50 * i + 30}`}
              stroke="#93C5FD"
              strokeWidth="1"
              fill="none"
              opacity={0.4}
            />
          ))}

          {/* Wind arrow (top-left) */}
          <G transform="translate(30, 30)">
            <Circle cx={0} cy={0} r={18} fill="#FFFFFF" stroke="#3B82F6" strokeWidth={1.5} />
            <Path d="M 0,-10 L 4,2 L 0,0 L -4,2 Z" fill="#3B82F6" />
            <SvgText
              x={0}
              y={-22}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#1E293B"
            >
              WIND
            </SvgText>
          </G>

          {/* Finish line */}
          <Line
            x1={40}
            y1={FINISH_Y}
            x2={SVG_WIDTH - 40}
            y2={FINISH_Y}
            stroke="#1E293B"
            strokeWidth={2}
            strokeDasharray="8,4"
          />
          <SvgText
            x={SVG_WIDTH / 2}
            y={FINISH_Y - 10}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#1E293B"
          >
            FINISH
          </SvgText>

          {/* Boats */}
          {boats.map((boat, index) => {
            const xPos = (boat.xPercent / 100) * (SVG_WIDTH - 80) + 40;
            const yPos =
              boatYPositions.length > index ? boatYPositions[index] : BOAT_START_Y;
            const hullColor = boat.team === 'blue' ? '#3B82F6' : '#EF4444';

            return (
              <G key={`boat-${boat.position}`} transform={`translate(${xPos}, ${yPos})`}>
                <TopDownSailboatSVG
                  hullColor={hullColor}
                  rotation={180}
                  scale={0.35}
                  showWake={true}
                  windDirection={0}
                />
                {/* Position label */}
                <G transform="translate(0, -20)">
                  <Rect
                    x={-12}
                    y={-9}
                    width={24}
                    height={18}
                    fill="#FFFFFF"
                    stroke={hullColor}
                    strokeWidth={1.5}
                    rx={4}
                  />
                  <SvgText
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={hullColor}
                  >
                    {boat.position}
                  </SvgText>
                </G>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Score Display */}
      <View style={styles.scoreSection}>
        {/* Blue Team */}
        <View style={styles.teamRow}>
          <Text style={styles.teamLabel}>Blue:</Text>
          <View style={styles.badgeRow}>
            {scenario.teamPositions.map((pos) => (
              <View key={`blue-${pos}`} style={[styles.badge, styles.badgeBlue]}>
                <Text style={styles.badgeText}>{ordinal(pos)}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.teamTotal, { color: '#1E40AF' }]}>= {scenario.teamTotal}</Text>
        </View>

        {/* Red Team */}
        <View style={styles.teamRow}>
          <Text style={styles.teamLabel}>Red:</Text>
          <View style={styles.badgeRow}>
            {scenario.opponentPositions.map((pos) => (
              <View key={`red-${pos}`} style={[styles.badge, styles.badgeRed]}>
                <Text style={styles.badgeText}>{ordinal(pos)}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.teamTotal, { color: '#991B1B' }]}>
            = {scenario.opponentTotal}
          </Text>
        </View>

        {/* Result */}
        <View
          style={[
            styles.resultBadge,
            scenario.result === 'win' ? styles.resultWin : styles.resultLose,
          ]}
        >
          <Text
            style={[
              styles.resultText,
              { color: scenario.result === 'win' ? '#166534' : '#991B1B' },
            ]}
          >
            {scenario.result === 'win' ? 'BLUE WINS' : 'RED WINS'} by {margin}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioDescription}>{scenario.description}</Text>
        <View style={styles.explanationBox}>
          <Ionicons name="bulb" size={16} color="#F59E0B" />
          <Text style={styles.explanationText}>{scenario.explanation}</Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={currentIndex === 0 ? '#CBD5E1' : '#3B82F6'}
          />
          <Text
            style={[
              styles.navButtonText,
              { color: currentIndex === 0 ? '#CBD5E1' : '#3B82F6' },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* Step dots */}
        <View style={styles.stepDots}>
          {SCORING_SCENARIOS.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
                i < currentIndex && styles.dotComplete,
              ]}
              onPress={() => setCurrentIndex(i)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === TOTAL_SCENARIOS - 1 ? 'Quiz' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  // -- Header ---------------------------------------------------------------
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerStep: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },

  // -- SVG ------------------------------------------------------------------
  svgWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    aspectRatio: SVG_WIDTH / SVG_HEIGHT,
    maxHeight: 350,
  },

  // -- Score display --------------------------------------------------------
  scoreSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    width: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  teamTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  resultWin: {
    backgroundColor: '#DCFCE7',
  },
  resultLose: {
    backgroundColor: '#FEE2E2',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // -- Description ----------------------------------------------------------
  descriptionSection: {
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  explanationBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },

  // -- Navigation -----------------------------------------------------------
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 18,
  },
  dotComplete: {
    backgroundColor: '#10B981',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // -- Quiz -----------------------------------------------------------------
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 12,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  quizLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  quizTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 12,
  },
  quizButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  quizButtonWin: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  quizButtonLose: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  quizButtonCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  quizButtonWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  quizButtonWinText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  quizButtonLoseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#991B1B',
  },

  // -- Feedback -------------------------------------------------------------
  feedbackBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
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
    marginBottom: 4,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackTitleCorrect: {
    color: '#166534',
  },
  feedbackTitleIncorrect: {
    color: '#991B1B',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
  },
  feedbackTextCorrect: {
    color: '#166534',
  },
  feedbackTextIncorrect: {
    color: '#991B1B',
  },

  // -- Quiz results ---------------------------------------------------------
  quizResults: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quizResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 8,
  },
  quizResultsScore: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 16,
  },
  quizResultsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  retryButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TeamRacingScoringInteractive;
