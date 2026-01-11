/**
 * SI Interpreter Interactive
 * Parse Sailing Instructions for race-critical information
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SIInterpreterInteractiveProps {
  onComplete?: () => void;
}

const SCENARIOS = [
  {
    id: 'penalty-systems',
    title: 'Understanding Penalty Systems',
    siExcerpt: '"Penalty System: RRS 44.1 is changed so that the Two-Turns Penalty is replaced by the One-Turn Penalty."',
    questions: [
      {
        question: 'You foul a boat during the race. How many turns must you do?',
        options: ['Two turns as normal', 'One turn only', 'No turns - just accept scoring penalty', 'Retire from the race'],
        correctAnswer: 1,
        explanation: 'The SI specifically states One-Turn Penalty replaces Two-Turns. This is a common modification that speeds up penalty execution. Always check the SI for penalty system changes.',
      },
    ],
  },
  {
    id: 'time-limits',
    title: 'Time Limits',
    siExcerpt: '"Time Limit: The time limit for finishing is 60 minutes after the first boat finishes. Boats failing to finish within this time will be scored DNF."',
    questions: [
      {
        question: 'First boat finishes at 14:35. You finish at 15:30. What\'s your result?',
        options: ['You\'re scored as finishing', 'You\'re scored DNF', 'You get average points', 'Time limits don\'t affect results'],
        correctAnswer: 0,
        explanation: '15:30 is 55 minutes after 14:35, which is within the 60-minute window. You\'re scored as finished. The time limit is 60 minutes AFTER the first boat, not from the start.',
      },
    ],
  },
  {
    id: 'course-designation',
    title: 'Course Designation',
    siExcerpt: '"Courses: The course to be sailed will be displayed on the committee boat before the warning signal. Course 3 is: Start - 1p - 2 - Finish."',
    questions: [
      {
        question: 'The board shows "3". After the start, which direction do you round mark 1?',
        options: ['Starboard (leave to starboard)', 'Port (leave to port)', 'Either direction', 'Check the SI again at the mark'],
        correctAnswer: 1,
        explanation: '"1p" means round mark 1 leaving it to PORT. Letters after mark numbers indicate rounding direction: "p" = port, "s" = starboard. No letter usually means leave to port.',
      },
    ],
  },
  {
    id: 'radio-communications',
    title: 'Radio Communications',
    siExcerpt: '"Radio Communication: The race committee may broadcast information on VHF Channel 72. Failure to receive a broadcast shall not be grounds for redress."',
    questions: [
      {
        question: 'You miss a radio broadcast about a course change. Can you request redress?',
        options: ['Yes - you weren\'t informed', 'No - the SI specifically excludes this', 'Only if your radio broke', 'Yes - RC must ensure everyone hears'],
        correctAnswer: 1,
        explanation: 'The SI explicitly states that missing a broadcast is not grounds for redress. This is common - radio is convenience, not required. You\'re responsible for watching for visual signals too.',
      },
    ],
  },
  {
    id: 'starting-procedures',
    title: 'Starting Procedures',
    siExcerpt: '"Starting: Races will be started using RRS 26 with the warning signal made 5 minutes before the start. The starting line is between a staff displaying an orange flag on the signal vessel and the course side of the port-end starting mark."',
    questions: [
      {
        question: 'The warning signal is at 13:00. When is the start?',
        options: ['13:04', '13:05', '13:06', '13:01'],
        correctAnswer: 1,
        explanation: 'RRS 26 is the standard 5-minute sequence. Warning at 13:00 means start at 13:05. The SI confirms this with "warning signal made 5 minutes before the start."',
      },
      {
        question: 'Which end of the start line is the signal vessel?',
        options: ['Port end', 'Starboard end', 'Middle of the line', 'Depends on wind'],
        correctAnswer: 1,
        explanation: 'The SI says the line is "between... signal vessel and port-end starting mark." The signal vessel is therefore at the starboard end (the other end from the port-end mark).',
      },
    ],
  },
  {
    id: 'restricted-areas',
    title: 'Restricted Areas',
    siExcerpt: '"Restricted Area: The area within 50 meters of the commercial ferry dock (marked on the chart) is a restricted area. A boat entering this area may be scored DNF without a hearing."',
    questions: [
      {
        question: 'You sail through the restricted area to gain tactically. What happens?',
        options: ['Nothing if no one sees', 'Warning for first offense', 'May be scored DNF without protest', 'Just a small time penalty'],
        correctAnswer: 2,
        explanation: 'The SI allows the RC to score you DNF without a hearing if you enter the restricted area. This is serious - there\'s no protest process, just DNF. Stay out of restricted areas.',
      },
    ],
  },
];

export function SIInterpreterInteractive({ onComplete }: SIInterpreterInteractiveProps) {
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
          <Ionicons name="reader" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>SI Interpretation Complete!</Text>
          <Text style={styles.completeScore}>Score: {score}/{total} ({Math.round((score / total) * 100)}%)</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <View style={styles.excerptBox}>
          <Text style={styles.excerptLabel}>From the SI:</Text>
          <Text style={styles.excerptText}>{scenario.siExcerpt}</Text>
        </View>
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
  scenarioHeader: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 12, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  scenarioTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  excerptBox: { backgroundColor: '#FEF9C3', padding: 12, borderRadius: 8, gap: 4, borderLeftWidth: 4, borderLeftColor: '#CA8A04' },
  excerptLabel: { fontSize: 11, fontWeight: '600', color: '#854D0E', textTransform: 'uppercase' },
  excerptText: { fontSize: 13, color: '#713F12', fontStyle: 'italic', lineHeight: 20 },
  progressText: { fontSize: 12, color: '#94A3B8' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 16, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  explanationBox: { backgroundColor: '#FEF3C7', padding: 14, borderRadius: 10 },
  explanationText: { fontSize: 14, color: '#92400E', lineHeight: 20 },
  nextButton: { backgroundColor: '#CA8A04', padding: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
});

export default SIInterpreterInteractive;
