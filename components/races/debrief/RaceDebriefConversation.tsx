import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export interface DebriefAnswer {
  question: string;
  answer: string;
}

interface RaceDebriefConversationProps {
  onComplete?: (answers: DebriefAnswer[]) => void;
}

const QUESTIONS = [
  'What was your most important decision before the start?',
  'Where did you gain or lose the most distance?',
  'What should you repeat next race?',
  'What is one training focus for this week?',
];

export function RaceDebriefConversation({ onComplete }: RaceDebriefConversationProps) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<DebriefAnswer[]>([]);

  const question = useMemo(() => QUESTIONS[index], [index]);
  const isLast = index === QUESTIONS.length - 1;

  const handleNext = () => {
    const nextAnswers = [...answers, { question, answer: draft.trim() }];
    setAnswers(nextAnswers);
    setDraft('');

    if (isLast) {
      onComplete?.(nextAnswers);
      return;
    }

    setIndex((prev) => prev + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guided Debrief</Text>
      <Text style={styles.progress}>Question {index + 1} of {QUESTIONS.length}</Text>
      <Text style={styles.question}>{question}</Text>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        multiline
        placeholder="Add your notes..."
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{isLast ? 'Finish Debrief' : 'Next Question'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  progress: {
    fontSize: 12,
    color: '#64748B',
  },
  question: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    fontWeight: '600',
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0F172A',
  },
  button: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
