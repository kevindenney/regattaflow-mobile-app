/**
 * StepProgressChart — Visualizes capability rating progress across completed steps.
 * Shows colored dots for each capability goal, sized and colored by rating value.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import type { StepMetadata } from '@/types/step-detail';

interface StepProgressChartProps {
  userId: string;
  interestId: string;
}

interface CapabilityDataPoint {
  stepTitle: string;
  rating: number;
}

interface CapabilityRow {
  goal: string;
  dataPoints: CapabilityDataPoint[];
}

function getDotColor(rating: number): string {
  if (rating <= 2) return IOS_COLORS.systemOrange;
  if (rating === 3) return IOS_COLORS.systemYellow;
  return IOS_COLORS.systemGreen;
}

function getDotSize(rating: number): number {
  // Scale from 8 (rating 1) to 20 (rating 5)
  return 8 + (rating - 1) * 3;
}

async function fetchCapabilityProgress(
  userId: string,
  interestId: string,
): Promise<CapabilityRow[]> {
  const { data, error } = await supabase
    .from('timeline_steps')
    .select('title, metadata, updated_at')
    .eq('user_id', userId)
    .eq('interest_id', interestId)
    .eq('status', 'completed')
    .not('metadata->review->capability_progress', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(10);

  if (error || !data || data.length === 0) return [];

  // Collect all capability goals and their ratings across steps
  const goalMap = new Map<string, CapabilityDataPoint[]>();

  for (const row of data) {
    const metadata = row.metadata as StepMetadata | null;
    const progress = metadata?.review?.capability_progress;
    if (!progress) continue;

    for (const [goal, rating] of Object.entries(progress)) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) continue;
      if (!goalMap.has(goal)) goalMap.set(goal, []);
      goalMap.get(goal)!.push({ stepTitle: row.title, rating });
    }
  }

  return Array.from(goalMap.entries()).map(([goal, dataPoints]) => ({
    goal,
    dataPoints,
  }));
}

export function StepProgressChart({ userId, interestId }: StepProgressChartProps) {
  const { data: rows, isLoading } = useQuery<CapabilityRow[], Error>({
    queryKey: ['step-progress', userId, interestId],
    queryFn: () => fetchCapabilityProgress(userId, interestId),
    enabled: Boolean(userId && interestId),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemGray} />
      </View>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No progress data yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rows.map((row) => (
        <View key={row.goal} style={styles.row}>
          <Text style={styles.goalLabel} numberOfLines={2}>
            {row.goal}
          </Text>
          <View style={styles.dotsContainer}>
            {row.dataPoints.map((dp, idx) => {
              const size = getDotSize(dp.rating);
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: getDotColor(dp.rating),
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      ))}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: IOS_COLORS.systemOrange }]} />
          <Text style={styles.legendText}>1-2</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: IOS_COLORS.systemYellow }]} />
          <Text style={styles.legendText}>3</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: IOS_COLORS.systemGreen }]} />
          <Text style={styles.legendText}>4-5</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.sm,
  },
  loadingContainer: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    padding: IOS_SPACING.sm,
    gap: IOS_SPACING.sm,
  },
  goalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    minWidth: 80,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  dot: {
    // width, height, borderRadius, backgroundColor set dynamically
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
  },
});
