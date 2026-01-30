/**
 * VenueDirectoryCard
 *
 * Compact iOS-style list row for the venue directory.
 * Shows venue name, location subtitle, activity stats, and a compact Join/Joined pill.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface VenueDirectoryCardProps {
  id: string;
  name: string;
  country: string;
  region: string;
  venueType: string;
  isJoined: boolean;
  onPress: () => void;
  onJoinToggle: () => void;
  postCount?: number;
  lastActiveAt?: string | null;
  matchedClubName?: string | null;
}

function formatLocation(country: string, region: string): string | null {
  const parts: string[] = [];
  if (region && region !== 'Unknown') parts.push(region);
  if (country && country !== 'Unknown') parts.push(country);
  return parts.length > 0 ? parts.join(', ') : null;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Active just now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Active ${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `Active ${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `Active ${diffMonth}mo ago`;
}

export function VenueDirectoryCard({
  name,
  country,
  region,
  isJoined,
  onPress,
  onJoinToggle,
  postCount,
  lastActiveAt,
  matchedClubName,
}: VenueDirectoryCardProps) {
  const location = formatLocation(country, region);
  const hasActivity = postCount != null && postCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {matchedClubName ? (
            <Text style={styles.clubMatch} numberOfLines={1}>
              via {matchedClubName}
            </Text>
          ) : location ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
          {hasActivity && (
            <Text style={styles.activityLine} numberOfLines={1}>
              {postCount} {postCount === 1 ? 'post' : 'posts'}
              {lastActiveAt ? `  ·  ${timeAgo(lastActiveAt)}` : ''}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onJoinToggle();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.joinPill, isJoined && styles.joinedPill]}
        >
          <Text style={[styles.joinText, isJoined && styles.joinedText]}>
            {isJoined ? 'Joined' : 'Join'}
          </Text>
        </Pressable>

        <Ionicons
          name="chevron-forward"
          size={14}
          color={IOS_COLORS.tertiaryLabel}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  cardPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingLeft: IOS_SPACING.lg,
    paddingRight: IOS_SPACING.md,
  },
  textContainer: {
    flex: 1,
    marginRight: IOS_SPACING.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  subtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.08,
    marginTop: 1,
  },
  clubMatch: {
    fontSize: 13,
    color: IOS_COLORS.systemBlue,
    letterSpacing: -0.08,
    marginTop: 1,
  },
  activityLine: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: -0.08,
    marginTop: 2,
  },
  joinPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: IOS_COLORS.systemBlue,
    marginRight: 6,
  },
  joinedPill: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  joinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinedText: {
    color: IOS_COLORS.secondaryLabel,
  },
  chevron: {
    marginLeft: 2,
  },
});

export default VenueDirectoryCard;
