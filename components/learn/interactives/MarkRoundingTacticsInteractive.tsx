/**
 * Mark Rounding Tactics Interactive
 * Master inside/outside scenarios and approach strategies
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MarkRoundingTacticsInteractiveProps {
  onComplete?: () => void;
}

const SCENARIOS = [
  {
    id: 'windward-mark',
    title: 'Windward Mark Approach',
    questions: [
      {
        question: 'What is the "zone" at marks?',
        options: ['1 boat length', '2 boat lengths', '3 boat lengths', '4 boat lengths'],
        correctAnswer: 2,
        explanation: 'The zone is 3 boat lengths from the mark. Overlaps established before entering the zone determine who gets mark-room.',
      },
      {
        question: 'You\'re approaching on port tack, a starboard tacker is coming. What are your options?',
        options: ['Duck behind them', 'Tack to starboard below them', 'Lee-bow them if you can cross', 'All of the above - depends on situation'],
        correctAnswer: 3,
        explanation: 'Your options depend on your position. You might duck, tack to leeward (if you\'ll be clear ahead), or lee-bow if you can just cross. Choose based on distance to mark and boat positions.',
      },
      {
        question: 'What\'s the "wide-and-tight" rounding technique?',
        options: ['Round wide throughout', 'Enter wide, exit tight to the mark', 'Enter tight, exit wide', 'Depends on current'],
        correctAnswer: 1,
        explanation: 'Wide-and-tight means approaching slightly wide of the mark, then rounding tight against it. This maintains speed through the turn and puts you in position to accelerate out of the mark.',
      },
    ],
  },
  {
    id: 'leeward-mark',
    title: 'Leeward Mark Rounding',
    questions: [
      {
        question: 'Why is an inside overlap so valuable at the leeward mark?',
        options: ['You can sail faster', 'You get mark-room and control the rounding', 'The rules don\'t apply inside', 'You can push boats out'],
        correctAnswer: 1,
        explanation: 'Inside overlap entitles you to mark-room. You control your rounding and can position for the windward leg. The outside boat must give you room to round and sail proper course.',
      },
      {
        question: 'You\'re approaching 4 lengths from the mark with a boat to leeward. Can you establish overlap?',
        options: ['Yes, zone hasn\'t started', 'No, you\'re too close', 'Only on port tack', 'Only in light air'],
        correctAnswer: 0,
        explanation: 'The zone is 3 boat lengths. At 4 lengths out, you\'re still outside the zone and can establish an inside overlap. Do it before entering the 3-length zone.',
      },
      {
        question: 'What\'s the best exit strategy from the leeward mark?',
        options: ['Head straight upwind immediately', 'Build speed before pointing high', 'Tack as soon as possible', 'Follow the boat ahead exactly'],
        correctAnswer: 1,
        explanation: 'After rounding, focus on building speed before pointing high. A fast boat with good flow has more options. Pinching immediately often leads to slowing down and getting rolled.',
      },
    ],
  },
  {
    id: 'gybe-mark',
    title: 'Gybe Mark Tactics',
    questions: [
      {
        question: 'Approaching a gybe mark from behind another boat, what\'s your goal?',
        options: ['Stay directly behind them', 'Establish inside overlap before zone', 'Go wide outside', 'Slow down and wait'],
        correctAnswer: 1,
        explanation: 'Your goal is to get inside overlap before the zone. The inside boat at a gybe mark gets room and can control the exit angle to the next leg.',
      },
      {
        question: 'What\'s the risk of being on the outside at a gybe mark?',
        options: ['Nothing - outside is better', 'You might have to sail extra distance', 'You could be squeezed wide, losing multiple lengths', 'Rules don\'t apply at gybe marks'],
        correctAnswer: 2,
        explanation: 'The outside boat at a gybe mark can be squeezed wide. Multiple boats stacking up inside forces you to sail a much longer arc around the mark, potentially losing many boat lengths.',
      },
      {
        question: 'When is being outside at the gybe mark acceptable?',
        options: ['Never - always fight for inside', 'When you can carry more speed and roll over boats', 'When current favors the outside', 'When you want to go to different side next leg'],
        correctAnswer: 3,
        explanation: 'If you want to go to the other side on the next leg, being outside positions you to peel off. Sometimes tactical considerations trump mark-rounding efficiency.',
      },
    ],
  },
];

export function MarkRoundingTacticsInteractive({ onComplete }: MarkRoundingTacticsInteractiveProps) {
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
          <Text style={styles.completeTitle}>Mark Rounding Complete!</Text>
          <Text style={styles.completeScore}>Score: {score}/{total} ({Math.round((score / total) * 100)}%)</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
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
  scenarioHeader: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 8, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  scenarioTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  progressText: { fontSize: 12, color: '#94A3B8' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 16, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  explanationBox: { backgroundColor: '#EFF6FF', padding: 14, borderRadius: 10 },
  explanationText: { fontSize: 14, color: '#1E3A8A', lineHeight: 20 },
  nextButton: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
});

export default MarkRoundingTacticsInteractive;
