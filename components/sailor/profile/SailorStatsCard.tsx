/**
 * SailorStatsCard - Strava-style stats card showing racing statistics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Medal, Sailboat } from 'lucide-react-native';
import type { SailorStats } from '@/services/SailorProfileService';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
  IOS_SHADOWS,
} from '@/lib/design-tokens-ios';

interface SailorStatsCardProps {
  stats: SailorStats;
}

export function SailorStatsCard({ stats }: SailorStatsCardProps) {
  const formatWinRate = (rate?: number) => {
    if (!rate) return '-';
    return `${(rate * 100).toFixed(0)}%`;
  };

  const formatAvgFinish = (avg?: number) => {
    if (!avg) return '-';
    return avg.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Season</Text>

      <View style={styles.statsGrid}>
        {/* Total Races */}
        <View style={styles.statBox}>
          <View style={[styles.iconContainer, { backgroundColor: IOS_COLORS.systemBlue + '15' }]}>
            <Sailboat size={20} color={IOS_COLORS.systemBlue} />
          </View>
          <Text style={styles.statValue}>{stats.seasonRaces}</Text>
          <Text style={styles.statLabel}>Races</Text>
        </View>

        {/* Wins */}
        <View style={styles.statBox}>
          <View style={[styles.iconContainer, { backgroundColor: IOS_COLORS.systemYellow + '15' }]}>
            <Trophy size={20} color={IOS_COLORS.systemYellow} />
          </View>
          <Text style={styles.statValue}>{stats.seasonWins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>

        {/* Podiums */}
        <View style={styles.statBox}>
          <View style={[styles.iconContainer, { backgroundColor: IOS_COLORS.systemOrange + '15' }]}>
            <Medal size={20} color={IOS_COLORS.systemOrange} />
          </View>
          <Text style={styles.statValue}>{stats.seasonPodiums}</Text>
          <Text style={styles.statLabel}>Podiums</Text>
        </View>
      </View>

      {/* Career Stats */}
      <View style={styles.careerSection}>
        <Text style={styles.careerTitle}>All Time</Text>
        <View style={styles.careerRow}>
          <View style={styles.careerStat}>
            <Text style={styles.careerValue}>{stats.totalRaces}</Text>
            <Text style={styles.careerLabel}>Races</Text>
          </View>
          <View style={styles.careerDivider} />
          <View style={styles.careerStat}>
            <Text style={styles.careerValue}>{stats.wins}</Text>
            <Text style={styles.careerLabel}>Wins</Text>
          </View>
          <View style={styles.careerDivider} />
          <View style={styles.careerStat}>
            <Text style={styles.careerValue}>{formatWinRate(stats.winRate)}</Text>
            <Text style={styles.careerLabel}>Win Rate</Text>
          </View>
          <View style={styles.careerDivider} />
          <View style={styles.careerStat}>
            <Text style={styles.careerValue}>{formatAvgFinish(stats.averageFinish)}</Text>
            <Text style={styles.careerLabel}>Avg Finish</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  statValue: {
    ...IOS_TYPOGRAPHY.title1,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statLabel: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  careerSection: {
    marginTop: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  careerTitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.sm,
  },
  careerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  careerStat: {
    alignItems: 'center',
    flex: 1,
  },
  careerValue: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  careerLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  careerDivider: {
    width: 1,
    height: 24,
    backgroundColor: IOS_COLORS.separator,
  },
});
