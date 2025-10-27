/**
 * CrewPerformanceCard Component
 * Displays crew member's race history and performance statistics
 */

import {
  CrewMember,
  CrewRaceParticipation,
  CrewRaceStats,
  crewManagementService,
} from '@/services/crewManagementService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface CrewPerformanceCardProps {
  crewMember: CrewMember;
}

export function CrewPerformanceCard({ crewMember }: CrewPerformanceCardProps) {
  const [stats, setStats] = useState<CrewRaceStats | null>(null);
  const [history, setHistory] = useState<CrewRaceParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [crewMember.id]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [statsData, historyData] = await Promise.all([
        crewManagementService.getCrewRaceStats(crewMember.id),
        crewManagementService.getCrewRaceHistory(crewMember.id),
      ]);

      setStats(statsData);
      setHistory(historyData.slice(0, 10)); // Show last 10 races
    } catch (err) {
      console.error('Error loading performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={star <= rating ? '#F59E0B' : '#CBD5E1'}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (!stats || stats.totalRaces === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Race History</Text>
          <Text style={styles.emptyText}>
            {crewMember.name} hasn't participated in any races yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="stats-chart" size={20} color="#3B82F6" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Performance</Text>
          <Text style={styles.headerSubtitle}>
            {crewMember.name}'s race statistics
          </Text>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalRaces}</Text>
          <Text style={styles.statLabel}>Races</Text>
        </View>

        {stats.avgFinish && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgFinish.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Finish</Text>
          </View>
        )}

        {stats.bestFinish && (
          <View style={styles.statCard}>
            <View style={styles.bestFinishBadge}>
              <Ionicons name="trophy" size={16} color="#F59E0B" />
              <Text style={styles.statValue}>{stats.bestFinish}</Text>
            </View>
            <Text style={styles.statLabel}>Best Finish</Text>
          </View>
        )}

        {stats.avgPerformanceRating && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.avgPerformanceRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
            {renderStars(Math.round(stats.avgPerformanceRating))}
          </View>
        )}
      </View>

      {/* Positions Sailed */}
      {stats.positionsSailed && stats.positionsSailed.length > 0 && (
        <View style={styles.positionsSection}>
          <Text style={styles.sectionTitle}>Positions</Text>
          <View style={styles.positionTags}>
            {stats.positionsSailed.map((position) => (
              <View key={position} style={styles.positionTag}>
                <Text style={styles.positionTagText}>
                  {position.charAt(0).toUpperCase() + position.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Races */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Races</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyScroll}
          >
            {history.map((race) => (
              <View key={race.id} style={styles.raceCard}>
                <View style={styles.raceHeader}>
                  <View style={styles.raceNumberBadge}>
                    <Text style={styles.raceNumberText}>R{race.raceNumber}</Text>
                  </View>
                  {race.performanceRating && renderStars(race.performanceRating)}
                </View>

                <View style={styles.raceDetails}>
                  <View style={styles.raceDetailRow}>
                    <Ionicons name="location" size={14} color="#64748B" />
                    <Text style={styles.raceDetailText} numberOfLines={1}>
                      {race.position}
                    </Text>
                  </View>

                  {race.finishPosition && (
                    <View style={styles.raceDetailRow}>
                      <Ionicons name="flag" size={14} color="#64748B" />
                      <Text style={styles.raceDetailText}>
                        Finished: {race.finishPosition}
                      </Text>
                    </View>
                  )}

                  {race.pointsScored !== undefined && (
                    <View style={styles.raceDetailRow}>
                      <Ionicons name="stats-chart" size={14} color="#64748B" />
                      <Text style={styles.raceDetailText}>
                        {race.pointsScored} pts
                      </Text>
                    </View>
                  )}
                </View>

                {race.notes && (
                  <View style={styles.raceNotes}>
                    <Text style={styles.raceNotesText} numberOfLines={2}>
                      {race.notes}
                    </Text>
                  </View>
                )}

                <Text style={styles.raceDate}>
                  {new Date(race.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Total Points */}
      {stats.totalPoints !== undefined && (
        <View style={styles.totalPointsCard}>
          <View style={styles.totalPointsContent}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <View>
              <Text style={styles.totalPointsValue}>
                {stats.totalPoints.toFixed(1)}
              </Text>
              <Text style={styles.totalPointsLabel}>Total Points</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  bestFinishBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  positionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  positionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  positionTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  positionTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  historySection: {
    marginBottom: 16,
  },
  historyScroll: {
    gap: 12,
  },
  raceCard: {
    width: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raceNumberBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  raceNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  raceDetails: {
    gap: 6,
    marginBottom: 8,
  },
  raceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceDetailText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  raceNotes: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  raceNotesText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  raceDate: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
  },
  totalPointsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  totalPointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalPointsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
  },
  totalPointsLabel: {
    fontSize: 12,
    color: '#92400E',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
