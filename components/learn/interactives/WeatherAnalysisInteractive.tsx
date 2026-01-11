/**
 * Weather Analysis Interactive
 * Learn to interpret weather forecasts and identify racing windows
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

interface WeatherAnalysisInteractiveProps {
  onComplete?: () => void;
}

interface ForecastData {
  hour: number;
  windSpeed: number;
  windDirection: number;
  gustFactor: number;
  pressure: number;
  pressureTrend: 'rising' | 'falling' | 'steady';
  cloudCover: 'clear' | 'scattered' | 'overcast';
  waveHeight: number;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  forecast: ForecastData[];
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'building-breeze',
    title: 'Building Sea Breeze',
    description: 'A typical summer day with thermal development. Analyze when conditions will be optimal.',
    forecast: [
      { hour: 9, windSpeed: 4, windDirection: 180, gustFactor: 1.2, pressure: 1015, pressureTrend: 'steady', cloudCover: 'clear', waveHeight: 0.3 },
      { hour: 10, windSpeed: 6, windDirection: 190, gustFactor: 1.3, pressure: 1015, pressureTrend: 'steady', cloudCover: 'scattered', waveHeight: 0.4 },
      { hour: 11, windSpeed: 8, windDirection: 200, gustFactor: 1.4, pressure: 1014, pressureTrend: 'falling', cloudCover: 'scattered', waveHeight: 0.5 },
      { hour: 12, windSpeed: 12, windDirection: 210, gustFactor: 1.3, pressure: 1014, pressureTrend: 'falling', cloudCover: 'scattered', waveHeight: 0.7 },
      { hour: 13, windSpeed: 14, windDirection: 220, gustFactor: 1.2, pressure: 1013, pressureTrend: 'falling', cloudCover: 'scattered', waveHeight: 0.8 },
      { hour: 14, windSpeed: 15, windDirection: 220, gustFactor: 1.2, pressure: 1013, pressureTrend: 'steady', cloudCover: 'clear', waveHeight: 0.9 },
      { hour: 15, windSpeed: 14, windDirection: 225, gustFactor: 1.2, pressure: 1013, pressureTrend: 'steady', cloudCover: 'clear', waveHeight: 0.8 },
      { hour: 16, windSpeed: 11, windDirection: 230, gustFactor: 1.3, pressure: 1014, pressureTrend: 'rising', cloudCover: 'clear', waveHeight: 0.6 },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What type of wind pattern is shown in this forecast?',
        options: [
          'Gradient wind with frontal passage',
          'Sea breeze development',
          'Land breeze transition',
          'Squall line approach',
        ],
        correctAnswer: 1,
        explanation: 'The wind building from 4 to 15 knots with a backing direction (180° to 220°) during midday is classic sea breeze development. Clear skies in the morning allow land heating.',
      },
      {
        id: 'q2',
        question: 'When would be the optimal time to start racing?',
        options: [
          '9:00 - Light but steady',
          '11:00 - Building nicely',
          '13:00 - Peak and steady',
          '16:00 - Dying breeze',
        ],
        correctAnswer: 2,
        explanation: 'Starting at 13:00 gives you racing in 14-15 knots with relatively low gust factor (1.2x). The sea breeze is established and the steadiest conditions of the day.',
      },
      {
        id: 'q3',
        question: 'What does the decreasing gust factor from 11:00-14:00 indicate?',
        options: [
          'Wind is becoming more unstable',
          'Sea breeze is becoming established and steady',
          'A squall is approaching',
          'Wind will die completely soon',
        ],
        correctAnswer: 1,
        explanation: 'Decreasing gust factor means the wind is becoming more consistent. As the sea breeze establishes, thermal mixing stabilizes and the breeze becomes more predictable.',
      },
    ],
  },
  {
    id: 'frontal-passage',
    title: 'Cold Front Approach',
    description: 'A cold front is approaching. Identify the warning signs and racing implications.',
    forecast: [
      { hour: 10, windSpeed: 8, windDirection: 210, gustFactor: 1.2, pressure: 1012, pressureTrend: 'steady', cloudCover: 'scattered', waveHeight: 0.5 },
      { hour: 11, windSpeed: 10, windDirection: 200, gustFactor: 1.3, pressure: 1010, pressureTrend: 'falling', cloudCover: 'scattered', waveHeight: 0.6 },
      { hour: 12, windSpeed: 14, windDirection: 190, gustFactor: 1.5, pressure: 1008, pressureTrend: 'falling', cloudCover: 'overcast', waveHeight: 0.8 },
      { hour: 13, windSpeed: 20, windDirection: 240, gustFactor: 1.8, pressure: 1006, pressureTrend: 'falling', cloudCover: 'overcast', waveHeight: 1.2 },
      { hour: 14, windSpeed: 18, windDirection: 280, gustFactor: 1.6, pressure: 1008, pressureTrend: 'rising', cloudCover: 'scattered', waveHeight: 1.0 },
      { hour: 15, windSpeed: 15, windDirection: 290, gustFactor: 1.4, pressure: 1010, pressureTrend: 'rising', cloudCover: 'scattered', waveHeight: 0.9 },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the key warning sign of the frontal passage?',
        options: [
          'Increasing cloud cover only',
          'Rapidly falling pressure with wind backing',
          'Steady wind speed',
          'Rising wave height only',
        ],
        correctAnswer: 1,
        explanation: 'Rapidly falling pressure (1012 to 1006 mb) combined with wind backing (210° to 190°) before the veer to 280° are classic pre-frontal warning signs.',
      },
      {
        id: 'q2',
        question: 'When does the front pass through?',
        options: [
          'Between 10:00-11:00',
          'Between 11:00-12:00',
          'Between 12:00-13:00',
          'Between 14:00-15:00',
        ],
        correctAnswer: 2,
        explanation: 'The front passes between 12:00-13:00 as indicated by the dramatic 50° wind shift (190° to 240°), maximum wind speed, highest gust factor, and pressure bottoming out.',
      },
      {
        id: 'q3',
        question: 'What strategy should you employ if caught racing during frontal passage?',
        options: [
          'Stay in the middle of the course',
          'Position for the expected wind shift',
          'Reduce sail area and wait it out',
          'All of the above depending on severity',
        ],
        correctAnswer: 3,
        explanation: 'Your strategy depends on severity. In moderate conditions, position for the shift. In severe conditions, prioritize safety and reduce sail. Always stay aware and flexible.',
      },
    ],
  },
];

export function WeatherAnalysisInteractive({ onComplete }: WeatherAnalysisInteractiveProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const scenario = SCENARIOS[currentScenario];
  const question = scenario.questions[currentQuestion];

  const getDirectionArrow = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getPressureTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'rising': return '↑';
      case 'falling': return '↓';
      default: return '→';
    }
  };

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

  if (isComplete) {
    const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Weather Analysis Complete!</Text>
          <Text style={styles.completeScore}>
            You scored {score}/{totalQuestions} ({percentage}%)
          </Text>
          <Text style={styles.completeMessage}>
            {percentage >= 80
              ? 'Excellent! You have a strong understanding of weather analysis for racing.'
              : percentage >= 60
              ? 'Good work! Review the explanations to improve your weather reading skills.'
              : 'Keep practicing! Understanding weather patterns is crucial for race preparation.'}
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

      {/* Forecast Table */}
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitle}>Hourly Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastCell, styles.headerCell]}>Hour</Text>
              {scenario.forecast.map((f) => (
                <Text key={f.hour} style={[styles.forecastCell, styles.headerCell]}>
                  {f.hour}:00
                </Text>
              ))}
            </View>
            {/* Wind Speed */}
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastCell, styles.labelCell]}>Wind (kts)</Text>
              {scenario.forecast.map((f) => (
                <Text key={f.hour} style={styles.forecastCell}>{f.windSpeed}</Text>
              ))}
            </View>
            {/* Wind Direction */}
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastCell, styles.labelCell]}>Dir (°)</Text>
              {scenario.forecast.map((f) => (
                <Text key={f.hour} style={styles.forecastCell}>
                  {f.windDirection}° {getDirectionArrow(f.windDirection)}
                </Text>
              ))}
            </View>
            {/* Gust Factor */}
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastCell, styles.labelCell]}>Gust</Text>
              {scenario.forecast.map((f) => (
                <Text key={f.hour} style={[
                  styles.forecastCell,
                  f.gustFactor >= 1.5 && styles.warningCell
                ]}>
                  {f.gustFactor}x
                </Text>
              ))}
            </View>
            {/* Pressure */}
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastCell, styles.labelCell]}>Pressure</Text>
              {scenario.forecast.map((f) => (
                <Text key={f.hour} style={styles.forecastCell}>
                  {f.pressure} {getPressureTrendIcon(f.pressureTrend)}
                </Text>
              ))}
            </View>
            {/* Waves */}
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastCell, styles.labelCell]}>Waves (m)</Text>
              {scenario.forecast.map((f) => (
                <Text key={f.hour} style={styles.forecastCell}>{f.waveHeight}</Text>
              ))}
            </View>
          </View>
        </ScrollView>
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
  forecastCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }
      : { elevation: 2 }),
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  forecastCell: {
    width: 70,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    color: '#1E293B',
  },
  labelCell: {
    fontWeight: '500',
    backgroundColor: '#F8FAFC',
    textAlign: 'left',
    width: 80,
  },
  warningCell: {
    color: '#DC2626',
    fontWeight: '600',
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
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  explanationText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
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

export default WeatherAnalysisInteractive;
