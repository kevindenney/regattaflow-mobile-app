/**
 * FeedPostCard
 *
 * Clean, spacious feed card matching iOS design patterns.
 * Layout: venue header, title, body preview, horizontal footer with metadata.
 */

import React from 'react';
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

export function FeedPostCard({
  post,
  onPress,
  onVenuePress,
  showVenueName = false,
}: FeedPostCardProps) {
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.discussion;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {/* Venue provenance line */}
      {showVenueName && post.venue && (
        <View style={styles.venueRow}>
          <Pressable
            style={styles.venueTextWrapper}
            onPress={(e) => {
              e.stopPropagation?.();
              onVenuePress?.(post.venue!.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.venueTextContainer} numberOfLines={1}>
              <Text style={styles.venueName}>{post.venue.name.toUpperCase()}</Text>
              {post.venue.region && post.venue.region !== 'Unknown' && (
                <Text style={styles.venueDetails}>  ·  {post.venue.region}</Text>
              )}
              <Text style={styles.venueDetails}>  ·  {timeAgo(post.created_at)}</Text>
            </Text>
          </Pressable>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
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

      {/* Footer: author + badge on left, metrics on right */}
      <View style={styles.footer}>
        {/* Left side: avatar + name + badge */}
        <View style={styles.footerLeft}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>
              {(post.author?.full_name || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author?.full_name || 'Anonymous'}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
        </View>

        {/* Right side: metrics */}
        <View style={styles.footerRight}>
          <Ionicons name="heart-outline" size={15} color="#8E8E93" />
          <Text style={styles.metricText}>{post.upvotes}</Text>
          <Ionicons name="chatbubble-outline" size={15} color="#8E8E93" style={styles.commentIcon} />
          <Text style={styles.metricText}>{post.comment_count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  containerPressed: {
    backgroundColor: '#F8F8F8',
  },

  // Venue header
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  venueTextWrapper: {
    flex: 1,
  },
  venueTextContainer: {
    flexDirection: 'row',
  },
  venueName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 0.2,
  },
  venueDetails: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  pinIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 22,
    flex: 1,
    letterSpacing: -0.2,
  },

  // Body
  body: {
    fontSize: 15,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricText: {
    fontSize: 14,
    color: '#8E8E93',
    minWidth: 20,
  },
  commentIcon: {
    marginLeft: 12,
  },
});

export default FeedPostCard;
