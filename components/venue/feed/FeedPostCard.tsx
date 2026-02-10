/**
 * FeedPostCard
 *
 * Clean, spacious feed card matching iOS design patterns.
 * Layout: venue header, title, body preview, horizontal footer with metadata.
 *
 * Enhanced with:
 * - Author avatar photos (with initials fallback)
 * - View count
 * - Topic tag chips
 * - Author credibility badge (race count at venue)
 * - Condition context indicators (wind/tide)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import type { FeedPost, TopicTag, ConditionTag } from '@/types/community-feed';

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

// Format view count like "1.2K views"
function formatViewCount(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
  if (count < 1000000) return `${Math.floor(count / 1000)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

// Get wind direction label from degrees
function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Format condition tag for display
function formatConditionPreview(tag: ConditionTag): string | null {
  const parts: string[] = [];

  // Wind info
  if (tag.wind_speed_min != null || tag.wind_speed_max != null) {
    const min = tag.wind_speed_min ?? 0;
    const max = tag.wind_speed_max ?? min;
    const dir = tag.wind_direction_min != null ? getWindDirectionLabel(tag.wind_direction_min) : '';
    if (min === max) {
      parts.push(`${min}kt ${dir}`.trim());
    } else {
      parts.push(`${min}-${max}kt ${dir}`.trim());
    }
  }

  // Tide info
  if (tag.tide_phase) {
    const tideLabels: Record<string, string> = {
      rising: 'Rising',
      falling: 'Falling',
      high: 'High',
      low: 'Low',
      ebb: 'Ebb',
      flood: 'Flood',
    };
    parts.push(tideLabels[tag.tide_phase] || tag.tide_phase);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
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

  // Get first condition tag preview (if any)
  const conditionPreview = useMemo(() => {
    if (!post.condition_tags?.length) return null;
    return formatConditionPreview(post.condition_tags[0]);
  }, [post.condition_tags]);

  // Limit topic tags to 2 for card display
  const displayTags = useMemo(() => {
    return (post.topic_tags || []).slice(0, 2);
  }, [post.topic_tags]);

  // Author stats for credibility badge
  const authorStats = post.author_venue_stats;
  const hasAuthorStats = authorStats && authorStats.race_count > 0;

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
        {post.author?.avatar_url ? (
          <Image
            source={{ uri: post.author.avatar_url }}
            style={styles.authorAvatarImage}
          />
        ) : (
          <View style={[styles.authorAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.authorAvatarText}>{authorInitials}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author?.full_name || 'Anonymous'}
          </Text>
          {hasAuthorStats && (
            <View style={styles.authorStatsBadge}>
              <Ionicons name="trophy-outline" size={10} color="#8E8E93" />
              <Text style={styles.authorStatsText}>
                {authorStats.race_count} races
                {authorStats.avg_finish && ` · Avg ${authorStats.avg_finish.toFixed(0)}th`}
              </Text>
            </View>
          )}
        </View>
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

      {/* Topic tags row */}
      {displayTags.length > 0 && (
        <View style={styles.tagsRow}>
          {displayTags.map((tag) => (
            <View
              key={tag.id}
              style={[
                styles.topicTag,
                tag.color && { backgroundColor: `${tag.color}20` },
              ]}
            >
              {tag.icon && (
                <Ionicons
                  name={tag.icon as any}
                  size={11}
                  color={tag.color || '#8E8E93'}
                />
              )}
              <Text
                style={[
                  styles.topicTagText,
                  tag.color && { color: tag.color },
                ]}
              >
                {tag.display_name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Condition context (wind/tide) */}
      {conditionPreview && (
        <View style={styles.conditionRow}>
          <Ionicons name="partly-sunny-outline" size={12} color="#8E8E93" />
          <Text style={styles.conditionText}>{conditionPreview}</Text>
        </View>
      )}

      {/* Footer: metrics */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="arrow-up-outline" size={15} color="#8E8E93" />
          <Text style={styles.metricText}>{(post.upvotes || 0) - (post.downvotes || 0)}</Text>
          <View style={styles.metricSpacer} />
          <Ionicons name="chatbubble-outline" size={15} color="#8E8E93" />
          <Text style={styles.metricText}>{post.comment_count}</Text>
          {post.view_count > 0 && (
            <>
              <View style={styles.metricSpacer} />
              <Ionicons name="eye-outline" size={15} color="#8E8E93" />
              <Text style={styles.metricText}>{formatViewCount(post.view_count)}</Text>
            </>
          )}
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
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  authorStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  authorStatsText: {
    fontSize: 11,
    color: '#8E8E93',
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

  // Topic tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  topicTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },

  // Condition context
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
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
