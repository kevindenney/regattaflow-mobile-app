/**
 * Route Briefing Interactive
 * Learn to create effective crew briefings for distance races
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
import Svg, { Path, Circle, Line, Polygon, Text as SvgText, G, Rect } from 'react-native-svg';

interface RouteBriefingInteractiveProps {
  onComplete?: () => void;
}

interface BriefingScenario {
  id: string;
  title: string;
  description: string;
  chartElements: {
    waypoints: { x: number; y: number; name: string; type: 'start' | 'turn' | 'hazard' | 'finish' }[];
    hazards: { x: number; y: number; name: string; type: 'shipping' | 'shallow' | 'rock' | 'zone' }[];
    route: number[][];
  };
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

const SCENARIOS: BriefingScenario[] = [
  {
    id: 'waypoint-identification',
    title: 'Waypoint & Hazard Identification',
    description: 'You\'re briefing the crew on a 40nm offshore race. Review the route and identify critical elements.',
    chartElements: {
      waypoints: [
        { x: 50, y: 220, name: 'Start', type: 'start' },
        { x: 100, y: 140, name: 'WP1', type: 'turn' },
        { x: 180, y: 80, name: 'WP2', type: 'turn' },
        { x: 230, y: 140, name: 'WP3', type: 'turn' },
        { x: 180, y: 220, name: 'Finish', type: 'finish' },
      ],
      hazards: [
        { x: 140, y: 110, name: 'TSS', type: 'shipping' },
        { x: 210, y: 100, name: '3m', type: 'shallow' },
      ],
      route: [[50, 220], [100, 140], [180, 80], [230, 140], [180, 220]],
    },
    questions: [
      {
        id: 'q1',
        question: 'What should be the FIRST item covered in a route briefing?',
        options: [
          'Expected weather conditions',
          'Overview of the full course with all waypoints in sequence',
          'Sail selection recommendations',
          'Watch schedule assignments',
        ],
        correctAnswer: 1,
        explanation: 'Start with the big picture - the full route overview. This helps everyone understand the race\'s shape and length before diving into details. Subsequent items like weather and sail selection build on this foundation.',
      },
      {
        id: 'q2',
        question: 'The chart shows a Traffic Separation Scheme (TSS). What should the briefing emphasize about this hazard?',
        options: [
          'Speed through this area to minimize time in shipping lanes',
          'COLREGS rules, crossing procedures, and specific VHF monitoring',
          'Avoid it entirely by going around',
          'It\'s only a concern at night',
        ],
        correctAnswer: 1,
        explanation: 'Traffic Separation Schemes require specific knowledge of COLREGS Rule 10 (crossing requirements), VHF monitoring for ships, and AIS watch. Brief the crew on crossing at right angles, maintaining lookout, and communication protocols.',
      },
      {
        id: 'q3',
        question: 'The shallow area near WP2 shows "3m". For a yacht drawing 2.2m, when should you brief about this?',
        options: [
          'Don\'t mention it - 3m is plenty of depth',
          'Only mention it if the crew asks',
          'Brief it, noting tidal state requirement and safe passing distance',
          'Change the waypoint to avoid it entirely',
        ],
        correctAnswer: 2,
        explanation: '3m charted depth with 2.2m draft leaves only 0.8m margin before considering swell, waves, and tidal height. Brief the required tidal state to pass safely, minimum clearance distance, and contingency if conditions deteriorate.',
      },
    ],
  },
  {
    id: 'decision-points',
    title: 'Strategic Decision Points',
    description: 'Distance races require pre-planned decision points where strategy may change based on conditions.',
    chartElements: {
      waypoints: [
        { x: 50, y: 200, name: 'Start', type: 'start' },
        { x: 120, y: 100, name: 'Decision', type: 'turn' },
        { x: 230, y: 80, name: 'WP2', type: 'turn' },
        { x: 180, y: 200, name: 'Finish', type: 'finish' },
      ],
      hazards: [
        { x: 160, y: 140, name: 'Option A', type: 'zone' },
        { x: 80, y: 60, name: 'Option B', type: 'zone' },
      ],
      route: [[50, 200], [120, 100], [230, 80], [180, 200]],
    },
    questions: [
      {
        id: 'q1',
        question: 'What defines a "decision point" in a route briefing?',
        options: [
          'Any waypoint where you change course',
          'A pre-planned location where conditions will inform route choice',
          'Where you change watches',
          'Locations where you can retire from the race',
        ],
        correctAnswer: 1,
        explanation: 'Decision points are pre-planned locations where you\'ll assess conditions and choose between options. Briefing them in advance ensures the whole crew knows what factors to monitor and what choices are available.',
      },
      {
        id: 'q2',
        question: 'When briefing a decision point with two route options, what must you include?',
        options: [
          'Just the preferred route based on forecast',
          'Both options with specific criteria for choosing each',
          'Tell crew you\'ll decide when you get there',
          'Only the weather forecast',
        ],
        correctAnswer: 1,
        explanation: 'Brief both options clearly: what conditions favor each, who makes the final call, and how you\'ll communicate the decision. This prepares crew for either outcome and enables informed discussion.',
      },
      {
        id: 'q3',
        question: 'Who should make the decision at pre-planned decision points?',
        options: [
          'Always the skipper alone',
          'The navigator only',
          'Whoever is on watch at the time',
          'Pre-designated person with input from key roles (nav, tactician)',
        ],
        correctAnswer: 3,
        explanation: 'Designate who makes the call during the briefing, usually skipper or tactician with navigator input. This avoids confusion when time is limited and ensures the decision-maker has relevant information.',
      },
    ],
  },
  {
    id: 'crew-roles',
    title: 'Navigation Watch Assignments',
    description: 'Assign navigation responsibilities so crew knows their duties during each watch.',
    chartElements: {
      waypoints: [
        { x: 80, y: 200, name: 'Start', type: 'start' },
        { x: 140, y: 100, name: 'WP1', type: 'turn' },
        { x: 220, y: 160, name: 'Finish', type: 'finish' },
      ],
      hazards: [],
      route: [[80, 200], [140, 100], [220, 160]],
    },
    questions: [
      {
        id: 'q1',
        question: 'What navigation duties should be assigned to each watch?',
        options: [
          'Just the helm position - navigation is automatic',
          'Position logging, AIS monitoring, weather updates, course checks',
          'Only position logging every hour',
          'Navigation is the skipper\'s responsibility',
        ],
        correctAnswer: 1,
        explanation: 'Each watch needs clear nav duties: log positions at set intervals, monitor AIS and VHF, check weather updates, confirm course to next waypoint, and note any concerns for handover.',
      },
      {
        id: 'q2',
        question: 'When briefing watch handovers, what information MUST be communicated?',
        options: [
          'Just the current heading',
          'Current position, next waypoint, any hazards, weather changes, concerns',
          'Nothing if all is well',
          'Only problems encountered',
        ],
        correctAnswer: 1,
        explanation: 'Handovers must include: current position, distance/bearing to next waypoint, any hazards or traffic in the area, weather changes observed, and any concerns or items to monitor.',
      },
      {
        id: 'q3',
        question: 'Who should have authority to wake the skipper for navigation decisions?',
        options: [
          'Only in emergencies',
          'Anyone - whenever they\'re unsure about anything',
          'Watch captain has clear criteria for when to call (e.g., visibility, traffic, course change)',
          'Never - the off-watch needs rest',
        ],
        correctAnswer: 2,
        explanation: 'Brief specific "wake the skipper" criteria: significant weather change, unplanned traffic situations, approaching decision points, equipment issues, or any safety concerns. Clear criteria prevent both under-reporting and unnecessary interruptions.',
      },
    ],
  },
  {
    id: 'emergency-planning',
    title: 'Emergency Waypoints & Safe Harbors',
    description: 'Every route briefing must cover contingency plans and nearest safe harbors.',
    chartElements: {
      waypoints: [
        { x: 60, y: 200, name: 'Start', type: 'start' },
        { x: 140, y: 80, name: 'WP1', type: 'turn' },
        { x: 220, y: 180, name: 'Finish', type: 'finish' },
      ],
      hazards: [
        { x: 80, y: 100, name: 'Harbor A', type: 'zone' },
        { x: 200, y: 120, name: 'Harbor B', type: 'zone' },
      ],
      route: [[60, 200], [140, 80], [220, 180]],
    },
    questions: [
      {
        id: 'q1',
        question: 'How should emergency waypoints be presented in the briefing?',
        options: [
          'Just mention they exist in the chartplotter',
          'List for each leg: nearest harbor, distance/bearing, entry considerations',
          'Only brief them if someone asks',
          'Just the single nearest harbor to the start',
        ],
        correctAnswer: 1,
        explanation: 'For each leg, brief the nearest safe harbor: name, approximate distance/bearing from leg midpoint, any entry hazards (bar, rocks), minimum conditions for entry, and VHF channel for port.',
      },
      {
        id: 'q2',
        question: 'What must be briefed about each potential shelter harbor?',
        options: [
          'Just the name and location',
          'Entry conditions, hazards, VHF channel, fuel/facilities available',
          'Only depth at the entrance',
          'Whether they have good restaurants',
        ],
        correctAnswer: 1,
        explanation: 'Brief each harbor\'s entry requirements: draft/tide constraints, any bar crossings, marks or lights, VHF channel for harbor authority, and available facilities. This information is critical under stress.',
      },
      {
        id: 'q3',
        question: 'When should the crew practice the emergency waypoint procedure?',
        options: [
          'Only when an actual emergency occurs',
          'During the briefing - show how to access them in the nav system',
          'After the race',
          'It\'s obvious, no practice needed',
        ],
        correctAnswer: 1,
        explanation: 'During the briefing, demonstrate accessing emergency waypoints in your navigation system. Ensure at least two crew members can do this independently. Under stress, you need immediate access without confusion.',
      },
    ],
  },
];

export function RouteBriefingInteractive({ onComplete }: RouteBriefingInteractiveProps) {
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

  const getWaypointColor = (type: string) => {
    switch (type) {
      case 'start': return '#10B981';
      case 'finish': return '#EF4444';
      case 'turn': return '#3B82F6';
      case 'hazard': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const getHazardColor = (type: string) => {
    switch (type) {
      case 'shipping': return '#EF4444';
      case 'shallow': return '#F59E0B';
      case 'rock': return '#6B7280';
      case 'zone': return '#8B5CF6';
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
          <Text style={styles.completeTitle}>Route Briefing Complete!</Text>
          <Text style={styles.completeScore}>
            You scored {score}/{totalQuestions} ({percentage}%)
          </Text>
          <Text style={styles.completeMessage}>
            {percentage >= 80
              ? 'Excellent! You understand how to brief a crew effectively for distance racing.'
              : percentage >= 60
              ? 'Good progress! Focus on including all safety-critical information.'
              : 'Keep studying! Thorough briefings prevent confusion and ensure safety.'}
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

      {/* Chart Diagram */}
      <View style={styles.diagramCard}>
        <Text style={styles.diagramTitle}>Route Chart</Text>
        <View style={styles.diagramContainer}>
          <Svg width="280" height="280" viewBox="0 0 280 280">
            {/* Background - water */}
            <Rect x="0" y="0" width="280" height="280" fill="#E0F2FE" />

            {/* Compass rose */}
            <SvgText x="140" y="20" textAnchor="middle" fontSize="10" fill="#64748B">N</SvgText>
            <Line x1="140" y1="25" x2="140" y2="35" stroke="#94A3B8" strokeWidth="1" />

            {/* Route line */}
            <Path
              d={`M ${scenario.chartElements.route.map(p => p.join(',')).join(' L ')}`}
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />

            {/* Hazard zones */}
            {scenario.chartElements.hazards.map((hazard, i) => (
              <G key={`hazard-${i}`}>
                <Circle
                  cx={hazard.x}
                  cy={hazard.y}
                  r="20"
                  fill={getHazardColor(hazard.type)}
                  opacity="0.2"
                  stroke={getHazardColor(hazard.type)}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={hazard.x}
                  y={hazard.y + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={getHazardColor(hazard.type)}
                >
                  {hazard.name}
                </SvgText>
              </G>
            ))}

            {/* Waypoints */}
            {scenario.chartElements.waypoints.map((wp, i) => (
              <G key={`wp-${i}`}>
                <Circle
                  cx={wp.x}
                  cy={wp.y}
                  r="8"
                  fill={getWaypointColor(wp.type)}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <SvgText
                  x={wp.x}
                  y={wp.y - 14}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#1E293B"
                >
                  {wp.name}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Start</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Waypoint</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Finish/Hazard</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>Zone/Option</Text>
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
    gap: 12,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
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

export default RouteBriefingInteractive;
