/**
 * SubStepChecklist — Read-only sub-step list with checkboxes for the Act tab.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import type { SubStep } from '@/types/step-detail';

interface SubStepChecklistProps {
  subSteps: SubStep[];
  progress: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function SubStepChecklist({ subSteps, progress, onToggle }: SubStepChecklistProps) {
  if (subSteps.length === 0) return null;

  const completedCount = subSteps.filter((s) => progress[s.id]).length;
  const total = subSteps.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {completedCount}/{total} completed
        </Text>
        <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
      </View>
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
      </View>

      {/* Checklist */}
      <View style={styles.list}>
        {subSteps.map((step) => {
          const done = Boolean(progress[step.id]);
          return (
            <Pressable
              key={step.id}
              style={styles.row}
              onPress={() => onToggle(step.id)}
            >
              <Ionicons
                name={done ? 'checkbox' : 'square-outline'}
                size={22}
                color={done ? IOS_COLORS.systemGreen : IOS_COLORS.systemGray3}
              />
              <Text
                style={[styles.rowText, done && styles.rowTextDone]}
                numberOfLines={2}
              >
                {step.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.systemGreen,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.systemGreen,
    borderRadius: 3,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    paddingHorizontal: 4,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  rowTextDone: {
    textDecorationLine: 'line-through',
    color: IOS_COLORS.secondaryLabel,
  },
});
