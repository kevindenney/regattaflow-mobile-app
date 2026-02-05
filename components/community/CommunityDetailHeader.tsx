/**
 * CommunityDetailHeader
 *
 * Header component for community detail screens.
 * Shows banner, icon, name, description, stats, and join button.
 * Inspired by Reddit subreddit headers.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_TYPOGRAPHY,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { Community } from '@/types/community';
import { COMMUNITY_TYPE_CONFIG } from '@/types/community';

interface CommunityDetailHeaderProps {
  community: Community;
  onJoinToggle: () => void;
  isJoinPending?: boolean;
}

function formatMemberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function formatLastActive(dateString: string | null): string {
  if (!dateString) return 'Active today';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Active ${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `Active ${diffDay}d ago`;
  return 'Active this week';
}

export function CommunityDetailHeader({
  community,
  onJoinToggle,
  isJoinPending = false,
}: CommunityDetailHeaderProps) {
  const typeConfig = COMMUNITY_TYPE_CONFIG[community.community_type] || COMMUNITY_TYPE_CONFIG.general;
  const isJoined = community.is_member ?? false;

  // Default banner gradient if no banner_url
  const defaultBannerColors: [string, string] = [typeConfig.color, `${typeConfig.color}80`];

  return (
    <View style={styles.container}>
      {/* Banner */}
      {community.banner_url ? (
        <ImageBackground
          source={{ uri: community.banner_url }}
          style={styles.banner}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.bannerGradient}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={defaultBannerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
            {community.icon_url ? (
              <Image
                source={{ uri: community.icon_url }}
                style={styles.iconImage}
              />
            ) : (
              <Ionicons
                name={typeConfig.icon as any}
                size={32}
                color={typeConfig.color}
              />
            )}
          </View>
        </View>

        {/* Name and Badges */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {community.name}
          </Text>
          {community.is_official && (
            <View style={styles.officialBadge}>
              <Ionicons name="checkmark-circle" size={16} color={IOS_COLORS.systemBlue} />
              <Text style={styles.officialText}>Official</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatMemberCount(community.member_count)}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatMemberCount(community.post_count)}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatLastActive(community.last_activity_at)}</Text>
          </View>
        </View>

        {/* Type Badge */}
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
            <Ionicons name={typeConfig.icon as any} size={14} color={typeConfig.color} />
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
          {community.category_name && (
            <Text style={styles.categoryText}>{community.category_name}</Text>
          )}
        </View>

        {/* Description */}
        {community.description && (
          <Text style={styles.description}>{community.description}</Text>
        )}

        {/* Join Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('impactMedium');
            onJoinToggle();
          }}
          style={({ pressed }) => [
            styles.joinButton,
            isJoined && styles.joinedButton,
            pressed && styles.joinButtonPressed,
            isJoinPending && styles.joinButtonPending,
          ]}
          disabled={isJoinPending}
        >
          {isJoined ? (
            <>
              <Ionicons name="checkmark" size={18} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.joinedButtonText}>Joined</Text>
            </>
          ) : (
            <>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>
                {isJoinPending ? 'Joining...' : 'Join Community'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  banner: {
    height: 120,
    width: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  content: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.lg,
    marginTop: -32,
  },
  iconWrapper: {
    marginBottom: IOS_SPACING.sm,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: IOS_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  iconImage: {
    width: 66,
    height: 66,
    borderRadius: IOS_RADIUS.lg - 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    ...IOS_TYPOGRAPHY.title2,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: IOS_RADIUS.full,
  },
  officialText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IOS_SPACING.md,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: IOS_SPACING.md,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: IOS_RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  description: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.md,
    lineHeight: 20,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: IOS_RADIUS.md,
    marginTop: IOS_SPACING.lg,
  },
  joinedButton: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  joinButtonPressed: {
    opacity: 0.8,
  },
  joinButtonPending: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
});

export default CommunityDetailHeader;
