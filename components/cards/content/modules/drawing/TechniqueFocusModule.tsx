/**
 * TechniqueFocusModule
 *
 * Shows the target technique for a drawing session.
 * Phase-aware: Plan shows technique overview, Draw shows key reminders only,
 * Critique shows technique self-assessment.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PenTool,
  Lightbulb,
  ChevronRight,
  Star,
  BarChart3,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface TechniqueFocusModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: '#34C759',
  Intermediate: '#FF9500',
  Advanced: '#FF3B30',
};

const MOCK_TECHNIQUE = {
  name: 'Cross-Hatching for Value',
  difficulty: 'Intermediate' as Difficulty,
  description:
    'Build value through layered sets of parallel lines at varying angles to create smooth tonal transitions.',
  reminders: [
    'Keep line spacing consistent within each layer',
    'Rotate 30-45 degrees between hatching passes',
    'Use lighter pressure for highlight transitions',
  ],
  lessonTitle: 'Cross-Hatching Techniques',
  sessionNumber: 4,
  totalSessions: 10,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TechniqueFocusModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: TechniqueFocusModuleProps) {
  if (isCollapsed) return null;

  if (phase === 'on_water') {
    return <KeyReminders />;
  }

  if (phase === 'after_race') {
    return <SelfAssessment />;
  }

  // days_before (Plan)
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <PenTool size={18} color="#E64A19" />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{MOCK_TECHNIQUE.name}</Text>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  DIFFICULTY_COLORS[MOCK_TECHNIQUE.difficulty] + '18',
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: DIFFICULTY_COLORS[MOCK_TECHNIQUE.difficulty] },
              ]}
            >
              {MOCK_TECHNIQUE.difficulty}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{MOCK_TECHNIQUE.description}</Text>

      {/* Key reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>KEY REMINDERS</Text>
        {MOCK_TECHNIQUE.reminders.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Lightbulb size={14} color="#FF9500" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Lesson link */}
      <Pressable
        style={({ pressed }) => [styles.lessonLink, pressed && styles.pressed]}
      >
        <Text style={styles.lessonLinkText}>
          Review lesson: {MOCK_TECHNIQUE.lessonTitle}
        </Text>
        <ChevronRight size={14} color="#E64A19" />
      </Pressable>

      {/* Progress */}
      <View style={styles.progressRow}>
        <BarChart3 size={14} color="#6B7280" />
        <Text style={styles.progressText}>
          Session {MOCK_TECHNIQUE.sessionNumber} of{' '}
          {MOCK_TECHNIQUE.totalSessions} in this technique series
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Phase sub-components
// ---------------------------------------------------------------------------

function KeyReminders() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>REMINDERS</Text>
      {MOCK_TECHNIQUE.reminders.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Lightbulb size={14} color="#FF9500" />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

function SelfAssessment() {
  const [rating, setRating] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>TECHNIQUE SELF-ASSESSMENT</Text>
      <Text style={styles.assessmentQuestion}>
        How well did you apply {MOCK_TECHNIQUE.name}?
      </Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Star
              size={28}
              color={n <= rating ? '#E64A19' : '#D1D5DB'}
              fill={n <= rating ? '#E64A19' : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
      <Text style={styles.assessmentHint}>
        {rating === 0
          ? 'Tap to rate your technique application'
          : rating <= 2
            ? 'Keep practicing -- review the lesson for pointers'
            : rating <= 4
              ? 'Good progress, keep refining'
              : 'Excellent application!'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  lessonLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E64A19',
  },
  pressed: {
    opacity: 0.7,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
  },
  // Self-assessment (Critique phase)
  assessmentQuestion: {
    fontSize: 13,
    color: '#1F2937',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  assessmentHint: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TechniqueFocusModule;
