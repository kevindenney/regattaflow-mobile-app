/**
 * SeasonHistorySection Component (Tufte-Style)
 *
 * Compact season history with slope graph and recent season list.
 * Hairline dividers, typography hierarchy, no cards.
 *
 * Tufte principles:
 * - High data-ink ratio
 * - Slope graph for position trajectory
 * - Dense, scannable season list
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { CompactSlopeGraph } from '@/components/seasons/SeasonSlopeGraph';
import { ordinal } from '@/lib/tufte';
import type { SeasonListItem, SeasonWithSummary } from '@/types/season';

// =============================================================================
// TYPES
// =============================================================================

interface SeasonHistorySectionProps {
  /** Seasons with summary data for the slope graph */
  seasonsWithSummary: SeasonWithSummary[];
  /** Flat season list for the compact list */
  seasons: SeasonListItem[];
  /** Max number of seasons to show in compact list */
  limit?: number;
  /** Callback when a season row is pressed */
  onSeasonPress?: (seasonId: string) => void;
  /** Callback for "View all seasons" */
  onViewAll?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) return `${startMonth} ${startYear}`;
    return `${startMonth}–${endMonth} ${startYear}`;
  }
  return `${startMonth} ${startYear}–${endMonth} ${endYear}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SeasonHistorySection({
  seasonsWithSummary,
  seasons,
  limit = 5,
  onSeasonPress,
  onViewAll,
}: SeasonHistorySectionProps) {
  // Sort seasons by year descending
  const sortedSeasons = [...seasons].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    if (a.year !== b.year) return b.year - a.year;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const displaySeasons = sortedSeasons.slice(0, limit);
  const hasMore = sortedSeasons.length > limit;

  if (seasons.length === 0) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Season History</Text>
        <Text style={styles.emptyText}>
          No seasons yet. Start your first season to track progress across regattas.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Season History</Text>

      {/* Slope Graph — shows position trajectory */}
      {seasonsWithSummary.length >= 2 && (
        <View style={styles.slopeGraphContainer}>
          <CompactSlopeGraph seasons={seasonsWithSummary} width={140} height={28} />
          <Text style={styles.slopeLabel}>position trend</Text>
        </View>
      )}

      {/* Compact season list */}
      {displaySeasons.map((season, index) => {
        const isActive = season.status === 'active';
        const dateRange = formatDateRange(season.start_date, season.end_date);
        const positionText = season.user_position
          ? ordinal(season.user_position)
          : null;

        return (
          <TouchableOpacity
            key={season.id}
            style={[
              styles.seasonRow,
              index < displaySeasons.length - 1 && styles.seasonRowBorder,
            ]}
            onPress={() => onSeasonPress?.(season.id)}
            activeOpacity={0.6}
            disabled={!onSeasonPress}
          >
            <View style={styles.seasonRowLeft}>
              <Text
                style={[
                  styles.seasonName,
                  isActive && styles.seasonNameActive,
                ]}
                numberOfLines={1}
              >
                {season.name}
                {isActive && (
                  <Text style={styles.activeBadge}> · current</Text>
                )}
              </Text>
              <Text style={styles.seasonMeta}>
                {dateRange} · {season.completed_count}/{season.race_count} races
                {season.user_points != null && ` · ${season.user_points}pts`}
              </Text>
            </View>
            {positionText && (
              <Text style={styles.positionText}>{positionText}</Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* View all link */}
      {hasMore && onViewAll && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.6}
        >
          <Text style={styles.viewAllText}>
            View all {sortedSeasons.length} seasons
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  slopeGraphContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  slopeLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  seasonRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  seasonRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  seasonName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  seasonNameActive: {
    fontWeight: '600',
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  seasonMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
    fontVariant: ['tabular-nums'],
  },
  positionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  viewAllButton: {
    paddingVertical: 12,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9ca3af',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
