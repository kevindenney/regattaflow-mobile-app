/**
 * Sail Selection Interactive
 * Match sail inventory to forecasted conditions
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SailSelectionInteractiveProps {
  onComplete?: () => void;
}

const SCENARIOS = [
  {
    id: 'light-air',
    title: 'Light Air Day',
    conditions: { wind: '4-8 knots', waves: 'Flat', forecast: 'Building to 10 knots by afternoon' },
    questions: [
      {
        question: 'What jib should you start with?',
        options: ['#1 Light genoa', '#2 Medium genoa', '#3 Heavy jib', 'Blade jib'],
        correctAnswer: 0,
        explanation: 'In 4-8 knots, start with your lightest, fullest headsail (#1). You need maximum sail area and power in light conditions. You can change down if the wind builds as forecast.',
      },
      {
        question: 'For mainsail setup, what\'s the priority?',
        options: ['Maximum prebend for flat shape', 'Full, powerful shape with minimal tension', 'Heavy vang tension', 'Maximum backstay'],
        correctAnswer: 1,
        explanation: 'Light air needs power. Keep the main full by easing outhaul, no cunningham, light vang. The goal is a smooth, full entry to keep airflow attached in marginal wind.',
      },
    ],
  },
  {
    id: 'medium-breeze',
    title: 'Medium Breeze',
    conditions: { wind: '12-16 knots', waves: '0.5-1m chop', forecast: 'Steady throughout' },
    questions: [
      {
        question: 'What\'s the ideal sail configuration?',
        options: ['#1 genoa, full main', '#2 genoa, medium main', 'Working jib, flattened main', 'Storm jib, reefed main'],
        correctAnswer: 1,
        explanation: 'Medium breeze (12-16 kts) is the sweet spot. A #2 genoa provides good power without overpowering, and a main with moderate flatness gives control. This is often the fastest setup.',
      },
      {
        question: 'With 1m waves, should you change your normal setup?',
        options: ['No changes needed', 'Go one size smaller to depower', 'Keep power but adjust leads aft', 'Reef the main'],
        correctAnswer: 2,
        explanation: 'Waves require power for acceleration. Keep your sail area but adjust jib leads slightly aft to open the leech. This maintains power while allowing the boat to punch through chop.',
      },
    ],
  },
  {
    id: 'heavy-air',
    title: 'Heavy Air Warning',
    conditions: { wind: '20-25 knots', waves: '1.5-2m', forecast: 'Gusts to 30 knots' },
    questions: [
      {
        question: 'What headsail choice is appropriate?',
        options: ['#1 genoa - need power in waves', '#2 genoa with caution', '#3 or heavy weather jib', 'No headsail, main only'],
        correctAnswer: 2,
        explanation: 'In 20-25 knots with gusts to 30, you need a small, flat headsail. #3 or a heavy weather jib keeps the boat manageable. Too much sail = loss of control and potential damage.',
      },
      {
        question: 'When should you consider reefing the main?',
        options: ['Only above 30 knots', 'When you\'re overpowered and can\'t keep the boat flat', 'Never in racing', 'Only downwind'],
        correctAnswer: 1,
        explanation: 'Reef when you\'re overpowered and hiking/depowering isn\'t enough to keep the boat under control. A well-set reefed main is faster than a flogging, out-of-control full main.',
      },
      {
        question: 'What\'s the risk of being over-canvassed?',
        options: ['Just slightly slower', 'Loss of control, potential broach or capsize', 'Only affects comfort', 'More speed but harder to handle'],
        correctAnswer: 1,
        explanation: 'Being over-canvassed in heavy air risks broaching, capsizing, or equipment failure. The boat becomes uncontrollable. It\'s always faster to be properly powered than over-powered.',
      },
    ],
  },
];

export function SailSelectionInteractive({ onComplete }: SailSelectionInteractiveProps) {
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
    if (index === question.correctAnswer) setScore(s => s + 1);
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
    const total = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Sail Selection Complete!</Text>
          <Text style={styles.completeScore}>Score: {score}/{total} ({Math.round((score / total) * 100)}%)</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <View style={styles.conditionsBox}>
          <Text style={styles.conditionItem}>Wind: {scenario.conditions.wind}</Text>
          <Text style={styles.conditionItem}>Waves: {scenario.conditions.waves}</Text>
          <Text style={styles.conditionItem}>Forecast: {scenario.conditions.forecast}</Text>
        </View>
        <Text style={styles.progressText}>
          Scenario {currentScenario + 1}/{SCENARIOS.length} • Question {currentQuestion + 1}/{scenario.questions.length}
        </Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && (index === question.correctAnswer ? styles.correctOption : styles.incorrectOption),
                selectedAnswer !== null && index === question.correctAnswer && styles.correctOption,
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {showExplanation && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16 },
  scenarioHeader: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 12, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  scenarioTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  conditionsBox: { backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, gap: 4 },
  conditionItem: { fontSize: 13, color: '#0369A1' },
  progressText: { fontSize: 12, color: '#94A3B8' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 16, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  explanationBox: { backgroundColor: '#F0FDFA', padding: 14, borderRadius: 10 },
  explanationText: { fontSize: 14, color: '#115E59', lineHeight: 20 },
  nextButton: { backgroundColor: '#14B8A6', padding: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
});

export default SailSelectionInteractive;
