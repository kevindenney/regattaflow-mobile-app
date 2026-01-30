/**
 * CommentsSection - Threaded comments display with input
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MessageCircle, CornerDownRight, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/providers/AuthProvider';
import { CommentInput } from './CommentInput';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatarEmoji?: string;
  userAvatarColor?: string;
  userAvatarUrl?: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  replies?: Comment[];
}

interface CommentsSectionProps {
  comments: Comment[];
  isLoading?: boolean;
  onAddComment: (text: string, parentId?: string | null) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  totalCount?: number;
}

export function CommentsSection({
  comments,
  isLoading = false,
  onAddComment,
  onDeleteComment,
  totalCount,
}: CommentsSectionProps) {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set()
  );

  // Build comment tree
  const commentTree = useMemo(() => {
    const topLevel: Comment[] = [];
    const childMap = new Map<string, Comment[]>();

    comments.forEach((comment) => {
      if (!comment.parentId) {
        topLevel.push(comment);
      } else {
        const children = childMap.get(comment.parentId) || [];
        children.push(comment);
        childMap.set(comment.parentId, children);
      }
    });

    // Attach replies to parents
    return topLevel.map((comment) => ({
      ...comment,
      replies: childMap.get(comment.id) || [],
    }));
  }, [comments]);

  const handleSubmit = useCallback(
    async (text: string) => {
      await onAddComment(text, replyingTo?.id);
      setReplyingTo(null);
    },
    [onAddComment, replyingTo]
  );

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo({ id: comment.id, name: comment.userName });
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const toggleThread = useCallback((commentId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const renderComment = useCallback(
    (comment: Comment, isReply = false) => {
      const isOwn = user?.id === comment.userId;
      const hasReplies = comment.replies && comment.replies.length > 0;
      const isExpanded = expandedThreads.has(comment.id);

      return (
        <View
          key={comment.id}
          style={[styles.commentContainer, isReply && styles.replyContainer]}
        >
          {isReply && (
            <CornerDownRight
              size={14}
              color={IOS_COLORS.tertiaryLabel}
              style={styles.replyIcon}
            />
          )}

          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <View style={[styles.avatar, { backgroundColor: comment.userAvatarColor || IOS_COLORS.systemBlue }]}>
                {comment.userAvatarUrl ? (
                  <Image
                    source={{ uri: comment.userAvatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : comment.userAvatarEmoji ? (
                  <Text style={styles.avatarEmoji}>{comment.userAvatarEmoji}</Text>
                ) : (
                  <Text style={styles.avatarInitials}>
                    {getInitials(comment.userName || 'U')}
                  </Text>
                )}
              </View>

              <View style={styles.commentMeta}>
                <Text style={styles.userName}>{comment.userName}</Text>
                <Text style={styles.timeAgo}>
                  {formatTime(comment.createdAt)}
                </Text>
              </View>

              {isOwn && onDeleteComment && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => onDeleteComment(comment.id)}
                >
                  <Trash2 size={14} color={IOS_COLORS.systemRed} />
                </Pressable>
              )}
            </View>

            <Text style={styles.commentText}>{comment.content}</Text>

            <View style={styles.commentActions}>
              {!isReply && (
                <Pressable
                  style={styles.replyButton}
                  onPress={() => handleReply(comment)}
                >
                  <MessageCircle size={14} color={IOS_COLORS.systemBlue} />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </Pressable>
              )}
            </View>

            {/* Replies */}
            {hasReplies && !isReply && (
              <>
                <Pressable
                  style={styles.viewRepliesButton}
                  onPress={() => toggleThread(comment.id)}
                >
                  <Text style={styles.viewRepliesText}>
                    {isExpanded
                      ? 'Hide replies'
                      : `View ${comment.replies!.length} ${
                          comment.replies!.length === 1 ? 'reply' : 'replies'
                        }`}
                  </Text>
                </Pressable>

                {isExpanded && (
                  <View style={styles.repliesContainer}>
                    {comment.replies!.map((reply) =>
                      renderComment(reply, true)
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      );
    },
    [
      user?.id,
      expandedThreads,
      handleReply,
      toggleThread,
      onDeleteComment,
    ]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemGray} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MessageCircle size={18} color={IOS_COLORS.secondaryLabel} />
        <Text style={styles.headerTitle}>
          Comments{' '}
          {totalCount !== undefined && totalCount > 0 && `(${totalCount})`}
        </Text>
      </View>

      {/* Comments list */}
      {commentTree.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment</Text>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {commentTree.map((comment) => renderComment(comment))}
        </View>
      )}

      {/* Input */}
      <CommentInput
        onSubmit={handleSubmit}
        replyingTo={replyingTo?.name}
        onCancelReply={handleCancelReply}
        placeholder={
          replyingTo
            ? `Reply to ${replyingTo.name}...`
            : 'Add a comment...'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  emptySubtext: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.xs,
  },
  commentsList: {
    padding: IOS_SPACING.md,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: IOS_SPACING.md,
  },
  replyContainer: {
    marginLeft: IOS_SPACING.xl,
  },
  replyIcon: {
    marginRight: IOS_SPACING.xs,
    marginTop: IOS_SPACING.xs,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IOS_SPACING.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentMeta: {
    flex: 1,
    marginLeft: IOS_SPACING.sm,
  },
  userName: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
  timeAgo: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
  },
  deleteButton: {
    padding: IOS_SPACING.xs,
  },
  commentText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: IOS_SPACING.xs,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: IOS_SPACING.xs,
  },
  replyButtonText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  viewRepliesButton: {
    paddingVertical: IOS_SPACING.xs,
  },
  viewRepliesText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: IOS_SPACING.sm,
  },
});
