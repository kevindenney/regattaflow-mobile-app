import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FleetMember {
  id: string;
  name: string;
  sail_number?: string;
  rank: number;
  points: number;
  events: number;
  trend?: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

interface MembersListProps {
  fleetId: string;
}

export function MembersList({ fleetId }: MembersListProps) {
  const [filterBy, setFilterBy] = useState<'rank' | 'events' | 'recent'>('rank');
  const [members] = useState<FleetMember[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      sail_number: 'USA 123',
      rank: 1,
      points: 89,
      events: 12,
      trend: 'same',
    },
    {
      id: '2',
      name: 'You',
      sail_number: 'USA 456',
      rank: 5,
      points: 72,
      events: 10,
      trend: 'up',
      isCurrentUser: true,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      sail_number: 'USA 789',
      rank: 3,
      points: 81,
      events: 11,
      trend: 'down',
    },
    {
      id: '4',
      name: 'Emma Williams',
      sail_number: 'CAN 234',
      rank: 2,
      points: 85,
      events: 11,
      trend: 'up',
    },
    {
      id: '5',
      name: 'James Brown',
      sail_number: 'GBR 567',
      rank: 4,
      points: 76,
      events: 9,
      trend: 'same',
    },
  ]);

  const sortedMembers = [...members].sort((a, b) => {
    switch (filterBy) {
      case 'rank':
        return a.rank - b.rank;
      case 'events':
        return b.events - a.events;
      case 'recent':
        return b.points - a.points;
      default:
        return 0;
    }
  });

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return { name: 'trending-up' as const, color: '#10B981' };
      case 'down':
        return { name: 'trending-down' as const, color: '#EF4444' };
      default:
        return { name: 'remove' as const, color: '#9CA3AF' };
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return styles.rankBadgeGold;
    if (rank === 2) return styles.rankBadgeSilver;
    if (rank === 3) return styles.rankBadgeBronze;
    return styles.rankBadgeDefault;
  };

  const renderMember = ({ item }: { item: FleetMember }) => {
    const trendIcon = getTrendIcon(item.trend);

    return (
      <Pressable
        style={[
          styles.memberCard,
          item.isCurrentUser && styles.currentUserCard,
        ]}
      >
        <View style={styles.rankBadgeContainer}>
          <View style={[styles.rankBadge, getRankBadgeStyle(item.rank)]}>
            <Text style={styles.rankText}>#{item.rank}</Text>
          </View>
        </View>

        <View style={styles.memberInfo}>
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
          {item.sail_number && (
            <Text style={styles.sailNumber}>{item.sail_number}</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.points}</Text>
            <Text style={styles.statLabel}>pts</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.events}</Text>
            <Text style={styles.statLabel}>events</Text>
          </View>
        </View>

        {item.trend && (
          <View style={styles.trendContainer}>
            <Ionicons name={trendIcon.name} size={20} color={trendIcon.color} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterButton, filterBy === 'rank' && styles.filterButtonActive]}
          onPress={() => setFilterBy('rank')}
        >
          <Text style={[styles.filterText, filterBy === 'rank' && styles.filterTextActive]}>
            By Rank
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterBy === 'events' && styles.filterButtonActive]}
          onPress={() => setFilterBy('events')}
        >
          <Text style={[styles.filterText, filterBy === 'events' && styles.filterTextActive]}>
            By Events
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterBy === 'recent' && styles.filterButtonActive]}
          onPress={() => setFilterBy('recent')}
        >
          <Text style={[styles.filterText, filterBy === 'recent' && styles.filterTextActive]}>
            Recent Form
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedMembers}
        renderItem={renderMember}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 12,
  },
  memberCard: {
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
  currentUserCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  rankBadgeContainer: {
    width: 50,
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  memberInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
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
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statColumn: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  trendContainer: {
    width: 28,
    alignItems: 'center',
  },
});
