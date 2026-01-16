/**
 * Racing in Current Interactive
 * Teaches how to read and use current/tides in sailboat racing
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  G, Line, Circle, Text as SvgText, Path, Defs, Marker, Polygon, Rect, Pattern,
  LinearGradient, Stop
} from 'react-native-svg';

// Types
interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  hint?: string;
}

interface LessonStep {
  id: string;
  label: string;
  description: string;
  details?: string[];
  proTip?: string;
  currentDirection: number; // degrees from north
  currentSpeed: number; // knots
  showBoats: boolean;
  showCurrentVectors: boolean;
  showLaylines: boolean;
}

// Lesson content
const LESSON_STEPS: LessonStep[] = [
  {
    id: 'intro',
    label: 'Why Current Matters',
    description: 'Current can make or break your race. A boat sailing with 1 knot of favorable current gains about 100 boat lengths per hour over a competitor in adverse current.',
    details: [
      'Current affects your course over ground (COG)',
      'Your boat speed through water stays the same, but ground speed changes',
      'Strategic positioning in current can win races even against faster boats',
    ],
    proTip: 'The best sailors often win by "sailing the current" rather than just sailing the wind.',
    currentDirection: 180,
    currentSpeed: 0.5,
    showBoats: false,
    showCurrentVectors: true,
    showLaylines: false,
  },
  {
    id: 'reading',
    label: 'Reading Current',
    description: 'Learn to spot current direction and strength from visual cues on the water.',
    details: [
      'Watch moored boats - they point into the current',
      'Look for disturbed water around marks and pilings',
      'Notice how the fleet drifts during the starting sequence',
      'Check tide tables before racing, but verify on the water',
    ],
    proTip: 'Sail past a moored boat before the start and watch how it swings. The bow points into the current.',
    currentDirection: 180,
    currentSpeed: 1.0,
    showBoats: false,
    showCurrentVectors: true,
    showLaylines: false,
  },
  {
    id: 'upwind_favorable',
    label: 'Upwind in Favorable Current',
    description: 'When current is pushing you upwind, stay in it as long as possible. You\'re getting a "free ride" toward the mark.',
    details: [
      'Keep to the side with stronger favorable current',
      'You can afford to sail a slightly longer course to stay in good current',
      'Your laylines are shorter than they appear - you\'re being pushed to windward',
    ],
    proTip: 'In favorable current, don\'t pinch - keep your speed up and let the current do the work.',
    currentDirection: 0, // Pushing toward windward mark
    currentSpeed: 1.2,
    showBoats: true,
    showCurrentVectors: true,
    showLaylines: true,
  },
  {
    id: 'upwind_adverse',
    label: 'Upwind in Adverse Current',
    description: 'When current pushes you away from the mark, minimize your time in the strongest current. Seek relief near shore or in eddies.',
    details: [
      'Tack earlier than normal to avoid strong adverse current',
      'Look for current relief near shore, behind points, or in shallow water',
      'Your laylines are longer - you\'re being pushed to leeward',
    ],
    proTip: 'An "adverse current tack" into shore can save minutes if you find a counter-current or relief zone.',
    currentDirection: 180, // Pushing away from windward mark
    currentSpeed: 1.0,
    showBoats: true,
    showCurrentVectors: true,
    showLaylines: true,
  },
  {
    id: 'mark_rounding',
    label: 'Mark Approaches',
    description: 'Current dramatically affects your mark rounding angles. Set up wide or tight depending on current direction.',
    details: [
      'Current pushing you toward the mark: set up wide, the current will sweep you in',
      'Current pushing you away: approach tight, you\'ll be swept away from the mark',
      'Allow for current "set" when judging your layline',
    ],
    proTip: 'The rule of thumb: if current is more than 0.5 knots, adjust your approach by at least one boat length.',
    currentDirection: 270, // Side current
    currentSpeed: 0.8,
    showBoats: true,
    showCurrentVectors: true,
    showLaylines: true,
  },
  {
    id: 'tide_gates',
    label: 'Tidal Gates',
    description: 'In distance races, timing your passage through narrow channels (tidal gates) can save hours.',
    details: [
      'Plan your arrival at the gate when current is favorable or slack',
      'Even waiting for the tide can be faster than fighting it',
      'Current strength increases in narrows (Venturi effect)',
    ],
    proTip: 'In strong tidal areas, the winning strategy often centers on gate timing rather than boat speed.',
    currentDirection: 90,
    currentSpeed: 2.0,
    showBoats: false,
    showCurrentVectors: true,
    showLaylines: false,
  },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'How can you read current direction from moored boats?',
    options: [
      { id: 'a', text: 'The stern points into the current', isCorrect: false },
      { id: 'b', text: 'The bow points into the current', isCorrect: true },
      { id: 'c', text: 'The boat sides face the current', isCorrect: false },
      { id: 'd', text: 'Moored boats don\'t indicate current', isCorrect: false },
    ],
    explanation: 'Moored boats naturally weathervane into the current, with their bow pointing upstream. This is a reliable way to check current direction before a race.',
    hint: 'Think about how a boat naturally aligns when tied to a single anchor point.',
  },
  {
    id: 'q2',
    question: 'When sailing upwind in adverse current, what\'s the best strategy?',
    options: [
      { id: 'a', text: 'Stay in the middle of the channel for the shortest distance', isCorrect: false },
      { id: 'b', text: 'Seek current relief near shore or in shallow water', isCorrect: true },
      { id: 'c', text: 'Sail as fast as possible in the strongest current', isCorrect: false },
      { id: 'd', text: 'Make longer tacks to average out the current', isCorrect: false },
    ],
    explanation: 'Current is typically weaker near shore and in shallow water. Seeking "current relief" can dramatically reduce the adverse effect, even if the distance is slightly longer.',
    hint: 'Current is affected by depth and obstructions.',
  },
  {
    id: 'q3',
    question: 'How does favorable current affect your laylines?',
    options: [
      { id: 'a', text: 'Laylines become longer', isCorrect: false },
      { id: 'b', text: 'Laylines stay the same', isCorrect: false },
      { id: 'c', text: 'Laylines become shorter', isCorrect: true },
      { id: 'd', text: 'Laylines become impossible to judge', isCorrect: false },
    ],
    explanation: 'Favorable current (pushing you toward the mark) effectively shortens your laylines because you\'re being pushed to windward. You can tack sooner than expected.',
    hint: 'Think about where the current is pushing you relative to the mark.',
  },
  {
    id: 'q4',
    question: 'When approaching a mark with current pushing you toward it, you should:',
    options: [
      { id: 'a', text: 'Approach tight to the mark', isCorrect: false },
      { id: 'b', text: 'Set up wide - the current will sweep you in', isCorrect: true },
      { id: 'c', text: 'Ignore the current and approach normally', isCorrect: false },
      { id: 'd', text: 'Speed up to fight the current', isCorrect: false },
    ],
    explanation: 'When current pushes you toward the mark, approaching wide gives you control. The current will sweep you in toward the mark during the rounding.',
    hint: 'What happens if you\'re too close and the current keeps pushing?',
  },
];

// Quiz Component
interface QuizProps {
  questions: QuizQuestion[];
  onComplete: () => void;
}

function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const selectedOption = currentQuestion.options.find(o => o.id === selectedAnswer);

  const handleAnswer = (optionId: string) => {
    if (showResult) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    if (selectedOption?.isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    }
  };

  return (
    <View style={quizStyles.container}>
      <View style={quizStyles.progress}>
        <Text style={quizStyles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <View style={quizStyles.progressBar}>
          <View
            style={[
              quizStyles.progressFill,
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <Text style={quizStyles.question}>{currentQuestion.question}</Text>

      {!showHint && currentQuestion.hint && !showResult && (
        <TouchableOpacity style={quizStyles.hintButton} onPress={() => setShowHint(true)}>
          <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
          <Text style={quizStyles.hintButtonText}>Need a hint?</Text>
        </TouchableOpacity>
      )}

      {showHint && !showResult && (
        <View style={quizStyles.hintBox}>
          <Ionicons name="bulb" size={16} color="#F59E0B" />
          <Text style={quizStyles.hintText}>{currentQuestion.hint}</Text>
        </View>
      )}

      <View style={quizStyles.options}>
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.isCorrect;

          let optionStyle = quizStyles.option;
          if (showResult) {
            if (isCorrect) {
              optionStyle = { ...quizStyles.option, ...quizStyles.optionCorrect };
            } else if (isSelected && !isCorrect) {
              optionStyle = { ...quizStyles.option, ...quizStyles.optionIncorrect };
            }
          } else if (isSelected) {
            optionStyle = { ...quizStyles.option, ...quizStyles.optionSelected };
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={optionStyle}
              onPress={() => handleAnswer(option.id)}
              disabled={showResult}
            >
              <Text style={quizStyles.optionText}>{option.text}</Text>
              {showResult && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              )}
              {showResult && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {showResult && (
        <View style={quizStyles.explanation}>
          <Ionicons
            name={selectedOption?.isCorrect ? "checkmark-circle" : "information-circle"}
            size={20}
            color={selectedOption?.isCorrect ? "#22C55E" : "#3B82F6"}
          />
          <Text style={quizStyles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      <View style={quizStyles.actions}>
        {!showResult ? (
          <TouchableOpacity
            style={[quizStyles.submitButton, !selectedAnswer && quizStyles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedAnswer}
          >
            <Text style={quizStyles.submitButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={quizStyles.nextButton} onPress={handleNext}>
            <Text style={quizStyles.nextButtonText}>
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Current Vector Visualization
interface CurrentVisualizationProps {
  currentDirection: number;
  currentSpeed: number;
  showBoats: boolean;
  showCurrentVectors: boolean;
  showLaylines: boolean;
}

function CurrentVisualization({
  currentDirection,
  currentSpeed,
  showBoats,
  showCurrentVectors,
  showLaylines,
}: CurrentVisualizationProps) {
  const vectorLength = 40 + currentSpeed * 30;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 350" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <Marker id="current-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <Polygon points="0,0 10,3.5 0,7" fill="#0EA5E9" />
        </Marker>
        <Pattern id="water-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <Path d="M0 20 Q10 15, 20 20 T40 20" stroke="#93C5FD" strokeWidth="1" fill="none" opacity={0.5} />
        </Pattern>
        <LinearGradient id="water-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#DBEAFE" />
          <Stop offset="100%" stopColor="#93C5FD" />
        </LinearGradient>
      </Defs>

      {/* Water background */}
      <Rect width="400" height="350" fill="url(#water-gradient)" />
      <Rect width="400" height="350" fill="url(#water-pattern)" />

      {/* Windward mark */}
      <Circle cx="200" cy="60" r="10" fill="#F59E0B" stroke="#000" strokeWidth="2" />
      <SvgText x="200" y="45" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1E293B">
        Windward Mark
      </SvgText>

      {/* Start line */}
      <Line x1="80" y1="300" x2="320" y2="300" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
      <Circle cx="80" cy="300" r="6" fill="#F97316" stroke="#000" strokeWidth="1" />
      <Circle cx="320" cy="300" r="6" fill="#22C55E" stroke="#000" strokeWidth="1" />
      <SvgText x="200" y="320" textAnchor="middle" fontSize="11" fill="#64748B">
        Start Line
      </SvgText>

      {/* Current vectors */}
      {showCurrentVectors && (
        <G>
          {/* Multiple current arrows across the course */}
          {[100, 200, 300].map((x) => (
            [100, 175, 250].map((y) => (
              <G key={`${x}-${y}`} transform={`translate(${x}, ${y}) rotate(${currentDirection})`}>
                <Line
                  x1={0} y1={-vectorLength/2} x2={0} y2={vectorLength/2}
                  stroke="#0EA5E9"
                  strokeWidth="3"
                  markerEnd="url(#current-arrow)"
                />
              </G>
            ))
          ))}

          {/* Current indicator label */}
          <G transform="translate(350, 30)">
            <Rect x="-45" y="-15" width="90" height="40" rx="6" fill="white" opacity={0.9} />
            <SvgText x="0" y="0" textAnchor="middle" fontSize="10" fill="#64748B">Current</SvgText>
            <SvgText x="0" y="16" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0EA5E9">
              {currentSpeed.toFixed(1)} kts
            </SvgText>
          </G>
        </G>
      )}

      {/* Laylines */}
      {showLaylines && (
        <G opacity={0.6}>
          {/* Port layline */}
          <Line x1="200" y1="60" x2="80" y2="280" stroke="#EF4444" strokeWidth="2" strokeDasharray="8,4" />
          {/* Starboard layline */}
          <Line x1="200" y1="60" x2="320" y2="280" stroke="#22C55E" strokeWidth="2" strokeDasharray="8,4" />
        </G>
      )}

      {/* Boats */}
      {showBoats && (
        <G>
          {/* Blue boat - starboard tack */}
          <G transform="translate(250, 200)">
            <Path
              d="M0,-20 L8,15 L0,10 L-8,15 Z"
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth="1.5"
            />
            <Path d="M0,-18 L12,5 L0,0 Z" fill="white" stroke="#94A3B8" strokeWidth="0.5" />
          </G>

          {/* Red boat - port tack */}
          <G transform="translate(140, 180)">
            <Path
              d="M0,-20 L8,15 L0,10 L-8,15 Z"
              fill="#EF4444"
              stroke="#B91C1C"
              strokeWidth="1.5"
            />
            <Path d="M0,-18 L-12,5 L0,0 Z" fill="white" stroke="#94A3B8" strokeWidth="0.5" />
          </G>
        </G>
      )}

      {/* Wind indicator */}
      <G transform="translate(50, 50)">
        <Circle cx="0" cy="0" r="25" fill="white" opacity={0.9} />
        <Line x1="0" y1="-20" x2="0" y2="10" stroke="#000" strokeWidth="2" />
        <Polygon points="0,-22 -5,-14 5,-14" fill="#000" />
        <SvgText x="0" y="25" textAnchor="middle" fontSize="8" fill="#64748B">WIND</SvgText>
      </G>
    </Svg>
  );
}

// Main Component
interface RacingInCurrentInteractiveProps {
  onComplete?: () => void;
}

export function RacingInCurrentInteractive({ onComplete }: RacingInCurrentInteractiveProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentStep = LESSON_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < LESSON_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Move to quiz or complete
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    onComplete?.();
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="water-outline" size={28} color="#0EA5E9" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Racing in Current</Text>
            <Text style={styles.headerSubtitle}>Master tides and currents for tactical advantage</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
          {/* Visualization */}
          <View style={[styles.visualContainer, isDesktop && styles.visualContainerDesktop]}>
            <CurrentVisualization
              currentDirection={currentStep.currentDirection}
              currentSpeed={currentStep.currentSpeed}
              showBoats={currentStep.showBoats}
              showCurrentVectors={currentStep.showCurrentVectors}
              showLaylines={currentStep.showLaylines}
            />
          </View>

          {/* Info Panel */}
          <View style={[styles.infoPanel, isDesktop && styles.infoPanelDesktop]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step {currentStepIndex + 1} of {LESSON_STEPS.length}</Text>
            </View>

            <Text style={styles.stepLabel}>{currentStep.label}</Text>
            <Text style={styles.stepDescription}>{currentStep.description}</Text>

            {currentStep.details && currentStep.details.length > 0 && (
              <View style={styles.detailsContainer}>
                {currentStep.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#0EA5E9" />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}

            {currentStep.proTip && (
              <View style={styles.proTipContainer}>
                <View style={styles.proTipHeader}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.proTipLabel}>Pro Tip</Text>
                </View>
                <Text style={styles.proTipText}>{currentStep.proTip}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#94A3B8' : '#0EA5E9'} />
            <Text style={[styles.navButtonText, currentStepIndex === 0 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            {LESSON_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index === currentStepIndex && styles.stepDotActive,
                  index < currentStepIndex && styles.stepDotCompleted
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNext}>
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {currentStepIndex === LESSON_STEPS.length - 1 ? 'Complete' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {quizCompleted && (
          <View style={styles.completionBadge}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
            <Text style={styles.completionText}>Lesson Completed!</Text>
          </View>
        )}
      </View>

      {/* Quiz Section */}
      <View style={styles.quizSection}>
        <View style={styles.quizSectionHeader}>
          <Ionicons name="school-outline" size={24} color="#0EA5E9" />
          <Text style={styles.quizSectionTitle}>Test Your Knowledge</Text>
        </View>
        <Text style={styles.quizSectionSubtitle}>
          Answer these questions to reinforce what you've learned about racing in current.
        </Text>
        <Quiz questions={QUIZ_QUESTIONS} onComplete={handleQuizComplete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 12,
    padding: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 16px rgba(14, 165, 233, 0.1)' }
      : {
          shadowColor: '#0EA5E9',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  mainContent: {
    marginBottom: 20,
  },
  mainContentDesktop: {
    flexDirection: 'row',
    gap: 20,
  },
  visualContainer: {
    aspectRatio: 4/3.5,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  visualContainerDesktop: {
    flex: 1.2,
    marginBottom: 0,
    minHeight: 350,
  },
  infoPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  infoPanelDesktop: {
    flex: 1,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  proTipContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  proTipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  proTipText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  navButtonTextDisabled: {
    color: '#94A3B8',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#0EA5E9',
    width: 20,
  },
  stepDotCompleted: {
    backgroundColor: '#0EA5E9',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  completionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  quizSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(14, 165, 233, 0.1)' }
      : {
          shadowColor: '#0EA5E9',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  quizSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  quizSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  quizSectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
});

const quizStyles = StyleSheet.create({
  container: {
    padding: 4,
  },
  progress: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0F2FE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    lineHeight: 24,
    marginBottom: 16,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  hintButtonText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  options: {
    gap: 10,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  optionSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22C55E',
    borderRadius: 10,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
