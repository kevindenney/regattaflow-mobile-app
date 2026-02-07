/**
 * FeedPostCard
 *
 * Clean, spacious feed card matching iOS design patterns.
 * Layout: venue header, title, body preview, horizontal footer with metadata.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import type { FeedPost } from '@/types/community-feed';

interface FeedPostCardProps {
  post: FeedPost;
  onPress?: () => void;
  onVenuePress?: (venueId: string) => void;
  onRacePress?: (slug: string) => void;
  showVenueName?: boolean;
  showConditionMatch?: boolean;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

// Generate a consistent color for an avatar based on name
const AVATAR_COLORS = [
  '#FF6B6B', // coral red
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96CEB4', // sage green
  '#FFEAA7', // cream yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // gold
  '#BB8FCE', // lavender
  '#85C1E9', // light blue
];

function getAvatarColor(name: string): string {
  if (!name) return '#E5E5EA';
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function FeedPostCard({
  post,
  onPress,
  onVenuePress,
  showVenueName = false,
}: FeedPostCardProps) {
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.discussion;

  // Memoize avatar color to be consistent
  const avatarColor = useMemo(
    () => getAvatarColor(post.author?.full_name || 'Anonymous'),
    [post.author?.full_name]
  );
  const authorInitials = useMemo(
    () => getInitials(post.author?.full_name),
    [post.author?.full_name]
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
        post.pinned && styles.containerPinned,
      ]}
      onPress={onPress ?? undefined}
      disabled={!onPress}
      accessibilityRole="button"
    >
      {/* Author line with avatar, name, badge, and timestamp */}
      <View style={styles.authorRow}>
        <View style={[styles.authorAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.authorAvatarText}>{authorInitials}</Text>
        </View>
        <Text style={styles.authorName} numberOfLines={1}>
          {post.author?.full_name || 'Anonymous'}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {timeAgo(post.created_at)}
          {post.updated_at && post.created_at &&
            new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60000 &&
            ' · edited'}
        </Text>
      </View>

      {/* Venue provenance line (when showing multiple venues) */}
      {showVenueName && post.venue && (
        <Pressable
          style={styles.venueRow}
          onPress={(e) => {
            e.stopPropagation?.();
            onVenuePress?.(post.venue!.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="location-outline" size={12} color="#8E8E93" />
          <Text style={styles.venueName} numberOfLines={1}>
            {post.venue.name}
            {post.venue.region && post.venue.region !== 'Unknown' && ` · ${post.venue.region}`}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#C7C7CC" />
        </Pressable>
      )}

      {/* Title with optional pin icon */}
      <View style={styles.titleRow}>
        {post.pinned && (
          <Ionicons name="arrow-up" size={16} color="#FF9500" style={styles.pinIcon} />
        )}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
      </View>

      {/* Body preview */}
      {post.body && (
        <Text style={styles.body} numberOfLines={2}>
          {post.body}
        </Text>
      )}

      {/* Footer: metrics */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="arrow-up-outline" size={15} color="#8E8E93" />
          <Text style={styles.metricText}>{(post.upvotes || 0) - (post.downvotes || 0)}</Text>
          <View style={styles.metricSpacer} />
          <Ionicons name="chatbubble-outline" size={15} color="#8E8E93" />
          <Text style={styles.metricText}>{post.comment_count}</Text>
        </View>
        {onPress && (
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Read more</Text>
            <Ionicons name="chevron-forward" size={12} color="#C7C7CC" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  containerPressed: {
    backgroundColor: '#F8F8F8',
  },
  containerPinned: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },

  // Author row at top
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    flex: 0,
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    marginLeft: 'auto',
  },

  // Venue line (when showing venue name)
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    paddingLeft: 28, // Align with title (after avatar space)
  },
  venueName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  pinIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 21,
    flex: 1,
    letterSpacing: -0.2,
  },

  // Body
  body: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 19,
    marginBottom: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 13,
    color: '#8E8E93',
    minWidth: 16,
  },
  metricSpacer: {
    width: 12,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});

export default FeedPostCard;
