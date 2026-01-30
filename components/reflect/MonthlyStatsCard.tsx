/**
 * MonthlyStatsCard - Monthly sailing statistics summary
 *
 * Similar to Strava's monthly activities card, shows races sailed,
 * podiums, time on water, and comparison to last month.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { MonthlyStats } from '@/hooks/useReflectData';

interface MonthlyStatsCardProps {
  stats: MonthlyStats;
  onSeeMore?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function ComparisonBadge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  if (value === 0) return null;

  const isPositive = value > 0;
  return (
    <View
      style={[
        styles.comparisonBadge,
        isPositive ? styles.comparisonPositive : styles.comparisonNegative,
      ]}
    >
      <Ionicons
        name={isPositive ? 'arrow-up' : 'arrow-down'}
        size={10}
        color={isPositive ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed}
      />
      <Text
        style={[
          styles.comparisonText,
          isPositive ? styles.comparisonTextPositive : styles.comparisonTextNegative,
        ]}
      >
        {Math.abs(value)} {label}
      </Text>
    </View>
  );
}

export function MonthlyStatsCard({ stats, onSeeMore }: MonthlyStatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Activities</Text>
        <Text style={styles.subtitle}>
          You raced {stats.racesSailed} {stats.racesSailed === 1 ? 'time' : 'times'} this month
          {stats.comparedToLastMonth.racesSailed !== 0 && (
            <Text style={styles.subtitleMuted}>
              {' '}&mdash; {stats.comparedToLastMonth.racesSailed > 0 ? 'up' : 'down'}{' '}
              {Math.abs(stats.comparedToLastMonth.racesSailed)} from last month
            </Text>
          )}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Races */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flag" size={18} color={IOS_COLORS.systemBlue} />
          </View>
          <Text style={styles.statValue}>{stats.racesSailed}</Text>
          <Text style={styles.statLabel}>Races</Text>
        </View>

        {/* Podiums */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trophy" size={18} color={IOS_COLORS.systemOrange} />
          </View>
          <Text style={styles.statValue}>{stats.podiums}</Text>
          <Text style={styles.statLabel}>Podiums</Text>
        </View>

        {/* Time on Water */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={18} color={IOS_COLORS.systemTeal} />
          </View>
          <Text style={styles.statValue}>{formatDuration(stats.timeOnWater)}</Text>
          <Text style={styles.statLabel}>On Water</Text>
        </View>

        {/* Average Finish */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="stats-chart" size={18} color={IOS_COLORS.systemPurple} />
          </View>
          <Text style={styles.statValue}>
            {stats.averageFinish !== null ? stats.averageFinish.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>Avg Finish</Text>
        </View>
      </View>

      {/* Comparison badges */}
      {(stats.comparedToLastMonth.racesSailed !== 0 ||
        stats.comparedToLastMonth.podiums !== 0) && (
        <View style={styles.comparisons}>
          <ComparisonBadge
            value={stats.comparedToLastMonth.racesSailed}
            label="races"
          />
          <ComparisonBadge
            value={stats.comparedToLastMonth.podiums}
            label="podiums"
          />
        </View>
      )}

      {onSeeMore && (
        <Pressable style={styles.seeMoreButton} onPress={onSeeMore}>
          <Text style={styles.seeMoreText}>
            See more of your {stats.month.split(' ')[0]} stats...
          </Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.08,
  },
  subtitleMuted: {
    color: IOS_COLORS.tertiaryLabel,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comparisonPositive: {
    backgroundColor: IOS_COLORS.systemGreen + '20',
  },
  comparisonNegative: {
    backgroundColor: IOS_COLORS.systemRed + '20',
  },
  comparisonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  comparisonTextPositive: {
    color: IOS_COLORS.systemGreen,
  },
  comparisonTextNegative: {
    color: IOS_COLORS.systemRed,
  },
  seeMoreButton: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
    letterSpacing: -0.08,
  },
});

export default MonthlyStatsCard;
