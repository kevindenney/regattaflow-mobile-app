/**
 * Current Reading Interactive
 * Learn to read and use tidal currents in racing
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Polygon, Text as SvgText, G } from 'react-native-svg';

interface CurrentReadingInteractiveProps {
  onComplete?: () => void;
}

interface CurrentScenario {
  id: string;
  title: string;
  description: string;
  windDirection: number; // degrees
  windSpeed: number;
  currentDirection: number; // degrees, direction current is FLOWING TO
  currentSpeed: number; // knots
  courseDirection: number; // direction to windward mark
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

const SCENARIOS: CurrentScenario[] = [
  {
    id: 'favorable-current',
    title: 'Favorable Tidal Current',
    description: 'The current is flowing toward the windward mark. How do you use this to your advantage?',
    windDirection: 0, // North wind
    windSpeed: 12,
    currentDirection: 0, // Flowing north
    currentSpeed: 1.5,
    courseDirection: 0, // Mark is north
    questions: [
      {
        id: 'q1',
        question: 'With current flowing toward the windward mark, what is the effect on your laylines?',
        options: [
          'Laylines get longer - need to sail further',
          'Laylines get shorter - can tack earlier',
          'Laylines stay the same',
          'Only the port layline changes',
        ],
        correctAnswer: 1,
        explanation: 'Favorable current (pushing you toward the mark) effectively shortens your laylines. The current carries you toward the mark while you sail, so you can tack onto the layline earlier than you would in no current.',
      },
      {
        id: 'q2',
        question: 'Which side of the course should you favor with this current?',
        options: [
          'Stay in the middle to minimize current exposure',
          'Stay on the side where current is strongest',
          'Current doesn\'t affect side choice when it\'s favorable',
          'Go to the side away from strongest current',
        ],
        correctAnswer: 1,
        explanation: 'With favorable current, you want to maximize your time in it. Stay in areas where current is strongest to get the most "free" distance toward the mark.',
      },
      {
        id: 'q3',
        question: 'How does wind-against-current affect the sea state?',
        options: [
          'Flat water - waves are suppressed',
          'Steep, choppy waves - current opposes wave motion',
          'No effect on sea state',
          'Long, rolling swells',
        ],
        correctAnswer: 0,
        explanation: 'When wind and current are in the same direction (wind from North, current to North), the sea state is typically flat. Current moving with the wind smooths out the waves, making for easier sailing.',
      },
    ],
  },
  {
    id: 'lee-bow-current',
    title: 'Lee-Bow Current',
    description: 'The current is coming from your leeward side. This is a classic tactical situation.',
    windDirection: 0, // North wind
    windSpeed: 10,
    currentDirection: 270, // Flowing west
    currentSpeed: 1.0,
    courseDirection: 0,
    questions: [
      {
        id: 'q1',
        question: 'What is "lee-bowing the current"?',
        options: [
          'Sailing with current from windward side',
          'Tacking to put current on your leeward bow',
          'Sailing directly into the current',
          'Avoiding current entirely',
        ],
        correctAnswer: 1,
        explanation: 'Lee-bowing means positioning so current hits your leeward bow. This pushes you to windward while you sail, effectively lifting your course toward the mark. It\'s one of the most valuable current tactics.',
      },
      {
        id: 'q2',
        question: 'On which tack do you lee-bow this current (flowing west)?',
        options: [
          'Port tack (sailing northwest)',
          'Starboard tack (sailing northeast)',
          'Either tack works equally',
          'You can\'t lee-bow this current',
        ],
        correctAnswer: 1,
        explanation: 'With current flowing west and wind from north, on starboard tack (sailing northeast) the current hits your leeward (left) bow. This pushes you to windward. Port tack would have current on weather bow, pushing you to leeward.',
      },
      {
        id: 'q3',
        question: 'Why is lee-bow current so valuable upwind?',
        options: [
          'It makes you faster through the water',
          'It lifts your course toward the mark without apparent wind change',
          'It reduces wave height',
          'It keeps you in phase with wind shifts',
        ],
        correctAnswer: 1,
        explanation: 'Lee-bow current lifts your course - you end up pointing higher relative to the mark than your boat heading suggests. Your instruments show your heading through water, but you\'re actually gaining to windward through the current effect.',
      },
    ],
  },
  {
    id: 'adverse-current',
    title: 'Adverse Current at the Mark',
    description: 'Strong current is pushing away from the windward mark. How do you adjust your approach?',
    windDirection: 0,
    windSpeed: 12,
    currentDirection: 180, // Flowing south, away from mark
    currentSpeed: 2.0,
    courseDirection: 0,
    questions: [
      {
        id: 'q1',
        question: 'How should you adjust your layline approach in adverse current?',
        options: [
          'Approach on same layline as normal',
          'Sail past the normal layline - overstand',
          'Sail short of the layline - you\'ll drift up',
          'Current doesn\'t affect laylines',
        ],
        correctAnswer: 1,
        explanation: 'In adverse current (pushing you away from mark), you must overstand. The current will push you down from your intended track, so you need extra margin. Better to approach high than get swept below the mark.',
      },
      {
        id: 'q2',
        question: 'At a windward mark with 2-knot adverse current, when should you round?',
        options: [
          'Go for the inside at the first opportunity',
          'Approach wide and round tight',
          'Stay well above the mark until very close',
          'It doesn\'t matter with current this strong',
        ],
        correctAnswer: 2,
        explanation: 'With strong adverse current, stay above the layline longer. The current will carry you down as you slow for the rounding. Arrive high, then let current help position you at the mark.',
      },
      {
        id: 'q3',
        question: 'What happens to the sea state with wind-against-current?',
        options: [
          'Flat, easy conditions',
          'Steep, choppy waves',
          'Long period swells',
          'No change from no-current conditions',
        ],
        correctAnswer: 1,
        explanation: 'Wind against current creates steep, choppy seas. The wind tries to push waves one way while current moves water the other way. This creates short, steep chop that slows boats and makes steering difficult.',
      },
    ],
  },
];

export function CurrentReadingInteractive({ onComplete }: CurrentReadingInteractiveProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const scenario = SCENARIOS[currentScenario];
  const question = scenario.questions[currentQuestion];

  const handleAnswerSelect = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === question.correctAnswer) {
      setScore(s => s + 1);
    }
  }, [selectedAnswer, question.correctAnswer]);

  const handleNext = useCallback(() => {
    if (currentQuestion < scenario.questions.length - 1) {
      setCurrentQuestion(q => q + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else if (currentScenario < SCENARIOS.length - 1) {
      setCurrentScenario(s => s + 1);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentQuestion, currentScenario, scenario.questions.length, onComplete]);

  // Convert direction to SVG rotation (0 = up/north)
  const getArrowRotation = (direction: number) => {
    return direction; // SVG already has 0 = up
  };

  if (isComplete) {
    const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Current Reading Complete!</Text>
          <Text style={styles.completeScore}>
            You scored {score}/{totalQuestions} ({percentage}%)
          </Text>
          <Text style={styles.completeMessage}>
            {percentage >= 80
              ? 'Excellent! You understand how to use current to your advantage.'
              : percentage >= 60
              ? 'Good progress! Practice identifying lee-bow opportunities on the water.'
              : 'Keep studying! Current tactics can make huge differences in tidal venues.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scenario Header */}
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioDescription}>{scenario.description}</Text>
        <Text style={styles.progressText}>
          Scenario {currentScenario + 1}/{SCENARIOS.length} • Question {currentQuestion + 1}/{scenario.questions.length}
        </Text>
      </View>

      {/* Diagram */}
      <View style={styles.diagramCard}>
        <Text style={styles.diagramTitle}>Current & Wind Diagram</Text>
        <View style={styles.diagramContainer}>
          <Svg width="280" height="280" viewBox="0 0 280 280">
            {/* Background */}
            <Circle cx="140" cy="140" r="130" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1" />

            {/* Compass rose */}
            <SvgText x="140" y="20" textAnchor="middle" fontSize="12" fill="#64748B">N</SvgText>
            <SvgText x="260" y="145" textAnchor="middle" fontSize="12" fill="#64748B">E</SvgText>
            <SvgText x="140" y="270" textAnchor="middle" fontSize="12" fill="#64748B">S</SvgText>
            <SvgText x="20" y="145" textAnchor="middle" fontSize="12" fill="#64748B">W</SvgText>

            {/* Wind arrow (blue) */}
            <G transform={`rotate(${scenario.windDirection + 180}, 140, 140)`}>
              <Line x1="140" y1="60" x2="140" y2="140" stroke="#3B82F6" strokeWidth="3" />
              <Polygon points="140,50 133,65 147,65" fill="#3B82F6" />
            </G>

            {/* Current arrow (teal) */}
            <G transform={`rotate(${scenario.currentDirection}, 140, 140)`}>
              <Line x1="140" y1="140" x2="140" y2="80" stroke="#14B8A6" strokeWidth="3" strokeDasharray="5,5" />
              <Polygon points="140,70 133,85 147,85" fill="#14B8A6" />
            </G>

            {/* Windward mark */}
            <G transform={`rotate(${scenario.courseDirection}, 140, 140)`}>
              <Circle cx="140" cy="45" r="8" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
              <SvgText x="140" y="35" textAnchor="middle" fontSize="8" fill="#F97316">WM</SvgText>
            </G>

            {/* Boat position */}
            <Circle cx="140" cy="180" r="6" fill="#1E293B" />
            <SvgText x="140" y="200" textAnchor="middle" fontSize="10" fill="#1E293B">You</SvgText>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Wind {scenario.windSpeed} kts</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#14B8A6' }]} />
            <Text style={styles.legendText}>Current {scenario.currentSpeed} kts</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F97316' }]} />
            <Text style={styles.legendText}>Windward Mark</Text>
          </View>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && (
                  index === question.correctAnswer
                    ? styles.correctOption
                    : styles.incorrectOption
                ),
                selectedAnswer !== null && index === question.correctAnswer && styles.correctOption,
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer !== null && index === question.correctAnswer && styles.correctText,
                selectedAnswer === index && index !== question.correctAnswer && styles.incorrectText,
              ]}>
                {option}
              </Text>
              {selectedAnswer !== null && index === question.correctAnswer && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              )}
              {selectedAnswer === index && index !== question.correctAnswer && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>Explanation</Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {showExplanation && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentQuestion < scenario.questions.length - 1
                ? 'Next Question'
                : currentScenario < SCENARIOS.length - 1
                ? 'Next Scenario'
                : 'Complete'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  scenarioHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }
      : { elevation: 2 }),
  },
  scenarioTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  diagramCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }
      : { elevation: 2 }),
  },
  diagramTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  diagramContainer: {
    width: 280,
    height: 280,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }
      : { elevation: 2 }),
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  correctOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  incorrectOption: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  correctText: {
    color: '#059669',
    fontWeight: '500',
  },
  incorrectText: {
    color: '#DC2626',
  },
  explanationBox: {
    backgroundColor: '#F0FDFA',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
  },
  explanationText: {
    fontSize: 14,
    color: '#115E59',
    lineHeight: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14B8A6',
    padding: 14,
    borderRadius: 10,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  completeScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  completeMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CurrentReadingInteractive;
