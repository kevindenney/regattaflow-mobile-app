/**
 * GoalsSection - Display season goals with progress tracking
 *
 * Shows user's racing goals with progress bars, similar to
 * fitness apps' goal tracking features.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { SeasonGoal } from '@/hooks/useReflectProfile';

interface GoalsSectionProps {
  goals: SeasonGoal[];
  onSeeMore?: () => void;
  onGoalPress?: (goal: SeasonGoal) => void;
  onAddGoal?: () => void;
}

// Map color names to actual colors
function getColor(colorName: string): string {
  const colors: Record<string, string> = {
    systemBlue: IOS_COLORS.systemBlue,
    systemGreen: IOS_COLORS.systemGreen,
    systemYellow: IOS_COLORS.systemYellow,
    systemOrange: IOS_COLORS.systemOrange,
    systemRed: IOS_COLORS.systemRed,
    systemPurple: IOS_COLORS.systemPurple,
    systemTeal: IOS_COLORS.systemTeal,
    systemIndigo: IOS_COLORS.systemIndigo,
  };
  return colors[colorName] || IOS_COLORS.systemBlue;
}

function getProgressPercentage(current: number, target: number, type: string): number {
  // For improvement goals (lower is better), invert the logic
  if (type === 'improvement') {
    if (current <= target) return 100;
    // Calculate how close we are to the target
    const startingPoint = target * 2; // Assume starting point was 2x the target
    const progress = ((startingPoint - current) / (startingPoint - target)) * 100;
    return Math.max(0, Math.min(100, progress));
  }
  return Math.min(100, (current / target) * 100);
}

function GoalCard({
  goal,
  onPress,
}: {
  goal: SeasonGoal;
  onPress?: () => void;
}) {
  const color = getColor(goal.color);
  const iconName = goal.icon as keyof typeof Ionicons.glyphMap;
  const progress = getProgressPercentage(goal.currentValue, goal.targetValue, goal.type);
  const isComplete = goal.isCompleted || progress >= 100;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.goalCard,
        pressed && onPress && styles.goalCardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Goal Header */}
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: color + '15' }]}>
          <Ionicons
            name={isComplete ? 'checkmark-circle' : iconName}
            size={20}
            color={isComplete ? IOS_COLORS.systemGreen : color}
          />
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle} numberOfLines={1}>
            {goal.title}
          </Text>
          {goal.description && (
            <Text style={styles.goalDescription} numberOfLines={1}>
              {goal.description}
            </Text>
          )}
        </View>
        {isComplete && (
          <View style={styles.completeBadge}>
            <Text style={styles.completeBadgeText}>Done</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isComplete ? IOS_COLORS.systemGreen : color,
              },
            ]}
          />
        </View>
        <View style={styles.progressStats}>
          <Text style={[styles.progressValue, { color: isComplete ? IOS_COLORS.systemGreen : color }]}>
            {goal.currentValue}
            <Text style={styles.progressTarget}> / {goal.targetValue} {goal.unit}</Text>
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function GoalsSection({
  goals,
  onSeeMore,
  onGoalPress,
  onAddGoal,
}: GoalsSectionProps) {
  // Separate active and completed goals
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedCount = goals.filter((g) => g.isCompleted).length;

  // Show up to 3 goals
  const displayGoals = goals.slice(0, 3);

  if (goals.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Season Goals</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="flag-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No goals set</Text>
          <Text style={styles.emptySubtext}>
            Set goals to track your progress this season
          </Text>
          {onAddGoal && (
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={onAddGoal}
            >
              <Ionicons name="add-circle" size={20} color={IOS_COLORS.systemBlue} />
              <Text style={styles.addButtonText}>Add Goal</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Season Goals</Text>
          {completedCount > 0 && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={IOS_COLORS.systemGreen} />
              <Text style={styles.completedBadgeText}>
                {completedCount} done
              </Text>
            </View>
          )}
        </View>
        {onSeeMore && goals.length > 3 && (
          <Pressable
            onPress={onSeeMore}
            style={({ pressed }) => [
              styles.seeMoreButton,
              pressed && styles.seeMoreButtonPressed,
            ]}
          >
            <Text style={styles.seeMoreText}>See All</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={IOS_COLORS.systemBlue}
            />
          </Pressable>
        )}
      </View>

      {/* Goals List */}
      <View style={styles.goalsList}>
        {displayGoals.map((goal, index) => (
          <React.Fragment key={goal.id}>
            <GoalCard
              goal={goal}
              onPress={onGoalPress ? () => onGoalPress(goal) : undefined}
            />
            {index < displayGoals.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Add Goal Button */}
      {onAddGoal && (
        <Pressable
          style={({ pressed }) => [
            styles.footerButton,
            pressed && styles.footerButtonPressed,
          ]}
          onPress={onAddGoal}
        >
          <Ionicons name="add" size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.footerButtonText}>Add New Goal</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreButtonPressed: {
    opacity: 0.6,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  goalsList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  goalCard: {
    padding: 12,
  },
  goalCardPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  completeBadge: {
    backgroundColor: IOS_COLORS.systemGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTarget: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  footerButtonPressed: {
    opacity: 0.6,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    borderRadius: 20,
    marginTop: 8,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});

export default GoalsSection;
