/**
 * GoalsModule
 *
 * Displays session goals, targets, and achievement status.
 * - Prep: shows goals with type badges and targets
 * - Train: shows key target for the session
 * - Review: shows goals assessment with achieved/missed status
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Target,
  CheckCircle2,
  Circle,
  XCircle,
  TrendingUp,
  Gauge,
  Eye,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface GoalsModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type GoalType = 'Strength' | 'Form' | 'Endurance';

interface SessionGoal {
  id: string;
  type: GoalType;
  description: string;
  targetMetric: string;
  previousSession: string;
}

const MOCK_GOALS: SessionGoal[] = [
  {
    id: 'g1',
    type: 'Strength',
    description: 'Hit 185 lbs for 4x8 on bench press',
    targetMetric: '185 lbs 4x8',
    previousSession: 'Last session: 175 lbs for 4x8 -- target +10 lbs today',
  },
  {
    id: 'g2',
    type: 'Form',
    description: 'Maintain RPE 7-8 throughout',
    targetMetric: 'RPE 7-8',
    previousSession: 'Last session: RPE 8-9 on final sets -- aim for better pacing',
  },
  {
    id: 'g3',
    type: 'Endurance',
    description: 'Focus on controlled eccentric phase',
    targetMetric: '3s eccentric tempo',
    previousSession: 'Last session: tempo was inconsistent -- use metronome cue',
  },
];

const ACCENT = '#2E7D32';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const GOAL_TYPE_CONFIG: Record<GoalType, { color: string; bg: string }> = {
  Strength: { color: '#DC2626', bg: '#DC262612' },
  Form: { color: '#7C3AED', bg: '#7C3AED12' },
  Endurance: { color: '#2563EB', bg: '#2563EB12' },
};

function getGoalIcon(type: GoalType, size: number, color: string) {
  switch (type) {
    case 'Strength':
      return <TrendingUp size={size} color={color} />;
    case 'Form':
      return <Eye size={size} color={color} />;
    case 'Endurance':
      return <Gauge size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function GoalsModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: GoalsModuleProps) {
  const [achieved, setAchieved] = useState<Set<string>>(new Set());

  if (isCollapsed) return null;

  const toggleGoal = (id: string) => {
    setAchieved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- TRAIN phase: key target ----
  if (phase === 'on_water') {
    const primary = MOCK_GOALS[0];
    const config = GOAL_TYPE_CONFIG[primary.type];
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>SESSION TARGET</Text>
        <View style={[styles.keyTargetCard, { borderLeftColor: config.color }]}>
          <View style={styles.keyTargetHeader}>
            <Target size={18} color={config.color} />
            <Text style={styles.keyTargetMetric}>{primary.targetMetric}</Text>
          </View>
          <Text style={styles.keyTargetDescription}>{primary.description}</Text>
          <Text style={styles.previousRef}>{primary.previousSession}</Text>
        </View>
        {MOCK_GOALS.length > 1 && (
          <Text style={styles.moreGoals}>
            +{MOCK_GOALS.length - 1} more goal{MOCK_GOALS.length - 1 > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    );
  }

  // ---- REVIEW phase: goals assessment ----
  if (phase === 'after_race') {
    const achievedCount = achieved.size;
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>GOALS ASSESSMENT</Text>
          <Text style={[styles.scoreText, achievedCount === MOCK_GOALS.length && { color: ACCENT }]}>
            {achievedCount}/{MOCK_GOALS.length} achieved
          </Text>
        </View>
        {MOCK_GOALS.map((goal) => {
          const hit = achieved.has(goal.id);
          const config = GOAL_TYPE_CONFIG[goal.type];
          return (
            <Pressable
              key={goal.id}
              onPress={() => toggleGoal(goal.id)}
              style={({ pressed }) => [
                styles.reviewRow,
                pressed && { opacity: 0.7 },
              ]}
            >
              {hit ? (
                <CheckCircle2 size={20} color={ACCENT} />
              ) : (
                <XCircle size={20} color={IOS_COLORS.red} />
              )}
              <View style={styles.reviewInfo}>
                <View style={styles.reviewTopRow}>
                  <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: config.color }]}>
                      {goal.type}
                    </Text>
                  </View>
                  <Text style={[styles.reviewStatus, { color: hit ? ACCENT : IOS_COLORS.red }]}>
                    {hit ? 'Achieved' : 'Missed'}
                  </Text>
                </View>
                <Text style={styles.reviewDescription}>{goal.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // ---- PREP phase (default): full goals list ----
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SESSION GOALS</Text>
      {MOCK_GOALS.map((goal) => {
        const config = GOAL_TYPE_CONFIG[goal.type];
        return (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                {getGoalIcon(goal.type, 12, config.color)}
                <Text style={[styles.typeBadgeText, { color: config.color }]}>
                  {goal.type}
                </Text>
              </View>
              <Text style={styles.targetMetric}>{goal.targetMetric}</Text>
            </View>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <Text style={styles.previousRef}>{goal.previousSession}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },

  // -- Goal card (Prep) --
  goalCard: {
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  targetMetric: {
    fontSize: 12,
    fontWeight: '600',
    color: ACCENT,
  },
  goalDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_PRIMARY,
  },
  previousRef: {
    fontSize: 11,
    fontWeight: '400',
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },

  // -- Key target (Train) --
  keyTargetCard: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 6,
    gap: 4,
  },
  keyTargetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyTargetMetric: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  keyTargetDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  moreGoals: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // -- Review --
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  reviewInfo: {
    flex: 1,
    gap: 3,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reviewDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_PRIMARY,
  },
});

export default GoalsModule;
