import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  sailNumber: string;
  points: number;
  races: number;
  bestFinish: number;
  average: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  fleetId: string;
}

export function Leaderboard({ fleetId }: LeaderboardProps) {
  const [season, setSeason] = useState('2024');
  const [entries] = useState<LeaderboardEntry[]>([
    {
      id: '1',
      rank: 1,
      previousRank: 1,
      name: 'Sarah Chen',
      sailNumber: 'USA 123',
      points: 89,
      races: 12,
      bestFinish: 1,
      average: 3.2,
    },
    {
      id: '2',
      rank: 2,
      previousRank: 3,
      name: 'Emma Williams',
      sailNumber: 'CAN 234',
      points: 85,
      races: 11,
      bestFinish: 1,
      average: 3.8,
    },
    {
      id: '3',
      rank: 3,
      previousRank: 2,
      name: 'Mike Johnson',
      sailNumber: 'USA 789',
      points: 81,
      races: 11,
      bestFinish: 2,
      average: 4.1,
    },
    {
      id: '4',
      rank: 4,
      previousRank: 5,
      name: 'James Brown',
      sailNumber: 'GBR 567',
      points: 76,
      races: 9,
      bestFinish: 1,
      average: 4.6,
    },
    {
      id: '5',
      rank: 5,
      previousRank: 6,
      name: 'You',
      sailNumber: 'USA 456',
      points: 72,
      races: 10,
      bestFinish: 3,
      average: 5.2,
      isCurrentUser: true,
    },
  ]);

  const getRankChange = (current: number, previous?: number) => {
    if (!previous || current === previous) return null;
    if (current < previous) {
      return { type: 'up' as const, value: previous - current };
    }
    return { type: 'down' as const, value: current - previous };
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return styles.rankBadgeGold;
    if (rank === 2) return styles.rankBadgeSilver;
    if (rank === 3) return styles.rankBadgeBronze;
    return styles.rankBadgeDefault;
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const rankChange = getRankChange(item.rank, item.previousRank);

    return (
      <View style={[
        styles.entryRow,
        item.isCurrentUser && styles.currentUserRow,
      ]}>
        <View style={styles.rankContainer}>
          <View style={[styles.rankBadge, getRankBadgeStyle(item.rank)]}>
            <Text style={styles.rankText}>#{item.rank}</Text>
          </View>
          {rankChange && (
            <View style={styles.changeIndicator}>
              <Ionicons
                name={rankChange.type === 'up' ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={rankChange.type === 'up' ? '#10B981' : '#EF4444'}
              />
              <Text style={[
                styles.changeText,
                rankChange.type === 'up' ? styles.changeUp : styles.changeDown
              ]}>
                {rankChange.value}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sailorInfo}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, item.isCurrentUser && styles.currentUserName]}>
              {item.name}
            </Text>
            {item.isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={styles.sailNumber}>{item.sailNumber}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.points}</Text>
            <Text style={styles.statLabel}>pts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.races}</Text>
            <Text style={styles.statLabel}>races</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.bestFinish}</Text>
            <Text style={styles.statLabel}>best</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.average.toFixed(1)}</Text>
            <Text style={styles.statLabel}>avg</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.seasonSelector}>
          <Pressable style={styles.seasonButton}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </Pressable>
          <Text style={styles.seasonText}>{season} Season</Text>
          <Pressable style={styles.seasonButton}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      <View style={styles.insightsCard}>
        <Ionicons name="trophy" size={24} color="#F59E0B" />
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>Your Season Progress</Text>
          <Text style={styles.insightText}>
            You've moved up 1 position. 3 more points to reach 4th place!
          </Text>
        </View>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  seasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  seasonButton: {
    padding: 8,
  },
  seasonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  insightsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#B45309',
  },
  list: {
    padding: 12,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  currentUserRow: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  rankContainer: {
    alignItems: 'center',
    width: 60,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeGold: {
    backgroundColor: '#FEF3C7',
  },
  rankBadgeSilver: {
    backgroundColor: '#E5E7EB',
  },
  rankBadgeBronze: {
    backgroundColor: '#FED7AA',
  },
  rankBadgeDefault: {
    backgroundColor: '#F3F4F6',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  changeUp: {
    color: '#10B981',
  },
  changeDown: {
    color: '#EF4444',
  },
  sailorInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  currentUserName: {
    color: '#3B82F6',
  },
  youBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sailNumber: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    alignItems: 'center',
    minWidth: 36,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
