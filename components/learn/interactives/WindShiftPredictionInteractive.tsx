/**
 * Wind Shift Prediction Interactive
 * Learn to identify and predict wind shifts from various sources
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
import Svg, { Path, Circle, Line, Polygon, Text as SvgText, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WindShiftPredictionInteractiveProps {
  onComplete?: () => void;
}

interface ShiftScenario {
  id: string;
  title: string;
  description: string;
  shiftType: 'oscillating' | 'persistent' | 'geographic' | 'thermal';
  visualElements: {
    type: 'shoreline' | 'clouds' | 'compass' | 'boats';
    data: any;
  }[];
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

const SCENARIOS: ShiftScenario[] = [
  {
    id: 'oscillating',
    title: 'Oscillating Wind Shifts',
    description: 'The wind is swinging back and forth in a regular pattern. Learn to work the shifts.',
    shiftType: 'oscillating',
    visualElements: [],
    questions: [
      {
        id: 'q1',
        question: 'What characterizes an oscillating shift pattern?',
        options: [
          'Wind permanently moves to new direction',
          'Wind swings back and forth around a median',
          'Wind speed changes but direction stays constant',
          'Wind only shifts at mark roundings',
        ],
        correctAnswer: 1,
        explanation: 'Oscillating shifts swing the wind direction back and forth around an average direction. The pattern repeats, usually every 5-15 minutes, allowing tactical opportunities on each shift.',
      },
      {
        id: 'q2',
        question: 'On which shifts should you tack in an oscillating pattern?',
        options: [
          'Tack on lifts to maximize each shift',
          'Tack on headers to stay in phase',
          'Only tack at the laylines',
          'Tack on every shift regardless of type',
        ],
        correctAnswer: 1,
        explanation: 'In oscillating breeze, tack on headers. When you\'re headed (wind shifts against you), tack to convert the header into a lift on the other tack. This keeps you "in phase" with the shifts.',
      },
      {
        id: 'q3',
        question: 'You\'re lifted 10° on starboard tack in an oscillating pattern. What should you do?',
        options: [
          'Tack immediately to port',
          'Sail the lift until you\'re headed back',
          'Head up to the new wind',
          'Bear off to maintain your original course',
        ],
        correctAnswer: 1,
        explanation: 'Sail the lift! In oscillating conditions, a lift means you\'re making better VMG toward the mark. Keep sailing until the wind shifts back and you\'re headed, then tack to catch the lift on the other tack.',
      },
    ],
  },
  {
    id: 'persistent',
    title: 'Persistent Wind Shifts',
    description: 'A weather system is causing the wind to gradually shift in one direction. Different tactics required.',
    shiftType: 'persistent',
    visualElements: [],
    questions: [
      {
        id: 'q1',
        question: 'How does a persistent shift differ from oscillating?',
        options: [
          'Persistent shifts are faster',
          'Persistent shifts move in one direction over time',
          'Persistent shifts only affect the start',
          'There\'s no practical difference',
        ],
        correctAnswer: 1,
        explanation: 'Persistent shifts trend in one direction (e.g., backing from SW to S over the race). Unlike oscillating shifts, they don\'t swing back. You must position to take advantage of the shift as it develops.',
      },
      {
        id: 'q2',
        question: 'If you expect the wind to veer (shift clockwise) during the race, which side should you go?',
        options: [
          'Go left to get to the new wind first',
          'Go right to get to the new wind first',
          'Stay in the middle to minimize risk',
          'Side choice doesn\'t matter with persistent shifts',
        ],
        correctAnswer: 1,
        explanation: 'If wind will veer (shift right), GO RIGHT. Position yourself to be on the inside of the shift. As the wind comes from the right, you\'ll be lifted on starboard tack. Going left means you\'ll be headed.',
      },
      {
        id: 'q3',
        question: 'What are common causes of persistent shifts?',
        options: [
          'Only puffy clouds',
          'Frontal passages, sea breeze development, pressure systems',
          'Waves and current',
          'Boat wakes',
        ],
        correctAnswer: 1,
        explanation: 'Persistent shifts are caused by large-scale weather: cold fronts veering the wind, sea breeze filling from shore, or gradient wind changes from pressure systems. They\'re predictable from weather forecasts.',
      },
    ],
  },
  {
    id: 'geographic',
    title: 'Geographic Wind Bends',
    description: 'The shoreline and terrain create predictable wind patterns. Learn to use them.',
    shiftType: 'geographic',
    visualElements: [],
    questions: [
      {
        id: 'q1',
        question: 'How does wind typically behave near a point of land?',
        options: [
          'Dies completely',
          'Accelerates and bends around the point',
          'Stays constant',
          'Becomes very gusty only',
        ],
        correctAnswer: 1,
        explanation: 'Wind accelerates as it funnels around points of land, and bends to follow the coastline. These "geographic bends" are predictable and repeatable - they happen the same way every race at that venue.',
      },
      {
        id: 'q2',
        question: 'What happens to wind in the shadow of a large building or hill?',
        options: [
          'Wind gets stronger',
          'Wind is blocked/disturbed creating a shadow zone',
          'Wind direction reverses',
          'No effect - wind ignores terrain',
        ],
        correctAnswer: 1,
        explanation: 'Obstructions create wind shadows - areas of reduced and disturbed wind. The shadow extends roughly 7-10 times the height of the obstruction. Racing near shore requires knowing where shadows are.',
      },
      {
        id: 'q3',
        question: 'If the wind is blowing offshore and you\'re racing near a convex coastline (bulge toward water), where is the wind likely strongest?',
        options: [
          'Directly in front of the bulge',
          'In the bays on either side of the bulge',
          'Wind is uniform along the whole shoreline',
          'At the furthest point from shore',
        ],
        correctAnswer: 0,
        explanation: 'Wind funnels and accelerates over convex shorelines (points). The apex of a bulge or point typically has the strongest wind. Conversely, concave areas (bays) tend to have lighter, more disturbed wind.',
      },
    ],
  },
  {
    id: 'thermal',
    title: 'Thermal/Sea Breeze Shifts',
    description: 'The sun heats the land, creating thermal winds. Predict when and how the sea breeze will develop.',
    shiftType: 'thermal',
    visualElements: [],
    questions: [
      {
        id: 'q1',
        question: 'What drives sea breeze development?',
        options: [
          'Moon position',
          'Temperature difference between land and water',
          'Wave action',
          'Cloud cover only',
        ],
        correctAnswer: 1,
        explanation: 'Sea breeze forms when land heats faster than water. Hot air rises over land, cooler air from over the water flows in to replace it. The greater the temperature difference, the stronger the sea breeze.',
      },
      {
        id: 'q2',
        question: 'When does sea breeze typically develop and peak?',
        options: [
          'Develops at dawn, peaks at noon',
          'Develops mid-morning, peaks mid-afternoon',
          'Develops at sunset, peaks at midnight',
          'It\'s random - no pattern',
        ],
        correctAnswer: 1,
        explanation: 'Sea breeze typically starts developing late morning (10-11am) as land heats up, peaks in mid-afternoon (2-4pm) when temperature differential is greatest, and dies near sunset as land cools.',
      },
      {
        id: 'q3',
        question: 'From which direction does sea breeze blow relative to the shoreline?',
        options: [
          'Parallel to shore',
          'Roughly perpendicular to shore (from water to land)',
          'Away from water',
          'Direction varies randomly',
        ],
        correctAnswer: 1,
        explanation: 'Sea breeze blows from water toward land, roughly perpendicular to the shoreline. The cooler air over water moves inland to replace rising hot air. This perpendicular flow is a key identifier of sea breeze.',
      },
    ],
  },
];

export function WindShiftPredictionInteractive({ onComplete }: WindShiftPredictionInteractiveProps) {
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

  const getShiftTypeIcon = (type: string) => {
    switch (type) {
      case 'oscillating': return 'swap-horizontal';
      case 'persistent': return 'arrow-forward';
      case 'geographic': return 'map';
      case 'thermal': return 'sunny';
      default: return 'help';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'oscillating': return '#8B5CF6';
      case 'persistent': return '#3B82F6';
      case 'geographic': return '#10B981';
      case 'thermal': return '#F59E0B';
      default: return '#64748B';
    }
  };

  if (isComplete) {
    const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Wind Shifts Complete!</Text>
          <Text style={styles.completeScore}>
            You scored {score}/{totalQuestions} ({percentage}%)
          </Text>
          <Text style={styles.completeMessage}>
            {percentage >= 80
              ? 'Excellent! You can identify different shift types and know how to use them.'
              : percentage >= 60
              ? 'Good work! Practice identifying shift types at your local venue.'
              : 'Keep studying! Understanding shifts is crucial for tactical racing.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scenario Header */}
      <View style={styles.scenarioHeader}>
        <View style={styles.headerRow}>
          <View style={[styles.shiftTypeBadge, { backgroundColor: getShiftTypeColor(scenario.shiftType) + '20' }]}>
            <Ionicons
              name={getShiftTypeIcon(scenario.shiftType) as any}
              size={16}
              color={getShiftTypeColor(scenario.shiftType)}
            />
            <Text style={[styles.shiftTypeText, { color: getShiftTypeColor(scenario.shiftType) }]}>
              {scenario.shiftType.charAt(0).toUpperCase() + scenario.shiftType.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioDescription}>{scenario.description}</Text>
        <Text style={styles.progressText}>
          Scenario {currentScenario + 1}/{SCENARIOS.length} • Question {currentQuestion + 1}/{scenario.questions.length}
        </Text>
      </View>

      {/* Visual Diagram */}
      <View style={styles.diagramCard}>
        <Text style={styles.diagramTitle}>Shift Pattern Visualization</Text>
        <View style={styles.diagramContainer}>
          <Svg width="280" height="200" viewBox="0 0 280 200">
            <Defs>
              <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#BFDBFE" />
                <Stop offset="1" stopColor="#3B82F6" />
              </LinearGradient>
            </Defs>

            {/* Background */}
            <Rect x="0" y="0" width="280" height="200" fill="#F0F9FF" />

            {scenario.shiftType === 'oscillating' && (
              <G>
                {/* Oscillating pattern visualization */}
                <Path
                  d="M 40 100 Q 70 60, 100 100 T 160 100 T 220 100 T 280 100"
                  stroke={getShiftTypeColor('oscillating')}
                  strokeWidth="3"
                  fill="none"
                />
                <SvgText x="140" y="50" textAnchor="middle" fontSize="12" fill="#1E293B">Wind swings</SvgText>
                <SvgText x="140" y="170" textAnchor="middle" fontSize="10" fill="#64748B">Time →</SvgText>

                {/* Arrows at peaks */}
                <Polygon points="100,90 94,100 106,100" fill="#8B5CF6" />
                <Polygon points="160,110 154,100 166,100" fill="#8B5CF6" />
                <Polygon points="220,90 214,100 226,100" fill="#8B5CF6" />
              </G>
            )}

            {scenario.shiftType === 'persistent' && (
              <G>
                {/* Persistent shift - trending line */}
                <Line x1="40" y1="140" x2="240" y2="60" stroke={getShiftTypeColor('persistent')} strokeWidth="3" />
                <Polygon points="240,60 230,55 230,65" fill="#3B82F6" />

                <SvgText x="140" y="30" textAnchor="middle" fontSize="12" fill="#1E293B">Wind trending right</SvgText>
                <SvgText x="60" y="160" textAnchor="start" fontSize="10" fill="#64748B">Start: 220°</SvgText>
                <SvgText x="200" y="80" textAnchor="start" fontSize="10" fill="#64748B">End: 250°</SvgText>
              </G>
            )}

            {scenario.shiftType === 'geographic' && (
              <G>
                {/* Shoreline */}
                <Path
                  d="M 0 150 Q 70 120, 140 150 Q 210 180, 280 150"
                  fill="#D4A574"
                  stroke="#8B5A2B"
                  strokeWidth="2"
                />
                <Rect x="0" y="150" width="280" height="50" fill="#D4A574" />

                {/* Water */}
                <Rect x="0" y="0" width="280" height="150" fill="url(#waterGrad)" opacity="0.3" />

                {/* Wind bending around point */}
                <Path
                  d="M 40 40 C 80 60, 100 80, 140 100"
                  stroke={getShiftTypeColor('geographic')}
                  strokeWidth="2"
                  fill="none"
                />
                <Path
                  d="M 60 50 C 100 70, 120 90, 140 100"
                  stroke={getShiftTypeColor('geographic')}
                  strokeWidth="2"
                  fill="none"
                />
                <Polygon points="140,100 130,95 135,105" fill="#10B981" />
                <Polygon points="140,100 130,105 135,95" fill="#10B981" />

                <SvgText x="140" y="20" textAnchor="middle" fontSize="11" fill="#1E293B">Wind bends at point</SvgText>
              </G>
            )}

            {scenario.shiftType === 'thermal' && (
              <G>
                {/* Land (bottom) */}
                <Rect x="0" y="130" width="280" height="70" fill="#86EFAC" />

                {/* Water (top) */}
                <Rect x="0" y="0" width="280" height="130" fill="url(#waterGrad)" opacity="0.4" />

                {/* Sun */}
                <Circle cx="240" cy="30" r="20" fill="#FCD34D" />

                {/* Rising air over land */}
                <Path d="M 100 150 Q 100 100, 120 60" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <Path d="M 180 150 Q 180 100, 160 60" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <SvgText x="140" y="80" textAnchor="middle" fontSize="10" fill="#DC2626">Hot air rises</SvgText>

                {/* Sea breeze arrows */}
                <Line x1="20" y1="100" x2="80" y2="120" stroke="#3B82F6" strokeWidth="3" />
                <Polygon points="80,120 70,115 72,125" fill="#3B82F6" />
                <SvgText x="50" y="90" textAnchor="middle" fontSize="10" fill="#1D4ED8">Cool air</SvgText>

                <SvgText x="140" y="180" textAnchor="middle" fontSize="10" fill="#15803D">Land (hot)</SvgText>
              </G>
            )}
          </Svg>
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
          <View style={[styles.explanationBox, { backgroundColor: getShiftTypeColor(scenario.shiftType) + '15' }]}>
            <Text style={[styles.explanationTitle, { color: getShiftTypeColor(scenario.shiftType) }]}>
              Explanation
            </Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {showExplanation && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: getShiftTypeColor(scenario.shiftType) }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestion < scenario.questions.length - 1
                ? 'Next Question'
                : currentScenario < SCENARIOS.length - 1
                ? 'Next Shift Type'
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shiftTypeText: {
    fontSize: 12,
    fontWeight: '600',
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
    height: 200,
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
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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

export default WindShiftPredictionInteractive;
