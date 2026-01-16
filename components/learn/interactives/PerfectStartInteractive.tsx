/**
 * Perfect Start Interactive
 * Teaches start line tactics, timing, and positioning
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  G, Line, Circle, Text as SvgText, Path, Defs, Marker, Polygon, Rect,
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
  lineBias: number; // degrees - positive = boat end favored
  fleetDensity: 'pin' | 'middle' | 'boat' | 'spread';
  showBoats: boolean;
  highlightPosition: string | null;
}

// Lesson content
const LESSON_STEPS: LessonStep[] = [
  {
    id: 'intro',
    label: 'The Start Is Everything',
    description: 'In fleet racing, a good start gives you clear air and tactical options. A bad start means fighting dirty air for the entire first beat.',
    details: [
      'The first row of boats at the start has a massive advantage',
      'Being buried in the second row can cost 20+ boat lengths',
      'Start strategy should align with your first beat plan',
    ],
    proTip: 'Even if you\'re not in the front row, being on the favored end is often better than starting mid-line in clear air.',
    lineBias: 0,
    fleetDensity: 'spread',
    showBoats: true,
    highlightPosition: null,
  },
  {
    id: 'line_bias',
    label: 'Understanding Line Bias',
    description: 'The start line is almost never perfectly square to the wind. One end is always "favored" - closer to the windward mark.',
    details: [
      'Sight down the line to check squareness (head to wind at center)',
      'The favored end can be worth 5+ boat lengths over a mile beat',
      'Bias changes as the wind shifts - check multiple times',
      'A 5° bias equals about one boat length advantage per 100m of line',
    ],
    proTip: 'Sail to the middle of the line, head to wind, and see which end the bow points to. That\'s the favored end.',
    lineBias: 15,
    fleetDensity: 'spread',
    showBoats: false,
    highlightPosition: null,
  },
  {
    id: 'position_pin',
    label: 'The Pin End Start',
    description: 'When the pin/port end is favored, it\'s the shortest path to the mark - but also the most contested.',
    details: [
      'High reward when pin is heavily favored',
      'Must time approach precisely - no room to wait',
      'If you\'re late or jammed, you\'re stuck in bad air',
      'Need clear air on port hip immediately after start',
    ],
    proTip: 'At the pin, approach on port and tack late to secure your spot. Practice your timing runs - they\'re critical here.',
    lineBias: -15,
    fleetDensity: 'pin',
    showBoats: true,
    highlightPosition: 'pin',
  },
  {
    id: 'position_boat',
    label: 'The Committee Boat Start',
    description: 'When the boat/starboard end is favored, you get the best wind angle, but the fleet piles up here.',
    details: [
      'Starboard end often crowded as it\'s the "safe" choice',
      'Must defend your position from boats trying to squeeze in',
      'Good for conservative sailors or uncertain conditions',
      'Right-of-way advantage on starboard tack',
    ],
    proTip: 'At the boat end, arrive early and defend your lane. "Barging" (squeezing in above proper course) is not allowed.',
    lineBias: 15,
    fleetDensity: 'boat',
    showBoats: true,
    highlightPosition: 'boat',
  },
  {
    id: 'position_middle',
    label: 'The Mid-Line Start',
    description: 'Mid-line can offer clear air when the ends are congested. It\'s often the smart play for lower-risk racing.',
    details: [
      'Less crowded than favored end - easier to execute',
      'Gives tactical flexibility after start',
      'Works well when line is square or bias is small',
      'Requires good timing - no mark to anchor on',
    ],
    proTip: 'Find a "range" - two objects on shore that line up - to judge your position and not drift down the line.',
    lineBias: 0,
    fleetDensity: 'middle',
    showBoats: true,
    highlightPosition: 'middle',
  },
  {
    id: 'timing',
    label: 'The Timed Run',
    description: 'Know exactly how long it takes to reach the line at speed. This removes guesswork from your approach.',
    details: [
      'Run the line at race start speed before the sequence',
      'Note time to cover line length (or half-line)',
      'Account for current, wind changes, and traffic',
      'Standard timing run: reach away, then beam reach back to line',
    ],
    proTip: 'In your final approach, use your timed run data. If line takes 30 seconds at 6 knots, start your run at 0:35.',
    lineBias: 0,
    fleetDensity: 'spread',
    showBoats: false,
    highlightPosition: null,
  },
  {
    id: 'escape',
    label: 'Escape Routes',
    description: 'Always have a backup plan if your primary start goes wrong.',
    details: [
      'If pinned at favored end, quick tack to port can find clear air',
      'Duck behind the fleet rather than sailing in dirty air',
      'Bear away and accelerate through a gap if stalled',
      'Sometimes the best escape is committing to the other end entirely',
    ],
    proTip: 'Mental rehearsal: before the gun, visualize your Plan B for three scenarios - crowded, early, late.',
    lineBias: 5,
    fleetDensity: 'pin',
    showBoats: true,
    highlightPosition: null,
  },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'How can you check which end of the line is favored?',
    options: [
      { id: 'a', text: 'Sail to the middle, head to wind, and see which end the bow points to', isCorrect: true },
      { id: 'b', text: 'The end closest to the committee boat is always favored', isCorrect: false },
      { id: 'c', text: 'Ask another competitor', isCorrect: false },
      { id: 'd', text: 'The pin end is always favored', isCorrect: false },
    ],
    explanation: 'Sailing to the middle of the line and heading to wind shows you which end is closer to the wind direction. Your bow points toward the favored end.',
    hint: 'Think about what "favored" means in terms of wind direction.',
  },
  {
    id: 'q2',
    question: 'What is the main risk of a pin-end start?',
    options: [
      { id: 'a', text: 'The wind is always lighter there', isCorrect: false },
      { id: 'b', text: 'If timing is wrong, you\'re stuck in bad air with no escape', isCorrect: true },
      { id: 'c', text: 'The committee boat might hit you', isCorrect: false },
      { id: 'd', text: 'Port tack boats have right of way', isCorrect: false },
    ],
    explanation: 'At the pin end, there\'s no room to wait or adjust. If you\'re late or get squeezed, you\'re trapped below other boats with no clean air.',
    hint: 'Consider what happens if multiple boats are fighting for the same spot.',
  },
  {
    id: 'q3',
    question: 'What is "barging" at the start?',
    options: [
      { id: 'a', text: 'Starting before the gun', isCorrect: false },
      { id: 'b', text: 'Trying to squeeze in above proper course at the committee boat', isCorrect: true },
      { id: 'c', text: 'Sailing below the start line', isCorrect: false },
      { id: 'd', text: 'Tacking at the pin end', isCorrect: false },
    ],
    explanation: 'Barging is when a boat tries to force their way in at the committee boat end by sailing above the course to the first mark. It\'s a foul.',
    hint: 'This happens at the starboard/boat end of the line.',
  },
  {
    id: 'q4',
    question: 'What should you do if you find yourself buried in the second row at the start?',
    options: [
      { id: 'a', text: 'Sail faster to catch up', isCorrect: false },
      { id: 'b', text: 'Stay the course and hope for the best', isCorrect: false },
      { id: 'c', text: 'Quick tack to port or duck behind fleet to find clear air', isCorrect: true },
      { id: 'd', text: 'Protest the boats ahead of you', isCorrect: false },
    ],
    explanation: 'In dirty air, you\'re losing ground every second. A quick escape - tacking away or ducking behind the fleet - gets you into clear air faster.',
    hint: 'Clear air is more important than distance sailed.',
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
            color={selectedOption?.isCorrect ? "#22C55E" : "#10B981"}
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

// Start Line Visualization
interface StartLineVisualizationProps {
  lineBias: number;
  fleetDensity: 'pin' | 'middle' | 'boat' | 'spread';
  showBoats: boolean;
  highlightPosition: string | null;
}

function StartLineVisualization({
  lineBias,
  fleetDensity,
  showBoats,
  highlightPosition,
}: StartLineVisualizationProps) {
  // Boat positions based on fleet density
  const getBoatPositions = () => {
    const baseBoats = [
      { x: 320, y: 210 },
      { x: 290, y: 205 },
      { x: 260, y: 210 },
      { x: 230, y: 205 },
      { x: 200, y: 210 },
      { x: 170, y: 205 },
      { x: 140, y: 210 },
      { x: 110, y: 205 },
      { x: 80, y: 210 },
    ];

    switch (fleetDensity) {
      case 'pin':
        return baseBoats.map((b, i) => ({
          ...b,
          x: b.x - (i * 5), // Compress toward pin
          y: b.y - (i < 4 ? 0 : 10), // Second row forms
        }));
      case 'boat':
        return baseBoats.map((b, i) => ({
          ...b,
          x: b.x + ((baseBoats.length - i) * 5), // Compress toward boat
          y: b.y - (i > 4 ? 0 : 10),
        }));
      case 'middle':
        return baseBoats.map((b, i) => ({
          ...b,
          x: i < 4 ? b.x + 30 : (i > 5 ? b.x - 30 : b.x),
        }));
      default:
        return baseBoats;
    }
  };

  const boatPositions = getBoatPositions();

  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <Marker id="wind-arrow-start" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <Polygon points="0,0 10,3.5 0,7" fill="#1E293B" />
        </Marker>
        <LinearGradient id="water-start" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#D1FAE5" />
          <Stop offset="100%" stopColor="#A7F3D0" />
        </LinearGradient>
      </Defs>

      {/* Water background */}
      <Rect width="400" height="280" fill="url(#water-start)" />

      {/* Wind indicator */}
      <G transform={`translate(200, 40) rotate(${lineBias})`}>
        <Line x1="0" y1="-25" x2="0" y2="15" stroke="#1E293B" strokeWidth="3" markerEnd="url(#wind-arrow-start)" />
        <SvgText x="0" y="-30" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B">WIND</SvgText>
      </G>

      {/* Windward mark */}
      <Circle cx="200" cy="70" r="8" fill="#F59E0B" stroke="#1E293B" strokeWidth="2" />
      <SvgText x="200" y="58" textAnchor="middle" fontSize="9" fill="#64748B">Mark</SvgText>

      {/* Start line */}
      <G transform={`rotate(${lineBias * 0.3}, 200, 230)`}>
        <Line x1="60" y1="230" x2="340" y2="230" stroke="#1E293B" strokeWidth="2" strokeDasharray="8,4" />

        {/* Pin end */}
        <Circle
          cx="60" cy="230" r="8"
          fill={highlightPosition === 'pin' ? '#10B981' : '#F97316'}
          stroke="#1E293B" strokeWidth="2"
        />
        <SvgText x="60" y="250" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B">Pin</SvgText>

        {/* Committee boat */}
        <G transform="translate(332, 220)">
          <Rect
            x="-12" y="-5" width="24" height="15" rx="3"
            fill={highlightPosition === 'boat' ? '#10B981' : '#6B7280'}
            stroke="#1E293B" strokeWidth="1.5"
          />
        </G>
        <SvgText x="340" y="250" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B">RC</SvgText>

        {/* Middle marker */}
        {highlightPosition === 'middle' && (
          <G>
            <Circle cx="200" cy="230" r="20" fill="#10B981" opacity={0.3} />
            <Circle cx="200" cy="230" r="4" fill="#10B981" />
          </G>
        )}
      </G>

      {/* Bias indicator */}
      {lineBias !== 0 && (
        <G transform="translate(200, 180)">
          <Rect x="-50" y="-10" width="100" height="20" rx="10" fill={lineBias > 0 ? '#ECFDF5' : '#FEF3C7'} />
          <SvgText x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="600" fill={lineBias > 0 ? '#059669' : '#D97706'}>
            {lineBias > 0 ? 'Boat End Favored' : 'Pin End Favored'}
          </SvgText>
        </G>
      )}

      {/* Fleet boats */}
      {showBoats && boatPositions.map((pos, i) => (
        <G key={i} transform={`translate(${pos.x}, ${pos.y})`}>
          <Path
            d="M0,-12 L5,10 L0,7 L-5,10 Z"
            fill={i === 0 || i === 8 ? '#10B981' : i === 4 ? '#3B82F6' : '#94A3B8'}
            stroke="#475569"
            strokeWidth="1"
          />
        </G>
      ))}

      {/* Laylines from mark to line ends */}
      <G opacity={0.3}>
        <Line x1="200" y1="70" x2="60" y2="230" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6,3" />
        <Line x1="200" y1="70" x2="340" y2="230" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="6,3" />
      </G>
    </Svg>
  );
}

// Main Component
interface PerfectStartInteractiveProps {
  onComplete?: () => void;
}

export function PerfectStartInteractive({ onComplete }: PerfectStartInteractiveProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentStep = LESSON_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < LESSON_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
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
            <Ionicons name="flag-outline" size={28} color="#10B981" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>The Perfect Start</Text>
            <Text style={styles.headerSubtitle}>Master positioning, timing, and line bias</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
          {/* Visualization */}
          <View style={[styles.visualContainer, isDesktop && styles.visualContainerDesktop]}>
            <StartLineVisualization
              lineBias={currentStep.lineBias}
              fleetDensity={currentStep.fleetDensity}
              showBoats={currentStep.showBoats}
              highlightPosition={currentStep.highlightPosition}
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
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
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
            <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#94A3B8' : '#10B981'} />
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
          <Ionicons name="school-outline" size={24} color="#10B981" />
          <Text style={styles.quizSectionTitle}>Test Your Knowledge</Text>
        </View>
        <Text style={styles.quizSectionSubtitle}>
          Answer these questions to reinforce what you've learned about race starts.
        </Text>
        <Quiz questions={QUIZ_QUESTIONS} onComplete={handleQuizComplete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ECFDF5',
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
      ? { boxShadow: '0px 4px 16px rgba(16, 185, 129, 0.1)' }
      : {
          shadowColor: '#10B981',
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
    borderBottomColor: '#D1FAE5',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#065F46',
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
    aspectRatio: 4/2.8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  visualContainerDesktop: {
    flex: 1.2,
    marginBottom: 0,
    minHeight: 280,
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
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#065F46',
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
    borderColor: '#D1FAE5',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
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
    backgroundColor: '#10B981',
    width: 20,
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
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
    borderColor: '#A7F3D0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(16, 185, 129, 0.1)' }
      : {
          shadowColor: '#10B981',
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
    color: '#065F46',
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
    backgroundColor: '#D1FAE5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
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
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  optionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
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
    color: '#065F46',
    lineHeight: 20,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10B981',
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
