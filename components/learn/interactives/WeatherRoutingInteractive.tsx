/**
 * Weather Routing Interactive
 * Learn to use weather data and routing software for distance racing
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

interface WeatherRoutingInteractiveProps {
  onComplete?: () => void;
}

interface RoutingScenario {
  id: string;
  title: string;
  description: string;
  weatherData: {
    windArrows: { x: number; y: number; direction: number; speed: number }[];
    pressureSystems: { x: number; y: number; type: 'high' | 'low'; value: number }[];
    routes: { name: string; color: string; path: number[][]; time: string; distance: string }[];
  };
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

const SCENARIOS: RoutingScenario[] = [
  {
    id: 'grib-interpretation',
    title: 'Reading GRIB Weather Data',
    description: 'GRIB files are the foundation of weather routing. Learn to interpret wind arrows and identify favorable conditions.',
    weatherData: {
      windArrows: [
        { x: 60, y: 60, direction: 225, speed: 15 },
        { x: 140, y: 60, direction: 220, speed: 18 },
        { x: 220, y: 60, direction: 215, speed: 20 },
        { x: 60, y: 140, direction: 230, speed: 12 },
        { x: 140, y: 140, direction: 225, speed: 15 },
        { x: 220, y: 140, direction: 220, speed: 17 },
        { x: 60, y: 220, direction: 240, speed: 8 },
        { x: 140, y: 220, direction: 235, speed: 10 },
        { x: 220, y: 220, direction: 230, speed: 12 },
      ],
      pressureSystems: [
        { x: 240, y: 40, type: 'low', value: 1002 },
      ],
      routes: [
        { name: 'Rhumb', color: '#94A3B8', path: [[50, 240], [230, 50]], time: '28h', distance: '95nm' },
        { name: 'Optimal', color: '#10B981', path: [[50, 240], [100, 180], [180, 100], [230, 50]], time: '24h', distance: '102nm' },
      ],
    },
    questions: [
      {
        id: 'q1',
        question: 'What do the wind barbs on a GRIB display tell you?',
        options: [
          'Only wind direction',
          'Wind direction and approximate speed',
          'Only wind speed',
          'Wave height and direction',
        ],
        correctAnswer: 1,
        explanation: 'Wind barbs show both direction (arrow points where wind is coming FROM) and speed (number of barbs/flags indicates speed in knots). Full barbs = 10 knots, half barbs = 5 knots, triangles = 50 knots.',
      },
      {
        id: 'q2',
        question: 'Looking at this GRIB data, where is the wind strongest?',
        options: [
          'Lower left (SW corner)',
          'Upper right (NE corner)',
          'Center of the chart',
          'Wind is uniform across the area',
        ],
        correctAnswer: 1,
        explanation: 'The GRIB shows increasing wind speeds toward the upper right, reaching 20 knots near the low pressure system. Wind typically increases closer to low pressure centers.',
      },
      {
        id: 'q3',
        question: 'How often should you download new GRIB files during a race?',
        options: [
          'Once before the start is enough',
          'Every 6-12 hours to capture forecast updates',
          'Only when conditions change dramatically',
          'Every hour for maximum accuracy',
        ],
        correctAnswer: 1,
        explanation: 'Download GRIBs every 6-12 hours during a distance race. Weather models update typically every 6 hours, and forecasts improve as you get closer to the prediction time. More frequent updates waste bandwidth without adding value.',
      },
    ],
  },
  {
    id: 'rhumb-vs-optimal',
    title: 'Rhumb Line vs. Optimal Route',
    description: 'The shortest path isn\'t always the fastest. Learn when to deviate from the direct route.',
    weatherData: {
      windArrows: [
        { x: 60, y: 80, direction: 270, speed: 8 },
        { x: 140, y: 80, direction: 280, speed: 12 },
        { x: 220, y: 80, direction: 290, speed: 18 },
        { x: 60, y: 160, direction: 260, speed: 6 },
        { x: 140, y: 160, direction: 270, speed: 10 },
        { x: 220, y: 160, direction: 280, speed: 15 },
        { x: 60, y: 240, direction: 250, speed: 5 },
        { x: 140, y: 240, direction: 260, speed: 8 },
        { x: 220, y: 240, direction: 270, speed: 12 },
      ],
      pressureSystems: [],
      routes: [
        { name: 'Rhumb', color: '#94A3B8', path: [[50, 260], [230, 40]], time: '32h', distance: '85nm' },
        { name: 'Optimal', color: '#10B981', path: [[50, 260], [180, 200], [220, 120], [230, 40]], time: '26h', distance: '92nm' },
      ],
    },
    questions: [
      {
        id: 'q1',
        question: 'In this scenario, the optimal route is 7nm longer but 6 hours faster. Why?',
        options: [
          'The direct route has adverse current',
          'The detour finds stronger, more favorable wind',
          'The rhumb line crosses a restricted area',
          'Boat speed is higher in warmer water',
        ],
        correctAnswer: 1,
        explanation: 'The optimal route curves toward the stronger NE winds (15-18 knots) instead of sailing through the lighter SW winds (5-8 knots). The extra distance is more than offset by higher boat speed in better breeze.',
      },
      {
        id: 'q2',
        question: 'What\'s the primary input that makes routing software calculate faster routes?',
        options: [
          'Current information only',
          'Your boat\'s polar diagram (speed at various wind angles)',
          'The magnetic variation',
          'Fuel consumption rates',
        ],
        correctAnswer: 1,
        explanation: 'Polar diagrams define your boat speed at each combination of wind angle and wind speed. The router tests thousands of routes and uses polars to calculate time for each, finding the fastest path.',
      },
      {
        id: 'q3',
        question: 'When should you sail the rhumb line despite routing showing a faster alternative?',
        options: [
          'Never - always follow the optimal route',
          'When tactical position matters (covering competitors, start placement)',
          'Whenever the rhumb line is shorter',
          'Only in light wind',
        ],
        correctAnswer: 1,
        explanation: 'In racing, position matters. If a competitor is nearby, covering them may be worth more than saving an hour. Also consider: high forecast uncertainty, avoiding shipping lanes, or conserving crew energy on shorter deviations.',
      },
    ],
  },
  {
    id: 'weather-windows',
    title: 'Identifying Weather Windows',
    description: 'Time your departure and maneuvers to take advantage of favorable weather windows.',
    weatherData: {
      windArrows: [
        { x: 80, y: 80, direction: 45, speed: 5 },
        { x: 160, y: 80, direction: 90, speed: 15 },
        { x: 240, y: 80, direction: 135, speed: 8 },
        { x: 80, y: 160, direction: 60, speed: 8 },
        { x: 160, y: 160, direction: 100, speed: 18 },
        { x: 240, y: 160, direction: 140, speed: 10 },
      ],
      pressureSystems: [
        { x: 160, y: 120, type: 'high', value: 1018 },
      ],
      routes: [
        { name: 'Early', color: '#F59E0B', path: [[40, 200], [120, 140], [220, 80]], time: '18h', distance: '70nm' },
        { name: 'Wait 6h', color: '#10B981', path: [[40, 200], [160, 160], [220, 80]], time: '14h', distance: '72nm' },
      ],
    },
    questions: [
      {
        id: 'q1',
        question: 'What is a "weather window" in sailing?',
        options: [
          'A porthole on the boat',
          'A period of favorable wind and sea conditions for your planned passage',
          'The gap between two weather fronts',
          'When visibility is best',
        ],
        correctAnswer: 1,
        explanation: 'A weather window is a time period when conditions align with your needs: adequate wind, acceptable sea state, and safe conditions. Identifying windows is critical for timing departure and routing decisions.',
      },
      {
        id: 'q2',
        question: 'The routing shows "Wait 6h" saves 4 hours of sailing time. What\'s happening?',
        options: [
          'Tidal current reverses',
          'Better wind fills in, allowing faster sailing angles',
          'The destination moves closer',
          'Wave height decreases',
        ],
        correctAnswer: 1,
        explanation: 'The 6-hour delay catches better wind (15-18 knots vs 5-8 knots at early departure). Sailing faster in good breeze more than compensates for the delayed start. This is a classic weather window decision.',
      },
      {
        id: 'q3',
        question: 'How do you verify a weather window is reliable enough to commit to?',
        options: [
          'Trust a single forecast model',
          'Compare multiple models (GFS, ECMWF, etc.) for agreement',
          'Only use observations, ignore forecasts',
          'Check if barometric pressure is rising',
        ],
        correctAnswer: 1,
        explanation: 'Compare multiple forecast models. When GFS, ECMWF, and others agree on timing and strength, confidence is high. When models diverge significantly, the window is uncertain - plan contingencies.',
      },
    ],
  },
  {
    id: 'model-uncertainty',
    title: 'Model Comparison & Uncertainty',
    description: 'No forecast is perfect. Learn to handle uncertainty in weather routing decisions.',
    weatherData: {
      windArrows: [
        { x: 80, y: 100, direction: 200, speed: 12 },
        { x: 160, y: 100, direction: 210, speed: 14 },
        { x: 80, y: 180, direction: 190, speed: 10 },
        { x: 160, y: 180, direction: 200, speed: 12 },
      ],
      pressureSystems: [
        { x: 220, y: 80, type: 'low', value: 1005 },
      ],
      routes: [
        { name: 'GFS', color: '#3B82F6', path: [[50, 220], [120, 160], [200, 80]], time: '22h', distance: '78nm' },
        { name: 'ECMWF', color: '#8B5CF6', path: [[50, 220], [80, 140], [160, 80], [200, 80]], time: '24h', distance: '82nm' },
        { name: 'Consensus', color: '#10B981', path: [[50, 220], [100, 150], [180, 80], [200, 80]], time: '23h', distance: '80nm' },
      ],
    },
    questions: [
      {
        id: 'q1',
        question: 'When two weather models suggest different optimal routes, what should you do?',
        options: [
          'Always choose the faster route',
          'Average them and sail the middle path',
          'Understand why they differ and plan for both scenarios',
          'Ignore routing and sail rhumb line',
        ],
        correctAnswer: 2,
        explanation: 'Understand WHY they differ - usually disagreement about system timing or intensity. Plan a route that works reasonably well under both scenarios, with decision points where you\'ll reassess with updated data.',
      },
      {
        id: 'q2',
        question: 'What does "ensemble spread" tell you about forecast reliability?',
        options: [
          'How many models were consulted',
          'The range of possible outcomes - wider spread means more uncertainty',
          'The average wind speed expected',
          'How far the weather system will travel',
        ],
        correctAnswer: 1,
        explanation: 'Ensemble forecasts run the same model many times with slightly different starting conditions. Wide spread (many different outcomes) indicates high uncertainty. Narrow spread means the forecast is more reliable.',
      },
      {
        id: 'q3',
        question: 'In areas where models disagree, how should this affect your routing?',
        options: [
          'Sail more conservatively with margin for error',
          'Take maximum risk to gain on competitors',
          'Ignore the disagreement - one model must be right',
          'Stop and wait for models to agree',
        ],
        correctAnswer: 0,
        explanation: 'In high-uncertainty areas, add safety margin. Don\'t bet everything on one forecast being correct. Choose routes that remain viable under different scenarios, and be prepared to adjust as you receive updated information.',
      },
    ],
  },
];

export function WeatherRoutingInteractive({ onComplete }: WeatherRoutingInteractiveProps) {
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

  // Draw wind barb based on direction and speed
  const getWindArrow = (x: number, y: number, direction: number, speed: number) => {
    const length = Math.min(25, 15 + speed / 2);
    const rad = (direction * Math.PI) / 180;
    const endX = x + Math.sin(rad) * length;
    const endY = y - Math.cos(rad) * length;

    // Arrowhead
    const arrowSize = 6;
    const arrowAngle1 = rad + (Math.PI * 5) / 6;
    const arrowAngle2 = rad - (Math.PI * 5) / 6;
    const arrow1X = endX + Math.sin(arrowAngle1) * arrowSize;
    const arrow1Y = endY - Math.cos(arrowAngle1) * arrowSize;
    const arrow2X = endX + Math.sin(arrowAngle2) * arrowSize;
    const arrow2Y = endY - Math.cos(arrowAngle2) * arrowSize;

    return (
      <G key={`wind-${x}-${y}`}>
        <Line x1={x} y1={y} x2={endX} y2={endY} stroke="#3B82F6" strokeWidth="2" />
        <Polygon points={`${endX},${endY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}`} fill="#3B82F6" />
        <SvgText x={x} y={y + length + 12} textAnchor="middle" fontSize="8" fill="#64748B">
          {speed}
        </SvgText>
      </G>
    );
  };

  if (isComplete) {
    const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Weather Routing Complete!</Text>
          <Text style={styles.completeScore}>
            You scored {score}/{totalQuestions} ({percentage}%)
          </Text>
          <Text style={styles.completeMessage}>
            {percentage >= 80
              ? 'Excellent! You understand weather routing fundamentals for distance racing.'
              : percentage >= 60
              ? 'Good progress! Practice comparing forecasts and identifying weather windows.'
              : 'Keep studying! Weather routing skills can save hours on every passage.'}
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

      {/* Weather Map Diagram */}
      <View style={styles.diagramCard}>
        <Text style={styles.diagramTitle}>Weather Routing Display</Text>
        <View style={styles.diagramContainer}>
          <Svg width="280" height="280" viewBox="0 0 280 280">
            {/* Background gradient - ocean */}
            <Defs>
              <LinearGradient id="ocean" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#DBEAFE" />
                <Stop offset="100%" stopColor="#BFDBFE" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="280" height="280" fill="url(#ocean)" />

            {/* Grid lines */}
            {[70, 140, 210].map(pos => (
              <G key={`grid-${pos}`}>
                <Line x1={pos} y1="0" x2={pos} y2="280" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="4,4" />
                <Line x1="0" y1={pos} x2="280" y2={pos} stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="4,4" />
              </G>
            ))}

            {/* Wind arrows */}
            {scenario.weatherData.windArrows.map((wind) =>
              getWindArrow(wind.x, wind.y, wind.direction, wind.speed)
            )}

            {/* Pressure systems */}
            {scenario.weatherData.pressureSystems.map((sys, i) => (
              <G key={`pressure-${i}`}>
                <Circle
                  cx={sys.x}
                  cy={sys.y}
                  r="18"
                  fill={sys.type === 'low' ? '#FEE2E2' : '#DCFCE7'}
                  stroke={sys.type === 'low' ? '#EF4444' : '#10B981'}
                  strokeWidth="2"
                />
                <SvgText
                  x={sys.x}
                  y={sys.y + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={sys.type === 'low' ? '#DC2626' : '#059669'}
                >
                  {sys.type === 'low' ? 'L' : 'H'}
                </SvgText>
                <SvgText
                  x={sys.x}
                  y={sys.y + 32}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#64748B"
                >
                  {sys.value}mb
                </SvgText>
              </G>
            ))}

            {/* Routes */}
            {scenario.weatherData.routes.map((route, i) => (
              <G key={`route-${i}`}>
                <Path
                  d={`M ${route.path.map(p => p.join(',')).join(' L ')}`}
                  stroke={route.color}
                  strokeWidth={route.name === 'Optimal' || route.name === 'Consensus' || route.name === 'Wait 6h' ? "3" : "2"}
                  strokeDasharray={route.name === 'Rhumb' || route.name === 'GFS' || route.name === 'ECMWF' ? "6,4" : undefined}
                  fill="none"
                />
                {/* Start marker */}
                <Circle cx={route.path[0][0]} cy={route.path[0][1]} r="5" fill="#10B981" />
                {/* End marker */}
                <Circle cx={route.path[route.path.length - 1][0]} cy={route.path[route.path.length - 1][1]} r="5" fill="#EF4444" />
              </G>
            ))}
          </Svg>
        </View>

        {/* Route Legend */}
        <View style={styles.routeLegend}>
          {scenario.weatherData.routes.map((route, i) => (
            <View key={i} style={styles.routeItem}>
              <View style={[styles.routeColor, { backgroundColor: route.color }]} />
              <View>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routeStats}>{route.distance} / {route.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Wind Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Wind (kts)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444', borderRadius: 8 }]} />
            <Text style={styles.legendText}>Low Pressure</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981', borderRadius: 8 }]} />
            <Text style={styles.legendText}>High Pressure</Text>
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
  routeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeColor: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  routeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  routeStats: {
    fontSize: 10,
    color: '#64748B',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
  },
  legendText: {
    fontSize: 11,
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

export default WeatherRoutingInteractive;
