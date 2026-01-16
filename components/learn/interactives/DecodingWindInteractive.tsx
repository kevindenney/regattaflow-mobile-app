/**
 * Decoding Wind Interactive
 * Teaches how to read and predict wind shifts for race strategy
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
  windDirection: number;
  shiftPattern: 'oscillating' | 'persistent' | 'building' | 'none';
  showShiftIndicator: boolean;
  shiftMagnitude: number;
}

// Lesson content
const LESSON_STEPS: LessonStep[] = [
  {
    id: 'intro',
    label: 'Why Wind Shifts Matter',
    description: 'The wind rarely blows from a constant direction. Understanding and predicting shifts is often the difference between winning and losing.',
    details: [
      'A 5° shift can move you 50+ boat lengths on a mile beat',
      'Being on the "right shift" compounds your advantage',
      'Shift pattern recognition is a learnable skill',
    ],
    proTip: 'Start watching wind patterns 30 minutes before your race. Look for consistent oscillation periods.',
    windDirection: 0,
    shiftPattern: 'none',
    showShiftIndicator: false,
    shiftMagnitude: 0,
  },
  {
    id: 'oscillating',
    label: 'Oscillating Shifts',
    description: 'The wind swings back and forth around a median direction. These are the most common and most exploitable shifts.',
    details: [
      'Wind oscillates like a pendulum, with typical periods of 3-12 minutes',
      'Tack on the headers - when the wind shifts against your current tack',
      'Don\'t tack on every small shift - wait for significant headers',
      'Track the median wind direction to know when you\'re lifted vs. headed',
    ],
    proTip: 'Keep a running tally of your compass heading. When you\'re 5-10° below your median, prepare to tack.',
    windDirection: 10,
    shiftPattern: 'oscillating',
    showShiftIndicator: true,
    shiftMagnitude: 15,
  },
  {
    id: 'persistent',
    label: 'Persistent Shifts',
    description: 'The wind gradually moves in one direction over time. Get to the favored side early - the advantage compounds.',
    details: [
      'Often caused by changing weather patterns or sea breeze development',
      'The side the wind is shifting toward becomes increasingly favored',
      'Commit early to the favored side - don\'t wait for the shift to complete',
      'Risk: if you\'re wrong about the shift direction, you lose big',
    ],
    proTip: 'Check weather forecasts for pressure system movement. Wind backs ahead of a front, veers after.',
    windDirection: -15,
    shiftPattern: 'persistent',
    showShiftIndicator: true,
    shiftMagnitude: -20,
  },
  {
    id: 'thermal',
    label: 'Thermal Effects',
    description: 'Land heats faster than water, creating predictable sea breezes. These typically kick in mid-day and can override gradient winds.',
    details: [
      'Sea breeze fills in perpendicular to the coastline',
      'Typical onset: late morning to early afternoon, peaks around 2-4pm',
      'Can either reinforce or oppose the gradient wind',
      'Watch for the "transition zone" where old and new winds meet',
    ],
    proTip: 'If you see puffy clouds forming over land before the sea breeze, the thermal is building - expect it within 30-60 minutes.',
    windDirection: -30,
    shiftPattern: 'persistent',
    showShiftIndicator: true,
    shiftMagnitude: -35,
  },
  {
    id: 'geographic',
    label: 'Geographic Effects',
    description: 'Hills, buildings, and gaps in terrain create local acceleration, bending, and shadow zones.',
    details: [
      'Wind accelerates through gaps and around headlands',
      'Wind "bends" to flow parallel to coastlines',
      'Wind shadows extend 5-10x the height of obstructions',
      'These effects are consistent and predictable once you know the venue',
    ],
    proTip: 'Sail the course before racing if possible. Note where you feel pressure changes and where the wind seems to bend.',
    windDirection: 0,
    shiftPattern: 'none',
    showShiftIndicator: false,
    shiftMagnitude: 0,
  },
  {
    id: 'strategy',
    label: 'Building Your Wind Strategy',
    description: 'Combine your observations into a race plan. Know what type of shifts to expect and how you\'ll respond.',
    details: [
      'Oscillating: tack on headers, stay in phase with the shifts',
      'Persistent: commit early to the side the wind is shifting toward',
      'Thermal: position yourself to catch the new breeze first',
      'Geographic: know the venue\'s characteristics and use them',
    ],
    proTip: 'Have a Plan A and Plan B. Define what would make you change your strategy mid-race (a shift that doesn\'t come back, new clouds, etc.).',
    windDirection: 0,
    shiftPattern: 'oscillating',
    showShiftIndicator: true,
    shiftMagnitude: 10,
  },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the best strategy in oscillating wind shifts?',
    options: [
      { id: 'a', text: 'Stay on one tack until you reach the layline', isCorrect: false },
      { id: 'b', text: 'Tack on headers to stay in phase with shifts', isCorrect: true },
      { id: 'c', text: 'Sail directly to the windward mark', isCorrect: false },
      { id: 'd', text: 'Always stay on starboard tack', isCorrect: false },
    ],
    explanation: 'In oscillating shifts, the wind swings back and forth. Tacking when headed (wind shifts against you) keeps you lifted more of the time, gaining distance to windward.',
    hint: 'Think about which tack puts you closer to the wind direction you want.',
  },
  {
    id: 'q2',
    question: 'In a persistent shift, when should you get to the favored side?',
    options: [
      { id: 'a', text: 'Wait until the shift is complete', isCorrect: false },
      { id: 'b', text: 'At the midpoint of the beat', isCorrect: false },
      { id: 'c', text: 'Get there early - the advantage compounds', isCorrect: true },
      { id: 'd', text: 'It doesn\'t matter when', isCorrect: false },
    ],
    explanation: 'In persistent shifts, the advantage of being on the favored side increases over time. Getting there early maximizes your gain as the shift continues to develop.',
    hint: 'Consider how a 10° shift affects boats at different positions on the course.',
  },
  {
    id: 'q3',
    question: 'When does a sea breeze typically reach its peak strength?',
    options: [
      { id: 'a', text: 'Early morning, around 8-9am', isCorrect: false },
      { id: 'b', text: 'Mid-afternoon, around 2-4pm', isCorrect: true },
      { id: 'c', text: 'Evening, around 6-7pm', isCorrect: false },
      { id: 'd', text: 'It varies randomly throughout the day', isCorrect: false },
    ],
    explanation: 'Sea breezes are driven by the temperature difference between land and water. This difference is greatest in mid-afternoon when the land has heated most, typically peaking around 2-4pm.',
    hint: 'Think about when the land-water temperature difference is largest.',
  },
  {
    id: 'q4',
    question: 'How far does a wind shadow typically extend behind an obstruction?',
    options: [
      { id: 'a', text: 'Equal to the height of the obstruction', isCorrect: false },
      { id: 'b', text: '2-3 times the height', isCorrect: false },
      { id: 'c', text: '5-10 times the height', isCorrect: true },
      { id: 'd', text: '20+ times the height', isCorrect: false },
    ],
    explanation: 'Wind shadows extend approximately 5-10 times the height of the obstruction. A 50-meter hill could create a shadow zone 250-500 meters downwind.',
    hint: 'The effect extends much further than the physical obstruction.',
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
            color={selectedOption?.isCorrect ? "#22C55E" : "#8B5CF6"}
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

// Wind Compass Visualization
interface WindVisualizationProps {
  windDirection: number;
  shiftPattern: 'oscillating' | 'persistent' | 'building' | 'none';
  showShiftIndicator: boolean;
  shiftMagnitude: number;
}

function WindVisualization({
  windDirection,
  shiftPattern,
  showShiftIndicator,
  shiftMagnitude,
}: WindVisualizationProps) {
  // Helper function to describe an arc
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = {
      x: cx + r * Math.cos((startAngle - 90) * Math.PI / 180),
      y: cy + r * Math.sin((startAngle - 90) * Math.PI / 180),
    };
    const end = {
      x: cx + r * Math.cos((endAngle - 90) * Math.PI / 180),
      y: cy + r * Math.sin((endAngle - 90) * Math.PI / 180),
    };
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`;
  };

  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <Marker id="wind-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <Polygon points="0,0 10,3.5 0,7" fill="#1E293B" />
        </Marker>
        <LinearGradient id="compass-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F5F3FF" />
          <Stop offset="100%" stopColor="#EDE9FE" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      <Rect width="300" height="300" fill="#F8FAFC" rx="16" />

      {/* Compass rose */}
      <Circle cx="150" cy="150" r="100" fill="url(#compass-bg)" stroke="#C4B5FD" strokeWidth="2" />
      <Circle cx="150" cy="150" r="80" fill="white" opacity={0.5} />

      {/* Cardinal directions */}
      <SvgText x="150" y="70" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6D28D9">N</SvgText>
      <SvgText x="150" y="240" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6D28D9">S</SvgText>
      <SvgText x="65" y="155" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6D28D9">W</SvgText>
      <SvgText x="235" y="155" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6D28D9">E</SvgText>

      {/* Shift indicator arc */}
      {showShiftIndicator && shiftPattern === 'oscillating' && (
        <G>
          <Path
            d={describeArc(150, 150, 60, -Math.abs(shiftMagnitude), Math.abs(shiftMagnitude))}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="20"
            opacity={0.2}
          />
          <Path
            d={describeArc(150, 150, 60, -Math.abs(shiftMagnitude), Math.abs(shiftMagnitude))}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeDasharray="5,3"
          />
        </G>
      )}

      {/* Persistent shift arrow */}
      {showShiftIndicator && shiftPattern === 'persistent' && (
        <G transform={`translate(150, 150) rotate(${shiftMagnitude / 2})`}>
          <Path
            d={describeArc(0, 0, 70, -5, shiftMagnitude > 0 ? 25 : -25)}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3"
            markerEnd="url(#wind-arrow)"
          />
          <SvgText
            x={shiftMagnitude > 0 ? 50 : -50}
            y={-60}
            textAnchor="middle"
            fontSize="11"
            fill="#6D28D9"
            fontWeight="600"
          >
            Shifting {shiftMagnitude > 0 ? 'Right' : 'Left'}
          </SvgText>
        </G>
      )}

      {/* Wind arrow */}
      <G transform={`translate(150, 150) rotate(${windDirection})`}>
        <Line x1="0" y1="-45" x2="0" y2="45" stroke="#1E293B" strokeWidth="4" />
        <Polygon points="0,-55 -8,-40 8,-40" fill="#1E293B" />
        <Circle cx="0" cy="0" r="8" fill="#8B5CF6" stroke="#1E293B" strokeWidth="2" />
      </G>

      {/* Direction label */}
      <G transform="translate(150, 270)">
        <Rect x="-40" y="-12" width="80" height="24" rx="12" fill="#8B5CF6" />
        <SvgText x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
          {Math.round(360 + windDirection) % 360}° TWD
        </SvgText>
      </G>

      {/* Pattern label */}
      {shiftPattern !== 'none' && (
        <G transform="translate(150, 25)">
          <Rect x="-55" y="-10" width="110" height="20" rx="10" fill="#EDE9FE" />
          <SvgText x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6D28D9">
            {shiftPattern.charAt(0).toUpperCase() + shiftPattern.slice(1)} Shifts
          </SvgText>
        </G>
      )}
    </Svg>
  );
}

// Main Component
interface DecodingWindInteractiveProps {
  onComplete?: () => void;
}

export function DecodingWindInteractive({ onComplete }: DecodingWindInteractiveProps) {
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
            <Ionicons name="analytics-outline" size={28} color="#8B5CF6" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Decoding Race Day Wind</Text>
            <Text style={styles.headerSubtitle}>Read and predict wind shifts like a pro</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
          {/* Visualization */}
          <View style={[styles.visualContainer, isDesktop && styles.visualContainerDesktop]}>
            <WindVisualization
              windDirection={currentStep.windDirection}
              shiftPattern={currentStep.shiftPattern}
              showShiftIndicator={currentStep.showShiftIndicator}
              shiftMagnitude={currentStep.shiftMagnitude}
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
                    <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
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
            <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#94A3B8' : '#8B5CF6'} />
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
          <Ionicons name="school-outline" size={24} color="#8B5CF6" />
          <Text style={styles.quizSectionTitle}>Test Your Knowledge</Text>
        </View>
        <Text style={styles.quizSectionSubtitle}>
          Answer these questions to reinforce what you've learned about wind patterns.
        </Text>
        <Quiz questions={QUIZ_QUESTIONS} onComplete={handleQuizComplete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF',
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
      ? { boxShadow: '0px 4px 16px rgba(139, 92, 246, 0.1)' }
      : {
          shadowColor: '#8B5CF6',
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
    borderBottomColor: '#EDE9FE',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B21B6',
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
    aspectRatio: 1,
    maxHeight: 300,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 300,
  },
  visualContainerDesktop: {
    flex: 0.8,
    marginBottom: 0,
    minHeight: 300,
    maxWidth: 350,
  },
  infoPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  infoPanelDesktop: {
    flex: 1.2,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B21B6',
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
    borderColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    width: 20,
  },
  stepDotCompleted: {
    backgroundColor: '#8B5CF6',
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
    borderColor: '#DDD6FE',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(139, 92, 246, 0.1)' }
      : {
          shadowColor: '#8B5CF6',
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
    color: '#5B21B6',
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
    backgroundColor: '#EDE9FE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
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
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  optionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#EDE9FE',
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
    color: '#5B21B6',
    lineHeight: 20,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    color: '#5B21B6',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
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
