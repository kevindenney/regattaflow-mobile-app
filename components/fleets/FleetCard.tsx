import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FleetCardProps {
  fleet: {
    id: string;
    name: string;
    boat_class: string;
    member_count: number;
    recent_activity?: string;
    user_stats?: {
      rank: number;
      points: number;
      events_participated: number;
    };
  };
  onPress: () => void;
}

export function FleetCard({ fleet, onPress }: FleetCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{fleet.name}</Text>
          <Text style={styles.boatClass}>{fleet.boat_class}</Text>
        </View>
        <View style={styles.memberBadge}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.memberCount}>{fleet.member_count}</Text>
        </View>
      </View>

      {fleet.user_stats && (
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Your Rank</Text>
            <Text style={styles.statValue}>#{fleet.user_stats.rank}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Points</Text>
            <Text style={styles.statValue}>{fleet.user_stats.points}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Events</Text>
            <Text style={styles.statValue}>{fleet.user_stats.events_participated}</Text>
          </View>
        </View>
      )}

      {fleet.recent_activity && (
        <View style={styles.activityContainer}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text style={styles.activityText}>{fleet.recent_activity}</Text>
        </View>
      )}

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  boatClass: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  activityText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
});
