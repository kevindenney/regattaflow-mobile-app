/**
 * Fleet Positioning Interactive
 * Learn fleet positioning tactics and clear air strategies
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

interface FleetPositioningInteractiveProps {
  onComplete?: () => void;
}

interface Scenario {
  id: string;
  title: string;
  situation: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'clear-air',
    title: 'Finding Clear Air',
    situation: 'You\'re mid-fleet after the start, surrounded by boats. Wind is 12 knots, oscillating.',
    questions: [
      {
        question: 'What\'s the most important factor for speed right now?',
        options: [
          'Pointing as high as possible',
          'Getting into clear air',
          'Tacking on every shift',
          'Following the boat ahead',
        ],
        correctAnswer: 1,
        explanation: 'In traffic, clear air is paramount. Dirty air can slow you 10-30%. Finding clean wind is more important than tactical positioning until you can sail at full speed.',
      },
      {
        question: 'How far behind and to windward does dirty air extend?',
        options: [
          '1-2 boat lengths',
          '3-5 boat lengths',
          '7-10 boat lengths or more',
          'Only directly behind',
        ],
        correctAnswer: 2,
        explanation: 'Dirty air (wind shadow + turbulence) extends 7-10+ boat lengths behind and to windward of boats ahead. The zone is cone-shaped, wider as it extends back.',
      },
      {
        question: 'Best escape route from dirty air?',
        options: [
          'Bear off and sail through leeward',
          'Tack away to clear air',
          'Pinch up above the boats ahead',
          'Either tack or bear off - whatever gets clean air fastest',
        ],
        correctAnswer: 3,
        explanation: 'The best escape depends on your situation. If you can tack to clear air, do it. If you can foot fast to leeward of the dirty air, do that. The key is to get clean air as quickly as possible.',
      },
    ],
  },
  {
    id: 'position-control',
    title: 'Controlling Position',
    situation: 'You\'re leading a group of 5 boats approaching the windward mark.',
    questions: [
      {
        question: 'What\'s the main principle of "staying between the fleet and the mark"?',
        options: [
          'It lets you block everyone',
          'You maintain tactical options while covering',
          'It\'s faster sailing',
          'It prevents protests',
        ],
        correctAnswer: 1,
        explanation: 'Staying between fleet and mark means any shift that helps them also helps you. You maintain the ability to cover threats without getting stuck in a corner.',
      },
      {
        question: 'When should you NOT try to cover all boats?',
        options: [
          'Never - always cover everyone',
          'When the fleet splits and you can\'t cover both groups',
          'When you\'re in first place',
          'In light wind only',
        ],
        correctAnswer: 1,
        explanation: 'When the fleet splits, trying to cover both groups means sailing extra distance. Choose the larger group or the bigger threat. Let some boats go if it means sailing your own race better.',
      },
      {
        question: 'A boat tacks to port 5 lengths to leeward. Do you cover?',
        options: [
          'Always cover immediately',
          'Only if they\'re a direct series threat',
          'Let them go - they\'re in your dirty air anyway',
          'Depends on where they\'re going and why',
        ],
        correctAnswer: 3,
        explanation: 'Consider: Are they a series threat? Where are they going? Are they likely to gain? Sometimes letting a boat go to the "wrong" side costs you nothing. Over-covering wastes your own distance.',
      },
    ],
  },
  {
    id: 'fleet-dynamics',
    title: 'Reading Fleet Dynamics',
    situation: 'The fleet is bunched at the start. You need to find passing lanes.',
    questions: [
      {
        question: 'What creates passing opportunities in a fleet?',
        options: [
          'Only major wind shifts',
          'Speed differences, shift phases, and tactical errors by others',
          'Luck alone',
          'Boat specifications',
        ],
        correctAnswer: 1,
        explanation: 'Passing lanes open through: boat speed differences, being in phase with shifts when others aren\'t, capitalizing on others\' tactical errors, and choosing the right side when the fleet splits.',
      },
      {
        question: 'When the fleet heavily favors one side, what\'s the smart play?',
        options: [
          'Follow the crowd - they probably know something',
          'Go the opposite way for clear air',
          'Consider going slightly toward the minority side if you have a reason',
          'It doesn\'t matter where you go',
        ],
        correctAnswer: 2,
        explanation: 'When everyone crowds one side, there may be value on the other side: clearer air, better position for the next shift. But only go there if you have a tactical reason, not just to be different.',
      },
      {
        question: 'How do you use "fleet geometry" to your advantage?',
        options: [
          'Sail faster than everyone',
          'Position to benefit from likely scenarios',
          'Stay exactly in the middle always',
          'Follow the leader exactly',
        ],
        correctAnswer: 1,
        explanation: 'Fleet geometry means positioning so common scenarios work in your favor. If a shift is likely, be positioned to gain from it. If the fleet will converge at a mark, arrive with options.',
      },
    ],
  },
];

export function FleetPositioningInteractive({ onComplete }: FleetPositioningInteractiveProps) {
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

  if (isComplete) {
    const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Fleet Positioning Complete!</Text>
          <Text style={styles.completeScore}>
            Score: {score}/{totalQuestions} ({percentage}%)
          </Text>
          <Text style={styles.completeMessage}>
            {percentage >= 80
              ? 'Excellent! You understand fleet dynamics well.'
              : percentage >= 60
              ? 'Good progress. Practice reading fleet patterns on the water.'
              : 'Keep studying! Fleet positioning is key to moving through the pack.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <View style={styles.situationBox}>
          <Text style={styles.situationLabel}>Situation:</Text>
          <Text style={styles.situationText}>{scenario.situation}</Text>
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
                selectedAnswer === index && (
                  index === question.correctAnswer ? styles.correctOption : styles.incorrectOption
                ),
                selectedAnswer !== null && index === question.correctAnswer && styles.correctOption,
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer !== null && index === question.correctAnswer && styles.correctText,
              ]}>
                {option}
              </Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16 },
  scenarioHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }),
  },
  scenarioTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  situationBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  situationLabel: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  situationText: { fontSize: 14, color: '#78350F', lineHeight: 20 },
  progressText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }),
  },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B', lineHeight: 24 },
  optionsContainer: { gap: 10 },
  optionButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  correctText: { color: '#059669', fontWeight: '500' },
  explanationBox: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  explanationTitle: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
  explanationText: { fontSize: 14, color: '#1E3A8A', lineHeight: 20 },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 10,
  },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
  completeMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});

export default FleetPositioningInteractive;
