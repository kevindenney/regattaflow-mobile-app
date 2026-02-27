/**
 * WorkoutPlanModule
 *
 * Displays the workout plan with exercises, set tracking, and phase-aware views.
 * - Prep: full plan overview
 * - Train: active exercise with set completion tracker
 * - Review: actual vs planned summary
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Dumbbell,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface WorkoutPlanModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  muscleGroup: string;
  actualWeight?: number;
  actualSets?: number;
}

const MOCK_EXERCISES: Exercise[] = [
  { id: 'ex1', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 185, restSeconds: 90, muscleGroup: 'Chest', actualWeight: 185, actualSets: 4 },
  { id: 'ex2', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 65, restSeconds: 75, muscleGroup: 'Chest', actualWeight: 60, actualSets: 3 },
  { id: 'ex3', name: 'Barbell Row', sets: 4, reps: 8, weight: 155, restSeconds: 90, muscleGroup: 'Back', actualWeight: 155, actualSets: 4 },
  { id: 'ex4', name: 'Overhead Press', sets: 3, reps: 10, weight: 95, restSeconds: 75, muscleGroup: 'Shoulders', actualWeight: 95, actualSets: 2 },
  { id: 'ex5', name: 'Weighted Pull-ups', sets: 3, reps: 6, weight: 25, restSeconds: 120, muscleGroup: 'Back', actualWeight: 25, actualSets: 3 },
];

const ACCENT = '#2E7D32';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#EF4444',
  Back: '#3B82F6',
  Shoulders: '#F59E0B',
  Legs: '#8B5CF6',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function WorkoutPlanModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: WorkoutPlanModuleProps) {
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>({});
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  if (isCollapsed) return null;

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setCompletedSets((prev) => {
      const next = { ...prev };
      const current = new Set(prev[exerciseId] ?? []);
      if (current.has(setIndex)) {
        current.delete(setIndex);
      } else {
        current.add(setIndex);
      }
      next[exerciseId] = current;
      return next;
    });
  };

  const totalPlannedSets = MOCK_EXERCISES.reduce((sum, e) => sum + e.sets, 0);
  const totalCompletedSets = Object.values(completedSets).reduce(
    (sum, s) => sum + s.size,
    0
  );

  // ---- REVIEW phase: actual vs planned summary ----
  if (phase === 'after_race') {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>WORKOUT SUMMARY</Text>
        {MOCK_EXERCISES.map((ex) => {
          const hit = ex.actualWeight! >= ex.weight && ex.actualSets! >= ex.sets;
          return (
            <View key={ex.id} style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.prescriptionText}>
                  Planned: {ex.sets}x{ex.reps} @ {ex.weight} lbs
                </Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={[styles.actualText, { color: hit ? ACCENT : IOS_COLORS.red }]}>
                  {ex.actualSets}x{ex.reps} @ {ex.actualWeight} lbs
                </Text>
                {hit ? (
                  <CheckCircle2 size={16} color={ACCENT} />
                ) : (
                  <Circle size={16} color={IOS_COLORS.red} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // ---- TRAIN phase: active exercise with set tracker ----
  if (phase === 'on_water') {
    const activeEx = MOCK_EXERCISES[activeExerciseIndex];
    const setsForActive = completedSets[activeEx.id] ?? new Set<number>();
    const allDone = setsForActive.size >= activeEx.sets;

    return (
      <View style={styles.container}>
        <View style={styles.trainHeader}>
          <Text style={styles.trainLabel}>
            EXERCISE {activeExerciseIndex + 1} OF {MOCK_EXERCISES.length}
          </Text>
          <Text style={styles.trainProgress}>
            {totalCompletedSets}/{totalPlannedSets} sets
          </Text>
        </View>

        <View style={[styles.activeCard, { borderColor: ACCENT }]}>
          <View style={styles.activeCardHeader}>
            <View style={[styles.numberBadge, { backgroundColor: ACCENT }]}>
              <Text style={styles.numberBadgeText}>{activeExerciseIndex + 1}</Text>
            </View>
            <View style={styles.activeCardInfo}>
              <Text style={styles.activeExerciseName}>{activeEx.name}</Text>
              <Text style={styles.prescriptionTextLarge}>
                {activeEx.sets}x{activeEx.reps} @ {activeEx.weight} lbs
              </Text>
            </View>
          </View>

          <View style={styles.restRow}>
            <Clock size={14} color={TEXT_MUTED} />
            <Text style={styles.restText}>{activeEx.restSeconds}s rest</Text>
          </View>

          <View style={styles.setTracker}>
            {Array.from({ length: activeEx.sets }).map((_, i) => {
              const done = setsForActive.has(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleSet(activeEx.id, i)}
                  style={({ pressed }) => [
                    styles.setCircle,
                    done && styles.setCircleDone,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.setCircleText, done && styles.setCircleTextDone]}>
                    {i + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.navRow}>
          {activeExerciseIndex > 0 && (
            <Pressable
              onPress={() => setActiveExerciseIndex((i) => i - 1)}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          {activeExerciseIndex < MOCK_EXERCISES.length - 1 && (
            <Pressable
              onPress={() => setActiveExerciseIndex((i) => i + 1)}
              style={[styles.navButton, { backgroundColor: allDone ? ACCENT : IOS_COLORS.gray5 }]}
            >
              <Text style={[styles.navButtonText, allDone && { color: '#FFFFFF' }]}>
                Next
              </Text>
              <ChevronRight size={14} color={allDone ? '#FFFFFF' : TEXT_SECONDARY} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // ---- PREP phase (default): full plan overview ----
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>WORKOUT PLAN</Text>
      {MOCK_EXERCISES.map((ex, idx) => (
        <View key={ex.id} style={styles.exerciseRow}>
          <View style={[styles.numberBadge, { backgroundColor: ACCENT }]}>
            <Text style={styles.numberBadgeText}>{idx + 1}</Text>
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.prescriptionText}>
              {ex.sets}x{ex.reps} @ {ex.weight} lbs
            </Text>
          </View>
          <View style={styles.exerciseMeta}>
            <View
              style={[
                styles.muscleTag,
                { backgroundColor: (MUSCLE_GROUP_COLORS[ex.muscleGroup] ?? TEXT_MUTED) + '18' },
              ]}
            >
              <Text
                style={[
                  styles.muscleTagText,
                  { color: MUSCLE_GROUP_COLORS[ex.muscleGroup] ?? TEXT_MUTED },
                ]}
              >
                {ex.muscleGroup}
              </Text>
            </View>
            <View style={styles.restIndicator}>
              <Clock size={12} color={TEXT_MUTED} />
              <Text style={styles.restSmallText}>{ex.restSeconds}s</Text>
            </View>
          </View>
        </View>
      ))}
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  // -- Exercise row (Prep) --
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  prescriptionText: {
    fontSize: 12,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  exerciseMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  muscleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleTagText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  restIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  restSmallText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },

  // -- Train phase --
  trainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  trainProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: ACCENT,
  },
  activeCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeCardInfo: {
    flex: 1,
    gap: 2,
  },
  activeExerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  prescriptionTextLarge: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  setTracker: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingTop: 4,
  },
  setCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCircleDone: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  setCircleText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  setCircleTextDone: {
    color: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.gray5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },

  // -- Review phase --
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  summaryLeft: {
    flex: 1,
    gap: 2,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actualText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default WorkoutPlanModule;
