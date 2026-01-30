/**
 * RelativeEffortCard - Weekly racing effort/intensity display
 *
 * Similar to Strava's Relative Effort feature, shows a weekly
 * intensity score based on racing activity.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { RelativeEffort } from '@/hooks/useReflectData';

interface RelativeEffortCardProps {
  effort: RelativeEffort[];
  onSeeMore?: () => void;
}

function getEffortColor(score: number): string {
  if (score >= 75) return IOS_COLORS.systemRed;
  if (score >= 50) return IOS_COLORS.systemOrange;
  if (score >= 25) return IOS_COLORS.systemYellow;
  return IOS_COLORS.systemGreen;
}

function getEffortLevel(score: number): string {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Moderate';
  if (score >= 25) return 'Light';
  return 'Rest';
}

function formatWeekLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RelativeEffortCard({
  effort,
  onSeeMore,
}: RelativeEffortCardProps) {
  const currentWeek = effort[effort.length - 1];
  const previousWeeks = effort.slice(0, -1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Relative Effort</Text>
          <Text style={styles.subtitle}>
            Your racing intensity based on weekly activity
          </Text>
        </View>
        <Ionicons name="help-circle-outline" size={20} color={IOS_COLORS.tertiaryLabel} />
      </View>

      {currentWeek && (
        <View style={styles.currentWeekContainer}>
          <View style={styles.scoreContainer}>
            <Text
              style={[styles.scoreValue, { color: getEffortColor(currentWeek.score) }]}
            >
              {currentWeek.score}
            </Text>
            <View style={styles.scoreMeta}>
              <Text style={styles.weekLabel}>This Week</Text>
              <Text
                style={[
                  styles.effortLevel,
                  { color: getEffortColor(currentWeek.score) },
                ]}
              >
                {getEffortLevel(currentWeek.score)} Effort
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${currentWeek.score}%`,
                  backgroundColor: getEffortColor(currentWeek.score),
                },
              ]}
            />
          </View>

          {currentWeek.raceCount > 0 && (
            <Text style={styles.raceCountText}>
              {currentWeek.raceCount} {currentWeek.raceCount === 1 ? 'race' : 'races'}{' '}
              this week
            </Text>
          )}
        </View>
      )}

      {/* Previous weeks mini chart */}
      {previousWeeks.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyLabel}>Previous weeks</Text>
          <View style={styles.historyBars}>
            {previousWeeks.map((week, index) => (
              <View key={index} style={styles.historyBarWrapper}>
                <View
                  style={[
                    styles.historyBar,
                    {
                      height: `${Math.max(week.score, 10)}%`,
                      backgroundColor: getEffortColor(week.score),
                    },
                  ]}
                />
                <Text style={styles.historyBarLabel}>
                  {formatWeekLabel(week.weekStart)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {onSeeMore && (
        <Pressable style={styles.seeMoreButton} onPress={onSeeMore}>
          <Text style={styles.seeMoreText}>
            Compare effort for up to 3 months
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  currentWeekContainer: {
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreMeta: {
    gap: 2,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  effortLevel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  raceCountText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  historyContainer: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
    alignItems: 'flex-end',
  },
  historyBarWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  historyBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  historyBarLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
  },
  seeMoreButton: {
    marginTop: 16,
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

export default RelativeEffortCard;
