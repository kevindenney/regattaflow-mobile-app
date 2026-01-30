/**
 * StatisticsSection - Detailed statistics view for Reflect tab
 *
 * Shows season and all-time stats in a Strava-inspired layout.
 * Includes races, wins, podiums, win rate, average finish, and streaks.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { ProfileStats } from '@/hooks/useReflectProfile';

interface StatisticsSectionProps {
  stats: ProfileStats;
  onSeeMore?: () => void;
}

function formatWinRate(rate: number | null): string {
  if (rate === null) return '-';
  return `${Math.round(rate * 100)}%`;
}

function formatAvgFinish(avg: number | null): string {
  if (avg === null) return '-';
  return avg.toFixed(1);
}

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function StatisticsSection({ stats, onSeeMore }: StatisticsSectionProps) {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        {onSeeMore && (
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

      {/* Season Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{currentYear} Season</Text>
        <View style={styles.statsGrid}>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: IOS_COLORS.systemBlue + '15' }]}>
              <Ionicons name="flag" size={18} color={IOS_COLORS.systemBlue} />
            </View>
            <Text style={styles.gridValue}>{stats.seasonRaces}</Text>
            <Text style={styles.gridLabel}>Races</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: IOS_COLORS.systemYellow + '15' }]}>
              <Ionicons name="trophy" size={18} color={IOS_COLORS.systemYellow} />
            </View>
            <Text style={styles.gridValue}>{stats.seasonWins}</Text>
            <Text style={styles.gridLabel}>Wins</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: IOS_COLORS.systemOrange + '15' }]}>
              <Ionicons name="medal" size={18} color={IOS_COLORS.systemOrange} />
            </View>
            <Text style={styles.gridValue}>{stats.seasonPodiums}</Text>
            <Text style={styles.gridLabel}>Podiums</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: IOS_COLORS.systemGreen + '15' }]}>
              <Ionicons name="analytics" size={18} color={IOS_COLORS.systemGreen} />
            </View>
            <Text style={styles.gridValue}>
              {formatAvgFinish(stats.seasonAverageFinish)}
            </Text>
            <Text style={styles.gridLabel}>Avg Finish</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* All-Time Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Time</Text>
        <View style={styles.allTimeGrid}>
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>{stats.totalRaces}</Text>
            <Text style={styles.allTimeLabel}>Races</Text>
          </View>
          <View style={styles.allTimeDivider} />
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>{stats.totalWins}</Text>
            <Text style={styles.allTimeLabel}>Wins</Text>
          </View>
          <View style={styles.allTimeDivider} />
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>{stats.totalPodiums}</Text>
            <Text style={styles.allTimeLabel}>Podiums</Text>
          </View>
          <View style={styles.allTimeDivider} />
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>{formatWinRate(stats.winRate)}</Text>
            <Text style={styles.allTimeLabel}>Win Rate</Text>
          </View>
        </View>
        <View style={styles.allTimeGrid}>
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>
              {formatAvgFinish(stats.averageFinish)}
            </Text>
            <Text style={styles.allTimeLabel}>Avg Finish</Text>
          </View>
          <View style={styles.allTimeDivider} />
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>{stats.currentStreak}</Text>
            <Text style={styles.allTimeLabel}>Week Streak</Text>
          </View>
          <View style={styles.allTimeDivider} />
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>{stats.longestStreak}</Text>
            <Text style={styles.allTimeLabel}>Best Streak</Text>
          </View>
          <View style={styles.allTimeDivider} />
          <View style={styles.allTimeItem}>
            <Text style={styles.allTimeValue}>
              {formatHours(stats.totalTimeOnWater)}
            </Text>
            <Text style={styles.allTimeLabel}>On Water</Text>
          </View>
        </View>
      </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
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
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gridItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginVertical: 16,
  },
  allTimeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  allTimeItem: {
    alignItems: 'center',
    flex: 1,
  },
  allTimeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  allTimeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  allTimeDivider: {
    width: 1,
    height: 28,
    backgroundColor: IOS_COLORS.separator,
  },
});

export default StatisticsSection;
