/**
 * TufteDrillRow
 *
 * Compact drill display following Tufte principles:
 * - Dense, scannable rows
 * - Key info at a glance: name, category, duration, difficulty
 * - Completion state integrated, not decorative
 */

import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Check, X, Play } from 'lucide-react-native';
import { IOS_COLORS, TUFTE_BACKGROUND, TUFTE_TEXT } from '@/components/cards/constants';
import type { PracticeSessionDrill } from '@/types/practice';

interface TufteDrillRowProps {
  drill: PracticeSessionDrill;
  index: number;
  onPress?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  showActions?: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: IOS_COLORS.green,
  intermediate: IOS_COLORS.orange,
  advanced: IOS_COLORS.red,
};

const DIFFICULTY_LABELS = {
  beginner: 'Easy',
  intermediate: 'Med',
  advanced: 'Hard',
};

export function TufteDrillRow({
  drill,
  index,
  onPress,
  onComplete,
  onSkip,
  showActions = false,
}: TufteDrillRowProps) {
  const drillInfo = drill.drill;
  if (!drillInfo) return null;

  const isCompleted = drill.completed;
  const isSkipped = drill.skipped;
  const duration = drill.plannedDurationMinutes || drillInfo.durationMinutes || 0;
  const difficulty = drillInfo.difficulty || 'intermediate';

  // Status indicator
  const StatusIndicator = () => {
    if (isCompleted) {
      return (
        <View style={[styles.statusCircle, styles.statusCompleted]}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </View>
      );
    }
    if (isSkipped) {
      return (
        <View style={[styles.statusCircle, styles.statusSkipped]}>
          <X size={14} color="#FFFFFF" strokeWidth={2} />
        </View>
      );
    }
    return (
      <View style={styles.statusCircle}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
    );
  };

  return (
    <Pressable
      style={[
        styles.container,
        (isCompleted || isSkipped) && styles.containerDone,
      ]}
      onPress={onPress}
    >
      {/* Status/Index */}
      <StatusIndicator />

      {/* Main content */}
      <View style={styles.content}>
        {/* Drill name */}
        <Text
          style={[styles.name, (isCompleted || isSkipped) && styles.nameDone]}
          numberOfLines={1}
        >
          {drillInfo.name}
        </Text>

        {/* Meta row: category · difficulty · duration */}
        <View style={styles.metaRow}>
          <Text style={styles.category}>
            {drillInfo.category?.replace('_', ' ')}
          </Text>
          <Text style={styles.separator}>·</Text>
          <View style={styles.difficultyContainer}>
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: DIFFICULTY_COLORS[difficulty] },
              ]}
            />
            <Text style={styles.difficultyText}>
              {DIFFICULTY_LABELS[difficulty]}
            </Text>
          </View>
        </View>
      </View>

      {/* Duration */}
      <Text style={styles.duration}>{duration} min</Text>

      {/* Actions (if in Train phase) */}
      {showActions && !isCompleted && !isSkipped && (
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onComplete}>
            <Check size={18} color={IOS_COLORS.green} />
          </Pressable>
        </View>
      )}

      {/* Rating (if completed) */}
      {isCompleted && drill.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{drill.rating}/5</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
    borderRadius: 6,
  },
  containerDone: {
    opacity: 0.6,
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TUFTE_BACKGROUND,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCompleted: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  statusSkipped: {
    backgroundColor: IOS_COLORS.gray,
    borderColor: IOS_COLORS.gray,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE_TEXT,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: IOS_COLORS.gray,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  separator: {
    fontSize: 12,
    color: IOS_COLORS.gray3,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  duration: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TUFTE_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
});

export default TufteDrillRow;
