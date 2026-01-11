/**
 * Course Signals Interactive
 * Recognize and respond to course signals and flags
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Polygon, Circle } from 'react-native-svg';

interface CourseSignalsInteractiveProps {
  onComplete?: () => void;
}

interface FlagQuestion {
  id: string;
  flagName: string;
  flagColors: { type: 'rect' | 'triangle' | 'cross' | 'circle', colors: string[] };
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const FLAG_QUESTIONS: FlagQuestion[] = [
  {
    id: 'p-flag',
    flagName: 'P (Papa) - Blue & White',
    flagColors: { type: 'rect', colors: ['#1E40AF', '#FFFFFF'] },
    question: 'The P flag is raised. What does it mean?',
    options: [
      'Race is postponed',
      'Preparatory signal - 4 minutes to start',
      'Protest flag',
      'Come to the committee boat',
    ],
    correctAnswer: 1,
    explanation: 'P flag is the standard preparatory signal in the starting sequence. When raised, you have 4 minutes until the start. It\'s removed 1 minute before start.',
  },
  {
    id: 'x-flag',
    flagName: 'X (X-ray) - Blue Cross on White',
    flagColors: { type: 'cross', colors: ['#FFFFFF', '#1E40AF'] },
    question: 'After the start, X flag is displayed. What happened?',
    options: [
      'Race is abandoned',
      'Course has changed',
      'Individual recall - one or more boats were OCS',
      'Shorten course',
    ],
    correctAnswer: 2,
    explanation: 'X flag means individual recall - one or more boats were on course side (OCS) at the start. If you think you might have been over, return and restart.',
  },
  {
    id: 'first-sub',
    flagName: 'First Substitute - Yellow Triangle',
    flagColors: { type: 'triangle', colors: ['#FACC15'] },
    question: 'First Substitute flag is raised with two sound signals. What should you do?',
    options: [
      'Continue racing normally',
      'General recall - return to the start area for a new start',
      'Shorten course at next mark',
      'Anchor and wait',
    ],
    correctAnswer: 1,
    explanation: 'First Substitute means general recall - the start is invalid and everyone must return for a new start. Usually means too many boats were OCS to identify.',
  },
  {
    id: 'ap-flag',
    flagName: 'AP (Answering Pennant) - Red & White',
    flagColors: { type: 'rect', colors: ['#DC2626', '#FFFFFF'] },
    question: 'AP flag is displayed. What does it mean?',
    options: [
      'Race is abandoned',
      'Racing is postponed - wait for further signals',
      'Finish at the next mark',
      'Protest time limit extended',
    ],
    correctAnswer: 1,
    explanation: 'AP means postponement. The race or start is delayed. Wait near the starting area for the signal to be lowered. The warning signal will be made 1 minute after AP is lowered.',
  },
  {
    id: 'n-flag',
    flagName: 'N (November) - Blue & White Checkered',
    flagColors: { type: 'rect', colors: ['#1E40AF', '#FFFFFF'] },
    question: 'N flag is displayed. What should you do?',
    options: [
      'Continue to next mark',
      'Race is abandoned - return to starting area',
      'Preparatory signal',
      'Shorten course',
    ],
    correctAnswer: 1,
    explanation: 'N flag means the race is abandoned. All boats should return to the starting area. If shown with other signals (like A), it provides additional information about what happens next.',
  },
  {
    id: 's-flag',
    flagName: 'S (Sierra) - Blue & White',
    flagColors: { type: 'rect', colors: ['#FFFFFF', '#1E40AF'] },
    question: 'S flag is displayed at the finish line. What does it mean?',
    options: [
      'Race abandoned',
      'Course shortened - finish at this mark',
      'Start postponed',
      'Safety signal - stop racing',
    ],
    correctAnswer: 1,
    explanation: 'S flag at a mark means the course is shortened. Finish at the mark displaying S flag. Cross between the mark and the RC boat or as described in the SI.',
  },
  {
    id: 'i-flag',
    flagName: 'I Flag (Rule 30.1)',
    flagColors: { type: 'rect', colors: ['#FACC15', '#1E293B'] },
    question: 'I flag is displayed with the preparatory signal. What special rule applies?',
    options: [
      'No penalties this race',
      'Boats in triangle must sail to pre-start side via ends',
      'Black flag is in effect',
      'Round-the-ends rule - boats must return via ends if OCS',
    ],
    correctAnswer: 3,
    explanation: 'I flag means the Round-the-Ends Rule (Rule 30.1). If any part of your boat is in the triangle during the last minute, you must return via an end of the line (not through the line).',
  },
  {
    id: 'z-flag',
    flagName: 'Z Flag (Rule 30.2)',
    flagColors: { type: 'triangle', colors: ['#FACC15', '#1E293B', '#DC2626', '#1E40AF'] },
    question: 'Z flag is displayed. You\'re in the triangle at 30 seconds before start, then restart correctly. What happens?',
    options: [
      'Nothing - you restarted correctly',
      '20% penalty added to your score',
      'DSQ',
      'Z flag doesn\'t apply in first race',
    ],
    correctAnswer: 1,
    explanation: 'Z flag (Rule 30.2) means if you\'re in the triangle during the last minute, you get a 20% scoring penalty even if you restart correctly. It discourages aggressive starts.',
  },
  {
    id: 'black-flag',
    flagName: 'Black Flag (Rule 30.3)',
    flagColors: { type: 'rect', colors: ['#1E293B'] },
    question: 'Black flag is displayed. You\'re OCS at the start. Can you restart?',
    options: [
      'Yes, just return and restart',
      'No - you\'re DSQ from this race, go home',
      'Yes, but with a penalty',
      'Black flag only affects team racing',
    ],
    correctAnswer: 1,
    explanation: 'Black flag is severe: if you\'re in the triangle during the last minute and the start is later recalled, you\'re DSQ without a hearing. You cannot restart that race.',
  },
  {
    id: 'c-flag',
    flagName: 'C Flag - Change of Course',
    flagColors: { type: 'rect', colors: ['#1E40AF', '#FFFFFF', '#DC2626'] },
    question: 'C flag is displayed at a mark. What should you do?',
    options: [
      'Race is cancelled',
      'Look for the new mark or course change indication',
      'Finish at this mark',
      'C flag has no racing meaning',
    ],
    correctAnswer: 1,
    explanation: 'C flag signals a change of course. Look for additional signals or boards indicating the new mark or course. The SI will explain how course changes are communicated.',
  },
];

const FlagDisplay = ({ flag }: { flag: FlagQuestion['flagColors'] }) => {
  const size = 60;

  if (flag.type === 'cross') {
    return (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Rect x="0" y="0" width="60" height="60" fill={flag.colors[0]} stroke="#1E293B" strokeWidth="1" />
        <Rect x="25" y="0" width="10" height="60" fill={flag.colors[1]} />
        <Rect x="0" y="25" width="60" height="10" fill={flag.colors[1]} />
      </Svg>
    );
  }

  if (flag.type === 'triangle') {
    return (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Polygon points="0,0 60,30 0,60" fill={flag.colors[0]} stroke="#1E293B" strokeWidth="1" />
      </Svg>
    );
  }

  // Default: two-color rect
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Rect x="0" y="0" width="30" height="60" fill={flag.colors[0]} stroke="#1E293B" strokeWidth="1" />
      <Rect x="30" y="0" width="30" height="60" fill={flag.colors[1]} stroke="#1E293B" strokeWidth="1" />
    </Svg>
  );
};

export function CourseSignalsInteractive({ onComplete }: CourseSignalsInteractiveProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const question = FLAG_QUESTIONS[currentQuestion];

  const handleAnswerSelect = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === question.correctAnswer) setScore(s => s + 1);
  }, [selectedAnswer, question.correctAnswer]);

  const handleNext = useCallback(() => {
    if (currentQuestion < FLAG_QUESTIONS.length - 1) {
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
          <Ionicons name="flag" size={64} color="#10B981" />
          <Text style={styles.completeTitle}>Course Signals Complete!</Text>
          <Text style={styles.completeScore}>Score: {score}/{FLAG_QUESTIONS.length} ({Math.round((score / FLAG_QUESTIONS.length) * 100)}%)</Text>
          <Text style={styles.completeMessage}>
            Knowing your flags is essential for safe and successful racing!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Signals Quiz</Text>
        <Text style={styles.progressText}>Flag {currentQuestion + 1} of {FLAG_QUESTIONS.length}</Text>
      </View>

      <View style={styles.flagCard}>
        <View style={styles.flagDisplay}>
          <FlagDisplay flag={question.flagColors} />
        </View>
        <Text style={styles.flagName}>{question.flagName}</Text>
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
            <Text style={styles.nextButtonText}>{currentQuestion < FLAG_QUESTIONS.length - 1 ? 'Next Flag' : 'Complete'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16 },
  header: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  progressText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  flagCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, alignItems: 'center', gap: 12, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  flagDisplay: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
  flagName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 16, ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } : { elevation: 2 }) },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  correctOption: { backgroundColor: '#DCFCE7', borderColor: '#10B981' },
  incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 14, color: '#475569' },
  explanationBox: { backgroundColor: '#EFF6FF', padding: 14, borderRadius: 10 },
  explanationText: { fontSize: 14, color: '#1E40AF', lineHeight: 20 },
  nextButton: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  completeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  completeScore: { fontSize: 18, fontWeight: '600', color: '#10B981' },
  completeMessage: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});

export default CourseSignalsInteractive;
