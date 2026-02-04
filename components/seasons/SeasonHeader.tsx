/**
 * Season Header
 *
 * Tufte-inspired typography-only header for current season context.
 * Pure data: season name on left, completion fraction on right.
 * No decorative elements - data density through typography.
 *
 * Following Tufte's principle: every pixel of ink conveys unique information.
 * - Removed dropdown chevron (tap whole area for picker)
 * - Removed "Archive >" link (access via long-press or swipe)
 * - Removed date range line entirely
 * - Removed "X completed · Y upcoming" — the fraction communicates this
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import type { SeasonWithSummary } from '@/types/season';

interface SeasonHeaderProps {
  /** Current season with summary data */
  season: SeasonWithSummary | null;
  /** Total races in the season */
  totalRaces?: number;
  /** Override upcoming races count (calculated from displayed races) */
  upcomingRaces?: number;
  /** Callback when archive link is tapped (now via long-press) */
  onArchivePress?: () => void;
  /** Callback when season name is tapped (for season picker/settings) */
  onSeasonPress?: () => void;
  /** Callback when upcoming count is tapped (scroll to upcoming races) */
  onUpcomingPress?: () => void;
  /** Callback when "Start season" is tapped (no active season state) */
  onStartSeasonPress?: () => void;
  /** Whether to show compact version */
  compact?: boolean;
  /** Whether we're in "All Races" mode (no season filter) */
  showAllRaces?: boolean;
}

export function SeasonHeader({
  season,
  totalRaces,
  upcomingRaces: upcomingRacesProp,
  onArchivePress,
  onSeasonPress,
  onUpcomingPress,
  onStartSeasonPress,
  compact = false,
  showAllRaces = false,
}: SeasonHeaderProps) {
  // "All Races" mode - show all races without season filter
  if (showAllRaces && !season) {
    return (
      <Pressable
        style={[styles.container, compact && styles.containerCompact]}
        onPress={onSeasonPress}
        onLongPress={onArchivePress}
      >
        <Text style={[styles.seasonName, styles.allRacesText, compact && styles.seasonNameCompact]}>
          All Races
        </Text>
        {totalRaces !== undefined && (
          <Text style={[styles.fraction, compact && styles.fractionCompact]}>
            {totalRaces} total
          </Text>
        )}
      </Pressable>
    );
  }

  // No season state - minimal, clean
  if (!season) {
    return (
      <Pressable
        style={[styles.container, compact && styles.containerCompact]}
        onPress={onStartSeasonPress}
        onLongPress={onArchivePress}
      >
        <Text style={[styles.noSeasonText, compact && styles.noSeasonTextCompact]}>No active season</Text>
      </Pressable>
    );
  }

  const raceCount = totalRaces ?? season.summary.total_races;
  const completedRaces = season.summary.completed_races;

  // Tufte: Single row - season name left, fraction right
  // Tap anywhere for season picker, long-press for archive
  return (
    <Pressable
      style={[styles.container, compact && styles.containerCompact]}
      onPress={onSeasonPress}
      onLongPress={onArchivePress}
    >
      <Text
        style={[styles.seasonName, compact && styles.seasonNameCompact]}
        numberOfLines={1}
      >
        {compact ? (season.short_name || season.name) : season.name}
      </Text>
      <Text style={[styles.fraction, compact && styles.fractionCompact]}>
        {completedRaces} of {raceCount}
      </Text>
    </Pressable>
  );
}

// =============================================================================
// STYLES - Tufte Minimalist
// =============================================================================

const styles = StyleSheet.create({
  // Container: single row, space-between
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  containerCompact: {
    paddingVertical: 8,
  },

  // No season state
  noSeasonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  noSeasonTextCompact: {
    fontSize: 14,
  },
  // All races mode
  allRacesText: {
    color: IOS_COLORS.secondaryLabel,
  },

  // Season name - left aligned
  seasonName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  seasonNameCompact: {
    fontSize: 14,
  },

  // Fraction - right aligned, muted
  fraction: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  fractionCompact: {
    fontSize: 13,
  },
});

export default SeasonHeader;
