/**
 * PostPreviewCard
 *
 * Simplified post card for overview highlights.
 * Shows: type icon (small) + title (1 line) + author + time + comment count
 * No vote column, no body preview, no topic tags, no condition match %.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import type { FeedPost } from '@/types/community-feed';

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

interface PostPreviewCardProps {
  post: FeedPost;
  onPress?: () => void;
}

export function PostPreviewCard({ post, onPress }: PostPreviewCardProps) {
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.discussion;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Type icon */}
      <View style={[styles.iconBox, { backgroundColor: typeConfig.bgColor }]}>
        <Ionicons name={typeConfig.icon as any} size={14} color={typeConfig.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {post.pinned ? '📌 ' : ''}{post.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {post.author?.full_name || 'Anonymous'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{timeAgo(post.created_at)}</Text>
          {post.comment_count > 0 && (
            <>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="chatbubble-outline" size={10} color={IOS_COLORS.tertiaryLabel} />
              <Text style={styles.metaText}>{post.comment_count}</Text>
            </>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.tertiaryLabel} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0,
  },
  dot: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default PostPreviewCard;
