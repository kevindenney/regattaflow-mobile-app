/**
 * CommentNode
 *
 * Single comment with indent by depth, upvote, reply button.
 * Max 3 levels of nesting. Recursive for replies.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import type { ThreadedComment } from '@/types/community-feed';

const MAX_DEPTH = 3;
const INDENT_WIDTH = 16;

interface CommentNodeProps {
  comment: ThreadedComment;
  depth: number;
  onReply?: (comment: ThreadedComment) => void;
  onVote?: (commentId: string, vote: 1 | 0) => void;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function CommentNode({ comment, depth, onReply, onVote }: CommentNodeProps) {
  const isUpvoted = comment.user_vote === 1;

  const handleVote = () => {
    onVote?.(comment.id, isUpvoted ? 0 : 1);
  };

  return (
    <View style={[styles.container, { marginLeft: depth * INDENT_WIDTH }]}>
      {/* Thread line for nested comments */}
      {depth > 0 && <View style={styles.threadLine} />}

      <View style={styles.commentBody}>
        {/* Header: avatar, name, time */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(comment.author?.full_name || 'A')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>
            {comment.author?.full_name || 'Anonymous'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{timeAgo(comment.created_at)}</Text>
        </View>

        {/* Comment text */}
        <Text style={styles.text}>{comment.body}</Text>

        {/* Actions: vote, reply */}
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={handleVote}>
            <Ionicons
              name={isUpvoted ? 'arrow-up' : 'arrow-up-outline'}
              size={14}
              color={isUpvoted ? '#2563EB' : '#9CA3AF'}
            />
            {(comment.upvotes > 0) && (
              <Text style={[
                styles.actionText,
                isUpvoted && { color: '#2563EB' },
              ]}>
                {comment.upvotes}
              </Text>
            )}
          </Pressable>

          {depth < MAX_DEPTH && onReply && (
            <Pressable
              style={styles.actionButton}
              onPress={() => onReply(comment)}
            >
              <Ionicons name="return-down-forward-outline" size={14} color="#9CA3AF" />
              <Text style={styles.actionText}>Reply</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {comment.replies.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onVote={onVote}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  threadLine: {
    position: 'absolute',
    left: -INDENT_WIDTH / 2,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  commentBody: {
    paddingVertical: TufteTokens.spacing.compact,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
  },
  authorName: {
    ...TufteTokens.typography.micro,
    fontWeight: '600',
    color: '#374151',
  },
  dot: {
    ...TufteTokens.typography.micro,
    color: '#D1D5DB',
  },
  time: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },
  text: {
    ...TufteTokens.typography.tertiary,
    color: '#374151',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.standard,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  actionText: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },
  replies: {
    marginTop: 0,
  },
});

export default CommentNode;
