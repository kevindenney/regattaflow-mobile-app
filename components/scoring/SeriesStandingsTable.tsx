/**
 * Series Standings Table Component
 * Displays full series standings with race-by-race breakdown
 * Supports export and sharing
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Trophy,
  Medal,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Filter,
} from 'lucide-react-native';
import { SeriesStanding, RaceScore } from '@/services/scoring/ScoringEngine';

interface SeriesStandingsTableProps {
  standings: SeriesStanding[];
  racesCompleted: number;
  discards: number;
  regattaName?: string;
  resultsStatus?: 'draft' | 'provisional' | 'final';
  onExport?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

export default function SeriesStandingsTable({
  standings,
  racesCompleted,
  discards,
  regattaName,
  resultsStatus = 'draft',
  onExport,
  onShare,
  compact = false,
}: SeriesStandingsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'points'>('rank');

  // Sort standings
  const sortedStandings = [...standings].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.entry.sailor_name || '').localeCompare(b.entry.sailor_name || '');
      case 'points':
        return a.net_points - b.net_points;
      default:
        return a.rank - b.rank;
    }
  });

  // Get medal color for top 3
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#D1D5DB';
    }
  };

  // Format race score display
  const formatScore = (score: RaceScore) => {
    if (score.score_code) return score.score_code;
    return score.points.toString();
  };

  // Get score style
  const getScoreStyle = (score: RaceScore) => {
    if (score.excluded) return styles.discardedScore;
    if (score.score_code) return styles.penaltyScore;
    if (score.points === 1) return styles.firstPlaceScore;
    return {};
  };

  return (
    <View style={styles.container}>
      {/* Header with status and actions */}
      {!compact && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Trophy size={20} color="#0EA5E9" />
            <Text style={styles.headerTitle}>Series Standings</Text>
            <View style={[
              styles.statusBadge,
              resultsStatus === 'final' && styles.finalBadge,
              resultsStatus === 'provisional' && styles.provisionalBadge,
            ]}>
              <Text style={styles.statusText}>
                {resultsStatus.charAt(0).toUpperCase() + resultsStatus.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            {onExport && (
              <TouchableOpacity style={styles.actionButton} onPress={onExport}>
                <Download size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                <Share2 size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Stats summary */}
      {!compact && (
        <View style={styles.statsSummary}>
          <Text style={styles.summaryText}>
            {racesCompleted} race{racesCompleted !== 1 ? 's' : ''} completed
            {discards > 0 && ` • ${discards} discard${discards !== 1 ? 's' : ''}`}
            {` • ${standings.length} competitor${standings.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      {/* Scrollable table */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        style={styles.tableScroll}
      >
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, styles.rankColumn]}>
              <Text style={styles.headerText}>Pos</Text>
            </View>
            <View style={[styles.headerCell, styles.sailColumn]}>
              <Text style={styles.headerText}>Sail</Text>
            </View>
            <View style={[styles.headerCell, styles.nameColumn]}>
              <Text style={styles.headerText}>Competitor</Text>
            </View>
            {/* Race columns */}
            {Array.from({ length: racesCompleted }, (_, i) => (
              <View key={i} style={[styles.headerCell, styles.raceColumn]}>
                <Text style={styles.headerText}>R{i + 1}</Text>
              </View>
            ))}
            <View style={[styles.headerCell, styles.totalColumn]}>
              <Text style={styles.headerText}>Total</Text>
            </View>
            <View style={[styles.headerCell, styles.netColumn]}>
              <Text style={[styles.headerText, styles.netHeader]}>Net</Text>
            </View>
          </View>

          {/* Table Rows */}
          {sortedStandings.map((standing, index) => {
            const isExpanded = expandedRow === standing.entry.entry_id;
            const isPodium = standing.rank <= 3;

            return (
              <View key={standing.entry.entry_id}>
                <TouchableOpacity
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.evenRow,
                    isPodium && styles.podiumRow,
                    isExpanded && styles.expandedRow,
                  ]}
                  onPress={() => setExpandedRow(isExpanded ? null : standing.entry.entry_id)}
                >
                  {/* Rank */}
                  <View style={[styles.cell, styles.rankColumn]}>
                    {isPodium ? (
                      <Medal size={24} color={getMedalColor(standing.rank)} />
                    ) : (
                      <Text style={styles.rankText}>{standing.rank}</Text>
                    )}
                  </View>

                  {/* Sail Number */}
                  <View style={[styles.cell, styles.sailColumn]}>
                    <Text style={styles.sailText}>
                      {standing.entry.sail_number}
                    </Text>
                  </View>

                  {/* Competitor Name */}
                  <View style={[styles.cell, styles.nameColumn]}>
                    <Text style={styles.competitorName} numberOfLines={1}>
                      {standing.entry.sailor_name || standing.entry.entry_number}
                    </Text>
                    {standing.entry.boat_class && (
                      <Text style={styles.boatClass}>
                        {standing.entry.boat_class}
                      </Text>
                    )}
                  </View>

                  {/* Race Scores */}
                  {standing.race_scores
                    .slice(0, racesCompleted)
                    .map((score, idx) => (
                      <View key={idx} style={[styles.cell, styles.raceColumn]}>
                        <Text style={[styles.scoreText, getScoreStyle(score)]}>
                          {formatScore(score)}
                        </Text>
                      </View>
                    ))}

                  {/* Total */}
                  <View style={[styles.cell, styles.totalColumn]}>
                    <Text style={styles.totalText}>{standing.total_points}</Text>
                  </View>

                  {/* Net */}
                  <View style={[styles.cell, styles.netColumn]}>
                    <Text style={styles.netText}>{standing.net_points}</Text>
                    {standing.tied && (
                      <Text style={styles.tieIndicator}>T</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Races Sailed:</Text>
                      <Text style={styles.detailValue}>{standing.races_sailed}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Discards Used:</Text>
                      <Text style={styles.detailValue}>{standing.discards_used}</Text>
                    </View>
                    {standing.tied && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tie Breaker:</Text>
                        <Text style={styles.detailValue}>
                          {standing.tie_breaker || 'Last race position'}
                        </Text>
                      </View>
                    )}
                    {standing.entry.club && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Club:</Text>
                        <Text style={styles.detailValue}>{standing.entry.club}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      {!compact && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.firstPlaceLegend]} />
            <Text style={styles.legendText}>1st Place</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.discardLegend]} />
            <Text style={styles.legendText}>Discarded</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.penaltyLegend]} />
            <Text style={styles.legendText}>Penalty/DNF</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  finalBadge: {
    backgroundColor: '#D1FAE5',
  },
  provisionalBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  statsSummary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  summaryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tableScroll: {
    flex: 1,
  },
  tableContainer: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 10,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  netHeader: {
    color: '#34D399',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  evenRow: {
    backgroundColor: '#F9FAFB',
  },
  podiumRow: {
    backgroundColor: '#FFFBEB',
  },
  expandedRow: {
    backgroundColor: '#EFF6FF',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rankColumn: {
    width: 44,
  },
  sailColumn: {
    width: 70,
  },
  nameColumn: {
    width: 140,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  raceColumn: {
    width: 40,
  },
  totalColumn: {
    width: 50,
  },
  netColumn: {
    width: 56,
    flexDirection: 'row',
    gap: 2,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  sailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  competitorName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  boatClass: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scoreText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  firstPlaceScore: {
    color: '#059669',
    fontWeight: '700',
  },
  discardedScore: {
    color: '#DC2626',
    textDecorationLine: 'line-through',
  },
  penaltyScore: {
    color: '#DC2626',
    fontWeight: '600',
  },
  totalText: {
    fontSize: 12,
    color: '#6B7280',
  },
  netText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  tieIndicator: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 2,
  },
  expandedDetails: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  firstPlaceLegend: {
    backgroundColor: '#059669',
  },
  discardLegend: {
    backgroundColor: '#DC2626',
  },
  penaltyLegend: {
    backgroundColor: '#F59E0B',
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});

