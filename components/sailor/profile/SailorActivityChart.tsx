/**
 * SailorActivityChart - Strava-style activity visualization
 *
 * Displays a bar chart showing racing activity over the past 12 months.
 * Tapping bars shows detailed stats for that month.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, Flag, Trophy, Award } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_SHADOWS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import {
  useSailorActivityData,
  type MonthlyActivity,
} from '@/hooks/useSailorActivityData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = IOS_SPACING.lg * 2;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING;
const BAR_GAP = 4;
const BAR_WIDTH = (CHART_WIDTH - 11 * BAR_GAP) / 12;
const MAX_BAR_HEIGHT = 80;

interface SailorActivityChartProps {
  userId: string;
}

export function SailorActivityChart({ userId }: SailorActivityChartProps) {
  const { data, isLoading, error } = useSailorActivityData(userId);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyActivity | null>(null);

  // Calculate max value for scaling
  const maxRaces = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.monthlyActivity.map((m) => m.races), 1);
  }, [data]);

  const handleBarPress = useCallback((month: MonthlyActivity) => {
    triggerHaptic('selection');
    setSelectedMonth((prev) => (prev?.fullMonth === month.fullMonth ? null : month));
  }, []);

  const handleChartPress = useCallback(() => {
    setSelectedMonth(null);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return null; // Silently fail if no data
  }

  // If no races at all, show empty state
  if (data.totalRaces === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TrendingUp size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.title}>This Season</Text>
        </View>
        <View style={styles.emptyState}>
          <Flag size={32} color={IOS_COLORS.tertiaryLabel} />
          <Text style={styles.emptyText}>No races logged yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking races to see your activity
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TrendingUp size={18} color={IOS_COLORS.systemBlue} />
        <Text style={styles.title}>This Season</Text>
        <Text style={styles.subtitle}>{data.totalRaces} races</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Flag size={16} color={IOS_COLORS.systemBlue} />
          <Text style={styles.statValue}>{data.totalRaces}</Text>
          <Text style={styles.statLabel}>Races</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Trophy size={16} color={IOS_COLORS.systemYellow} />
          <Text style={styles.statValue}>{data.totalWins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Award size={16} color={IOS_COLORS.systemOrange} />
          <Text style={styles.statValue}>{data.totalPodiums}</Text>
          <Text style={styles.statLabel}>Podiums</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <Pressable style={styles.chartContainer} onPress={handleChartPress}>
        <View style={styles.barsContainer}>
          {data.monthlyActivity.map((month, index) => {
            const barHeight = (month.races / maxRaces) * MAX_BAR_HEIGHT;
            const isSelected = selectedMonth?.fullMonth === month.fullMonth;
            const hasActivity = month.races > 0;

            return (
              <Pressable
                key={month.fullMonth}
                style={styles.barWrapper}
                onPress={() => handleBarPress(month)}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, hasActivity ? 4 : 2),
                      backgroundColor: isSelected
                        ? IOS_COLORS.systemBlue
                        : hasActivity
                        ? IOS_COLORS.systemBlue + '80'
                        : IOS_COLORS.systemGray5,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.monthLabel,
                    isSelected && styles.monthLabelActive,
                  ]}
                >
                  {month.month.charAt(0)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Selected Month Detail */}
        {selectedMonth && (
          <View style={styles.detailCard}>
            <Text style={styles.detailMonth}>{selectedMonth.month}</Text>
            <View style={styles.detailStats}>
              <Text style={styles.detailStat}>
                <Text style={styles.detailValue}>{selectedMonth.races}</Text> race
                {selectedMonth.races !== 1 ? 's' : ''}
              </Text>
              {selectedMonth.wins > 0 && (
                <Text style={styles.detailStat}>
                  <Text style={styles.detailValue}>{selectedMonth.wins}</Text> win
                  {selectedMonth.wins !== 1 ? 's' : ''}
                </Text>
              )}
              {selectedMonth.podiums > 0 && (
                <Text style={styles.detailStat}>
                  <Text style={styles.detailValue}>{selectedMonth.podiums}</Text> podium
                  {selectedMonth.podiums !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  loadingContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    flex: 1,
  },
  subtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: IOS_SPACING.md,
    marginBottom: IOS_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: IOS_COLORS.separator,
  },
  statValue: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.xs,
  },
  statLabel: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  chartContainer: {
    position: 'relative',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: MAX_BAR_HEIGHT + 20,
    paddingTop: IOS_SPACING.sm,
  },
  barWrapper: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  bar: {
    width: BAR_WIDTH - 2,
    borderRadius: IOS_RADIUS.xs,
    minHeight: 2,
  },
  monthLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.xs,
    fontSize: 10,
  },
  monthLabelActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  detailCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: IOS_COLORS.label,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.md,
    minWidth: 100,
  },
  detailMonth: {
    ...IOS_TYPOGRAPHY.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailStats: {
    gap: 2,
  },
  detailStat: {
    ...IOS_TYPOGRAPHY.caption2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailValue: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xl,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.sm,
  },
  emptySubtext: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.xs,
  },
});
