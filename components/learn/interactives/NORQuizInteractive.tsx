/**
 * NOR Quiz Interactive
 * Master the critical elements of the Notice of Race
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NORQuizInteractiveProps {
  onComplete?: () => void;
}

const QUESTIONS = [
  {
    question: 'What is the primary purpose of the Notice of Race (NOR)?',
    options: [
      'Provide racing results',
      'Advertise the event and set eligibility requirements',
      'List mark positions only',
      'Display weather forecasts',
    ],
    correctAnswer: 1,
    explanation: 'The NOR is the advance document that advertises the event and sets requirements for eligibility, entry, and participation. It\'s published before entries open so competitors can decide whether to enter.',
  },
  {
    question: 'An entry deadline is listed in the NOR. You miss it by one day. What happens?',
    options: [
      'You\'re automatically entered anyway',
      'You may be denied entry - late entries at discretion of organizers',
      'The deadline doesn\'t matter for racing',
      'You just pay a late fee and race normally',
    ],
    correctAnswer: 1,
    explanation: 'Entry deadlines in the NOR are binding. Missing the deadline may mean you cannot race. Some events allow late entries at their discretion (often with a fee), but they\'re not obligated to accept you.',
  },
  {
    question: 'The NOR says "boats must have valid class measurement certificate." You don\'t have one. What should you do?',
    options: [
      'Race anyway - they probably won\'t check',
      'Get measured and certificated before the event',
      'Bring your boat for measurement at registration',
      'This requirement is just a suggestion',
    ],
    correctAnswer: 1,
    explanation: 'Measurement requirements in the NOR are mandatory. Racing without valid certification risks disqualification from all races if discovered. Get your boat measured and certified well before the event.',
  },
  {
    question: 'The NOR lists specific safety equipment requirements. What if your boat has slightly different but "equivalent" gear?',
    options: [
      'Equivalent is always acceptable',
      'Contact the organizers before the event to confirm',
      'Just use what you have - it\'ll be fine',
      'Safety requirements are optional',
    ],
    correctAnswer: 1,
    explanation: 'NOR safety requirements are specific for a reason. If you have different equipment you believe is equivalent, contact the organizers BEFORE the event to get written approval. Don\'t assume equivalence.',
  },
  {
    question: 'The NOR says "RRS Appendix P [Special Procedures] will apply." What does this mean?',
    options: [
      'Protests are not allowed',
      'Yellow/red flag penalty system is in use',
      'Racing rules don\'t apply',
      'Only affects the last race',
    ],
    correctAnswer: 1,
    explanation: 'Appendix P means the umpire-based penalty system (yellow/red flags) is in use instead of the normal protest system. Penalties can be assessed on the water without a hearing.',
  },
  {
    question: 'When should you read the NOR?',
    options: [
      'The night before racing',
      'Before deciding to enter the event',
      'After you finish racing',
      'Only if there\'s a protest',
    ],
    correctAnswer: 1,
    explanation: 'Read the NOR before entering. It tells you requirements you must meet (measurement, safety, qualifications), costs, schedule, and special rules. Entering without reading the NOR risks surprises.',
  },
];

export function NORQuizInteractive({ onComplete }: NORQuizInteractiveProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const question = QUESTIONS[currentQuestion];

  const handleAnswerSelect = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === question.correctAnswer) setScore(s => s + 1);
  }, [selectedAnswer, question.correctAnswer]);

  const handleNext = useCallback(() => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(q => q + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentQuestion, onComplete]);

  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="document-text" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>NOR Quiz Complete!</Text>
          <Text style={styles.completeScore}>Score: {score}/{QUESTIONS.length} ({Math.round((score / QUESTIONS.length) * 100)}%)</Text>
          <Text style={styles.completeMessage}>
            Always read the NOR carefully before entering any regatta!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={24} color="#7C3AED" />
        <Text style={styles.headerTitle}>Notice of Race Quiz</Text>
        <Text style={styles.progressText}>Question {currentQuestion + 1} of {QUESTIONS.length}</Text>
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
            <Text style={styles.nextButtonText}>{currentQuestion < QUESTIONS.length - 1 ? 'Next Question' : 'Complete'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16 },
  header: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', flex: 1 },
  progressText: { fontSize: 12, color: '#94A3B8', width: '100%' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 16, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B', lineHeight: 24 },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  explanationBox: { backgroundColor: '#F5F3FF', padding: 14, borderRadius: 10 },
  explanationText: { fontSize: 14, color: '#5B21B6', lineHeight: 20 },
  nextButton: { backgroundColor: '#7C3AED', padding: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
  completeMessage: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});

export default NORQuizInteractive;
