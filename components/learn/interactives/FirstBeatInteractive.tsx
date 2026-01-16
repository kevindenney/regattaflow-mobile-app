/**
 * First Beat Interactive
 * Teaches upwind strategy and side selection for the first beat
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
  favoredSide: 'left' | 'right' | 'center';
  windShift: number;
  showTracks: boolean;
  commitmentLevel: 'low' | 'medium' | 'high';
}

// Lesson content
const LESSON_STEPS: LessonStep[] = [
  {
    id: 'intro',
    label: 'Why the First Beat Matters',
    description: 'The first beat often determines your race. Getting to the windward mark in clear air and good position sets you up for the rest of the race.',
    details: [
      'The fleet is most compressed on the first beat - everyone is fighting for lanes',
      'Gains made here compound through subsequent legs',
      'Your strategy should connect your start to your mark approach',
    ],
    proTip: 'Plan your first beat before the start. Where do you want to be at the mark? Work backward from there.',
    favoredSide: 'center',
    windShift: 0,
    showTracks: false,
    commitmentLevel: 'low',
  },
  {
    id: 'side_selection',
    label: 'Choosing a Side',
    description: 'The favored side gets you to the mark faster. Factors include wind shifts, current, and geographic features.',
    details: [
      'Wind shifts: persistent shift → go to the side wind is coming from',
      'Current: sail where it\'s favorable or least adverse',
      'Geography: wind acceleration zones, shore effects, shadows',
      'Fleet: avoid traffic, don\'t follow the crowd blindly',
    ],
    proTip: 'Weight the factors. If wind and current both favor the same side, commit harder. If they conflict, stay flexible.',
    favoredSide: 'right',
    windShift: 10,
    showTracks: true,
    commitmentLevel: 'medium',
  },
  {
    id: 'commitment',
    label: 'How Hard to Commit',
    description: 'High confidence → commit hard. Low confidence → stay in the middle and react.',
    details: [
      'High commitment: bang the corner, get there first, high risk/high reward',
      'Medium commitment: favor one side but stay connected to fleet',
      'Low commitment: work the middle, play shifts, react to what develops',
      'Your confidence should match your commitment level',
    ],
    proTip: 'If you\'re unsure, err on the side of lower commitment. You can\'t win the race on the first beat, but you can definitely lose it.',
    favoredSide: 'left',
    windShift: -15,
    showTracks: true,
    commitmentLevel: 'high',
  },
  {
    id: 'starting_tack',
    label: 'Choosing Your Starting Tack',
    description: 'Your starting tack should align with your first beat strategy.',
    details: [
      'If right is favored, start at pin and go right on starboard',
      'If left is favored, start mid-line or boat end, tack to port early',
      'Don\'t get stuck on the wrong tack - plan your escape',
      'Consider where you can tack to port without crossing traffic',
    ],
    proTip: 'Look for a "window" to tack to port in the first 2 minutes. If there\'s no window, you may need to adjust your start position.',
    favoredSide: 'right',
    windShift: 5,
    showTracks: true,
    commitmentLevel: 'medium',
  },
  {
    id: 'laylines',
    label: 'Layline Strategy',
    description: 'Approaching the layline too early limits your options. Approaching too late costs distance.',
    details: [
      'Early layline = committed. Any shift hurts you.',
      'Late layline = you\'re still racing, but risk overstanding',
      'Oscillating shifts: approach on a lift, tack before overstanding',
      'In traffic: sometimes early layline is necessary for clear air',
    ],
    proTip: 'In shifting conditions, approach the layline with "two tacks to go" rather than one. This gives you adjustment room.',
    favoredSide: 'center',
    windShift: 0,
    showTracks: true,
    commitmentLevel: 'low',
  },
  {
    id: 'bail_triggers',
    label: 'When to Bail on Your Plan',
    description: 'Having a great strategy means nothing if conditions change. Define your "bail triggers" before the race.',
    details: [
      'Expected shift doesn\'t materialize within X minutes',
      'New cloud/weather moving in from unexpected direction',
      'Leaders going the opposite way and pulling ahead',
      'Current not behaving as predicted',
    ],
    proTip: 'Write down your bail triggers before the start. "If [condition], then [action]." This prevents emotional decisions during the race.',
    favoredSide: 'left',
    windShift: -8,
    showTracks: true,
    commitmentLevel: 'medium',
  },
  {
    id: 'traffic',
    label: 'Managing Traffic',
    description: 'The first beat is crowded. Knowing when to duck, when to lee-bow, and when to tack away is crucial.',
    details: [
      'Duck: gives way quickly, maintains speed, often best option',
      'Lee-bow: slows you both, use when you want to control competitor',
      'Tack away: if crossing is close, sometimes better to just go your way',
      'Don\'t get into tacking duels - they slow both boats',
    ],
    proTip: 'Keep your head out of the boat. Look 2-3 boats ahead to anticipate crosses and plan your moves early.',
    favoredSide: 'center',
    windShift: 0,
    showTracks: true,
    commitmentLevel: 'low',
  },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'If you expect a persistent wind shift to the right, which side of the course should you favor?',
    options: [
      { id: 'a', text: 'Stay in the middle', isCorrect: false },
      { id: 'b', text: 'Go left early', isCorrect: false },
      { id: 'c', text: 'Go right - toward where the wind is shifting from', isCorrect: true },
      { id: 'd', text: 'It doesn\'t matter with persistent shifts', isCorrect: false },
    ],
    explanation: 'With a persistent shift, you want to sail toward where the new wind is coming from. As the wind shifts right, you get progressive lifts sailing from that direction.',
    hint: 'Think about which boats get the shift first and keep getting lifted.',
  },
  {
    id: 'q2',
    question: 'What commitment level should you use when you\'re uncertain about conditions?',
    options: [
      { id: 'a', text: 'High - go for the win', isCorrect: false },
      { id: 'b', text: 'Low - stay in the middle and react', isCorrect: true },
      { id: 'c', text: 'Medium - split the difference', isCorrect: false },
      { id: 'd', text: 'Commitment level doesn\'t matter', isCorrect: false },
    ],
    explanation: 'When uncertain, stay conservative. Working the middle lets you react to what develops rather than gambling on a guess. You can\'t win the race on beat 1, but you can lose it.',
    hint: 'Consider the risk/reward of each approach.',
  },
  {
    id: 'q3',
    question: 'What\'s the risk of approaching the layline too early?',
    options: [
      { id: 'a', text: 'You might have to tack more times', isCorrect: false },
      { id: 'b', text: 'Any wind shift will hurt you - you\'re fully committed', isCorrect: true },
      { id: 'c', text: 'Other boats will follow you', isCorrect: false },
      { id: 'd', text: 'There is no risk to being early', isCorrect: false },
    ],
    explanation: 'Once you\'re on the layline, you\'re committed. A header means you have to tack and overstand. A lift means you could have gone further the other way. You\'ve given up all tactical flexibility.',
    hint: 'Think about what happens if the wind shifts after you\'re on the layline.',
  },
  {
    id: 'q4',
    question: 'When should you "duck" (pass behind) another boat rather than lee-bow them?',
    options: [
      { id: 'a', text: 'Never - always assert your rights', isCorrect: false },
      { id: 'b', text: 'When you want to maintain speed and avoid a tacking duel', isCorrect: true },
      { id: 'c', text: 'Only when the other boat is much faster', isCorrect: false },
      { id: 'd', text: 'Only on the last beat', isCorrect: false },
    ],
    explanation: 'Ducking is often the smart play - it\'s quick, keeps your speed up, and avoids the mutual slow-down of a lee-bow situation. Save lee-bowing for when you specifically want to control a competitor.',
    hint: 'Consider the effect on boat speed of each choice.',
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
            color={selectedOption?.isCorrect ? "#22C55E" : "#F97316"}
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

// First Beat Visualization
interface FirstBeatVisualizationProps {
  favoredSide: 'left' | 'right' | 'center';
  windShift: number;
  showTracks: boolean;
  commitmentLevel: 'low' | 'medium' | 'high';
}

function FirstBeatVisualization({
  favoredSide,
  windShift,
  showTracks,
  commitmentLevel,
}: FirstBeatVisualizationProps) {
  // Get track path based on commitment and side
  const getTrackPath = () => {
    const startY = 280;
    const markY = 50;

    switch (commitmentLevel) {
      case 'high':
        if (favoredSide === 'left') {
          return `M 200 ${startY} L 80 180 L 200 ${markY}`;
        } else if (favoredSide === 'right') {
          return `M 200 ${startY} L 320 180 L 200 ${markY}`;
        }
        return `M 200 ${startY} L 200 ${markY}`;
      case 'medium':
        if (favoredSide === 'left') {
          return `M 200 ${startY} L 140 200 L 100 120 L 200 ${markY}`;
        } else if (favoredSide === 'right') {
          return `M 200 ${startY} L 260 200 L 300 120 L 200 ${markY}`;
        }
        return `M 200 ${startY} L 160 180 L 240 100 L 200 ${markY}`;
      default: // low
        return `M 200 ${startY} L 180 220 L 220 160 L 180 100 L 200 ${markY}`;
    }
  };

  const favoredColor = favoredSide === 'left' ? '#EF4444' : favoredSide === 'right' ? '#22C55E' : '#94A3B8';
  const favoredLabel = favoredSide === 'left' ? 'Left Favored' : favoredSide === 'right' ? 'Right Favored' : 'Neutral';

  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <Marker id="wind-arrow-beat" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <Polygon points="0,0 10,3.5 0,7" fill="#1E293B" />
        </Marker>
        <LinearGradient id="water-beat" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFF7ED" />
          <Stop offset="100%" stopColor="#FFEDD5" />
        </LinearGradient>
        <LinearGradient id="left-zone" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={favoredSide === 'left' ? '#FEE2E2' : '#F1F5F9'} />
          <Stop offset="100%" stopColor="transparent" />
        </LinearGradient>
        <LinearGradient id="right-zone" x1="100%" y1="0%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor={favoredSide === 'right' ? '#DCFCE7' : '#F1F5F9'} />
          <Stop offset="100%" stopColor="transparent" />
        </LinearGradient>
      </Defs>

      {/* Water background */}
      <Rect width="400" height="320" fill="url(#water-beat)" />

      {/* Side zones */}
      <Rect x="0" y="0" width="160" height="320" fill="url(#left-zone)" opacity={0.6} />
      <Rect x="240" y="0" width="160" height="320" fill="url(#right-zone)" opacity={0.6} />

      {/* Zone labels */}
      <SvgText x="60" y="160" textAnchor="middle" fontSize="11" fontWeight="600" fill="#EF4444" opacity={favoredSide === 'left' ? 1 : 0.4}>
        LEFT
      </SvgText>
      <SvgText x="340" y="160" textAnchor="middle" fontSize="11" fontWeight="600" fill="#22C55E" opacity={favoredSide === 'right' ? 1 : 0.4}>
        RIGHT
      </SvgText>

      {/* Wind indicator */}
      <G transform={`translate(200, 25) rotate(${windShift})`}>
        <Line x1="0" y1="-15" x2="0" y2="10" stroke="#1E293B" strokeWidth="3" markerEnd="url(#wind-arrow-beat)" />
      </G>
      <SvgText x="200" y="8" textAnchor="middle" fontSize="9" fill="#64748B">WIND</SvgText>

      {/* Windward mark */}
      <Circle cx="200" cy="50" r="10" fill="#F97316" stroke="#1E293B" strokeWidth="2" />
      <SvgText x="200" y="38" textAnchor="middle" fontSize="9" fill="#1E293B">WM</SvgText>

      {/* Laylines */}
      <G opacity={0.3}>
        <Line x1="200" y1="50" x2="60" y2="280" stroke="#EF4444" strokeWidth="2" strokeDasharray="8,4" />
        <Line x1="200" y1="50" x2="340" y2="280" stroke="#22C55E" strokeWidth="2" strokeDasharray="8,4" />
      </G>

      {/* Start line */}
      <Line x1="80" y1="290" x2="320" y2="290" stroke="#1E293B" strokeWidth="2" strokeDasharray="6,4" />
      <Circle cx="80" cy="290" r="5" fill="#F97316" stroke="#1E293B" strokeWidth="1" />
      <Circle cx="320" cy="290" r="5" fill="#6B7280" stroke="#1E293B" strokeWidth="1" />

      {/* Track path */}
      {showTracks && (
        <Path
          d={getTrackPath()}
          fill="none"
          stroke="#F97316"
          strokeWidth="3"
          strokeDasharray="10,4"
        />
      )}

      {/* Boat position */}
      {showTracks && (
        <G transform={`translate(200, 280)`}>
          <Path
            d="M0,-15 L6,12 L0,8 L-6,12 Z"
            fill="#F97316"
            stroke="#C2410C"
            strokeWidth="1.5"
          />
        </G>
      )}

      {/* Favored side indicator */}
      <G transform="translate(200, 305)">
        <Rect x="-50" y="-10" width="100" height="20" rx="10" fill={favoredSide === 'center' ? '#F1F5F9' : favoredColor} opacity={0.2} />
        <SvgText x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="600" fill={favoredColor}>
          {favoredLabel}
        </SvgText>
      </G>

      {/* Commitment level */}
      <G transform="translate(370, 280)">
        <Rect x="-25" y="-35" width="50" height="70" rx="8" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1" />
        <SvgText x="0" y="-20" textAnchor="middle" fontSize="8" fill="#9A3412">COMMIT</SvgText>
        <Rect x="-15" y="-10" width="30" height="6" rx="3" fill={commitmentLevel === 'high' ? '#F97316' : '#FED7AA'} />
        <Rect x="-15" y="2" width="30" height="6" rx="3" fill={commitmentLevel !== 'low' ? '#F97316' : '#FED7AA'} />
        <Rect x="-15" y="14" width="30" height="6" rx="3" fill="#F97316" />
        <SvgText x="0" y="32" textAnchor="middle" fontSize="8" fontWeight="600" fill="#9A3412">
          {commitmentLevel.toUpperCase()}
        </SvgText>
      </G>
    </Svg>
  );
}

// Main Component
interface FirstBeatInteractiveProps {
  onComplete?: () => void;
}

export function FirstBeatInteractive({ onComplete }: FirstBeatInteractiveProps) {
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
            <Ionicons name="trending-up-outline" size={28} color="#F97316" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Winning the First Beat</Text>
            <Text style={styles.headerSubtitle}>Side selection, commitment, and layline strategy</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
          {/* Visualization */}
          <View style={[styles.visualContainer, isDesktop && styles.visualContainerDesktop]}>
            <FirstBeatVisualization
              favoredSide={currentStep.favoredSide}
              windShift={currentStep.windShift}
              showTracks={currentStep.showTracks}
              commitmentLevel={currentStep.commitmentLevel}
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
                    <Ionicons name="checkmark-circle" size={16} color="#F97316" />
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
            <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#94A3B8' : '#F97316'} />
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
          <Ionicons name="school-outline" size={24} color="#F97316" />
          <Text style={styles.quizSectionTitle}>Test Your Knowledge</Text>
        </View>
        <Text style={styles.quizSectionSubtitle}>
          Answer these questions to reinforce what you've learned about first beat strategy.
        </Text>
        <Quiz questions={QUIZ_QUESTIONS} onComplete={handleQuizComplete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFF7ED',
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
      ? { boxShadow: '0px 4px 16px rgba(249, 115, 22, 0.1)' }
      : {
          shadowColor: '#F97316',
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
    borderBottomColor: '#FFEDD5',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#9A3412',
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
    aspectRatio: 4/3.2,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  visualContainerDesktop: {
    flex: 1.2,
    marginBottom: 0,
    minHeight: 320,
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
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9A3412',
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
    borderColor: '#FFEDD5',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
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
    backgroundColor: '#F97316',
    width: 20,
  },
  stepDotCompleted: {
    backgroundColor: '#F97316',
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
    borderColor: '#FED7AA',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(249, 115, 22, 0.1)' }
      : {
          shadowColor: '#F97316',
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
    color: '#9A3412',
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
    backgroundColor: '#FFEDD5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9A3412',
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
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  optionSelected: {
    borderColor: '#F97316',
    backgroundColor: '#FFEDD5',
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
    color: '#9A3412',
    lineHeight: 20,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#FFEDD5',
    borderRadius: 10,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#9A3412',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F97316',
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
