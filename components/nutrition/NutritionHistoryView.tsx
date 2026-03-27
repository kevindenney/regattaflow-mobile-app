/**
 * NutritionHistoryView — Weekly nutrition overview with daily breakdowns.
 *
 * Shows a simple 7-day bar chart and day-by-day meal list.
 * Accessible from NutritionSummaryCard "See more".
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useNutritionWeekly, useNutritionTargets } from '@/hooks/useNutrition';
import type { NutritionDaySummary } from '@/types/nutrition';

interface NutritionHistoryViewProps {
  interestId: string;
}

export function NutritionHistoryView({ interestId }: NutritionHistoryViewProps) {
  const { data: weekly } = useNutritionWeekly(interestId);
  const { data: targets } = useNutritionTargets(interestId);

  if (!weekly?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="nutrition-outline" size={32} color={IOS_COLORS.systemGray3} />
        <Text style={styles.emptyText}>No nutrition data this week.</Text>
        <Text style={styles.emptySubtext}>Log meals to see your weekly overview.</Text>
      </View>
    );
  }

  const maxCal = Math.max(
    targets?.calories_daily ?? 0,
    ...weekly.map((d) => d.total_calories),
    1,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 7-day bar chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.barChart}>
          {weekly.map((day) => (
            <DayBar
              key={day.day}
              day={day}
              maxCal={maxCal}
              targetCal={targets?.calories_daily}
            />
          ))}
        </View>
        {targets?.calories_daily ? (
          <View style={styles.targetLine}>
            <View style={styles.targetDash} />
            <Text style={styles.targetLabel}>{targets.calories_daily} cal target</Text>
          </View>
        ) : null}
      </View>

      {/* Day-by-day details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Meals</Text>
        {[...weekly].reverse().map((day) =>
          day.meal_count > 0 ? (
            <View key={day.day} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>
                {formatDayLabel(day.day)} — {day.total_calories} cal, {Math.round(day.total_protein)}g protein
              </Text>
              {day.entries.map((entry) => (
                <View key={entry.id} style={styles.mealRow}>
                  <Text style={styles.mealType}>
                    {entry.meal_type?.replace('_', ' ') ?? 'meal'}
                  </Text>
                  <Text style={styles.mealDescription} numberOfLines={1}>
                    {entry.description}
                  </Text>
                  {entry.calories ? (
                    <Text style={styles.mealCal}>{entry.calories}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null,
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// DayBar sub-component
// ---------------------------------------------------------------------------

function DayBar({
  day,
  maxCal,
  targetCal,
}: {
  day: NutritionDaySummary;
  maxCal: number;
  targetCal?: number;
}) {
  const height = maxCal > 0 ? (day.total_calories / maxCal) * 80 : 0;
  const isToday = day.day === new Date().toISOString().slice(0, 10);
  const overTarget = targetCal ? day.total_calories > targetCal : false;

  const dayName = new Date(day.day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });

  return (
    <View style={styles.barCol}>
      <View style={styles.barWrapper}>
        <View
          style={[
            styles.bar,
            {
              height: Math.max(2, height),
              backgroundColor: overTarget
                ? IOS_COLORS.systemOrange
                : isToday
                  ? IOS_COLORS.systemGreen
                  : IOS_COLORS.systemGray4,
            },
          ]}
        />
      </View>
      <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{dayName}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDayLabel(isoDay: string): string {
  const date = new Date(isoDay + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isoDay === today.toISOString().slice(0, 10)) return 'Today';
  if (isoDay === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chartSection: {
    gap: 4,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '500',
  },
  barLabelToday: {
    color: IOS_COLORS.systemGreen,
    fontWeight: '700',
  },
  targetLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  targetDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray3,
  },
  targetLabel: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
  },
  detailsSection: {},
  dayGroup: {
    marginBottom: IOS_SPACING.sm,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
    paddingLeft: 8,
  },
  mealType: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
    width: 70,
  },
  mealDescription: {
    flex: 1,
    fontSize: 12,
    color: IOS_COLORS.label,
  },
  mealCal: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
});
