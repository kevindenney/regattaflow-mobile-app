/**
 * Shared demo card components for the Connect tab.
 *
 * Used by FollowContent and DiscussContent to render config-driven
 * demo data for non-sailing interests.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { DemoPeer, DemoPost, DemoCommunity } from '@/configs/connectDemoData';

// =============================================================================
// POST TYPE BADGE STYLES
// =============================================================================

const POST_TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  tip: { label: 'Tip', color: '#059669', bg: '#D1FAE5' },
  question: { label: 'Question', color: '#D97706', bg: '#FEF3C7' },
  discussion: { label: 'Discussion', color: '#2563EB', bg: '#DBEAFE' },
  safety_alert: { label: 'Alert', color: '#DC2626', bg: '#FEE2E2' },
};

// =============================================================================
// PEER CARD
// =============================================================================

interface DemoPeerCardProps {
  peer: DemoPeer;
  isFollowing: boolean;
  onToggleFollow: (id: string) => void;
}

export function DemoPeerCard({ peer, isFollowing, onToggleFollow }: DemoPeerCardProps) {
  return (
    <View style={s.peerCard}>
      <View style={[s.peerAvatar, { backgroundColor: peer.avatarColor }]}>
        <Text style={s.peerAvatarText}>{peer.avatarInitials}</Text>
      </View>
      <View style={s.peerInfo}>
        <Text style={s.peerName} numberOfLines={1}>{peer.name}</Text>
        <Text style={s.peerSubtitle} numberOfLines={1}>{peer.subtitle}</Text>
        <Text style={s.peerStat}>{peer.stat}</Text>
      </View>
      <Pressable
        style={[s.followButton, isFollowing && s.followButtonActive]}
        onPress={() => {
          triggerHaptic('selection');
          onToggleFollow(peer.id);
        }}
      >
        <Text style={[s.followButtonText, isFollowing && s.followButtonTextActive]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// POST CARD (with interactive upvote)
// =============================================================================

export function DemoPostCard({ post }: { post: DemoPost }) {
  const typeStyle = POST_TYPE_STYLES[post.postType] || POST_TYPE_STYLES.discussion;
  const [upvoted, setUpvoted] = useState(false);
  const displayUpvotes = upvoted ? post.upvotes + 1 : post.upvotes;

  return (
    <Pressable style={s.postCard}>
      {/* Author row */}
      <View style={s.postAuthorRow}>
        <View style={[s.postAuthorAvatar, { backgroundColor: post.authorColor }]}>
          <Text style={s.postAuthorAvatarText}>{post.authorInitials}</Text>
        </View>
        <View style={s.postAuthorInfo}>
          <Text style={s.postAuthorName}>{post.authorName}</Text>
          <Text style={s.postCommunityName}>{post.communityName} · {post.timeAgo}</Text>
        </View>
        <View style={[s.postTypeBadge, { backgroundColor: typeStyle.bg }]}>
          <Text style={[s.postTypeBadgeText, { color: typeStyle.color }]}>{typeStyle.label}</Text>
        </View>
      </View>
      {/* Title + body */}
      <Text style={s.postTitle} numberOfLines={2}>{post.title}</Text>
      <Text style={s.postBody} numberOfLines={3}>{post.body}</Text>
      {/* Tags */}
      {post.topicTags.length > 0 && (
        <View style={s.postTags}>
          {post.topicTags.map((tag) => (
            <View key={tag.label} style={[s.postTag, { backgroundColor: tag.color + '18' }]}>
              <Text style={[s.postTagText, { color: tag.color }]}>{tag.label}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Footer metrics */}
      <View style={s.postFooter}>
        <Pressable
          style={s.postMetric}
          onPress={() => {
            triggerHaptic('selection');
            setUpvoted((v) => !v);
          }}
        >
          <Ionicons
            name={upvoted ? 'arrow-up' : 'arrow-up-outline'}
            size={15}
            color={upvoted ? '#2563EB' : IOS_COLORS.secondaryLabel}
          />
          <Text style={[s.postMetricText, upvoted && { color: '#2563EB', fontWeight: '600' }]}>
            {displayUpvotes}
          </Text>
        </Pressable>
        <View style={s.postMetric}>
          <Ionicons name="chatbubble-outline" size={13} color={IOS_COLORS.secondaryLabel} />
          <Text style={s.postMetricText}>{post.commentCount}</Text>
        </View>
        <View style={s.postMetric}>
          <Ionicons name="eye-outline" size={14} color={IOS_COLORS.secondaryLabel} />
          <Text style={s.postMetricText}>{post.viewCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// =============================================================================
// COMMUNITY CARD
// =============================================================================

interface DemoCommunityCardProps {
  community: DemoCommunity;
  isJoined: boolean;
  onToggleJoin: (id: string) => void;
}

export function DemoCommunityCard({ community, isJoined, onToggleJoin }: DemoCommunityCardProps) {
  const displayMembers = isJoined ? community.memberCount + 1 : community.memberCount;
  return (
    <Pressable style={s.communityCard}>
      <View style={[s.communityIcon, { backgroundColor: community.iconBgColor }]}>
        <Ionicons name={community.icon as any} size={22} color={community.iconColor} />
      </View>
      <View style={s.communityInfo}>
        <Text style={s.communityName} numberOfLines={1}>{community.name}</Text>
        <Text style={s.communityDescription} numberOfLines={2}>{community.description}</Text>
        <View style={s.communityMeta}>
          <Ionicons name="people-outline" size={12} color={IOS_COLORS.tertiaryLabel} />
          <Text style={s.communityMetaText}>
            {displayMembers.toLocaleString()} members · {community.postCount} posts
          </Text>
        </View>
      </View>
      <Pressable
        style={[s.joinButton, isJoined && s.joinButtonActive]}
        onPress={() => {
          triggerHaptic('selection');
          onToggleJoin(community.id);
        }}
      >
        <Text style={[s.joinButtonText, isJoined && s.joinButtonTextActive]}>
          {isJoined ? 'Joined' : 'Join'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function DemoEmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={s.emptyState}>
      <Ionicons name={icon as any} size={44} color={IOS_COLORS.tertiaryLabel} />
      <Text style={s.emptyStateTitle}>{title}</Text>
      <Text style={s.emptyStateSubtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <Pressable style={s.emptyStateCta} onPress={onAction}>
          <Text style={s.emptyStateCtaText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  // Peer cards
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  peerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  peerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  peerName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  peerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  peerStat: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#2563EB',
  },
  followButtonActive: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextActive: {
    color: IOS_COLORS.label,
  },

  // Post cards
  postCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postAuthorInfo: {
    flex: 1,
    marginLeft: 8,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  postCommunityName: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  postTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  postTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 22,
    marginBottom: 4,
  },
  postBody: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginBottom: 10,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  postTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  postTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  postMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postMetricText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },

  // Community cards
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  communityIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  communityDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
    marginTop: 2,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  communityMetaText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#2563EB',
  },
  joinButtonActive: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButtonTextActive: {
    color: IOS_COLORS.label,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateCta: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2563EB',
  },
  emptyStateCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
