/**
 * Season Archive
 *
 * Tufte-inspired archive view for past seasons.
 * Maximum data-ink ratio - status conveyed through typography weight,
 * results as inline text sequences, no decorative badges or section labels.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { ordinal } from '@/lib/tufte';
import type { SeasonListItem, SeasonWithSummary } from '@/types/season';

// =============================================================================
// TYPOGRAPHY STYLES BY STATUS
// =============================================================================

/** Status conveyed through typography hierarchy, not colored badges */
function getStatusTypography(status: string): {
  fontWeight: '300' | '400' | '500' | '600';
  opacity: number;
} {
  switch (status) {
    case 'active':
      return { fontWeight: '600', opacity: 1 };
    case 'completed':
      return { fontWeight: '400', opacity: 0.85 };
    case 'archived':
      return { fontWeight: '300', opacity: 0.7 };
    case 'upcoming':
      return { fontWeight: '500', opacity: 0.9 };
    case 'draft':
    default:
      return { fontWeight: '300', opacity: 0.6 };
  }
}

// =============================================================================
// INLINE RESULTS SPARKLINE
// =============================================================================

/**
 * Format results as inline text sequence: 2·4·1·3·2·5·1
 * Wins shown bold, DNF as ○
 */
function formatResultsSequence(
  results: (number | null)[],
  wins?: number
): React.ReactNode[] {
  if (!results || results.length === 0) return [];

  return results.map((result, index) => {
    const isWin = result === 1;
    const isDNF = result === null;
    const separator = index < results.length - 1 ? '·' : '';

    if (isDNF) {
      return (
        <Text key={index} style={styles.resultDNF}>
          ○{separator}
        </Text>
      );
    }

    return (
      <Text
        key={index}
        style={[styles.resultNumber, isWin && styles.resultWin]}
      >
        {result}{separator}
      </Text>
    );
  });
}

// =============================================================================
// SEASON SUMMARY CARD
// =============================================================================

interface SeasonSummaryCardProps {
  season: SeasonListItem;
  onPress?: () => void;
}

function SeasonSummaryCard({ season, onPress }: SeasonSummaryCardProps) {
  const dateRange = formatDateRange(
    new Date(season.start_date),
    new Date(season.end_date)
  );

  const typography = getStatusTypography(season.status);

  // Build inline summary line: "Summer 2025 → 2nd/12"
  const finalStanding = season.user_position
    ? ` → ${ordinal(season.user_position)}`
    : '';

  return (
    <TouchableOpacity
      style={[styles.card, { opacity: typography.opacity }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Single-line header with status conveyed through weight */}
      <Text
        style={[styles.cardTitle, { fontWeight: typography.fontWeight }]}
        numberOfLines={1}
      >
        {season.name}
        {finalStanding && (
          <Text style={styles.inlineStanding}>{finalStanding}</Text>
        )}
      </Text>

      {/* Metadata line */}
      <Text style={styles.cardMeta}>
        {dateRange} · {season.completed_count}/{season.race_count} races
        {season.user_points !== null && season.user_points !== undefined && (
          <Text style={styles.inlinePoints}> · {season.user_points} pts</Text>
        )}
      </Text>

      {/* View link */}
      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>View races</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={IOS_COLORS.blue} />
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// DETAILED SEASON CARD (for expanded view)
// =============================================================================

interface DetailedSeasonCardProps {
  season: SeasonWithSummary;
  onPress?: () => void;
}

export function DetailedSeasonCard({ season, onPress }: DetailedSeasonCardProps) {
  const dateRange = formatDateRange(
    new Date(season.start_date),
    new Date(season.end_date)
  );

  const { summary } = season;
  const results = summary.results || [];
  const typography = getStatusTypography(season.status);

  // Build compact standing string: "2nd/12"
  const standingString = summary.user_standing
    ? `${ordinal(summary.user_standing.rank)}/${summary.user_standing.total_entries}`
    : '';

  return (
    <TouchableOpacity
      style={[styles.detailedCard, { opacity: typography.opacity }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header - season name with inline standing */}
      <View style={styles.detailedHeader}>
        <Text
          style={[styles.detailedTitle, { fontWeight: typography.fontWeight }]}
          numberOfLines={1}
        >
          {season.name}
        </Text>
        {standingString && (
          <Text style={styles.headerStanding}>→ {standingString}</Text>
        )}
      </View>

      {/* Inline results sequence with final position */}
      {results.length > 0 && (
        <View style={styles.resultsInline}>
          <Text style={styles.resultsSequenceText}>
            {formatResultsSequence(results)}
          </Text>
          {summary.user_standing && (
            <Text style={styles.resultsArrow}>
              {' '}→ {summary.user_standing.net_points}pts
            </Text>
          )}
        </View>
      )}

      {/* Compact stats line - no labels, just data */}
      {summary.user_standing && (
        <Text style={styles.statsLine}>
          {summary.user_standing.wins > 0 && (
            <Text style={styles.winsHighlight}>
              {summary.user_standing.wins}× 1st
            </Text>
          )}
          {summary.user_standing.wins > 0 && summary.user_standing.podiums > summary.user_standing.wins && ' · '}
          {summary.user_standing.podiums > summary.user_standing.wins && (
            <Text>{summary.user_standing.podiums - summary.user_standing.wins}× top 3</Text>
          )}
        </Text>
      )}

      {/* Conditions - single dense line */}
      {summary.conditions && (
        <Text style={styles.conditionsLine}>
          {summary.conditions.avg_wind_speed}kt avg ({summary.conditions.wind_range[0]}–{summary.conditions.wind_range[1]}) · {summary.conditions.predominant_direction}
        </Text>
      )}

      {/* Race counts and date */}
      <Text style={styles.metaLine}>
        {dateRange} · {summary.completed_races}/{summary.total_races} races
        {summary.regatta_count > 0 && ` · ${summary.regatta_count} regattas`}
      </Text>

      {/* View link */}
      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>View all races</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={IOS_COLORS.blue} />
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// SEASON ARCHIVE COMPONENT
// =============================================================================

interface SeasonArchiveProps {
  /** List of seasons to display */
  seasons: SeasonListItem[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback for pull-to-refresh */
  onRefresh?: () => void;
  /** Callback when a season is selected */
  onSeasonPress?: (seasonId: string) => void;
  /** Callback for back navigation */
  onBackPress?: () => void;
  /** Optional header content */
  headerContent?: React.ReactNode;
}

export function SeasonArchive({
  seasons,
  isLoading = false,
  onRefresh,
  onSeasonPress,
  onBackPress,
  headerContent,
}: SeasonArchiveProps) {
  // Sort seasons: active first, then by year descending, then by status
  const sortedSeasons = [...seasons].sort((a, b) => {
    // Active seasons first
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;

    // Then by year
    if (a.year !== b.year) return b.year - a.year;

    // Then by start date
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  // Group by year
  const seasonsByYear = groupByYear(sortedSeasons);
  const years = Object.keys(seasonsByYear).sort((a, b) => Number(b) - Number(a));

  const totalRaces = seasons.reduce((sum, s) => sum + s.race_count, 0);
  const totalCompleted = seasons.reduce((sum, s) => sum + s.completed_count, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={IOS_COLORS.blue} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Season Archive</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {headerContent}

        {/* Summary - single dense line, no label */}
        <Text style={styles.summaryStats}>
          {seasons.length} seasons · {totalRaces} races · {totalCompleted} completed
        </Text>

        {/* Seasons by year */}
        {years.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No archived seasons</Text>
            <Text style={styles.emptySubtext}>
              Completed seasons will appear here
            </Text>
          </View>
        ) : (
          years.map((year) => (
            <View key={year} style={styles.yearSection}>
              <Text style={styles.yearLabel}>{year}</Text>
              {seasonsByYear[year].map((season) => (
                <SeasonSummaryCard
                  key={season.id}
                  season={season}
                  onPress={() => onSeasonPress?.(season.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
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

function groupByYear(seasons: SeasonListItem[]): Record<string, SeasonListItem[]> {
  return seasons.reduce((acc, season) => {
    const year = String(season.year);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(season);
    return acc;
  }, {} as Record<string, SeasonListItem[]>);
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray4,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
    textAlign: 'center',
    marginRight: 60, // Balance back button
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Summary - single dense line
  summaryStats: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },

  // Year sections
  yearSection: {
    marginBottom: 20,
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // Card styles
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  inlineStanding: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  inlinePoints: {
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Detailed card styles
  detailedCard: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailedTitle: {
    fontSize: 16,
    color: IOS_COLORS.label,
    flex: 1,
  },
  headerStanding: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginLeft: 8,
  },

  // Inline results sequence
  resultsInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  resultsSequenceText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  resultNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  resultWin: {
    fontWeight: '700',
  },
  resultDNF: {
    fontSize: 14,
    color: IOS_COLORS.gray3,
  },
  resultsArrow: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },

  // Stats line
  statsLine: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  winsHighlight: {
    fontWeight: '600',
    color: IOS_COLORS.green,
  },

  // Conditions line
  conditionsLine: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },

  // Meta line
  metaLine: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginBottom: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});

export default SeasonArchive;
