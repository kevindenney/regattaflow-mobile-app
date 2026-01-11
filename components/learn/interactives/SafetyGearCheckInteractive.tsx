/**
 * Safety Gear Check Interactive
 * Scenario-based safety equipment decisions
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SafetyGearCheckInteractiveProps {
  onComplete?: () => void;
}

const SCENARIOS = [
  {
    id: 'pfd-check',
    title: 'PFD Requirements',
    questions: [
      {
        question: 'What\'s the most important check for an inflatable PFD?',
        options: ['Color is bright', 'CO2 cartridge is charged and indicator shows green', 'Whistle is attached', 'Name is written on it'],
        correctAnswer: 1,
        explanation: 'The CO2 cartridge must be charged and the indicator (usually a green tab) must show it\'s armed. An expired or discharged cartridge means the PFD won\'t inflate automatically.',
      },
      {
        question: 'When must PFDs be worn vs. just accessible during racing?',
        options: ['Always worn no matter what', 'Check the SI - rules vary by event', 'Only in heavy weather', 'Only for children'],
        correctAnswer: 1,
        explanation: 'PFD requirements vary by event. Some require wearing at all times, others only when specified signals are displayed. Always check the Sailing Instructions for the specific requirements.',
      },
    ],
  },
  {
    id: 'emergency-equipment',
    title: 'Emergency Equipment',
    questions: [
      {
        question: 'Your flares expire in 2 weeks. Are they acceptable for today\'s race?',
        options: ['Yes, they\'re still within date', 'No, replace them immediately', 'Only if you have backups', 'Check with race committee'],
        correctAnswer: 0,
        explanation: 'Flares are acceptable until their expiration date. However, it\'s good practice to replace them before they expire so you\'re never caught with expired equipment at the start of a season.',
      },
      {
        question: 'What safety items should be immediately accessible, not stored below?',
        options: ['First aid kit only', 'Throwable flotation device and knife', 'Everything should be stored securely below', 'Fire extinguisher only'],
        correctAnswer: 1,
        explanation: 'Throwable flotation (life ring, cushion) must be instantly accessible for MOB situations. A knife should also be within reach to cut lines in emergencies. Seconds matter.',
      },
      {
        question: 'Your VHF radio\'s battery is at 50%. What should you do?',
        options: ['It\'s fine for a day race', 'Charge or replace it - you need full charge', 'Only matters for offshore races', 'Switch to channel 16 to save battery'],
        correctAnswer: 1,
        explanation: 'Always start with a fully charged VHF. In an emergency, you may need to transmit repeatedly. 50% battery might not last through a prolonged emergency situation.',
      },
    ],
  },
  {
    id: 'conditions-safety',
    title: 'Conditions-Based Safety',
    questions: [
      {
        question: 'Forecast shows 25 knots building to 35. What additional safety preparation?',
        options: ['Nothing extra needed', 'Brief crew on MOB procedure, check all jack lines, consider storm sails', 'Cancel racing', 'Just sail conservatively'],
        correctAnswer: 1,
        explanation: 'Heavy weather requires extra preparation: brief all crew on MOB and emergency procedures, verify jack lines and tethers, check that storm sails are accessible, and ensure everyone understands the plan if conditions worsen.',
      },
      {
        question: 'Crew member doesn\'t have their own PFD. What do you do?',
        options: ['They can share with another crew member', 'Use a spare from the boat\'s safety kit', 'They can\'t race - everyone needs their own PFD', 'Only matters in heavy weather'],
        correctAnswer: 2,
        explanation: 'Every crew member must have their own PFD that fits them properly. Sharing or borrowing isn\'t acceptable - in an MOB situation, everyone needs protection simultaneously.',
      },
    ],
  },
];

export function SafetyGearCheckInteractive({ onComplete }: SafetyGearCheckInteractiveProps) {
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
          <Ionicons name="shield-checkmark" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Safety Check Complete!</Text>
          <Text style={styles.completeScore}>Score: {score}/{total} ({Math.round((score / total) * 100)}%)</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scenarioHeader}>
        <Ionicons name="shield" size={24} color="#DC2626" />
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.progressText}>
          Topic {currentScenario + 1}/{SCENARIOS.length} • Question {currentQuestion + 1}/{scenario.questions.length}
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
  scenarioHeader: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  scenarioTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', flex: 1 },
  progressText: { fontSize: 12, color: '#94A3B8', width: '100%' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 16, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  explanationBox: { backgroundColor: '#FEF2F2', padding: 14, borderRadius: 10 },
  explanationText: { fontSize: 14, color: '#991B1B', lineHeight: 20 },
  nextButton: { backgroundColor: '#DC2626', padding: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
});

export default SafetyGearCheckInteractive;
