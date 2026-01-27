/**
 * Season Table View
 *
 * Tufte-inspired dense tabular display for season history.
 * Maximum data-ink ratio - no colored badges, minimal borders,
 * tabular numbers for alignment.
 *
 * Format:
 * Season          Races   Result   Points   Best
 * ────────────────────────────────────────────────
 * Summer '25      12/12   2nd      47       1st (3×)
 * Spring '25       8/10   4th      62       2nd
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { ordinal } from '@/lib/tufte';
import type { SeasonListItem, SeasonWithSummary } from '@/types/season';

// =============================================================================
// TYPES
// =============================================================================

interface SeasonTableRow {
  id: string;
  name: string;
  shortName: string;
  status: string;
  races: string;       // "12/12"
  result: string;      // "2nd" or "—"
  points: string;      // "47" or "—"
  best: string;        // "1st (3×)" or "—"
  year: number;
}

interface SeasonTableViewProps {
  /** Seasons with full summary data */
  seasons: SeasonWithSummary[];
  /** Callback when a row is pressed */
  onSeasonPress?: (seasonId: string) => void;
  /** Whether to show year dividers */
  showYearDividers?: boolean;
  /** Maximum rows to display (for compact preview) */
  maxRows?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatShortName(name: string, year: number): string {
  // Try to abbreviate: "Summer Series 2025" → "Summer '25"
  const words = name.split(' ');
  const seasonWord = words[0];

  // Get last 2 digits of year
  const yearShort = `'${String(year).slice(-2)}`;

  // If name already includes year, just use first word + abbreviated year
  if (name.includes(String(year))) {
    return `${seasonWord} ${yearShort}`;
  }

  return `${seasonWord} ${yearShort}`;
}

function formatBestFinish(
  bestFinish?: number,
  wins?: number
): string {
  if (!bestFinish) return '—';

  const position = ordinal(bestFinish);

  // Show win count if multiple wins
  if (wins && wins > 1 && bestFinish === 1) {
    return `${position} (${wins}×)`;
  }

  return position;
}

/** Transform SeasonWithSummary to table row */
function toTableRow(season: SeasonWithSummary): SeasonTableRow {
  const { summary } = season;

  return {
    id: season.id,
    name: season.name,
    shortName: season.short_name || formatShortName(season.name, season.year),
    status: season.status,
    races: `${summary.completed_races}/${summary.total_races}`,
    result: summary.user_standing
      ? ordinal(summary.user_standing.rank)
      : '—',
    points: summary.user_standing
      ? String(summary.user_standing.net_points)
      : '—',
    best: formatBestFinish(
      summary.user_standing?.best_finish,
      summary.user_standing?.wins
    ),
    year: season.year,
  };
}

/** Get typography style based on status */
function getRowOpacity(status: string): number {
  switch (status) {
    case 'active': return 1;
    case 'completed': return 0.9;
    case 'archived': return 0.75;
    default: return 0.65;
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

function TableHeader() {
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.cellSeason]}>Season</Text>
      <Text style={[styles.headerCell, styles.cellRaces]}>Races</Text>
      <Text style={[styles.headerCell, styles.cellResult]}>Result</Text>
      <Text style={[styles.headerCell, styles.cellPoints]}>Pts</Text>
      <Text style={[styles.headerCell, styles.cellBest]}>Best</Text>
    </View>
  );
}

interface TableRowProps {
  row: SeasonTableRow;
  onPress?: () => void;
  isActive?: boolean;
}

function TableRow({ row, onPress, isActive }: TableRowProps) {
  const opacity = getRowOpacity(row.status);

  return (
    <TouchableOpacity
      style={[styles.dataRow, { opacity }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.dataCell,
          styles.cellSeason,
          isActive && styles.activeCell,
        ]}
        numberOfLines={1}
      >
        {row.shortName}
      </Text>
      <Text style={[styles.dataCell, styles.cellRaces]}>{row.races}</Text>
      <Text
        style={[
          styles.dataCell,
          styles.cellResult,
          row.result === '1st' && styles.winCell,
        ]}
      >
        {row.result}
      </Text>
      <Text style={[styles.dataCell, styles.cellPoints]}>{row.points}</Text>
      <Text
        style={[
          styles.dataCell,
          styles.cellBest,
          row.best.startsWith('1st') && styles.winCell,
        ]}
      >
        {row.best}
      </Text>
    </TouchableOpacity>
  );
}

function YearDivider({ year }: { year: number }) {
  return (
    <View style={styles.yearDivider}>
      <Text style={styles.yearText}>{year}</Text>
      <View style={styles.yearLine} />
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SeasonTableView({
  seasons,
  onSeasonPress,
  showYearDividers = true,
  maxRows,
}: SeasonTableViewProps) {
  // Transform to table rows
  const rows = seasons.map(toTableRow);

  // Apply maxRows limit if specified
  const displayRows = maxRows ? rows.slice(0, maxRows) : rows;

  // Group by year for dividers
  const currentYear = displayRows[0]?.year;

  // Detect year changes for dividers
  const getYearChange = (index: number): number | null => {
    if (index === 0) return null;
    const prevYear = displayRows[index - 1]?.year;
    const currYear = displayRows[index]?.year;
    if (prevYear !== currYear) return currYear;
    return null;
  };

  if (displayRows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No season data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TableHeader />
      <View style={styles.dividerLine} />

      {displayRows.map((row, index) => {
        const yearChange = showYearDividers ? getYearChange(index) : null;

        return (
          <React.Fragment key={row.id}>
            {yearChange && <YearDivider year={yearChange} />}
            <TableRow
              row={row}
              onPress={onSeasonPress ? () => onSeasonPress(row.id) : undefined}
              isActive={row.status === 'active'}
            />
          </React.Fragment>
        );
      })}

      {/* Show count if truncated */}
      {maxRows && rows.length > maxRows && (
        <Text style={styles.moreText}>
          +{rows.length - maxRows} more seasons
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// SCROLLABLE VERSION
// =============================================================================

interface ScrollableSeasonTableProps extends SeasonTableViewProps {
  /** Sticky header */
  stickyHeader?: boolean;
}

export function ScrollableSeasonTable({
  seasons,
  onSeasonPress,
  showYearDividers = true,
  stickyHeader = true,
}: ScrollableSeasonTableProps) {
  const rows = seasons.map(toTableRow);

  const getYearChange = (index: number): number | null => {
    if (index === 0) return null;
    const prevYear = rows[index - 1]?.year;
    const currYear = rows[index]?.year;
    if (prevYear !== currYear) return currYear;
    return null;
  };

  return (
    <View style={styles.scrollContainer}>
      {stickyHeader && (
        <>
          <TableHeader />
          <View style={styles.dividerLine} />
        </>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {!stickyHeader && (
          <>
            <TableHeader />
            <View style={styles.dividerLine} />
          </>
        )}

        {rows.map((row, index) => {
          const yearChange = showYearDividers ? getYearChange(index) : null;

          return (
            <React.Fragment key={row.id}>
              {yearChange && <YearDivider year={yearChange} />}
              <TableRow
                row={row}
                onPress={onSeasonPress ? () => onSeasonPress(row.id) : undefined}
                isActive={row.status === 'active'}
              />
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: TUFTE_BACKGROUND,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Divider
  dividerLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.gray4,
    marginHorizontal: 12,
  },

  // Data rows
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  dataCell: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  activeCell: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  winCell: {
    fontWeight: '600',
    color: IOS_COLORS.green,
  },

  // Column widths (percentage-like via flex)
  cellSeason: {
    flex: 2.5,
    paddingRight: 8,
  },
  cellRaces: {
    flex: 1,
    textAlign: 'center',
  },
  cellResult: {
    flex: 1,
    textAlign: 'center',
  },
  cellPoints: {
    flex: 0.8,
    textAlign: 'right',
  },
  cellBest: {
    flex: 1.5,
    textAlign: 'right',
  },

  // Year divider
  yearDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  yearText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginRight: 8,
  },
  yearLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.gray4,
  },

  // More text
  moreText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Empty state
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
});

export default SeasonTableView;
