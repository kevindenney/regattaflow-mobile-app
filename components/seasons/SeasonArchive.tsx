/**
 * Season Archive
 *
 * Tufte-inspired archive view for past seasons.
 * Uses small multiples pattern - each season is a comparable data-dense card.
 * Shows results sequence as inline text sparkline, standings, conditions.
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
import type { SeasonListItem, SeasonWithSummary } from '@/types/season';

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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{season.name}</Text>
        <StatusBadge status={season.status} />
      </View>

      {/* Metadata line */}
      <Text style={styles.cardMeta}>
        {dateRange} · {season.race_count} races · {season.completed_count} completed
      </Text>

      {/* User standing (if available) */}
      {season.user_position && (
        <View style={styles.standingRow}>
          <Text style={styles.standingLabel}>Your result:</Text>
          <Text style={styles.standingValue}>
            {formatOrdinal(season.user_position)} place
          </Text>
          {season.user_points !== null && (
            <>
              <Text style={styles.standingSeparator}>·</Text>
              <Text style={styles.standingPoints}>{season.user_points} pts</Text>
            </>
          )}
        </View>
      )}

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

  return (
    <TouchableOpacity
      style={styles.detailedCard}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.detailedHeader}>
        <Text style={styles.detailedTitle}>{season.name}</Text>
        <StatusBadge status={season.status} />
      </View>

      {/* Metadata */}
      <Text style={styles.detailedMeta}>{dateRange}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Results sequence - text sparkline */}
      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionLabel}>RESULTS</Text>
          <View style={styles.resultsSequence}>
            {results.map((result, index) => (
              <Text
                key={index}
                style={[
                  styles.resultNumber,
                  result === 1 && styles.resultWin,
                  result === null && styles.resultDNS,
                ]}
              >
                {result === null ? '·' : result}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Standing summary */}
      {summary.user_standing && (
        <View style={styles.standingsSection}>
          <Text style={styles.sectionLabel}>STANDINGS</Text>
          <View style={styles.standingsGrid}>
            <View style={styles.standingStat}>
              <Text style={styles.statValue}>
                {formatOrdinal(summary.user_standing.rank)}
              </Text>
              <Text style={styles.statLabel}>of {summary.user_standing.total_entries}</Text>
            </View>
            <View style={styles.standingStat}>
              <Text style={styles.statValue}>{summary.user_standing.net_points}</Text>
              <Text style={styles.statLabel}>points</Text>
            </View>
            <View style={styles.standingStat}>
              <Text style={[styles.statValue, styles.statWins]}>
                {summary.user_standing.wins}
              </Text>
              <Text style={styles.statLabel}>{summary.user_standing.wins === 1 ? 'win' : 'wins'}</Text>
            </View>
            <View style={styles.standingStat}>
              <Text style={styles.statValue}>{summary.user_standing.podiums}</Text>
              <Text style={styles.statLabel}>podiums</Text>
            </View>
          </View>
        </View>
      )}

      {/* Conditions summary */}
      {summary.conditions && (
        <View style={styles.conditionsSection}>
          <Text style={styles.sectionLabel}>CONDITIONS</Text>
          <Text style={styles.conditionsText}>
            Avg wind {summary.conditions.avg_wind_speed}kt
            ({summary.conditions.wind_range[0]}–{summary.conditions.wind_range[1]}kt)
            · {summary.conditions.predominant_direction}
          </Text>
          <Text style={styles.conditionsDetail}>
            {summary.conditions.light_days} light days · {summary.conditions.heavy_days} heavy days
          </Text>
        </View>
      )}

      {/* Race counts */}
      <View style={styles.countsSection}>
        <Text style={styles.countsText}>
          {summary.total_races} races · {summary.completed_races} completed
          {summary.regatta_count > 0 && ` · ${summary.regatta_count} regattas`}
        </Text>
      </View>

      {/* View link */}
      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>View all {summary.total_races} races</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={IOS_COLORS.blue} />
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// STATUS BADGE
// =============================================================================

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: IOS_COLORS.green },
    completed: { label: 'Completed', color: IOS_COLORS.blue },
    archived: { label: 'Archived', color: IOS_COLORS.gray },
    upcoming: { label: 'Upcoming', color: IOS_COLORS.orange },
    draft: { label: 'Draft', color: IOS_COLORS.gray2 },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Text style={[styles.statusBadge, { color: config.color }]}>
      {config.label}
    </Text>
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
  // Group seasons by year for visual organization
  const seasonsByYear = groupByYear(seasons);
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

        {/* Summary stats */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>YOUR RACING HISTORY</Text>
          <Text style={styles.summaryStats}>
            {seasons.length} seasons · {totalRaces} races · {totalCompleted} completed
          </Text>
        </View>

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

function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

  // Summary section
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryStats: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Year sections
  yearSection: {
    marginBottom: 24,
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
    paddingLeft: 4,
  },

  // Card styles
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  standingLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  standingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  standingSeparator: {
    fontSize: 13,
    color: IOS_COLORS.gray3,
  },
  standingPoints: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Status badge
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Detailed card styles
  detailedCard: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  detailedMeta: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.gray4,
    marginVertical: 12,
  },

  // Results section
  resultsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    marginBottom: 6,
  },
  resultsSequence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    minWidth: 20,
    textAlign: 'center',
  },
  resultWin: {
    color: IOS_COLORS.green,
  },
  resultDNS: {
    color: IOS_COLORS.gray3,
  },

  // Standings section
  standingsSection: {
    marginBottom: 12,
  },
  standingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  standingStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statWins: {
    color: IOS_COLORS.green,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Conditions section
  conditionsSection: {
    marginBottom: 12,
  },
  conditionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  conditionsDetail: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Counts section
  countsSection: {
    marginBottom: 8,
  },
  countsText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
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
