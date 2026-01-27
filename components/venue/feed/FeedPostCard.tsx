/**
 * FeedPostCard
 *
 * Post card for the community feed showing: post type icon, title, body preview,
 * author badge, upvote count, comment count, topic tags, condition match %,
 * map pin indicator, pinned banner.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import type { FeedPost } from '@/types/community-feed';

interface FeedPostCardProps {
  post: FeedPost;
  onPress?: () => void;
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

export function FeedPostCard({ post, onPress, showConditionMatch }: FeedPostCardProps) {
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.discussion;
  const hasLocation = post.location_lat != null && post.location_lng != null;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Pinned banner */}
      {post.pinned && (
        <View style={styles.pinnedBanner}>
          <Ionicons name="pin" size={10} color="#059669" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <View style={styles.row}>
        {/* Vote column */}
        <View style={styles.voteColumn}>
          <Ionicons
            name={post.user_vote === 1 ? 'arrow-up' : 'arrow-up-outline'}
            size={16}
            color={post.user_vote === 1 ? '#2563EB' : '#9CA3AF'}
          />
          <Text style={[
            styles.voteCount,
            post.user_vote === 1 && styles.voteCountActive,
          ]}>
            {post.upvotes || 0}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Type + Meta Row */}
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
              <Ionicons name={typeConfig.icon as any} size={10} color={typeConfig.color} />
              <Text style={[styles.typeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>

            {post.is_resolved && (
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-circle" size={10} color="#059669" />
                <Text style={styles.resolvedText}>Resolved</Text>
              </View>
            )}

            {showConditionMatch && post.condition_match_score != null && post.condition_match_score > 0 && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>
                  {post.condition_match_score}% match
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>

          {/* Body preview */}
          {post.body && (
            <Text style={styles.body} numberOfLines={2}>
              {post.body}
            </Text>
          )}

          {/* Topic tags */}
          {post.topic_tags && post.topic_tags.length > 0 && (
            <View style={styles.tagRow}>
              {post.topic_tags.slice(0, 3).map(tag => (
                <View key={tag.id} style={[styles.tag, { backgroundColor: `${tag.color}15` }]}>
                  <Text style={[styles.tagText, { color: tag.color || '#6B7280' }]}>
                    {tag.display_name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer: author, time, comments, location */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {post.author?.full_name || 'Anonymous'}
            </Text>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerText}>
              {timeAgo(post.created_at)}
            </Text>
            <Text style={styles.footerDot}>·</Text>
            <View style={styles.footerItem}>
              <Ionicons name="chatbubble-outline" size={10} color="#9CA3AF" />
              <Text style={styles.footerText}>{post.comment_count}</Text>
            </View>
            {hasLocation && (
              <>
                <Text style={styles.footerDot}>·</Text>
                <Ionicons name="location-outline" size={10} color="#9CA3AF" />
              </>
            )}
            {post.racing_area?.area_name && (
              <>
                <Text style={styles.footerDot}>·</Text>
                <Text style={styles.areaTag}>{post.racing_area.area_name}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.standard,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: TufteTokens.spacing.tight,
    paddingLeft: 32, // Align with content (past vote column)
  },
  pinnedText: {
    ...TufteTokens.typography.micro,
    fontSize: 9,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.standard,
  },
  // Vote column
  voteColumn: {
    alignItems: 'center',
    gap: 2,
    width: 24,
    paddingTop: 2,
  },
  voteCount: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  voteCountActive: {
    color: '#2563EB',
  },
  // Content
  content: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TufteTokens.spacing.compact,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: TufteTokens.borderRadius.minimal,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  resolvedText: {
    ...TufteTokens.typography.micro,
    fontSize: 9,
    color: '#059669',
    fontWeight: '600',
  },
  matchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#DBEAFE',
    borderRadius: TufteTokens.borderRadius.minimal,
  },
  matchText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2563EB',
  },
  title: {
    ...TufteTokens.typography.secondary,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 18,
  },
  body: {
    ...TufteTokens.typography.tertiary,
    color: '#6B7280',
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: TufteTokens.borderRadius.minimal,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  footerText: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },
  footerDot: {
    ...TufteTokens.typography.micro,
    color: '#D1D5DB',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  areaTag: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
    backgroundColor: TufteTokens.backgrounds.subtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: TufteTokens.borderRadius.minimal,
  },
});

export default FeedPostCard;
