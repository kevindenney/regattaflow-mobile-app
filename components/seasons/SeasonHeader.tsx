/**
 * Season Header
 *
 * Tufte-inspired typography-only header for current season context.
 * Shows season name, race position, and upcoming count.
 * No decorative elements - data density through typography.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/components/cards/constants';
import type { SeasonWithSummary } from '@/types/season';

interface SeasonHeaderProps {
  /** Current season with summary data */
  season: SeasonWithSummary | null;
  /** Current race index (0-based) */
  currentRaceIndex?: number;
  /** Total races in the season */
  totalRaces?: number;
  /** Override upcoming races count (calculated from displayed races) */
  upcomingRaces?: number;
  /** Callback when archive link is tapped */
  onArchivePress?: () => void;
  /** Callback when season name is tapped (for season picker/settings) */
  onSeasonPress?: () => void;
  /** Callback when upcoming count is tapped (scroll to upcoming races) */
  onUpcomingPress?: () => void;
  /** Callback when "Start season" is tapped (no active season state) */
  onStartSeasonPress?: () => void;
  /** Whether to show compact version */
  compact?: boolean;
}

export function SeasonHeader({
  season,
  currentRaceIndex = 0,
  totalRaces,
  upcomingRaces: upcomingRacesProp,
  onArchivePress,
  onSeasonPress,
  onUpcomingPress,
  onStartSeasonPress,
  compact = false,
}: SeasonHeaderProps) {
  if (!season) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSeasonText}>No active season</Text>
        <View style={styles.noSeasonActions}>
          {onArchivePress && (
            <TouchableOpacity onPress={onArchivePress} style={styles.archiveLink}>
              <Text style={styles.archiveLinkText}>View archive</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={IOS_COLORS.blue} />
            </TouchableOpacity>
          )}
          {onStartSeasonPress && (
            <TouchableOpacity onPress={onStartSeasonPress} style={styles.startSeasonLink}>
              <Text style={styles.startSeasonText}>Start season</Text>
              <MaterialCommunityIcons name="plus" size={16} color={IOS_COLORS.blue} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const raceCount = totalRaces ?? season.summary.total_races;
  const completedRaces = season.summary.completed_races;
  const upcomingRaces = upcomingRacesProp ?? season.summary.upcoming_races;
  const currentRace = currentRaceIndex + 1;

  // Format date range
  const startDate = new Date(season.start_date);
  const endDate = new Date(season.end_date);
  const dateRange = formatDateRange(startDate, endDate);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onSeasonPress}
        activeOpacity={0.7}
        disabled={!onSeasonPress}
      >
        <Text style={styles.compactSeasonName} numberOfLines={1}>
          {season.short_name || season.name}
        </Text>
        <Text style={styles.compactSeparator}>·</Text>
        <Text style={styles.compactRacePosition}>
          Race {currentRace} of {raceCount}
        </Text>
        {upcomingRaces > 0 && (
          <>
            <Text style={styles.compactSeparator}>·</Text>
            <TouchableOpacity
              onPress={onUpcomingPress}
              disabled={!onUpcomingPress}
              activeOpacity={0.7}
            >
              <Text style={styles.compactUpcoming}>{upcomingRaces} upcoming</Text>
            </TouchableOpacity>
          </>
        )}
        {onSeasonPress && (
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={IOS_COLORS.gray}
            style={styles.compactChevron}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Season Name Row */}
      <View style={styles.nameRow}>
        <TouchableOpacity
          onPress={onSeasonPress}
          disabled={!onSeasonPress}
          activeOpacity={0.7}
          style={styles.nameButton}
        >
          <Text style={styles.seasonName}>{season.name}</Text>
          {onSeasonPress && (
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={IOS_COLORS.gray}
            />
          )}
        </TouchableOpacity>

        {onArchivePress && (
          <TouchableOpacity onPress={onArchivePress} style={styles.archiveLink}>
            <Text style={styles.archiveLinkText}>Archive</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={IOS_COLORS.blue} />
          </TouchableOpacity>
        )}
      </View>

      {/* Context Row - Tufte data strip */}
      <View style={styles.contextRow}>
        <Text style={styles.dateRange}>{dateRange}</Text>
        <Text style={styles.contextSeparator}>·</Text>
        <Text style={styles.raceCount}>{raceCount} races</Text>
        {completedRaces > 0 && (
          <>
            <Text style={styles.contextSeparator}>·</Text>
            <Text style={styles.completedCount}>{completedRaces} completed</Text>
          </>
        )}
      </View>

      {/* Position Row - Primary data */}
      <View style={styles.positionRow}>
        <Text style={styles.racePosition}>
          Race {currentRace} of {raceCount}
        </Text>
        {upcomingRaces > 0 && (
          <>
            <Text style={styles.positionSeparator}>·</Text>
            <TouchableOpacity
              onPress={onUpcomingPress}
              disabled={!onUpcomingPress}
              activeOpacity={0.7}
            >
              <Text style={styles.upcomingCount}>{upcomingRaces} upcoming</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* User Standing (if available) */}
      {season.summary.user_standing && (
        <View style={styles.standingRow}>
          <Text style={styles.standingRank}>
            {formatOrdinal(season.summary.user_standing.rank)} place
          </Text>
          <Text style={styles.standingSeparator}>·</Text>
          <Text style={styles.standingPoints}>
            {season.summary.user_standing.net_points} pts
          </Text>
          {season.summary.user_standing.wins > 0 && (
            <>
              <Text style={styles.standingSeparator}>·</Text>
              <Text style={styles.standingWins}>
                {season.summary.user_standing.wins} {season.summary.user_standing.wins === 1 ? 'win' : 'wins'}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startMonth} ${startYear}`;
    }
    return `${startMonth}–${endMonth} ${startYear}`;
  }
  return `${startMonth} ${startYear}–${endMonth} ${endYear}`;
}

function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // No season state
  noSeasonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  noSeasonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  startSeasonLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startSeasonText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.2,
  },

  // Archive link
  archiveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  archiveLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Context row
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  dateRange: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  contextSeparator: {
    fontSize: 13,
    color: IOS_COLORS.gray3,
  },
  raceCount: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  completedCount: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },

  // Position row
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  racePosition: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  positionSeparator: {
    fontSize: 15,
    color: IOS_COLORS.gray3,
  },
  upcomingCount: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Standing row
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  standingRank: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  standingSeparator: {
    fontSize: 14,
    color: IOS_COLORS.gray3,
  },
  standingPoints: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  standingWins: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  compactSeasonName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flexShrink: 1,
  },
  compactSeparator: {
    fontSize: 14,
    color: IOS_COLORS.gray3,
  },
  compactRacePosition: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  compactUpcoming: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  compactChevron: {
    marginLeft: 2,
  },
});

export default SeasonHeader;
