/**
 * ActivityCommentSection
 *
 * Displays comments on a sailor's activity and allows adding new comments.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Send, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useActivityComments } from '@/hooks/useActivityComments';
import type { ActivityType, ActivityComment } from '@/services/ActivityCommentService';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface ActivityCommentSectionProps {
  activityType: ActivityType;
  activityId: string;
  targetUserId: string;
  /** Whether comments are visible (collapsed by default) */
  expanded?: boolean;
  /** Compact mode shows fewer comments */
  compact?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAvatarColor(userId: string): string {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

// =============================================================================
// COMMENT ROW
// =============================================================================

function CommentRow({
  comment,
  isOwn,
  onDelete,
}: {
  comment: ActivityComment;
  isOwn: boolean;
  onDelete?: () => void;
}) {
  const initials = comment.authorName
    ? comment.authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '??';

  const handleLongPress = () => {
    if (!isOwn || !onDelete) return;
    showConfirm('Delete Comment', 'Are you sure you want to delete this comment?', onDelete, { destructive: true });
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={styles.commentRow}
    >
      <View
        style={[
          styles.commentAvatar,
          {
            backgroundColor:
              comment.authorAvatarColor || getAvatarColor(comment.userId),
          },
        ]}
      >
        <Text style={styles.commentAvatarText}>
          {comment.authorAvatarEmoji || initials}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor} numberOfLines={1}>
            {comment.authorName || 'Unknown'}
          </Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
      {isOwn && onDelete && (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          onPress={() =>
            showConfirm('Delete Comment', 'Are you sure?', onDelete!, { destructive: true })
          }
        >
          <Trash2 size={14} color={IOS_COLORS.systemRed} />
        </Pressable>
      )}
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ActivityCommentSection({
  activityType,
  activityId,
  targetUserId,
  expanded = true,
  compact = false,
}: ActivityCommentSectionProps) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    comments,
    isLoading,
    addComment,
    isAdding,
    deleteComment,
  } = useActivityComments({
    activityType,
    activityId,
    enabled: expanded,
  });

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isAdding) return;

    setSendError(null);
    setInputText('');
    try {
      await addComment(text, targetUserId);
    } catch (err: any) {
      setInputText(text);
      const message = err?.message || 'Could not post comment';
      setSendError(message);
    }
  }, [inputText, isAdding, addComment, targetUserId]);

  const handleDelete = useCallback(
    async (commentId: string) => {
      try {
        await deleteComment(commentId);
      } catch {
        showAlert('Error', 'Could not delete comment');
      }
    },
    [deleteComment]
  );

  const displayComments = compact ? comments.slice(-3) : comments;
  const canSend = inputText.trim().length > 0 && !isAdding;

  if (!expanded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Comments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No comments yet</Text>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {compact && comments.length > 3 && (
            <Text style={styles.moreComments}>
              {comments.length - 3} more comment{comments.length - 3 !== 1 ? 's' : ''}
            </Text>
          )}
          {displayComments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              isOwn={comment.userId === user?.id}
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </View>
      )}

      {/* Composer */}
      <View style={styles.composerRow}>
        <TextInput
          style={styles.composerInput}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            if (sendError) setSendError(null);
          }}
          placeholder="Add a comment..."
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray5 },
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Send size={16} color={canSend ? '#FFFFFF' : IOS_COLORS.systemGray3} />
        </Pressable>
      </View>
      {sendError && (
        <Text style={styles.sendErrorText}>{sendError}</Text>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    marginTop: IOS_SPACING.sm,
    paddingTop: IOS_SPACING.sm,
  },
  loadingContainer: {
    paddingVertical: IOS_SPACING.md,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: IOS_SPACING.sm,
    alignItems: 'center',
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  commentsList: {
    gap: IOS_SPACING.sm,
  },
  moreComments: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemBlue,
    paddingVertical: IOS_SPACING.xs,
  },

  // Comment row
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IOS_SPACING.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginBottom: 2,
  },
  commentAuthor: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  commentTime: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
  },
  commentText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.label,
    lineHeight: 18,
  },
  deleteButton: {
    padding: IOS_SPACING.xs,
    opacity: 0.6,
  },
  deleteButtonPressed: {
    opacity: 1,
  },

  // Composer
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IOS_SPACING.sm,
  },
  composerInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    fontSize: 15,
    color: IOS_COLORS.label,
    marginRight: IOS_SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendErrorText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemRed,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});

export default ActivityCommentSection;
