/**
 * NutritionSummaryCard — Compact card showing today's nutrition at a glance.
 *
 * Shows progress bars for calories, protein, carbs, fat vs daily targets.
 * Tap "Log a meal" to open NutritionChatSheet.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useStepNutritionToday, useNutritionToday, useNutritionTargets } from '@/hooks/useNutrition';
import { NutritionChatSheet } from './NutritionChatSheet';

interface NutritionSummaryCardProps {
  interestId: string;
  interestName: string;
}

export function NutritionSummaryCard({ interestId, interestName }: NutritionSummaryCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const { data: stepNutrition } = useStepNutritionToday(interestId);
  const { data: legacyNutrition } = useNutritionToday(interestId);
  const { data: targets } = useNutritionTargets(interestId);

  // Prefer step-based nutrition, fall back to legacy nutrition_entries table
  const today = (stepNutrition?.meal_count ?? 0) > 0 ? stepNutrition : legacyNutrition;

  const cal = today?.total_calories ?? 0;
  const pro = Math.round(today?.total_protein ?? 0);
  const carbs = Math.round(today?.total_carbs ?? 0);
  const fat = Math.round(today?.total_fat ?? 0);
  const mealCount = today?.meal_count ?? 0;

  const calTarget = targets?.calories_daily;
  const proTarget = targets?.protein_daily_g;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="nutrition-outline" size={14} color={IOS_COLORS.systemGreen} />
            <Text style={styles.headerTitle}>Nutrition Today</Text>
          </View>
          <Pressable
            style={styles.logButton}
            onPress={() => setChatOpen(true)}
            hitSlop={8}
          >
            <Ionicons name="add-circle" size={16} color={IOS_COLORS.systemGreen} />
            <Text style={styles.logButtonText}>Log a meal</Text>
          </Pressable>
        </View>

        {mealCount === 0 ? (
          <Text style={styles.emptyText}>No meals logged yet. Tap "Log a meal" to get started.</Text>
        ) : (
          <View style={styles.content}>
            {/* Main metrics row */}
            <View style={styles.metricsRow}>
              <MetricPill
                label="Cal"
                value={cal}
                target={calTarget}
                color={IOS_COLORS.systemOrange}
              />
              <MetricPill
                label="Protein"
                value={pro}
                unit="g"
                target={proTarget}
                color={IOS_COLORS.systemRed}
              />
              <MetricPill
                label="Carbs"
                value={carbs}
                unit="g"
                target={targets?.carbs_daily_g}
                color={IOS_COLORS.systemBlue}
              />
              <MetricPill
                label="Fat"
                value={fat}
                unit="g"
                target={targets?.fat_daily_g}
                color={IOS_COLORS.systemYellow}
              />
            </View>

            {/* Calorie progress bar */}
            {calTarget ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, (cal / calTarget) * 100)}%`,
                        backgroundColor: cal > calTarget ? IOS_COLORS.systemRed : IOS_COLORS.systemGreen,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {cal} / {calTarget} cal
                </Text>
              </View>
            ) : null}

            {/* Meal count */}
            <Text style={styles.mealCount}>
              {mealCount} meal{mealCount !== 1 ? 's' : ''} logged
            </Text>
          </View>
        )}
      </View>

      {chatOpen && (
        <NutritionChatSheet
          interestId={interestId}
          interestName={interestName}
          onClose={() => setChatOpen(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// MetricPill sub-component
// ---------------------------------------------------------------------------

function MetricPill({
  label,
  value,
  unit,
  target,
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  target?: number;
  color: string;
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : null;

  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>
        {value}
        {unit && <Text style={styles.pillUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.pillLabel}>{label}</Text>
      {pct !== null && (
        <View style={styles.pillBarTrack}>
          <View
            style={[
              styles.pillBarFill,
              { width: `${pct}%`, backgroundColor: color },
            ]}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.15)',
    padding: IOS_SPACING.sm,
    gap: IOS_SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.systemGreen,
    letterSpacing: 0.3,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  emptyText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    paddingVertical: IOS_SPACING.xs,
  },
  content: {
    gap: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pillValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  pillUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  pillBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressContainer: {
    gap: 3,
  },
  progressTrack: {
    height: 6,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  mealCount: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
});
