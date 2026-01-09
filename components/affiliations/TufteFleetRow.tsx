/**
 * TufteFleetRow
 *
 * Dense fleet row with member count, ranking, and activity subtitle.
 * Follows Tufte principles: data-dense, minimal chrome, typography-driven.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';

interface TufteFleetRowProps {
  name: string;
  memberCount?: number;
  ranking?: number;
  activity?: string;
  activityTime?: string;
  boatClass?: string;
  onPress?: () => void;
  isLast?: boolean;
}

export function TufteFleetRow({
  name,
  memberCount,
  ranking,
  activity,
  activityTime,
  boatClass,
  onPress,
  isLast = false,
}: TufteFleetRowProps) {
  // Build activity subtitle
  let displayActivity = '';
  if (activity && activityTime) {
    displayActivity = `${activity} ${activityTime}`;
  } else if (activity) {
    displayActivity = activity;
  }

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.content}>
        {/* Title row with stats */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.statsRow}>
            {memberCount !== undefined && (
              <Text style={styles.stat}>{memberCount} members</Text>
            )}
            {ranking !== undefined && (
              <Text style={styles.ranking}>#{ranking}</Text>
            )}
          </View>
        </View>

        {/* Boat class or activity */}
        {(boatClass || displayActivity) && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {boatClass && <Text style={styles.boatClass}>{boatClass}</Text>}
            {boatClass && displayActivity && ' · '}
            {displayActivity}
          </Text>
        )}
      </View>

      {/* Chevron */}
      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    minHeight: 52,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stat: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  ranking: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  subtitle: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  boatClass: {
    color: IOS_COLORS.secondaryLabel,
  },
  chevron: {
    fontSize: 20,
    color: IOS_COLORS.tertiaryLabel,
    marginLeft: 8,
  },
});
