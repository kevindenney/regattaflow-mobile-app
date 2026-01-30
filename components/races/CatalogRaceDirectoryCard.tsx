/**
 * CatalogRaceDirectoryCard
 *
 * Compact iOS-style list row for the catalog race directory.
 * Shows race name, location subtitle, activity stats, and Follow/Following pill.
 * Modeled on VenueDirectoryCard.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { CatalogRaceType, RaceLevel } from '@/types/catalog-race';
import { RACE_TYPE_CONFIG, RACE_LEVEL_CONFIG } from '@/types/catalog-race';

interface CatalogRaceDirectoryCardProps {
  name: string;
  country: string | null;
  organizingAuthority: string | null;
  raceType: CatalogRaceType | null;
  level: RaceLevel | null;
  isFollowed: boolean;
  onPress: () => void;
  onFollowToggle: () => void;
  discussionCount: number;
  followerCount: number;
}

function formatActivityLine(discussions: number, followers: number): string | null {
  const parts: string[] = [];
  if (discussions > 0) {
    parts.push(`${discussions} ${discussions === 1 ? 'discussion' : 'discussions'}`);
  }
  if (followers > 0) {
    parts.push(`${followers} ${followers === 1 ? 'follower' : 'followers'}`);
  }
  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}

export function CatalogRaceDirectoryCard({
  name,
  country,
  organizingAuthority,
  raceType,
  level,
  isFollowed,
  onPress,
  onFollowToggle,
  discussionCount,
  followerCount,
}: CatalogRaceDirectoryCardProps) {
  const subtitle = [organizingAuthority, country].filter(Boolean).join(' \u00b7 ');
  const activityLine = formatActivityLine(discussionCount, followerCount);
  const levelLabel = level ? RACE_LEVEL_CONFIG[level]?.shortLabel : null;
  const typeLabel = raceType ? RACE_TYPE_CONFIG[raceType]?.label : null;
  const metaLine = [typeLabel, levelLabel].filter(Boolean).join(' \u00b7 ');

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
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {metaLine ? (
            <Text style={styles.metaLine} numberOfLines={1}>
              {metaLine}
            </Text>
          ) : null}
          {activityLine && (
            <Text style={styles.activityLine} numberOfLines={1}>
              {activityLine}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onFollowToggle();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.followPill, isFollowed && styles.followedPill]}
        >
          <Text style={[styles.followText, isFollowed && styles.followedText]}>
            {isFollowed ? 'Following' : 'Follow'}
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
  metaLine: {
    fontSize: 12,
    color: IOS_COLORS.systemIndigo ?? IOS_COLORS.systemPurple,
    letterSpacing: -0.08,
    marginTop: 1,
  },
  activityLine: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: -0.08,
    marginTop: 2,
  },
  followPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: IOS_COLORS.systemBlue,
    marginRight: 6,
  },
  followedPill: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  followText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followedText: {
    color: IOS_COLORS.secondaryLabel,
  },
  chevron: {
    marginLeft: 2,
  },
});

export default CatalogRaceDirectoryCard;
